import * as childProcess from 'node:child_process';

import type { ReleaseManifest } from './releaseManifest';
import { buildReleaseWaves } from './releaseWavePolicy';

export const APP_HOST_RELEASE_MANIFEST_PATH = '/opt/ev-dashboard/release-manifest.json';
export const APP_HOST_BOOTSTRAP_ROOT = '/opt/ev-dashboard/bootstrap';
export const APP_HOST_RUNTIME_CLI_PATH = '/opt/ev-dashboard/bootstrap/ev_dashboard_runtime/cli.py';

export type WarmHostWaveManifest = {
  releaseId: string;
  wave: number;
  label: string;
  services: ReleaseManifest['services'];
};

export function buildEc2RuntimeStackName(environment: string): string {
  if (environment === 'dev') {
    return 'EvDashboardPlatformDevStack';
  }
  if (environment === 'stage') {
    return 'EvDashboardPlatformStageStack';
  }
  return 'EvDashboardPlatformStack';
}

export function buildAppHostInstanceName(environment: string): string {
  return `${buildEc2RuntimeStackName(environment)}-app-host`;
}

export function buildWarmHostWaveManifests(manifest: ReleaseManifest): WarmHostWaveManifest[] {
  const waves = buildReleaseWaves(manifest);
  return waves.map((wave) => ({
    releaseId: manifest.releaseId,
    wave: wave.wave,
    label: wave.label,
    services: manifest.services.filter((service) => wave.services.includes(service.service))
  }));
}

export function buildWaveReconcileCommands(wave: WarmHostWaveManifest): string[] {
  const encodedManifest = Buffer.from(
    JSON.stringify({
      releaseId: wave.releaseId,
      wave: wave.wave,
      waveLabel: wave.label,
      services: wave.services
    }),
    'utf8'
  ).toString('base64');

  return [
    'set -euo pipefail',
    `install -d "$(dirname '${APP_HOST_RELEASE_MANIFEST_PATH}')"` ,
    `printf '%s' '${encodedManifest}' | base64 --decode > '${APP_HOST_RELEASE_MANIFEST_PATH}'`,
    'systemctl start ev-dashboard-app-reconcile.service',
    `rm -f '${APP_HOST_RELEASE_MANIFEST_PATH}'`
  ];
}

export function buildFinalizeReleaseCommands(releaseId: string): string[] {
  return [
    'set -euo pipefail',
    `${buildRuntimeCliCommand('finalize-app-release')} --release-id ${shellQuote(releaseId)}`
  ];
}

export function buildAssertReleaseReadyCommands(): string[] {
  return [
    'set -euo pipefail',
    buildRuntimeCliCommand('assert-app-release-ready')
  ];
}

export function buildMarkReleaseFailedCommands(releaseId: string, reason: string): string[] {
  return [
    'set -euo pipefail',
    `${buildRuntimeCliCommand('mark-app-release-failed')} --release-id ${shellQuote(releaseId)} --reason ${shellQuote(reason)}`
  ];
}

export function buildRollbackReleaseCommands(releaseId: string, reason: string): string[] {
  return [
    'set -euo pipefail',
    `${buildRuntimeCliCommand('rollback-app-release')} --release-id ${shellQuote(releaseId)} --reason ${shellQuote(reason)}`
  ];
}

export function resolveRunningAppHostInstanceId(input: {
  region: string;
  environment: string;
}): string {
  const instanceName = buildAppHostInstanceName(input.environment);
  const output = childProcess.execFileSync(
    'aws',
    [
      'ec2',
      'describe-instances',
      '--region',
      input.region,
      '--filters',
      `Name=tag:Name,Values=${instanceName}`,
      'Name=instance-state-name,Values=running',
      '--query',
      'Reservations[].Instances[].InstanceId',
      '--output',
      'text'
    ],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }
  ).trim();

  const instanceIds = output
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (instanceIds.length !== 1) {
    throw new Error(`Expected exactly one running app host for ${instanceName}, got ${instanceIds.length}.`);
  }

  return instanceIds[0];
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

function buildRuntimeCliCommand(command: string): string {
  return `PYTHONPATH=${APP_HOST_BOOTSTRAP_ROOT} /usr/bin/python3 ${APP_HOST_RUNTIME_CLI_PATH} ${command}`;
}
