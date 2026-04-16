import type { ReleaseManifest } from '../lib/releaseManifest';
import {
  APP_HOST_RELEASE_MANIFEST_PATH,
  APP_HOST_RUNTIME_CLI_PATH,
  buildAppHostInstanceName,
  buildAssertReleaseReadyCommands,
  buildEc2RuntimeStackName,
  buildFinalizeReleaseCommands,
  buildMarkReleaseFailedCommands,
  buildRollbackReleaseCommands,
  buildWarmHostWaveManifests,
  buildWaveReconcileCommands
} from '../lib/warmHostPartial';

function createManifest(services: ReleaseManifest['services']): ReleaseManifest {
  return {
    manifestPath: 'release-manifests/dev/test.json',
    manifestAbsolutePath: '/tmp/release-manifests/dev/test.json',
    releaseId: 'dev-partial-test',
    impact: {
      requiresGateway: false,
      requiresFront: false,
      routeGroups: []
    },
    services
  };
}

describe('warm host partial deploy helpers', () => {
  test('splits a release manifest into ordered wave manifests', () => {
    const manifest = createManifest([
      {
        service: 'service-support-registry',
        action: 'deploy',
        imageUri: 'repo/service-support-registry:sha-support'
      },
      {
        service: 'edge-api-gateway',
        action: 'deploy',
        imageUri: 'repo/edge-api-gateway:sha-gateway'
      }
    ]);

    expect(buildWarmHostWaveManifests(manifest)).toEqual([
      {
        releaseId: 'dev-partial-test',
        wave: 1,
        label: 'independent-backend-services',
        services: [
          {
            service: 'service-support-registry',
            action: 'deploy',
            imageUri: 'repo/service-support-registry:sha-support'
          }
        ]
      },
      {
        releaseId: 'dev-partial-test',
        wave: 3,
        label: 'edge',
        services: [
          {
            service: 'edge-api-gateway',
            action: 'deploy',
            imageUri: 'repo/edge-api-gateway:sha-gateway'
          }
        ]
      }
    ]);
  });

  test('builds a shell command set that writes the exact wave manifest and starts reconcile', () => {
    const commands = buildWaveReconcileCommands({
      releaseId: 'dev-partial-test',
      wave: 2,
      label: 'derived-and-operations-services',
      services: [
        {
          service: 'service-dispatch-operations-view',
          action: 'remove'
        }
      ]
    });

    expect(commands[0]).toBe('set -euo pipefail');
    expect(commands[1]).toContain(APP_HOST_RELEASE_MANIFEST_PATH);
    expect(commands[2]).toContain(APP_HOST_RELEASE_MANIFEST_PATH);
    expect(commands[3]).toBe('systemctl start ev-dashboard-app-reconcile.service');
    expect(commands[4]).toContain(APP_HOST_RELEASE_MANIFEST_PATH);
  });

  test('builds finalize and failure marker commands against the host runtime CLI', () => {
    const readyCommands = buildAssertReleaseReadyCommands();
    const finalizeCommands = buildFinalizeReleaseCommands('release-001');
    const failureCommands = buildMarkReleaseFailedCommands('release-001', 'wave smoke failed');

    expect(readyCommands).toEqual([
      'set -euo pipefail',
      `PYTHONPATH=/opt/ev-dashboard/bootstrap /usr/bin/python3 ${APP_HOST_RUNTIME_CLI_PATH} assert-app-release-ready`
    ]);
    expect(finalizeCommands).toEqual([
      'set -euo pipefail',
      `PYTHONPATH=/opt/ev-dashboard/bootstrap /usr/bin/python3 ${APP_HOST_RUNTIME_CLI_PATH} finalize-app-release --release-id 'release-001'`
    ]);
    expect(failureCommands).toEqual([
      'set -euo pipefail',
      `PYTHONPATH=/opt/ev-dashboard/bootstrap /usr/bin/python3 ${APP_HOST_RUNTIME_CLI_PATH} mark-app-release-failed --release-id 'release-001' --reason 'wave smoke failed'`
    ]);
    expect(buildRollbackReleaseCommands('release-001', 'wave smoke failed')).toEqual([
      'set -euo pipefail',
      `PYTHONPATH=/opt/ev-dashboard/bootstrap /usr/bin/python3 ${APP_HOST_RUNTIME_CLI_PATH} rollback-app-release --release-id 'release-001' --reason 'wave smoke failed'`
    ]);
  });

  test('derives stack and app host names from the deploy environment', () => {
    expect(buildEc2RuntimeStackName('dev')).toBe('EvDashboardPlatformDevStack');
    expect(buildEc2RuntimeStackName('stage')).toBe('EvDashboardPlatformStageStack');
    expect(buildEc2RuntimeStackName('prod')).toBe('EvDashboardPlatformStack');
    expect(buildAppHostInstanceName('dev')).toBe('EvDashboardPlatformDevStack-app-host');
  });
});
