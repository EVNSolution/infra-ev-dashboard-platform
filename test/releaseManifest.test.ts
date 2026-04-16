import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  loadReleaseManifest,
  type ReleaseManifest
} from '../lib/releaseManifest';

function createTempRepoRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'release-manifest-test-'));
}

function writeManifest(repoRoot: string, relativePath: string, content: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
  return absolutePath;
}

describe('release manifest', () => {
  test('rejects a missing manifest file', () => {
    const repoRoot = createTempRepoRoot();

    expect(() => loadReleaseManifest(repoRoot, 'release-manifests/dev/missing.json')).toThrow(
      'Release manifest file does not exist'
    );
  });

  test('rejects invalid JSON', () => {
    const repoRoot = createTempRepoRoot();

    writeManifest(
      repoRoot,
      'release-manifests/dev/invalid.json',
      '{"release_id":"dev-invalid","services":{"service-account-access":'
    );

    expect(() => loadReleaseManifest(repoRoot, 'release-manifests/dev/invalid.json')).toThrow(
      'Release manifest file is not valid JSON'
    );
  });

  test('rejects duplicate service keys inside services', () => {
    const repoRoot = createTempRepoRoot();

    writeManifest(
      repoRoot,
      'release-manifests/dev/duplicate.json',
      JSON.stringify(
        {
          release_id: 'dev-duplicate',
          services: {}
        },
        null,
        2
      ).replace(
        '"services": {}',
        `"services": {
    "service-account-access": {
      "image_uri": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-old"
    },
    "service-account-access": {
      "image_uri": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-new"
    }
  }`
      )
    );

    expect(() => loadReleaseManifest(repoRoot, 'release-manifests/dev/duplicate.json')).toThrow(
      'Release manifest contains duplicate service key: service-account-access'
    );
  });

  test('rejects unknown service names', () => {
    const repoRoot = createTempRepoRoot();

    writeManifest(
      repoRoot,
      'release-manifests/dev/unknown-service.json',
      JSON.stringify({
        release_id: 'dev-unknown-service',
        services: {
          'service-does-not-exist': {
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-does-not-exist:sha-unknown'
          }
        }
      })
    );

    expect(() => loadReleaseManifest(repoRoot, 'release-manifests/dev/unknown-service.json')).toThrow(
      'Release manifest contains unknown service: service-does-not-exist'
    );
  });

  test('rejects mutable latest tags', () => {
    const repoRoot = createTempRepoRoot();

    writeManifest(
      repoRoot,
      'release-manifests/dev/mutable-tag.json',
      JSON.stringify({
        release_id: 'dev-mutable-tag',
        services: {
          'front-web-console': {
            action: 'deploy',
            image_uri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:latest'
          }
        }
      })
    );

    expect(() => loadReleaseManifest(repoRoot, 'release-manifests/dev/mutable-tag.json')).toThrow(
      'Release manifest service front-web-console must not use the mutable "latest" tag.'
    );
  });

  test('requires an explicit action for every manifest service', () => {
    const repoRoot = createTempRepoRoot();

    writeManifest(
      repoRoot,
      'release-manifests/dev/missing-action.json',
      JSON.stringify({
        release_id: 'dev-missing-action',
        services: {
          'service-account-access': {
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account'
          }
        }
      })
    );

    expect(() => loadReleaseManifest(repoRoot, 'release-manifests/dev/missing-action.json')).toThrow(
      'Release manifest service service-account-access must include action "deploy" or "remove".'
    );
  });

  test('rejects remove actions that still include an image uri', () => {
    const repoRoot = createTempRepoRoot();

    writeManifest(
      repoRoot,
      'release-manifests/dev/remove-with-image.json',
      JSON.stringify({
        release_id: 'dev-remove-with-image',
        services: {
          'service-support-registry': {
            action: 'remove',
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:sha-support'
          }
        }
      })
    );

    expect(() => loadReleaseManifest(repoRoot, 'release-manifests/dev/remove-with-image.json')).toThrow(
      'Release manifest service service-support-registry must not include "image_uri" when action is "remove".'
    );
  });

  test('returns a normalized service list ordered by service name', () => {
    const repoRoot = createTempRepoRoot();

    writeManifest(
      repoRoot,
      'release-manifests/dev/ordered.json',
      JSON.stringify({
        release_id: 'dev-ordered',
        services: {
          'service-support-registry': {
            action: 'remove'
          },
          'service-account-access': {
            action: 'deploy',
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account'
          }
        }
      })
    );

    const manifest = loadReleaseManifest(repoRoot, 'release-manifests/dev/ordered.json');

    expect(manifest).toEqual<ReleaseManifest>({
      manifestPath: 'release-manifests/dev/ordered.json',
      manifestAbsolutePath: path.join(repoRoot, 'release-manifests/dev/ordered.json'),
      releaseId: 'dev-ordered',
      impact: {
        routeGroups: [],
        requiresFront: false,
        requiresGateway: false
      },
      services: [
        {
          service: 'service-account-access',
          action: 'deploy',
          imageUri:
            '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account'
        },
        {
          service: 'service-support-registry',
          action: 'remove'
        }
      ]
    });
  });

  test('parses optional impact hints', () => {
    const repoRoot = createTempRepoRoot();

    writeManifest(
      repoRoot,
      'release-manifests/dev/impact.json',
      JSON.stringify({
        release_id: 'dev-impact',
        impact: {
          requires_gateway: true,
          requires_front: true,
          route_groups: ['people-and-assets']
        },
        services: {
          'service-driver-profile': {
            action: 'deploy',
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:sha-driver'
          }
        }
      })
    );

    expect(loadReleaseManifest(repoRoot, 'release-manifests/dev/impact.json').impact).toEqual({
      requiresGateway: true,
      requiresFront: true,
      routeGroups: ['people-and-assets']
    });
  });
});
