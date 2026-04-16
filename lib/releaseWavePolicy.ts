import type { ReleaseManifest, ReleaseManifestServiceName } from './releaseManifest';
import { getServiceCatalogEntry } from './serviceCatalog';

export type ReleaseWave = {
  wave: number;
  label: string;
  services: ReleaseManifestServiceName[];
};

const WAVE_LABELS = {
  1: 'independent-backend-services',
  2: 'derived-and-operations-services',
  3: 'edge',
  4: 'front'
} as const;

export function buildReleaseWaves(manifest: Pick<ReleaseManifest, 'services'>): ReleaseWave[] {
  const grouped = new Map<keyof typeof WAVE_LABELS, ReleaseManifestServiceName[]>();

  for (const service of manifest.services) {
    const wave = getServiceCatalogEntry(service.service).wave as keyof typeof WAVE_LABELS;
    const services = grouped.get(wave) ?? [];
    services.push(service.service);
    grouped.set(wave, services);
  }

  return Object.keys(WAVE_LABELS)
    .map((wave) => Number(wave) as keyof typeof WAVE_LABELS)
    .filter((wave) => (grouped.get(wave)?.length ?? 0) > 0)
    .map((wave) => ({
      wave,
      label: WAVE_LABELS[wave],
      services: [...(grouped.get(wave) ?? [])].sort((left, right) => left.localeCompare(right))
    }));
}
