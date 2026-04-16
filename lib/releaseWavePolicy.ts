import type { ReleaseManifest, ReleaseManifestServiceName } from './releaseManifest';

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

const SERVICE_WAVE_MAP: Record<ReleaseManifestServiceName, keyof typeof WAVE_LABELS> = {
  'edge-api-gateway': 3,
  'front-web-console': 4,
  'service-account-access': 1,
  'service-announcement-registry': 1,
  'service-attendance-registry': 1,
  'service-delivery-record': 1,
  'service-dispatch-operations-view': 2,
  'service-dispatch-registry': 1,
  'service-driver-operations-view': 2,
  'service-driver-profile': 1,
  'service-notification-hub': 1,
  'service-organization-registry': 1,
  'service-personnel-document-registry': 1,
  'service-region-analytics': 2,
  'service-region-registry': 1,
  'service-settlement-operations-view': 2,
  'service-settlement-payroll': 1,
  'service-settlement-registry': 1,
  'service-support-registry': 1,
  'service-telemetry-dead-letter': 1,
  'service-telemetry-hub': 1,
  'service-telemetry-listener': 1,
  'service-terminal-registry': 1,
  'service-vehicle-assignment': 1,
  'service-vehicle-operations-view': 2,
  'service-vehicle-registry': 1
};

export function buildReleaseWaves(manifest: Pick<ReleaseManifest, 'services'>): ReleaseWave[] {
  const grouped = new Map<keyof typeof WAVE_LABELS, ReleaseManifestServiceName[]>();

  for (const service of manifest.services) {
    const wave = SERVICE_WAVE_MAP[service.service];
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
