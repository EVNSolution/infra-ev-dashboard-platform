#!/usr/bin/env node

import * as childProcess from 'node:child_process';
import * as path from 'node:path';

import {
  buildReleaseManifestSmokeChecks,
  formatPostDeploySmokeReport,
  runSmokeChecks
} from '../lib/postDeploySmoke';
import { loadReleaseManifest } from '../lib/releaseManifest';
import {
  buildAssertReleaseReadyCommands,
  buildFinalizeReleaseCommands,
  buildRollbackReleaseCommands,
  buildWaveReconcileCommands,
  buildWarmHostWaveManifests,
  resolveRunningAppHostInstanceId
} from '../lib/warmHostPartial';

async function main(): Promise<void> {
  const manifestPath = process.argv[2] ?? process.env.RELEASE_MANIFEST_PATH;
  const region = process.env.AWS_REGION?.trim();
  const environment = process.env.DEPLOY_ENVIRONMENT?.trim();

  if (!manifestPath) {
    throw new Error('Release manifest path is required. Pass it as argv[2] or RELEASE_MANIFEST_PATH.');
  }
  if (!region) {
    throw new Error('AWS_REGION is required.');
  }
  if (!environment) {
    throw new Error('DEPLOY_ENVIRONMENT is required.');
  }

  const repoRoot = path.resolve(__dirname, '..');
  const manifest = loadReleaseManifest(repoRoot, manifestPath);
  const waves = buildWarmHostWaveManifests(manifest);
  const instanceId = resolveRunningAppHostInstanceId({ region, environment });

  try {
    const assertReadyCommandId = runSsmCommand({
      region,
      instanceId,
      comment: `ev-dashboard assert release ready ${manifest.releaseId}`,
      commands: buildAssertReleaseReadyCommands()
    });
    waitForCommand(region, assertReadyCommandId, instanceId);

    for (const wave of waves) {
      process.stdout.write(`wave ${wave.wave} (${wave.label}) -> ${wave.services.map((service) => service.service).join(', ')}\n`);
      const commandId = runSsmCommand({
        region,
        instanceId,
        comment: `ev-dashboard warm-host partial deploy wave ${wave.wave}`,
        commands: buildWaveReconcileCommands(wave)
      });

      waitForCommand(region, commandId, instanceId);

      const waveChecks = buildReleaseManifestSmokeChecks(process.env, wave.services);
      if (waveChecks.length === 0) {
        process.stdout.write(`wave ${wave.wave} (${wave.label}) smoke -> skipped (no scoped checks)\n`);
        continue;
      }

      const report = await runSmokeChecks(process.env, waveChecks);
      process.stdout.write(formatPostDeploySmokeReport(report));
      if (report.errors.length > 0) {
        throw new Error(`Warm-host wave ${wave.wave} smoke failed.\n${formatPostDeploySmokeReport(report)}`);
      }
    }

    const finalizeCommandId = runSsmCommand({
      region,
      instanceId,
      comment: `ev-dashboard finalize release ${manifest.releaseId}`,
      commands: buildFinalizeReleaseCommands(manifest.releaseId)
    });
    waitForCommand(region, finalizeCommandId, instanceId);
  } catch (error) {
    try {
      const rollbackCommandId = runSsmCommand({
        region,
        instanceId,
        comment: `ev-dashboard rollback release ${manifest.releaseId}`,
        commands: buildRollbackReleaseCommands(
          manifest.releaseId,
          error instanceof Error ? error.message : String(error)
        )
      });
      waitForCommand(region, rollbackCommandId, instanceId);
    } catch (rollbackError) {
      process.stderr.write(
        `Failed to rollback release ${manifest.releaseId}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}\n`
      );
    }
    throw error;
  }
}

function runSsmCommand(input: {
  region: string;
  instanceId: string;
  comment: string;
  commands: string[];
}): string {
  return childProcess.execFileSync(
    'aws',
    [
      'ssm',
      'send-command',
      '--region',
      input.region,
      '--instance-ids',
      input.instanceId,
      '--document-name',
      'AWS-RunShellScript',
      '--comment',
      input.comment,
      '--parameters',
      JSON.stringify({
        commands: input.commands
      }),
      '--query',
      'Command.CommandId',
      '--output',
      'text'
    ],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }
  ).trim();
}

function waitForCommand(region: string, commandId: string, instanceId: string): void {
  while (true) {
    const status = childProcess.execFileSync(
      'aws',
      [
        'ssm',
        'get-command-invocation',
        '--region',
        region,
        '--command-id',
        commandId,
        '--instance-id',
        instanceId,
        '--query',
        'Status',
        '--output',
        'text'
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }
    ).trim();

    if (status === 'Success') {
      return;
    }

    if (['Cancelled', 'Cancelling', 'Failed', 'TimedOut'].includes(status)) {
      const stdout = childProcess.execFileSync(
        'aws',
        [
          'ssm',
          'get-command-invocation',
          '--region',
          region,
          '--command-id',
          commandId,
          '--instance-id',
          instanceId,
          '--query',
          'StandardOutputContent',
          '--output',
          'text'
        ],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe']
        }
      ).trim();
      const stderr = childProcess.execFileSync(
        'aws',
        [
          'ssm',
          'get-command-invocation',
          '--region',
          region,
          '--command-id',
          commandId,
          '--instance-id',
          instanceId,
          '--query',
          'StandardErrorContent',
          '--output',
          'text'
        ],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe']
        }
      ).trim();

      throw new Error(
        `Warm-host wave reconcile failed with status ${status}.\nstdout:\n${stdout || '(empty)'}\nstderr:\n${stderr || '(empty)'}`
      );
    }

    sleep(5_000);
  }
}

function sleep(milliseconds: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
