import type { ReleaseManifest } from '../lib/releaseManifest';
import { buildReleaseImpact } from '../lib/releaseImpact';

function createManifest(
  services: ReleaseManifest['services'],
  impact: ReleaseManifest['impact'] = {
    requiresGateway: false,
    requiresFront: false,
    routeGroups: []
  }
): ReleaseManifest {
  return {
    manifestPath: 'release-manifests/dev/test.json',
    manifestAbsolutePath: '/tmp/release-manifests/dev/test.json',
    releaseId: 'dev-impact-test',
    impact,
    services
  };
}

describe('release impact', () => {
  test('classifies backend-only releases by default', () => {
    const impact = buildReleaseImpact(
      createManifest([
        {
          service: 'service-driver-profile',
          action: 'deploy',
          imageUri: 'repo/service-driver-profile:sha-driver'
        }
      ])
    );

    expect(impact.classification).toBe('backend-only');
    expect(impact.requiresGateway).toBe(false);
    expect(impact.requiresFront).toBe(false);
    expect(impact.routeGroups).toEqual([]);
  });

  test('classifies route-group hints as gateway-required', () => {
    const impact = buildReleaseImpact(
      createManifest(
        [
          {
            service: 'service-driver-profile',
            action: 'deploy',
            imageUri: 'repo/service-driver-profile:sha-driver'
          }
        ],
        {
          requiresGateway: false,
          requiresFront: false,
          routeGroups: ['people-and-assets']
        }
      )
    );

    expect(impact.classification).toBe('gateway-required');
    expect(impact.requiresGateway).toBe(true);
    expect(impact.requiresFront).toBe(false);
    expect(impact.routeGroups).toEqual(['people-and-assets']);
  });

  test('classifies front hints as front-required and includes gateway', () => {
    const impact = buildReleaseImpact(
      createManifest(
        [
          {
            service: 'service-driver-profile',
            action: 'deploy',
            imageUri: 'repo/service-driver-profile:sha-driver'
          }
        ],
        {
          requiresGateway: false,
          requiresFront: true,
          routeGroups: []
        }
      )
    );

    expect(impact.classification).toBe('front-required');
    expect(impact.requiresGateway).toBe(true);
    expect(impact.requiresFront).toBe(true);
  });

  test('classifies explicit gateway/front services without extra hints', () => {
    expect(
      buildReleaseImpact(
        createManifest([
          {
            service: 'edge-api-gateway',
            action: 'deploy',
            imageUri: 'repo/edge-api-gateway:sha-gateway'
          }
        ])
      ).classification
    ).toBe('gateway-required');

    expect(
      buildReleaseImpact(
        createManifest([
          {
            service: 'front-web-console',
            action: 'deploy',
            imageUri: 'repo/front-web-console:sha-front'
          }
        ])
      ).classification
    ).toBe('front-required');
  });
});
