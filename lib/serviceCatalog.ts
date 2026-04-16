import type { PlatformConfig } from './config';
import type { ReleaseManifestServiceName } from './releaseManifest';

export const serviceCatalogRouteGroups = [
  'people-and-assets',
  'dispatch-inputs',
  'dispatch-read-models',
  'settlement',
  'support-surface',
  'terminal-and-telemetry'
] as const;

export type ServiceCatalogRouteGroup = (typeof serviceCatalogRouteGroups)[number];

export type ServiceCatalogSlice =
  | 'core-entry'
  | 'auth-surface'
  | 'company-governance'
  | 'people-and-assets'
  | 'dispatch-inputs'
  | 'dispatch-read-models'
  | 'settlement'
  | 'support-surface'
  | 'terminal-and-telemetry';

export type ServiceCatalogWave = 1 | 2 | 3 | 4;

export type ServiceCatalogEntry = {
  service: ReleaseManifestServiceName;
  routeGroup?: ServiceCatalogRouteGroup;
  wave: ServiceCatalogWave;
  slice: ServiceCatalogSlice;
  imageEnvKey: keyof NodeJS.ProcessEnv;
  desiredCountEnvKey: keyof NodeJS.ProcessEnv;
  desiredCountConfigKey: keyof PlatformConfig;
  cpuEnvKey: keyof NodeJS.ProcessEnv;
  cpuConfigKey: keyof PlatformConfig;
  memoryEnvKey: keyof NodeJS.ProcessEnv;
  memoryConfigKey: keyof PlatformConfig;
  healthCheckPathEnvKey?: keyof NodeJS.ProcessEnv;
  healthCheckPathConfigKey?: keyof PlatformConfig;
};

const serviceCatalogEntries: readonly ServiceCatalogEntry[] = [
  {
    service: 'edge-api-gateway',
    wave: 3,
    slice: 'core-entry',
    imageEnvKey: 'GATEWAY_IMAGE_URI',
    desiredCountEnvKey: 'GATEWAY_DESIRED_COUNT',
    desiredCountConfigKey: 'gatewayDesiredCount',
    cpuEnvKey: 'GATEWAY_CPU',
    cpuConfigKey: 'gatewayCpu',
    memoryEnvKey: 'GATEWAY_MEMORY_MIB',
    memoryConfigKey: 'gatewayMemoryMiB',
    healthCheckPathEnvKey: 'GATEWAY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'gatewayHealthCheckPath'
  },
  {
    service: 'front-web-console',
    wave: 4,
    slice: 'core-entry',
    imageEnvKey: 'FRONT_IMAGE_URI',
    desiredCountEnvKey: 'FRONT_DESIRED_COUNT',
    desiredCountConfigKey: 'frontDesiredCount',
    cpuEnvKey: 'FRONT_CPU',
    cpuConfigKey: 'frontCpu',
    memoryEnvKey: 'FRONT_MEMORY_MIB',
    memoryConfigKey: 'frontMemoryMiB',
    healthCheckPathEnvKey: 'FRONT_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'frontHealthCheckPath'
  },
  {
    service: 'service-account-access',
    wave: 1,
    slice: 'auth-surface',
    imageEnvKey: 'ACCOUNT_ACCESS_IMAGE_URI',
    desiredCountEnvKey: 'ACCOUNT_ACCESS_DESIRED_COUNT',
    desiredCountConfigKey: 'accountAccessDesiredCount',
    cpuEnvKey: 'ACCOUNT_ACCESS_CPU',
    cpuConfigKey: 'accountAccessCpu',
    memoryEnvKey: 'ACCOUNT_ACCESS_MEMORY_MIB',
    memoryConfigKey: 'accountAccessMemoryMiB',
    healthCheckPathEnvKey: 'ACCOUNT_ACCESS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'accountAccessHealthCheckPath'
  },
  {
    service: 'service-organization-registry',
    wave: 1,
    slice: 'company-governance',
    imageEnvKey: 'ORGANIZATION_IMAGE_URI',
    desiredCountEnvKey: 'ORGANIZATION_DESIRED_COUNT',
    desiredCountConfigKey: 'organizationDesiredCount',
    cpuEnvKey: 'ORGANIZATION_CPU',
    cpuConfigKey: 'organizationCpu',
    memoryEnvKey: 'ORGANIZATION_MEMORY_MIB',
    memoryConfigKey: 'organizationMemoryMiB',
    healthCheckPathEnvKey: 'ORGANIZATION_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'organizationHealthCheckPath'
  },
  {
    service: 'service-driver-profile',
    routeGroup: 'people-and-assets',
    wave: 1,
    slice: 'people-and-assets',
    imageEnvKey: 'DRIVER_PROFILE_IMAGE_URI',
    desiredCountEnvKey: 'DRIVER_PROFILE_DESIRED_COUNT',
    desiredCountConfigKey: 'driverProfileDesiredCount',
    cpuEnvKey: 'DRIVER_PROFILE_CPU',
    cpuConfigKey: 'driverProfileCpu',
    memoryEnvKey: 'DRIVER_PROFILE_MEMORY_MIB',
    memoryConfigKey: 'driverProfileMemoryMiB',
    healthCheckPathEnvKey: 'DRIVER_PROFILE_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'driverProfileHealthCheckPath'
  },
  {
    service: 'service-personnel-document-registry',
    routeGroup: 'people-and-assets',
    wave: 1,
    slice: 'people-and-assets',
    imageEnvKey: 'PERSONNEL_DOCUMENT_IMAGE_URI',
    desiredCountEnvKey: 'PERSONNEL_DOCUMENT_DESIRED_COUNT',
    desiredCountConfigKey: 'personnelDocumentDesiredCount',
    cpuEnvKey: 'PERSONNEL_DOCUMENT_CPU',
    cpuConfigKey: 'personnelDocumentCpu',
    memoryEnvKey: 'PERSONNEL_DOCUMENT_MEMORY_MIB',
    memoryConfigKey: 'personnelDocumentMemoryMiB',
    healthCheckPathEnvKey: 'PERSONNEL_DOCUMENT_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'personnelDocumentHealthCheckPath'
  },
  {
    service: 'service-vehicle-registry',
    routeGroup: 'people-and-assets',
    wave: 1,
    slice: 'people-and-assets',
    imageEnvKey: 'VEHICLE_ASSET_IMAGE_URI',
    desiredCountEnvKey: 'VEHICLE_ASSET_DESIRED_COUNT',
    desiredCountConfigKey: 'vehicleAssetDesiredCount',
    cpuEnvKey: 'VEHICLE_ASSET_CPU',
    cpuConfigKey: 'vehicleAssetCpu',
    memoryEnvKey: 'VEHICLE_ASSET_MEMORY_MIB',
    memoryConfigKey: 'vehicleAssetMemoryMiB',
    healthCheckPathEnvKey: 'VEHICLE_ASSET_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'vehicleAssetHealthCheckPath'
  },
  {
    service: 'service-vehicle-assignment',
    routeGroup: 'people-and-assets',
    wave: 1,
    slice: 'people-and-assets',
    imageEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI',
    desiredCountEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT',
    desiredCountConfigKey: 'driverVehicleAssignmentDesiredCount',
    cpuEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_CPU',
    cpuConfigKey: 'driverVehicleAssignmentCpu',
    memoryEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_MEMORY_MIB',
    memoryConfigKey: 'driverVehicleAssignmentMemoryMiB',
    healthCheckPathEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'driverVehicleAssignmentHealthCheckPath'
  },
  {
    service: 'service-dispatch-registry',
    routeGroup: 'dispatch-inputs',
    wave: 1,
    slice: 'dispatch-inputs',
    imageEnvKey: 'DISPATCH_REGISTRY_IMAGE_URI',
    desiredCountEnvKey: 'DISPATCH_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'dispatchRegistryDesiredCount',
    cpuEnvKey: 'DISPATCH_REGISTRY_CPU',
    cpuConfigKey: 'dispatchRegistryCpu',
    memoryEnvKey: 'DISPATCH_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'dispatchRegistryMemoryMiB',
    healthCheckPathEnvKey: 'DISPATCH_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'dispatchRegistryHealthCheckPath'
  },
  {
    service: 'service-delivery-record',
    routeGroup: 'dispatch-inputs',
    wave: 1,
    slice: 'dispatch-inputs',
    imageEnvKey: 'DELIVERY_RECORD_IMAGE_URI',
    desiredCountEnvKey: 'DELIVERY_RECORD_DESIRED_COUNT',
    desiredCountConfigKey: 'deliveryRecordDesiredCount',
    cpuEnvKey: 'DELIVERY_RECORD_CPU',
    cpuConfigKey: 'deliveryRecordCpu',
    memoryEnvKey: 'DELIVERY_RECORD_MEMORY_MIB',
    memoryConfigKey: 'deliveryRecordMemoryMiB',
    healthCheckPathEnvKey: 'DELIVERY_RECORD_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'deliveryRecordHealthCheckPath'
  },
  {
    service: 'service-attendance-registry',
    routeGroup: 'dispatch-inputs',
    wave: 1,
    slice: 'dispatch-inputs',
    imageEnvKey: 'ATTENDANCE_REGISTRY_IMAGE_URI',
    desiredCountEnvKey: 'ATTENDANCE_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'attendanceRegistryDesiredCount',
    cpuEnvKey: 'ATTENDANCE_REGISTRY_CPU',
    cpuConfigKey: 'attendanceRegistryCpu',
    memoryEnvKey: 'ATTENDANCE_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'attendanceRegistryMemoryMiB',
    healthCheckPathEnvKey: 'ATTENDANCE_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'attendanceRegistryHealthCheckPath'
  },
  {
    service: 'service-dispatch-operations-view',
    routeGroup: 'dispatch-read-models',
    wave: 2,
    slice: 'dispatch-read-models',
    imageEnvKey: 'DISPATCH_OPS_IMAGE_URI',
    desiredCountEnvKey: 'DISPATCH_OPS_DESIRED_COUNT',
    desiredCountConfigKey: 'dispatchOpsDesiredCount',
    cpuEnvKey: 'DISPATCH_OPS_CPU',
    cpuConfigKey: 'dispatchOpsCpu',
    memoryEnvKey: 'DISPATCH_OPS_MEMORY_MIB',
    memoryConfigKey: 'dispatchOpsMemoryMiB',
    healthCheckPathEnvKey: 'DISPATCH_OPS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'dispatchOpsHealthCheckPath'
  },
  {
    service: 'service-driver-operations-view',
    routeGroup: 'dispatch-read-models',
    wave: 2,
    slice: 'dispatch-read-models',
    imageEnvKey: 'DRIVER_OPS_IMAGE_URI',
    desiredCountEnvKey: 'DRIVER_OPS_DESIRED_COUNT',
    desiredCountConfigKey: 'driverOpsDesiredCount',
    cpuEnvKey: 'DRIVER_OPS_CPU',
    cpuConfigKey: 'driverOpsCpu',
    memoryEnvKey: 'DRIVER_OPS_MEMORY_MIB',
    memoryConfigKey: 'driverOpsMemoryMiB',
    healthCheckPathEnvKey: 'DRIVER_OPS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'driverOpsHealthCheckPath'
  },
  {
    service: 'service-vehicle-operations-view',
    routeGroup: 'dispatch-read-models',
    wave: 2,
    slice: 'dispatch-read-models',
    imageEnvKey: 'VEHICLE_OPS_IMAGE_URI',
    desiredCountEnvKey: 'VEHICLE_OPS_DESIRED_COUNT',
    desiredCountConfigKey: 'vehicleOpsDesiredCount',
    cpuEnvKey: 'VEHICLE_OPS_CPU',
    cpuConfigKey: 'vehicleOpsCpu',
    memoryEnvKey: 'VEHICLE_OPS_MEMORY_MIB',
    memoryConfigKey: 'vehicleOpsMemoryMiB',
    healthCheckPathEnvKey: 'VEHICLE_OPS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'vehicleOpsHealthCheckPath'
  },
  {
    service: 'service-settlement-registry',
    routeGroup: 'settlement',
    wave: 1,
    slice: 'settlement',
    imageEnvKey: 'SETTLEMENT_REGISTRY_IMAGE_URI',
    desiredCountEnvKey: 'SETTLEMENT_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'settlementRegistryDesiredCount',
    cpuEnvKey: 'SETTLEMENT_REGISTRY_CPU',
    cpuConfigKey: 'settlementRegistryCpu',
    memoryEnvKey: 'SETTLEMENT_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'settlementRegistryMemoryMiB',
    healthCheckPathEnvKey: 'SETTLEMENT_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'settlementRegistryHealthCheckPath'
  },
  {
    service: 'service-settlement-payroll',
    routeGroup: 'settlement',
    wave: 1,
    slice: 'settlement',
    imageEnvKey: 'SETTLEMENT_PAYROLL_IMAGE_URI',
    desiredCountEnvKey: 'SETTLEMENT_PAYROLL_DESIRED_COUNT',
    desiredCountConfigKey: 'settlementPayrollDesiredCount',
    cpuEnvKey: 'SETTLEMENT_PAYROLL_CPU',
    cpuConfigKey: 'settlementPayrollCpu',
    memoryEnvKey: 'SETTLEMENT_PAYROLL_MEMORY_MIB',
    memoryConfigKey: 'settlementPayrollMemoryMiB',
    healthCheckPathEnvKey: 'SETTLEMENT_PAYROLL_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'settlementPayrollHealthCheckPath'
  },
  {
    service: 'service-settlement-operations-view',
    routeGroup: 'settlement',
    wave: 2,
    slice: 'settlement',
    imageEnvKey: 'SETTLEMENT_OPS_IMAGE_URI',
    desiredCountEnvKey: 'SETTLEMENT_OPS_DESIRED_COUNT',
    desiredCountConfigKey: 'settlementOpsDesiredCount',
    cpuEnvKey: 'SETTLEMENT_OPS_CPU',
    cpuConfigKey: 'settlementOpsCpu',
    memoryEnvKey: 'SETTLEMENT_OPS_MEMORY_MIB',
    memoryConfigKey: 'settlementOpsMemoryMiB',
    healthCheckPathEnvKey: 'SETTLEMENT_OPS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'settlementOpsHealthCheckPath'
  },
  {
    service: 'service-region-registry',
    routeGroup: 'support-surface',
    wave: 1,
    slice: 'support-surface',
    imageEnvKey: 'REGION_REGISTRY_IMAGE_URI',
    desiredCountEnvKey: 'REGION_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'regionRegistryDesiredCount',
    cpuEnvKey: 'REGION_REGISTRY_CPU',
    cpuConfigKey: 'regionRegistryCpu',
    memoryEnvKey: 'REGION_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'regionRegistryMemoryMiB',
    healthCheckPathEnvKey: 'REGION_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'regionRegistryHealthCheckPath'
  },
  {
    service: 'service-region-analytics',
    routeGroup: 'support-surface',
    wave: 2,
    slice: 'support-surface',
    imageEnvKey: 'REGION_ANALYTICS_IMAGE_URI',
    desiredCountEnvKey: 'REGION_ANALYTICS_DESIRED_COUNT',
    desiredCountConfigKey: 'regionAnalyticsDesiredCount',
    cpuEnvKey: 'REGION_ANALYTICS_CPU',
    cpuConfigKey: 'regionAnalyticsCpu',
    memoryEnvKey: 'REGION_ANALYTICS_MEMORY_MIB',
    memoryConfigKey: 'regionAnalyticsMemoryMiB',
    healthCheckPathEnvKey: 'REGION_ANALYTICS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'regionAnalyticsHealthCheckPath'
  },
  {
    service: 'service-announcement-registry',
    routeGroup: 'support-surface',
    wave: 1,
    slice: 'support-surface',
    imageEnvKey: 'ANNOUNCEMENT_REGISTRY_IMAGE_URI',
    desiredCountEnvKey: 'ANNOUNCEMENT_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'announcementRegistryDesiredCount',
    cpuEnvKey: 'ANNOUNCEMENT_REGISTRY_CPU',
    cpuConfigKey: 'announcementRegistryCpu',
    memoryEnvKey: 'ANNOUNCEMENT_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'announcementRegistryMemoryMiB',
    healthCheckPathEnvKey: 'ANNOUNCEMENT_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'announcementRegistryHealthCheckPath'
  },
  {
    service: 'service-support-registry',
    routeGroup: 'support-surface',
    wave: 1,
    slice: 'support-surface',
    imageEnvKey: 'SUPPORT_REGISTRY_IMAGE_URI',
    desiredCountEnvKey: 'SUPPORT_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'supportRegistryDesiredCount',
    cpuEnvKey: 'SUPPORT_REGISTRY_CPU',
    cpuConfigKey: 'supportRegistryCpu',
    memoryEnvKey: 'SUPPORT_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'supportRegistryMemoryMiB',
    healthCheckPathEnvKey: 'SUPPORT_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'supportRegistryHealthCheckPath'
  },
  {
    service: 'service-notification-hub',
    routeGroup: 'support-surface',
    wave: 1,
    slice: 'support-surface',
    imageEnvKey: 'NOTIFICATION_HUB_IMAGE_URI',
    desiredCountEnvKey: 'NOTIFICATION_HUB_DESIRED_COUNT',
    desiredCountConfigKey: 'notificationHubDesiredCount',
    cpuEnvKey: 'NOTIFICATION_HUB_CPU',
    cpuConfigKey: 'notificationHubCpu',
    memoryEnvKey: 'NOTIFICATION_HUB_MEMORY_MIB',
    memoryConfigKey: 'notificationHubMemoryMiB',
    healthCheckPathEnvKey: 'NOTIFICATION_HUB_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'notificationHubHealthCheckPath'
  },
  {
    service: 'service-terminal-registry',
    routeGroup: 'terminal-and-telemetry',
    wave: 1,
    slice: 'terminal-and-telemetry',
    imageEnvKey: 'TERMINAL_REGISTRY_IMAGE_URI',
    desiredCountEnvKey: 'TERMINAL_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'terminalRegistryDesiredCount',
    cpuEnvKey: 'TERMINAL_REGISTRY_CPU',
    cpuConfigKey: 'terminalRegistryCpu',
    memoryEnvKey: 'TERMINAL_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'terminalRegistryMemoryMiB',
    healthCheckPathEnvKey: 'TERMINAL_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'terminalRegistryHealthCheckPath'
  },
  {
    service: 'service-telemetry-hub',
    routeGroup: 'terminal-and-telemetry',
    wave: 1,
    slice: 'terminal-and-telemetry',
    imageEnvKey: 'TELEMETRY_HUB_IMAGE_URI',
    desiredCountEnvKey: 'TELEMETRY_HUB_DESIRED_COUNT',
    desiredCountConfigKey: 'telemetryHubDesiredCount',
    cpuEnvKey: 'TELEMETRY_HUB_CPU',
    cpuConfigKey: 'telemetryHubCpu',
    memoryEnvKey: 'TELEMETRY_HUB_MEMORY_MIB',
    memoryConfigKey: 'telemetryHubMemoryMiB',
    healthCheckPathEnvKey: 'TELEMETRY_HUB_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'telemetryHubHealthCheckPath'
  },
  {
    service: 'service-telemetry-dead-letter',
    routeGroup: 'terminal-and-telemetry',
    wave: 1,
    slice: 'terminal-and-telemetry',
    imageEnvKey: 'TELEMETRY_DEAD_LETTER_IMAGE_URI',
    desiredCountEnvKey: 'TELEMETRY_DEAD_LETTER_DESIRED_COUNT',
    desiredCountConfigKey: 'telemetryDeadLetterDesiredCount',
    cpuEnvKey: 'TELEMETRY_DEAD_LETTER_CPU',
    cpuConfigKey: 'telemetryDeadLetterCpu',
    memoryEnvKey: 'TELEMETRY_DEAD_LETTER_MEMORY_MIB',
    memoryConfigKey: 'telemetryDeadLetterMemoryMiB',
    healthCheckPathEnvKey: 'TELEMETRY_DEAD_LETTER_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'telemetryDeadLetterHealthCheckPath'
  },
  {
    service: 'service-telemetry-listener',
    routeGroup: 'terminal-and-telemetry',
    wave: 1,
    slice: 'terminal-and-telemetry',
    imageEnvKey: 'TELEMETRY_LISTENER_IMAGE_URI',
    desiredCountEnvKey: 'TELEMETRY_LISTENER_DESIRED_COUNT',
    desiredCountConfigKey: 'telemetryListenerDesiredCount',
    cpuEnvKey: 'TELEMETRY_LISTENER_CPU',
    cpuConfigKey: 'telemetryListenerCpu',
    memoryEnvKey: 'TELEMETRY_LISTENER_MEMORY_MIB',
    memoryConfigKey: 'telemetryListenerMemoryMiB'
  }
];

const serviceCatalogEntryMap = new Map<ReleaseManifestServiceName, ServiceCatalogEntry>(
  serviceCatalogEntries.map((entry) => [entry.service, entry])
);

export function listServiceCatalogEntries(): readonly ServiceCatalogEntry[] {
  return serviceCatalogEntries;
}

export function getServiceCatalogEntry(service: ReleaseManifestServiceName): ServiceCatalogEntry {
  const entry = serviceCatalogEntryMap.get(service);
  if (!entry) {
    throw new Error(`Unknown service catalog entry: ${service}`);
  }
  return entry;
}

export function listCatalogEntriesForRouteGroup(routeGroup: ServiceCatalogRouteGroup): readonly ServiceCatalogEntry[] {
  return sortCatalogEntries(serviceCatalogEntries.filter((entry) => entry.routeGroup === routeGroup));
}

export function listCatalogEntriesForWave(wave: ServiceCatalogWave): readonly ServiceCatalogEntry[] {
  return sortCatalogEntries(serviceCatalogEntries.filter((entry) => entry.wave === wave));
}

export function getServiceDesiredCount(config: PlatformConfig, service: ReleaseManifestServiceName): number {
  const entry = getServiceCatalogEntry(service);
  return Number(config[entry.desiredCountConfigKey] ?? 0);
}

function sortCatalogEntries(entries: readonly ServiceCatalogEntry[]): readonly ServiceCatalogEntry[] {
  return [...entries].sort((left, right) => left.service.localeCompare(right.service));
}
