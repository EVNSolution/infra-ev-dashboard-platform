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

export function buildBootstrapPrecheckReport(env: NodeJS.ProcessEnv): BootstrapPrecheckReport {
  const lane = (env.BOOTSTRAP_LANE ?? 'dev').trim() || 'dev';
  const mode = normalizeMode(env.BOOTSTRAP_PRECHECK_MODE);
  const warnings: string[] = [];
  const errors: string[] = [];
  const waitSignals: string[] = [];

  const appHostInstanceId = env.BOOTSTRAP_APP_HOST_INSTANCE_ID?.trim() ?? '';
  const dataHostInstanceId = env.BOOTSTRAP_DATA_HOST_INSTANCE_ID?.trim() ?? '';

  if (!appHostInstanceId) {
    errors.push('BOOTSTRAP_APP_HOST_INSTANCE_ID is required for bootstrap precheck.');
  }

  if (mode === 'proof') {
    if (!dataHostInstanceId) {
      errors.push('BOOTSTRAP_DATA_HOST_INSTANCE_ID is required for bootstrap precheck.');
    }

    if (!dataHostInstanceId) {
      errors.push('BOOTSTRAP_DATA_HOST_INSTANCE_ID is required when BOOTSTRAP_PRECHECK_MODE=proof.');
    }

    if (appHostInstanceId) {
      waitSignals.push('sync bootstrap package to app host');
      waitSignals.push('run verify-app on app host');
    }

    if (dataHostInstanceId) {
      waitSignals.push('sync bootstrap package to data host');
      waitSignals.push('run verify-data on data host');
    }
  }

  if (mode === 'verify-app' && appHostInstanceId) {
    waitSignals.push('sync bootstrap package to app host');
    waitSignals.push('run verify-app on app host');
  }

  if (mode === 'verify-data') {
    if (!dataHostInstanceId) {
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
  const appHostInstanceId = env.BOOTSTRAP_APP_HOST_INSTANCE_ID?.trim() ?? '';
  const dataHostInstanceId = env.BOOTSTRAP_DATA_HOST_INSTANCE_ID?.trim() ?? '';
  const bootstrapRoot = env.BOOTSTRAP_SYNC_ROOT?.trim() || '/opt/ev-dashboard/bootstrap';

  if (report.errors.length === 0 && report.mode === 'proof') {
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
      commands: [`PYTHONPATH=${bootstrapRoot} python3 ${bootstrapRoot}/ev_dashboard_runtime/cli.py verify-app`]
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
      commands: [`PYTHONPATH=${bootstrapRoot} python3 ${bootstrapRoot}/ev_dashboard_runtime/cli.py verify-data`]
    });
  }

  if (report.errors.length === 0 && report.mode === 'verify-app') {
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
      commands: [`PYTHONPATH=${bootstrapRoot} python3 ${bootstrapRoot}/ev_dashboard_runtime/cli.py verify-app`]
    });
  }

  if (report.errors.length === 0 && report.mode === 'verify-data') {
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
      commands: [`PYTHONPATH=${bootstrapRoot} python3 ${bootstrapRoot}/ev_dashboard_runtime/cli.py verify-data`]
    });
  }

  return {
    ...report,
    steps
  };
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
