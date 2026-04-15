import { Buffer } from 'node:buffer';
import * as childProcess from 'node:child_process';

import { renderBootstrapPackageStageCommands } from './bootstrapPackage';

export type BootstrapPrecheckMode = 'proof' | 'verify-app' | 'verify-data';

export type BootstrapPrecheckReport = {
  lane: string;
  mode: BootstrapPrecheckMode;
  warnings: string[];
  errors: string[];
  waitSignals: string[];
};

export type BootstrapPrecheckStep = {
  host: 'app' | 'data';
  action: 'sync' | 'verify';
  instanceId: string;
  commands: string[];
};

export type BootstrapPrecheckExecutionPlan = BootstrapPrecheckReport & {
  steps: BootstrapPrecheckStep[];
};

const APP_HOST_REQUIRED_ENV = [
  'AWS_REGION',
  'BOOTSTRAP_IMAGE_MAP_PARAM',
  'BOOTSTRAP_DATA_HOST_ADDRESS',
  'APEX_DOMAIN',
  'API_DOMAIN',
  'BOOTSTRAP_ACCOUNT_ACCESS_POSTGRES_SECRET_ARN',
  'BOOTSTRAP_ACCOUNT_ACCESS_DJANGO_SECRET_ARN',
  'BOOTSTRAP_ACCOUNT_ACCESS_JWT_SECRET_ARN'
] as const;

const DATA_HOST_REQUIRED_ENV = [
  'AWS_REGION',
  'BOOTSTRAP_DEVICE_NAME',
  'BOOTSTRAP_MOUNT_PATH',
  'BOOTSTRAP_POSTGRES_VERSION',
  'BOOTSTRAP_REDIS_VERSION',
  'BOOTSTRAP_POSTGRES_SUPERUSER_SECRET_ARN',
  'BOOTSTRAP_DATA_HOST_DATABASES_B64'
] as const;

const STACK_RESOLVABLE_BOOTSTRAP_ENV = new Set<string>([
  'BOOTSTRAP_APP_HOST_INSTANCE_ID',
  'BOOTSTRAP_DATA_HOST_INSTANCE_ID',
  'BOOTSTRAP_IMAGE_MAP_PARAM',
  'BOOTSTRAP_DATA_HOST_ADDRESS',
  'BOOTSTRAP_ACCOUNT_ACCESS_POSTGRES_SECRET_ARN',
  'BOOTSTRAP_ACCOUNT_ACCESS_DJANGO_SECRET_ARN',
  'BOOTSTRAP_ACCOUNT_ACCESS_JWT_SECRET_ARN',
  'BOOTSTRAP_DEVICE_NAME',
  'BOOTSTRAP_MOUNT_PATH',
  'BOOTSTRAP_POSTGRES_VERSION',
  'BOOTSTRAP_REDIS_VERSION',
  'BOOTSTRAP_POSTGRES_SUPERUSER_SECRET_ARN',
  'BOOTSTRAP_DATA_HOST_DATABASES_B64'
]);

export function buildBootstrapPrecheckReport(env: NodeJS.ProcessEnv): BootstrapPrecheckReport {
  const lane = (env.BOOTSTRAP_LANE ?? 'dev').trim() || 'dev';
  const mode = normalizeMode(env.BOOTSTRAP_PRECHECK_MODE);
  const warnings: string[] = [];
  const errors: string[] = [];
  const waitSignals: string[] = [];

  const appHostInstanceId = env.BOOTSTRAP_APP_HOST_INSTANCE_ID?.trim() ?? '';
  const dataHostInstanceId = env.BOOTSTRAP_DATA_HOST_INSTANCE_ID?.trim() ?? '';
  const canResolveFromStack = Boolean(resolveBootstrapStackName(env));

  if (!appHostInstanceId && !canResolveFromStack) {
    errors.push('BOOTSTRAP_APP_HOST_INSTANCE_ID is required for bootstrap precheck.');
  }

  if (mode === 'proof') {
    if (!dataHostInstanceId && !canResolveFromStack) {
      errors.push('BOOTSTRAP_DATA_HOST_INSTANCE_ID is required for bootstrap precheck.');
      errors.push('BOOTSTRAP_DATA_HOST_INSTANCE_ID is required when BOOTSTRAP_PRECHECK_MODE=proof.');
    }

    if (appHostInstanceId || canResolveFromStack) {
      waitSignals.push('sync bootstrap package to app host');
      waitSignals.push('run verify-app on app host');
    }

    if (dataHostInstanceId || canResolveFromStack) {
      waitSignals.push('sync bootstrap package to data host');
      waitSignals.push('run verify-data on data host');
    }
  }

  if (mode === 'verify-app' && (appHostInstanceId || canResolveFromStack)) {
    waitSignals.push('sync bootstrap package to app host');
    waitSignals.push('run verify-app on app host');
  }

  if (mode === 'verify-data') {
    if (!dataHostInstanceId && !canResolveFromStack) {
      errors.push('BOOTSTRAP_DATA_HOST_INSTANCE_ID is required for bootstrap precheck.');
    } else {
      waitSignals.push('sync bootstrap package to data host');
      waitSignals.push('run verify-data on data host');
    }
  }

  if (mode === 'verify-app' && dataHostInstanceId) {
    warnings.push('BOOTSTRAP_DATA_HOST_INSTANCE_ID is ignored when BOOTSTRAP_PRECHECK_MODE=verify-app.');
  }

  if (mode === 'verify-data' && appHostInstanceId) {
    warnings.push('BOOTSTRAP_APP_HOST_INSTANCE_ID is ignored when BOOTSTRAP_PRECHECK_MODE=verify-data.');
  }

  if (mode === 'proof' || mode === 'verify-app') {
    validateRequiredBootstrapEnv(APP_HOST_REQUIRED_ENV, env, errors, canResolveFromStack);
  }

  if (mode === 'proof' || mode === 'verify-data') {
    validateRequiredBootstrapEnv(DATA_HOST_REQUIRED_ENV, env, errors, canResolveFromStack);
  }

  return {
    lane,
    mode,
    warnings,
    errors,
    waitSignals
  };
}

export function buildBootstrapPrecheckExecutionPlan(env: NodeJS.ProcessEnv): BootstrapPrecheckExecutionPlan {
  const report = buildBootstrapPrecheckReport(env);
  const steps: BootstrapPrecheckStep[] = [];
  const resolvedEnv = resolveBootstrapPrecheckEnv(env);
  const resolvedErrors = [...report.errors];
  const appHostInstanceId = resolvedEnv.BOOTSTRAP_APP_HOST_INSTANCE_ID?.trim() ?? '';
  const dataHostInstanceId = resolvedEnv.BOOTSTRAP_DATA_HOST_INSTANCE_ID?.trim() ?? '';
  const bootstrapRoot = resolvedEnv.BOOTSTRAP_SYNC_ROOT?.trim() || '/opt/ev-dashboard/bootstrap';

  if (resolvedEnv.BOOTSTRAP_STACK_RESOLUTION_ERROR?.trim()) {
    resolvedErrors.push(resolvedEnv.BOOTSTRAP_STACK_RESOLUTION_ERROR.trim());
    return {
      ...report,
      errors: dedupeErrors(resolvedErrors),
      steps
    };
  }

  if (!appHostInstanceId) {
    resolvedErrors.push('BOOTSTRAP_APP_HOST_INSTANCE_ID is required for bootstrap precheck.');
  }
  if ((report.mode === 'proof' || report.mode === 'verify-data') && !dataHostInstanceId) {
    resolvedErrors.push('BOOTSTRAP_DATA_HOST_INSTANCE_ID is required for bootstrap precheck.');
  }
  if (report.mode === 'proof' || report.mode === 'verify-app') {
    validateRequiredBootstrapEnv(APP_HOST_REQUIRED_ENV, resolvedEnv, resolvedErrors, false);
  }
  if (report.mode === 'proof' || report.mode === 'verify-data') {
    validateRequiredBootstrapEnv(DATA_HOST_REQUIRED_ENV, resolvedEnv, resolvedErrors, false);
  }

  if (resolvedErrors.length === 0 && report.mode === 'proof') {
    steps.push({
      host: 'app',
      action: 'sync',
      instanceId: appHostInstanceId,
      commands: renderBootstrapPackageStageCommands(bootstrapRoot)
    });
    steps.push({
      host: 'app',
      action: 'verify',
      instanceId: appHostInstanceId,
      commands: [
        ...renderBootstrapEnvCommands(
          {
            AWS_REGION: resolvedEnv.AWS_REGION,
            IMAGE_MAP_PARAM: resolvedEnv.BOOTSTRAP_IMAGE_MAP_PARAM,
            DATA_HOST_ADDRESS: resolvedEnv.BOOTSTRAP_DATA_HOST_ADDRESS,
            APEX_DOMAIN: resolvedEnv.APEX_DOMAIN,
            API_DOMAIN: resolvedEnv.API_DOMAIN,
            ACCOUNT_ACCESS_POSTGRES_SECRET_ARN: resolvedEnv.BOOTSTRAP_ACCOUNT_ACCESS_POSTGRES_SECRET_ARN,
            ACCOUNT_ACCESS_DJANGO_SECRET_ARN: resolvedEnv.BOOTSTRAP_ACCOUNT_ACCESS_DJANGO_SECRET_ARN,
            ACCOUNT_ACCESS_JWT_SECRET_ARN: resolvedEnv.BOOTSTRAP_ACCOUNT_ACCESS_JWT_SECRET_ARN
          },
          bootstrapRoot
        ),
        `python3 ${bootstrapRoot}/ev_dashboard_runtime/cli.py verify-app`
      ]
    });
    steps.push({
      host: 'data',
      action: 'sync',
      instanceId: dataHostInstanceId,
      commands: renderBootstrapPackageStageCommands(bootstrapRoot)
    });
    steps.push({
      host: 'data',
      action: 'verify',
      instanceId: dataHostInstanceId,
      commands: [
        ...renderBootstrapEnvCommands(
          {
            AWS_REGION: resolvedEnv.AWS_REGION,
            DEVICE_NAME: resolvedEnv.BOOTSTRAP_DEVICE_NAME,
            MOUNT_PATH: resolvedEnv.BOOTSTRAP_MOUNT_PATH,
            POSTGRES_VERSION: resolvedEnv.BOOTSTRAP_POSTGRES_VERSION,
            REDIS_VERSION: resolvedEnv.BOOTSTRAP_REDIS_VERSION,
            POSTGRES_SUPERUSER_SECRET_ARN: resolvedEnv.BOOTSTRAP_POSTGRES_SUPERUSER_SECRET_ARN,
            DATA_HOST_DATABASES_B64: resolvedEnv.BOOTSTRAP_DATA_HOST_DATABASES_B64
          },
          bootstrapRoot
        ),
        `python3 ${bootstrapRoot}/ev_dashboard_runtime/cli.py verify-data`
      ]
    });
  }

  if (resolvedErrors.length === 0 && report.mode === 'verify-app') {
    steps.push({
      host: 'app',
      action: 'sync',
      instanceId: appHostInstanceId,
      commands: renderBootstrapPackageStageCommands(bootstrapRoot)
    });
    steps.push({
      host: 'app',
      action: 'verify',
      instanceId: appHostInstanceId,
      commands: [
        ...renderBootstrapEnvCommands(
          {
            AWS_REGION: resolvedEnv.AWS_REGION,
            IMAGE_MAP_PARAM: resolvedEnv.BOOTSTRAP_IMAGE_MAP_PARAM,
            DATA_HOST_ADDRESS: resolvedEnv.BOOTSTRAP_DATA_HOST_ADDRESS,
            APEX_DOMAIN: resolvedEnv.APEX_DOMAIN,
            API_DOMAIN: resolvedEnv.API_DOMAIN,
            ACCOUNT_ACCESS_POSTGRES_SECRET_ARN: resolvedEnv.BOOTSTRAP_ACCOUNT_ACCESS_POSTGRES_SECRET_ARN,
            ACCOUNT_ACCESS_DJANGO_SECRET_ARN: resolvedEnv.BOOTSTRAP_ACCOUNT_ACCESS_DJANGO_SECRET_ARN,
            ACCOUNT_ACCESS_JWT_SECRET_ARN: resolvedEnv.BOOTSTRAP_ACCOUNT_ACCESS_JWT_SECRET_ARN
          },
          bootstrapRoot
        ),
        `python3 ${bootstrapRoot}/ev_dashboard_runtime/cli.py verify-app`
      ]
    });
  }

  if (resolvedErrors.length === 0 && report.mode === 'verify-data') {
    steps.push({
      host: 'data',
      action: 'sync',
      instanceId: dataHostInstanceId,
      commands: renderBootstrapPackageStageCommands(bootstrapRoot)
    });
    steps.push({
      host: 'data',
      action: 'verify',
      instanceId: dataHostInstanceId,
      commands: [
        ...renderBootstrapEnvCommands(
          {
            AWS_REGION: resolvedEnv.AWS_REGION,
            DEVICE_NAME: resolvedEnv.BOOTSTRAP_DEVICE_NAME,
            MOUNT_PATH: resolvedEnv.BOOTSTRAP_MOUNT_PATH,
            POSTGRES_VERSION: resolvedEnv.BOOTSTRAP_POSTGRES_VERSION,
            REDIS_VERSION: resolvedEnv.BOOTSTRAP_REDIS_VERSION,
            POSTGRES_SUPERUSER_SECRET_ARN: resolvedEnv.BOOTSTRAP_POSTGRES_SUPERUSER_SECRET_ARN,
            DATA_HOST_DATABASES_B64: resolvedEnv.BOOTSTRAP_DATA_HOST_DATABASES_B64
          },
          bootstrapRoot
        ),
        `python3 ${bootstrapRoot}/ev_dashboard_runtime/cli.py verify-data`
      ]
    });
  }

  return {
    ...report,
    errors: dedupeErrors(resolvedErrors),
    steps
  };
}

function validateRequiredBootstrapEnv(
  names: readonly string[],
  env: NodeJS.ProcessEnv,
  errors: string[],
  canResolveFromStack: boolean
): void {
  for (const name of names) {
    if (!(env[name]?.trim() ?? '') && !(canResolveFromStack && STACK_RESOLVABLE_BOOTSTRAP_ENV.has(name))) {
      errors.push(`Missing required bootstrap environment variable: ${name}`);
    }
  }
}

function renderBootstrapEnvCommands(
  values: Record<string, string | undefined>,
  bootstrapRoot: string
): string[] {
  const commands = [`export PYTHONPATH=${shellQuote(bootstrapRoot)}`];

  for (const [name, value] of Object.entries(values)) {
    if (!value?.trim()) {
      continue;
    }
    commands.push(`export ${name}=${shellQuote(value)}`);
  }

  return commands;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

function dedupeErrors(errors: string[]): string[] {
  return [...new Set(errors)];
}

export function resolveBootstrapPrecheckEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const resolved: NodeJS.ProcessEnv = { ...env };
  const stackName = resolveBootstrapStackName(env);

  if (!stackName) {
    return resolved;
  }

  let outputs: Record<string, string>;
  try {
    outputs = describeStackOutputs(stackName);
  } catch (error) {
    resolved.BOOTSTRAP_STACK_RESOLUTION_ERROR = `Unable to resolve bootstrap stack context for ${stackName}: ${
      error instanceof Error ? error.message : String(error)
    }`;
    resolved.BOOTSTRAP_STACK_NAME = stackName;
    return resolved;
  }
  const appHostInstanceId = resolved.BOOTSTRAP_APP_HOST_INSTANCE_ID?.trim() || outputs.AppHostInstanceId || '';
  const dataHostInstanceId = resolved.BOOTSTRAP_DATA_HOST_INSTANCE_ID?.trim() || outputs.DataHostInstanceId || '';
  const postgresSecretName =
    resolved.BOOTSTRAP_ACCOUNT_ACCESS_POSTGRES_SECRET_ARN?.trim() || outputs.PostgresSecretName || '';
  const djangoSecretName =
    resolved.BOOTSTRAP_ACCOUNT_ACCESS_DJANGO_SECRET_ARN?.trim() ||
    describeStackPhysicalResourceId(stackName, 'AccountAccessDjangoSecretKey') ||
    '';
  const jwtSecretName =
    resolved.BOOTSTRAP_ACCOUNT_ACCESS_JWT_SECRET_ARN?.trim() ||
    describeStackPhysicalResourceId(stackName, 'PlatformJwtSecretKey') ||
    '';

  resolved.BOOTSTRAP_STACK_NAME = stackName;
  resolved.BOOTSTRAP_APP_HOST_INSTANCE_ID = appHostInstanceId;
  resolved.BOOTSTRAP_DATA_HOST_INSTANCE_ID = dataHostInstanceId;
  resolved.BOOTSTRAP_IMAGE_MAP_PARAM =
    resolved.BOOTSTRAP_IMAGE_MAP_PARAM?.trim() || outputs.RuntimeImageMapParameterName || '';
  resolved.BOOTSTRAP_ACCOUNT_ACCESS_POSTGRES_SECRET_ARN = postgresSecretName;
  resolved.BOOTSTRAP_ACCOUNT_ACCESS_DJANGO_SECRET_ARN = djangoSecretName;
  resolved.BOOTSTRAP_ACCOUNT_ACCESS_JWT_SECRET_ARN = jwtSecretName;
  resolved.BOOTSTRAP_DATA_HOST_ADDRESS =
    resolved.BOOTSTRAP_DATA_HOST_ADDRESS?.trim() || describeInstancePrivateIp(dataHostInstanceId) || '';
  resolved.BOOTSTRAP_DEVICE_NAME = resolved.BOOTSTRAP_DEVICE_NAME?.trim() || '/dev/sdf';
  resolved.BOOTSTRAP_MOUNT_PATH = resolved.BOOTSTRAP_MOUNT_PATH?.trim() || '/data';
  resolved.BOOTSTRAP_POSTGRES_VERSION = resolved.BOOTSTRAP_POSTGRES_VERSION?.trim() || '16';
  resolved.BOOTSTRAP_REDIS_VERSION = resolved.BOOTSTRAP_REDIS_VERSION?.trim() || '7';
  resolved.BOOTSTRAP_POSTGRES_SUPERUSER_SECRET_ARN =
    resolved.BOOTSTRAP_POSTGRES_SUPERUSER_SECRET_ARN?.trim() || postgresSecretName;

  if (!(resolved.BOOTSTRAP_DATA_HOST_DATABASES_B64?.trim() ?? '') && postgresSecretName) {
    resolved.BOOTSTRAP_DATA_HOST_DATABASES_B64 = Buffer.from(
      JSON.stringify([
        {
          databaseName: 'account_auth',
          username: 'account_auth',
          passwordSecretArn: postgresSecretName
        }
      ]),
      'utf8'
    ).toString('base64');
  }

  return resolved;
}

export function formatBootstrapPrecheckReport(report: BootstrapPrecheckReport): string {
  const lines: string[] = [];

  lines.push('ev-dashboard bootstrap precheck');
  lines.push(`Lane: ${report.lane}`);
  lines.push(`Mode: ${report.mode}`);

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const error of report.errors) {
      lines.push(`- ${error}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  if (report.waitSignals.length > 0) {
    lines.push('Wait signals:');
    for (const signal of report.waitSignals) {
      lines.push(`- ${signal}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function runBootstrapPrecheck(env: NodeJS.ProcessEnv): BootstrapPrecheckExecutionPlan {
  const plan = buildBootstrapPrecheckExecutionPlan(env);

  if (plan.errors.length > 0) {
    throw new Error(formatBootstrapPrecheckReport(plan));
  }

  for (const step of plan.steps) {
    const commandId = childProcess
      .execFileSync(
        'aws',
        [
          'ssm',
          'send-command',
          '--instance-ids',
          step.instanceId,
          '--document-name',
          'AWS-RunShellScript',
          '--parameters',
          `commands=${JSON.stringify(step.commands)}`,
          '--query',
          'Command.CommandId',
          '--output',
          'text'
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      )
      .trim();

    childProcess.execFileSync(
      'aws',
      ['ssm', 'wait', 'command-executed', '--command-id', commandId, '--instance-id', step.instanceId],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );

    const invocationJson = childProcess.execFileSync(
      'aws',
      ['ssm', 'get-command-invocation', '--command-id', commandId, '--instance-id', step.instanceId, '--output', 'json'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    const invocation = JSON.parse(invocationJson) as { Status?: string; StandardErrorContent?: string };

    if (invocation.Status !== 'Success') {
      const stderr = invocation.StandardErrorContent?.trim();
      throw new Error(`bootstrap precheck failed at ${step.host} ${step.action}${stderr ? `: ${stderr}` : ''}`);
    }
  }

  return plan;
}

function resolveBootstrapStackName(env: NodeJS.ProcessEnv): string | undefined {
  const explicit = env.BOOTSTRAP_STACK_NAME?.trim();
  if (explicit) {
    return explicit;
  }

  const deployEnvironment = env.DEPLOY_ENVIRONMENT?.trim().toLowerCase();
  if (deployEnvironment === 'dev') {
    return 'EvDashboardPlatformDevStack';
  }
  if (deployEnvironment === 'stage') {
    return 'EvDashboardPlatformStageStack';
  }
  if (deployEnvironment === 'prod') {
    return 'EvDashboardPlatformStack';
  }

  return undefined;
}

function describeStackOutputs(stackName: string): Record<string, string> {
  const response = childProcess.execFileSync(
    'aws',
    ['cloudformation', 'describe-stacks', '--stack-name', stackName, '--output', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const parsed = JSON.parse(response) as {
    Stacks?: Array<{ Outputs?: Array<{ OutputKey?: string; OutputValue?: string }> }>;
  };
  const outputs = parsed.Stacks?.[0]?.Outputs ?? [];
  return Object.fromEntries(
    outputs
      .filter((output) => output.OutputKey && output.OutputValue)
      .map((output) => [output.OutputKey!, output.OutputValue!])
  );
}

function describeStackPhysicalResourceId(stackName: string, logicalResourceId: string): string | undefined {
  const response = childProcess.execFileSync(
    'aws',
    [
      'cloudformation',
      'describe-stack-resource',
      '--stack-name',
      stackName,
      '--logical-resource-id',
      logicalResourceId,
      '--output',
      'json'
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const parsed = JSON.parse(response) as { StackResourceDetail?: { PhysicalResourceId?: string } };
  return parsed.StackResourceDetail?.PhysicalResourceId?.trim() || undefined;
}

function describeInstancePrivateIp(instanceId: string): string | undefined {
  if (!instanceId) {
    return undefined;
  }

  const response = childProcess.execFileSync(
    'aws',
    ['ec2', 'describe-instances', '--instance-ids', instanceId, '--output', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const parsed = JSON.parse(response) as {
    Reservations?: Array<{ Instances?: Array<{ PrivateIpAddress?: string }> }>;
  };

  return parsed.Reservations?.[0]?.Instances?.[0]?.PrivateIpAddress?.trim() || undefined;
}

function normalizeMode(value: string | undefined): BootstrapPrecheckMode {
  switch (value) {
    case 'verify-app':
    case 'verify-data':
    case 'proof':
      return value;
    default:
      return 'proof';
  }
}
