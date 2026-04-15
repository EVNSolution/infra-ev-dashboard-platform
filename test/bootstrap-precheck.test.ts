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
  runBootstrapPrecheck
} from '../lib/bootstrapPrecheck';

function readPackageJson(): { scripts?: Record<string, string> } {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { scripts?: Record<string, string> };
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
    expect(executionPlan.steps[1].commands.join('\n')).toContain('verify-app');
    expect(executionPlan.steps[3].commands.join('\n')).toContain('verify-data');
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
});
