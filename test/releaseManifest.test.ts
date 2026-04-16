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
            image_uri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:latest'
          }
        }
      })
    );

    expect(() => loadReleaseManifest(repoRoot, 'release-manifests/dev/mutable-tag.json')).toThrow(
      'Release manifest service front-web-console must not use the mutable "latest" tag.'
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
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:sha-support'
          },
          'service-account-access': {
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
      services: [
        {
          service: 'service-account-access',
          imageUri:
            '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account'
        },
        {
          service: 'service-support-registry',
          imageUri:
            '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:sha-support'
        }
      ]
    });
  });
});
