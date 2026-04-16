#!/usr/bin/env node

import * as path from 'node:path';

import { buildReleaseImpact } from '../lib/releaseImpact';
import { loadReleaseManifest } from '../lib/releaseManifest';
import { buildReleaseWaves } from '../lib/releaseWavePolicy';

function main(): void {
  const manifestPath = process.argv[2] ?? process.env.RELEASE_MANIFEST_PATH;
  if (!manifestPath) {
    throw new Error('Release manifest path is required. Pass it as argv[2] or RELEASE_MANIFEST_PATH.');
  }

  const repoRoot = path.resolve(__dirname, '..');
  const manifest = loadReleaseManifest(repoRoot, manifestPath);
  const waves = buildReleaseWaves(manifest);
  const impact = buildReleaseImpact(manifest);

  const lines = [
    `release_id: ${manifest.releaseId}`,
    `service_count: ${manifest.services.length}`,
    `impact: ${impact.classification}`,
    `requires_gateway: ${impact.requiresGateway ? 'yes' : 'no'}`,
    `requires_front: ${impact.requiresFront ? 'yes' : 'no'}`,
    `route_groups: ${impact.routeGroups.length > 0 ? impact.routeGroups.join(', ') : '(none)'}`,
    `touched_route_groups: ${impact.touchedRouteGroups.length > 0 ? impact.touchedRouteGroups.join(', ') : '(none)'}`,
    'waves:'
  ];

  for (const wave of waves) {
    lines.push(`- wave ${wave.wave} (${wave.label})`);
    for (const serviceName of wave.services) {
      const service = manifest.services.find((entry) => entry.service === serviceName);
      if (!service) {
        throw new Error(`Release manifest preview could not find service entry for ${serviceName}.`);
      }
      lines.push(
        service.action === 'deploy'
          ? `  - ${service.service} [deploy] -> ${service.imageUri}`
          : `  - ${service.service} [remove]`
      );
    }
  }

  process.stdout.write(`${lines.join('\n')}\n`);
}

main();
