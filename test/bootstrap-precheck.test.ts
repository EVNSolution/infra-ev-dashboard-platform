jest.mock('node:child_process', () => ({
  execFileSync: jest.fn()
}));

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';

import {
  buildBootstrapPrecheckExecutionPlan,
  buildBootstrapPrecheckReport,
  formatBootstrapPrecheckReport,
  resolveBootstrapPrecheckEnv,
  runBootstrapPrecheck
} from '../lib/bootstrapPrecheck';

function readPackageJson(): { scripts?: Record<string, string> } {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { scripts?: Record<string, string> };
}

function buildBootstrapEnv(): NodeJS.ProcessEnv {
  return {
    AWS_REGION: 'ap-northeast-2',
    APEX_DOMAIN: 'candidate.ev-dashboard.com',
    API_DOMAIN: 'api.candidate.ev-dashboard.com',
    BOOTSTRAP_IMAGE_MAP_PARAM: '/ev-dashboard/runtime/images',
    BOOTSTRAP_DATA_HOST_ADDRESS: '10.0.2.20',
    BOOTSTRAP_ACCOUNT_ACCESS_POSTGRES_SECRET_ARN:
      'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:postgres',
    BOOTSTRAP_ACCOUNT_ACCESS_DJANGO_SECRET_ARN: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:django',
    BOOTSTRAP_ACCOUNT_ACCESS_JWT_SECRET_ARN: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:jwt',
    BOOTSTRAP_DEVICE_NAME: '/dev/sdf',
    BOOTSTRAP_MOUNT_PATH: '/srv/ev-dashboard-data',
    BOOTSTRAP_POSTGRES_VERSION: '16',
    BOOTSTRAP_REDIS_VERSION: '7',
    BOOTSTRAP_POSTGRES_SUPERUSER_SECRET_ARN:
      'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:postgres-super',
    BOOTSTRAP_DATA_HOST_DATABASES_B64: Buffer.from(
      JSON.stringify([{ databaseName: 'account_auth', username: 'account_auth', passwordSecretArn: 'arn:...' }]),
      'utf8'
    ).toString('base64')
  };
}

describe('bootstrap precheck contract', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('exposes a bootstrap:precheck package script', () => {
    const packageJson = readPackageJson();

    expect(packageJson.scripts?.['bootstrap:precheck']).toBe('ts-node bin/bootstrapPrecheck.ts');
  });

  test('rejects missing lane host targets', () => {
    const report = buildBootstrapPrecheckReport({});

    expect(report.errors).toContain('BOOTSTRAP_APP_HOST_INSTANCE_ID is required for bootstrap precheck.');
    expect(report.errors).toContain('BOOTSTRAP_DATA_HOST_INSTANCE_ID is required for bootstrap precheck.');
  });

  test('requires both app and data host verification in proof mode', () => {
    const report = buildBootstrapPrecheckReport({
      BOOTSTRAP_PRECHECK_MODE: 'proof',
      BOOTSTRAP_APP_HOST_INSTANCE_ID: 'i-app-only'
    });

    expect(report.errors).toContain('BOOTSTRAP_DATA_HOST_INSTANCE_ID is required when BOOTSTRAP_PRECHECK_MODE=proof.');
  });

  test('formats proof mode wait signals with both host checks', () => {
    const report = buildBootstrapPrecheckReport({
      ...buildBootstrapEnv(),
      BOOTSTRAP_PRECHECK_MODE: 'proof',
      BOOTSTRAP_LANE: 'dev',
      BOOTSTRAP_APP_HOST_INSTANCE_ID: 'i-app',
      BOOTSTRAP_DATA_HOST_INSTANCE_ID: 'i-data'
    });

    expect(report.errors).toEqual([]);
    expect(report.waitSignals).toEqual([
      'sync bootstrap package to app host',
      'run verify-app on app host',
      'sync bootstrap package to data host',
      'run verify-data on data host'
    ]);

    expect(formatBootstrapPrecheckReport(report)).toContain('Mode: proof');
  });

  test('builds sync and verify sequencing for both hosts in proof mode', () => {
    const executionPlan = buildBootstrapPrecheckExecutionPlan({
      ...buildBootstrapEnv(),
      BOOTSTRAP_PRECHECK_MODE: 'proof',
      BOOTSTRAP_LANE: 'dev',
      BOOTSTRAP_APP_HOST_INSTANCE_ID: 'i-app',
      BOOTSTRAP_DATA_HOST_INSTANCE_ID: 'i-data'
    });

    expect(executionPlan.errors).toEqual([]);
    expect(executionPlan.steps.map((step) => `${step.host}:${step.action}`)).toEqual([
      'app:sync',
      'app:verify',
      'data:sync',
      'data:verify'
    ]);
    expect(executionPlan.steps[0].commands.join('\n')).toContain('cli.py');
    expect(executionPlan.steps[1].commands.join('\n')).toContain('export AWS_REGION=');
    expect(executionPlan.steps[1].commands.join('\n')).toContain('export IMAGE_MAP_PARAM=');
    expect(executionPlan.steps[1].commands.join('\n')).toContain('verify-app');
    expect(executionPlan.steps[3].commands.join('\n')).toContain('export DEVICE_NAME=');
    expect(executionPlan.steps[3].commands.join('\n')).toContain('verify-data');
  });

  test('reports missing bootstrap env required to execute verify-app on host', () => {
    const report = buildBootstrapPrecheckReport({
      BOOTSTRAP_PRECHECK_MODE: 'verify-app',
      BOOTSTRAP_APP_HOST_INSTANCE_ID: 'i-app'
    });

    expect(report.errors).toContain('Missing required bootstrap environment variable: AWS_REGION');
    expect(report.errors).toContain('Missing required bootstrap environment variable: BOOTSTRAP_IMAGE_MAP_PARAM');
    expect(report.errors).toContain('Missing required bootstrap environment variable: BOOTSTRAP_DATA_HOST_ADDRESS');
  });

  test('fails fast when a verify step fails', () => {
    (childProcess.execFileSync as jest.Mock)
      .mockReturnValueOnce('cmd-app-sync\n')
      .mockReturnValueOnce('')
      .mockReturnValueOnce(JSON.stringify({ Status: 'Success', StandardOutputContent: 'sync ok' }))
      .mockReturnValueOnce('cmd-app-verify\n')
      .mockReturnValueOnce('')
      .mockReturnValueOnce(JSON.stringify({ Status: 'Failed', StandardErrorContent: 'verify failed' }));

    expect(() =>
      runBootstrapPrecheck({
        ...buildBootstrapEnv(),
        BOOTSTRAP_PRECHECK_MODE: 'proof',
        BOOTSTRAP_LANE: 'dev',
        BOOTSTRAP_APP_HOST_INSTANCE_ID: 'i-app',
        BOOTSTRAP_DATA_HOST_INSTANCE_ID: 'i-data'
      })
    ).toThrow('bootstrap precheck failed at app verify');

    const awsCalls = (childProcess.execFileSync as jest.Mock).mock.calls
      .map((call) => call[1] as string[])
      .map((args) => args.join(' '));

    expect(awsCalls.some((args) => args.includes('i-data'))).toBe(false);
  });

  test('surfaces stack resolution failures as bootstrap gate errors', () => {
    (childProcess.execFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Stack with id EvDashboardPlatformStack does not exist');
    });

    expect(() =>
      runBootstrapPrecheck({
        AWS_REGION: 'ap-northeast-2',
        APEX_DOMAIN: 'ev-dashboard.com',
        API_DOMAIN: 'api.ev-dashboard.com',
        DEPLOY_ENVIRONMENT: 'prod'
      })
    ).toThrow('Unable to resolve bootstrap stack context for EvDashboardPlatformStack');
  });

  test('resolves hashed logical resource ids when stack resources add suffixes', () => {
    (childProcess.execFileSync as jest.Mock).mockImplementation((command: string, args: string[]) => {
      const joined = `${command} ${args.join(' ')}`;

      if (joined.includes('cloudformation describe-stacks')) {
        return JSON.stringify({
          Stacks: [
            {
              Outputs: [
                { OutputKey: 'AppHostInstanceId', OutputValue: 'i-app' },
                { OutputKey: 'DataHostInstanceId', OutputValue: 'i-data' },
                { OutputKey: 'RuntimeImageMapParameterName', OutputValue: '/EvDashboardPlatformDevStack/runtime/images' },
                { OutputKey: 'PostgresSecretName', OutputValue: 'postgres-secret' }
              ]
            }
          ]
        });
      }

      if (joined.includes('cloudformation describe-stack-resources')) {
        return JSON.stringify({
          StackResources: [
            {
              LogicalResourceId: 'AccountAccessDjangoSecretKeyA5BA0AAE',
              PhysicalResourceId: 'django-secret'
            },
            {
              LogicalResourceId: 'PlatformJwtSecretKeyD00247A0',
              PhysicalResourceId: 'jwt-secret'
            }
          ]
        });
      }

      if (joined.includes('cloudformation describe-stack-resource')) {
        throw new Error('Resource does not exist for stack');
      }

      if (joined.includes('ec2 describe-instances')) {
        return JSON.stringify({
          Reservations: [{ Instances: [{ PrivateIpAddress: '10.20.0.225' }] }]
        });
      }

      throw new Error(`Unexpected aws call: ${joined}`);
    });

    const resolved = resolveBootstrapPrecheckEnv({
      DEPLOY_ENVIRONMENT: 'dev',
      AWS_REGION: 'ap-northeast-2',
      APEX_DOMAIN: 'candidate.ev-dashboard.com',
      API_DOMAIN: 'api.candidate.ev-dashboard.com'
    });

    expect(resolved.BOOTSTRAP_ACCOUNT_ACCESS_DJANGO_SECRET_ARN).toBe('django-secret');
    expect(resolved.BOOTSTRAP_ACCOUNT_ACCESS_JWT_SECRET_ARN).toBe('jwt-secret');
    expect(resolved.BOOTSTRAP_IMAGE_MAP_PARAM).toBe('/EvDashboardPlatformDevStack/runtime/images');
    expect(resolved.BOOTSTRAP_DATA_HOST_ADDRESS).toBe('10.20.0.225');
  });
});
