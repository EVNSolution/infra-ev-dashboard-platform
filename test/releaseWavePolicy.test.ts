import type { ReleaseManifest } from '../lib/releaseManifest';
import { buildReleaseWaves, type ReleaseWave } from '../lib/releaseWavePolicy';

function createManifest(services: ReleaseManifest['services']): ReleaseManifest {
  return {
    manifestPath: 'release-manifests/dev/test.json',
    manifestAbsolutePath: '/tmp/release-manifests/dev/test.json',
    releaseId: 'dev-wave-test',
    services
  };
}

describe('release wave policy', () => {
  test('orders backend services before gateway and front', () => {
    const manifest = createManifest([
      {
        service: 'front-web-console',
        imageUri: 'repo/front-web-console:sha-front'
      },
      {
        service: 'edge-api-gateway',
        imageUri: 'repo/edge-api-gateway:sha-gateway'
      },
      {
        service: 'service-support-registry',
        imageUri: 'repo/service-support-registry:sha-support'
      }
    ]);

    expect(buildReleaseWaves(manifest)).toEqual<ReleaseWave[]>([
      {
        wave: 1,
        label: 'independent-backend-services',
        services: ['service-support-registry']
      },
      {
        wave: 3,
        label: 'edge',
        services: ['edge-api-gateway']
      },
      {
        wave: 4,
        label: 'front',
        services: ['front-web-console']
      }
    ]);
  });

  test('emits only touched services and keeps derived services behind their source backends', () => {
    const manifest = createManifest([
      {
        service: 'service-region-analytics',
        imageUri: 'repo/service-region-analytics:sha-analytics'
      },
      {
        service: 'service-region-registry',
        imageUri: 'repo/service-region-registry:sha-registry'
      },
      {
        service: 'service-dispatch-operations-view',
        imageUri: 'repo/service-dispatch-operations-view:sha-dispatch-ops'
      }
    ]);

    expect(buildReleaseWaves(manifest)).toEqual<ReleaseWave[]>([
      {
        wave: 1,
        label: 'independent-backend-services',
        services: ['service-region-registry']
      },
      {
        wave: 2,
        label: 'derived-and-operations-services',
        services: ['service-dispatch-operations-view', 'service-region-analytics']
      }
    ]);
  });
});
