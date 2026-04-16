#!/usr/bin/env node

import * as path from 'node:path';

import { loadReleaseManifest } from '../lib/releaseManifest';

function main(): void {
  const manifestPath = process.argv[2] ?? process.env.RELEASE_MANIFEST_PATH;
  if (!manifestPath) {
    throw new Error('Release manifest path is required. Pass it as argv[2] or RELEASE_MANIFEST_PATH.');
  }

  const repoRoot = path.resolve(__dirname, '..');
  const manifest = loadReleaseManifest(repoRoot, manifestPath);

  const lines = [
    `release_id: ${manifest.releaseId}`,
    `service_count: ${manifest.services.length}`,
    'services:'
  ];

  for (const service of manifest.services) {
    lines.push(`- ${service.service} -> ${service.imageUri}`);
  }

  process.stdout.write(`${lines.join('\n')}\n`);
}

main();
