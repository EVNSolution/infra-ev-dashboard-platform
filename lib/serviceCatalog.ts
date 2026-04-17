import type { PlatformConfig, PlatformConfigInput } from './config';
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

export const serviceCatalogPreflightGroups = [
  'Auth Surface',
  'Company Governance',
  'People And Assets',
  'Dispatch Inputs',
  'Dispatch Read Models',
  'Settlement',
  'Support Surface',
  'Terminal And Telemetry'
] as const;

export type ServiceCatalogPreflightGroup = (typeof serviceCatalogPreflightGroups)[number];

export type AppHostRuntimeCatalogMetadata = {
  id: string;
  imageMapKey: string;
  containerName: string;
  containerPort?: number;
  hostPort?: number;
};

export type ServiceCatalogEntry = {
  service: ReleaseManifestServiceName;
  routeGroup?: ServiceCatalogRouteGroup;
  wave: ServiceCatalogWave;
  slice: ServiceCatalogSlice;
  preflightGroup?: ServiceCatalogPreflightGroup;
  appHostRuntime?: AppHostRuntimeCatalogMetadata;
  imageConfigKey: keyof PlatformConfigInput;
  imageEnvKey: keyof NodeJS.ProcessEnv;
  imageRequiredWhenEnabledOnly?: boolean;
  defaultDesiredCount: number;
  desiredCountEnvKey: keyof NodeJS.ProcessEnv;
  desiredCountConfigKey: keyof PlatformConfig;
  defaultCpu: number;
  cpuEnvKey: keyof NodeJS.ProcessEnv;
  cpuConfigKey: keyof PlatformConfig;
  defaultMemoryMiB: number;
  memoryEnvKey: keyof NodeJS.ProcessEnv;
  memoryConfigKey: keyof PlatformConfig;
  defaultHealthCheckPath?: string;
  healthCheckPathEnvKey?: keyof NodeJS.ProcessEnv;
  healthCheckPathConfigKey?: keyof PlatformConfig;
};

const serviceCatalogEntries: readonly ServiceCatalogEntry[] = [
  {
    service: 'edge-api-gateway',
    wave: 3,
    slice: 'core-entry',
    imageConfigKey: 'gatewayImageUri',
    imageEnvKey: 'GATEWAY_IMAGE_URI',
    defaultDesiredCount: 1,
    desiredCountEnvKey: 'GATEWAY_DESIRED_COUNT',
    desiredCountConfigKey: 'gatewayDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'GATEWAY_CPU',
    cpuConfigKey: 'gatewayCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'GATEWAY_MEMORY_MIB',
    memoryConfigKey: 'gatewayMemoryMiB',
    defaultHealthCheckPath: '/healthz',
    healthCheckPathEnvKey: 'GATEWAY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'gatewayHealthCheckPath'
  },
  {
    service: 'front-web-console',
    wave: 4,
    slice: 'core-entry',
    imageConfigKey: 'frontImageUri',
    imageEnvKey: 'FRONT_IMAGE_URI',
    defaultDesiredCount: 1,
    desiredCountEnvKey: 'FRONT_DESIRED_COUNT',
    desiredCountConfigKey: 'frontDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'FRONT_CPU',
    cpuConfigKey: 'frontCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'FRONT_MEMORY_MIB',
    memoryConfigKey: 'frontMemoryMiB',
    defaultHealthCheckPath: '/healthz',
    healthCheckPathEnvKey: 'FRONT_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'frontHealthCheckPath'
  },
  {
    service: 'service-account-access',
    wave: 1,
    slice: 'auth-surface',
    preflightGroup: 'Auth Surface',
    appHostRuntime: {
      id: 'ACCOUNT_ACCESS',
      imageMapKey: 'service-account-access',
      containerName: 'account-auth-api',
      containerPort: 8000
    },
    imageConfigKey: 'accountAccessImageUri',
    imageEnvKey: 'ACCOUNT_ACCESS_IMAGE_URI',
    defaultDesiredCount: 1,
    desiredCountEnvKey: 'ACCOUNT_ACCESS_DESIRED_COUNT',
    desiredCountConfigKey: 'accountAccessDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'ACCOUNT_ACCESS_CPU',
    cpuConfigKey: 'accountAccessCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'ACCOUNT_ACCESS_MEMORY_MIB',
    memoryConfigKey: 'accountAccessMemoryMiB',
    defaultHealthCheckPath: '/healthz',
    healthCheckPathEnvKey: 'ACCOUNT_ACCESS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'accountAccessHealthCheckPath'
  },
  {
    service: 'service-organization-registry',
    wave: 1,
    slice: 'company-governance',
    preflightGroup: 'Company Governance',
    appHostRuntime: {
      id: 'ORGANIZATION',
      imageMapKey: 'service-organization-registry',
      containerName: 'organization-master-api',
      containerPort: 8000
    },
    imageConfigKey: 'organizationImageUri',
    imageEnvKey: 'ORGANIZATION_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'ORGANIZATION_DESIRED_COUNT',
    desiredCountConfigKey: 'organizationDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'ORGANIZATION_CPU',
    cpuConfigKey: 'organizationCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'ORGANIZATION_MEMORY_MIB',
    memoryConfigKey: 'organizationMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'ORGANIZATION_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'organizationHealthCheckPath'
  },
  {
    service: 'service-driver-profile',
    routeGroup: 'people-and-assets',
    wave: 1,
    slice: 'people-and-assets',
    preflightGroup: 'People And Assets',
    appHostRuntime: {
      id: 'DRIVER_PROFILE',
      imageMapKey: 'service-driver-profile',
      containerName: 'driver-profile-api',
      containerPort: 8000
    },
    imageConfigKey: 'driverProfileImageUri',
    imageEnvKey: 'DRIVER_PROFILE_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'DRIVER_PROFILE_DESIRED_COUNT',
    desiredCountConfigKey: 'driverProfileDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'DRIVER_PROFILE_CPU',
    cpuConfigKey: 'driverProfileCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'DRIVER_PROFILE_MEMORY_MIB',
    memoryConfigKey: 'driverProfileMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'DRIVER_PROFILE_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'driverProfileHealthCheckPath'
  },
  {
    service: 'service-personnel-document-registry',
    routeGroup: 'people-and-assets',
    wave: 1,
    slice: 'people-and-assets',
    preflightGroup: 'People And Assets',
    appHostRuntime: {
      id: 'PERSONNEL_DOCUMENT',
      imageMapKey: 'service-personnel-document-registry',
      containerName: 'personnel-document-registry-api',
      containerPort: 8000
    },
    imageConfigKey: 'personnelDocumentImageUri',
    imageEnvKey: 'PERSONNEL_DOCUMENT_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'PERSONNEL_DOCUMENT_DESIRED_COUNT',
    desiredCountConfigKey: 'personnelDocumentDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'PERSONNEL_DOCUMENT_CPU',
    cpuConfigKey: 'personnelDocumentCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'PERSONNEL_DOCUMENT_MEMORY_MIB',
    memoryConfigKey: 'personnelDocumentMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'PERSONNEL_DOCUMENT_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'personnelDocumentHealthCheckPath'
  },
  {
    service: 'service-vehicle-registry',
    routeGroup: 'people-and-assets',
    wave: 1,
    slice: 'people-and-assets',
    preflightGroup: 'People And Assets',
    appHostRuntime: {
      id: 'VEHICLE_ASSET',
      imageMapKey: 'service-vehicle-registry',
      containerName: 'vehicle-asset-api',
      containerPort: 8000
    },
    imageConfigKey: 'vehicleAssetImageUri',
    imageEnvKey: 'VEHICLE_ASSET_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'VEHICLE_ASSET_DESIRED_COUNT',
    desiredCountConfigKey: 'vehicleAssetDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'VEHICLE_ASSET_CPU',
    cpuConfigKey: 'vehicleAssetCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'VEHICLE_ASSET_MEMORY_MIB',
    memoryConfigKey: 'vehicleAssetMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'VEHICLE_ASSET_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'vehicleAssetHealthCheckPath'
  },
  {
    service: 'service-vehicle-assignment',
    routeGroup: 'people-and-assets',
    wave: 1,
    slice: 'people-and-assets',
    preflightGroup: 'People And Assets',
    appHostRuntime: {
      id: 'DRIVER_VEHICLE_ASSIGNMENT',
      imageMapKey: 'service-vehicle-assignment',
      containerName: 'driver-vehicle-assignment-api',
      containerPort: 8000
    },
    imageConfigKey: 'driverVehicleAssignmentImageUri',
    imageEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT',
    desiredCountConfigKey: 'driverVehicleAssignmentDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_CPU',
    cpuConfigKey: 'driverVehicleAssignmentCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_MEMORY_MIB',
    memoryConfigKey: 'driverVehicleAssignmentMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'DRIVER_VEHICLE_ASSIGNMENT_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'driverVehicleAssignmentHealthCheckPath'
  },
  {
    service: 'service-dispatch-registry',
    routeGroup: 'dispatch-inputs',
    wave: 1,
    slice: 'dispatch-inputs',
    preflightGroup: 'Dispatch Inputs',
    imageConfigKey: 'dispatchRegistryImageUri',
    imageEnvKey: 'DISPATCH_REGISTRY_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'DISPATCH_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'dispatchRegistryDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'DISPATCH_REGISTRY_CPU',
    cpuConfigKey: 'dispatchRegistryCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'DISPATCH_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'dispatchRegistryMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'DISPATCH_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'dispatchRegistryHealthCheckPath'
  },
  {
    service: 'service-delivery-record',
    routeGroup: 'dispatch-inputs',
    wave: 1,
    slice: 'dispatch-inputs',
    preflightGroup: 'Dispatch Inputs',
    imageConfigKey: 'deliveryRecordImageUri',
    imageEnvKey: 'DELIVERY_RECORD_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'DELIVERY_RECORD_DESIRED_COUNT',
    desiredCountConfigKey: 'deliveryRecordDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'DELIVERY_RECORD_CPU',
    cpuConfigKey: 'deliveryRecordCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'DELIVERY_RECORD_MEMORY_MIB',
    memoryConfigKey: 'deliveryRecordMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'DELIVERY_RECORD_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'deliveryRecordHealthCheckPath'
  },
  {
    service: 'service-attendance-registry',
    routeGroup: 'dispatch-inputs',
    wave: 1,
    slice: 'dispatch-inputs',
    preflightGroup: 'Dispatch Inputs',
    imageConfigKey: 'attendanceRegistryImageUri',
    imageEnvKey: 'ATTENDANCE_REGISTRY_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'ATTENDANCE_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'attendanceRegistryDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'ATTENDANCE_REGISTRY_CPU',
    cpuConfigKey: 'attendanceRegistryCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'ATTENDANCE_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'attendanceRegistryMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'ATTENDANCE_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'attendanceRegistryHealthCheckPath'
  },
  {
    service: 'service-dispatch-operations-view',
    routeGroup: 'dispatch-read-models',
    wave: 2,
    slice: 'dispatch-read-models',
    preflightGroup: 'Dispatch Read Models',
    appHostRuntime: {
      id: 'DISPATCH_OPS',
      imageMapKey: 'service-dispatch-operations-view',
      containerName: 'dispatch-ops-api',
      containerPort: 8000
    },
    imageConfigKey: 'dispatchOpsImageUri',
    imageEnvKey: 'DISPATCH_OPS_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'DISPATCH_OPS_DESIRED_COUNT',
    desiredCountConfigKey: 'dispatchOpsDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'DISPATCH_OPS_CPU',
    cpuConfigKey: 'dispatchOpsCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'DISPATCH_OPS_MEMORY_MIB',
    memoryConfigKey: 'dispatchOpsMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'DISPATCH_OPS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'dispatchOpsHealthCheckPath'
  },
  {
    service: 'service-driver-operations-view',
    routeGroup: 'dispatch-read-models',
    wave: 2,
    slice: 'dispatch-read-models',
    preflightGroup: 'Dispatch Read Models',
    appHostRuntime: {
      id: 'DRIVER_OPS',
      imageMapKey: 'service-driver-operations-view',
      containerName: 'driver-ops-api',
      containerPort: 8000
    },
    imageConfigKey: 'driverOpsImageUri',
    imageEnvKey: 'DRIVER_OPS_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'DRIVER_OPS_DESIRED_COUNT',
    desiredCountConfigKey: 'driverOpsDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'DRIVER_OPS_CPU',
    cpuConfigKey: 'driverOpsCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'DRIVER_OPS_MEMORY_MIB',
    memoryConfigKey: 'driverOpsMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'DRIVER_OPS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'driverOpsHealthCheckPath'
  },
  {
    service: 'service-vehicle-operations-view',
    routeGroup: 'dispatch-read-models',
    wave: 2,
    slice: 'dispatch-read-models',
    preflightGroup: 'Dispatch Read Models',
    appHostRuntime: {
      id: 'VEHICLE_OPS',
      imageMapKey: 'service-vehicle-operations-view',
      containerName: 'vehicle-ops-api',
      containerPort: 8000
    },
    imageConfigKey: 'vehicleOpsImageUri',
    imageEnvKey: 'VEHICLE_OPS_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'VEHICLE_OPS_DESIRED_COUNT',
    desiredCountConfigKey: 'vehicleOpsDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'VEHICLE_OPS_CPU',
    cpuConfigKey: 'vehicleOpsCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'VEHICLE_OPS_MEMORY_MIB',
    memoryConfigKey: 'vehicleOpsMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'VEHICLE_OPS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'vehicleOpsHealthCheckPath'
  },
  {
    service: 'service-settlement-registry',
    routeGroup: 'settlement',
    wave: 1,
    slice: 'settlement',
    preflightGroup: 'Settlement',
    imageConfigKey: 'settlementRegistryImageUri',
    imageEnvKey: 'SETTLEMENT_REGISTRY_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'SETTLEMENT_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'settlementRegistryDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'SETTLEMENT_REGISTRY_CPU',
    cpuConfigKey: 'settlementRegistryCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'SETTLEMENT_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'settlementRegistryMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'SETTLEMENT_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'settlementRegistryHealthCheckPath'
  },
  {
    service: 'service-settlement-payroll',
    routeGroup: 'settlement',
    wave: 1,
    slice: 'settlement',
    preflightGroup: 'Settlement',
    imageConfigKey: 'settlementPayrollImageUri',
    imageEnvKey: 'SETTLEMENT_PAYROLL_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'SETTLEMENT_PAYROLL_DESIRED_COUNT',
    desiredCountConfigKey: 'settlementPayrollDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'SETTLEMENT_PAYROLL_CPU',
    cpuConfigKey: 'settlementPayrollCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'SETTLEMENT_PAYROLL_MEMORY_MIB',
    memoryConfigKey: 'settlementPayrollMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'SETTLEMENT_PAYROLL_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'settlementPayrollHealthCheckPath'
  },
  {
    service: 'service-settlement-operations-view',
    routeGroup: 'settlement',
    wave: 2,
    slice: 'settlement',
    preflightGroup: 'Settlement',
    imageConfigKey: 'settlementOpsImageUri',
    imageEnvKey: 'SETTLEMENT_OPS_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'SETTLEMENT_OPS_DESIRED_COUNT',
    desiredCountConfigKey: 'settlementOpsDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'SETTLEMENT_OPS_CPU',
    cpuConfigKey: 'settlementOpsCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'SETTLEMENT_OPS_MEMORY_MIB',
    memoryConfigKey: 'settlementOpsMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'SETTLEMENT_OPS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'settlementOpsHealthCheckPath'
  },
  {
    service: 'service-region-registry',
    routeGroup: 'support-surface',
    wave: 1,
    slice: 'support-surface',
    preflightGroup: 'Support Surface',
    imageConfigKey: 'regionRegistryImageUri',
    imageEnvKey: 'REGION_REGISTRY_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'REGION_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'regionRegistryDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'REGION_REGISTRY_CPU',
    cpuConfigKey: 'regionRegistryCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'REGION_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'regionRegistryMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'REGION_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'regionRegistryHealthCheckPath'
  },
  {
    service: 'service-region-analytics',
    routeGroup: 'support-surface',
    wave: 2,
    slice: 'support-surface',
    preflightGroup: 'Support Surface',
    imageConfigKey: 'regionAnalyticsImageUri',
    imageEnvKey: 'REGION_ANALYTICS_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'REGION_ANALYTICS_DESIRED_COUNT',
    desiredCountConfigKey: 'regionAnalyticsDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'REGION_ANALYTICS_CPU',
    cpuConfigKey: 'regionAnalyticsCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'REGION_ANALYTICS_MEMORY_MIB',
    memoryConfigKey: 'regionAnalyticsMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'REGION_ANALYTICS_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'regionAnalyticsHealthCheckPath'
  },
  {
    service: 'service-announcement-registry',
    routeGroup: 'support-surface',
    wave: 1,
    slice: 'support-surface',
    preflightGroup: 'Support Surface',
    imageConfigKey: 'announcementRegistryImageUri',
    imageEnvKey: 'ANNOUNCEMENT_REGISTRY_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'ANNOUNCEMENT_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'announcementRegistryDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'ANNOUNCEMENT_REGISTRY_CPU',
    cpuConfigKey: 'announcementRegistryCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'ANNOUNCEMENT_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'announcementRegistryMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'ANNOUNCEMENT_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'announcementRegistryHealthCheckPath'
  },
  {
    service: 'service-support-registry',
    routeGroup: 'support-surface',
    wave: 1,
    slice: 'support-surface',
    preflightGroup: 'Support Surface',
    imageConfigKey: 'supportRegistryImageUri',
    imageEnvKey: 'SUPPORT_REGISTRY_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'SUPPORT_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'supportRegistryDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'SUPPORT_REGISTRY_CPU',
    cpuConfigKey: 'supportRegistryCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'SUPPORT_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'supportRegistryMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'SUPPORT_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'supportRegistryHealthCheckPath'
  },
  {
    service: 'service-notification-hub',
    routeGroup: 'support-surface',
    wave: 1,
    slice: 'support-surface',
    preflightGroup: 'Support Surface',
    imageConfigKey: 'notificationHubImageUri',
    imageEnvKey: 'NOTIFICATION_HUB_IMAGE_URI',
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'NOTIFICATION_HUB_DESIRED_COUNT',
    desiredCountConfigKey: 'notificationHubDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'NOTIFICATION_HUB_CPU',
    cpuConfigKey: 'notificationHubCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'NOTIFICATION_HUB_MEMORY_MIB',
    memoryConfigKey: 'notificationHubMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'NOTIFICATION_HUB_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'notificationHubHealthCheckPath'
  },
  {
    service: 'service-terminal-registry',
    routeGroup: 'terminal-and-telemetry',
    wave: 1,
    slice: 'terminal-and-telemetry',
    preflightGroup: 'Terminal And Telemetry',
    imageConfigKey: 'terminalRegistryImageUri',
    imageEnvKey: 'TERMINAL_REGISTRY_IMAGE_URI',
    imageRequiredWhenEnabledOnly: true,
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'TERMINAL_REGISTRY_DESIRED_COUNT',
    desiredCountConfigKey: 'terminalRegistryDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'TERMINAL_REGISTRY_CPU',
    cpuConfigKey: 'terminalRegistryCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'TERMINAL_REGISTRY_MEMORY_MIB',
    memoryConfigKey: 'terminalRegistryMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'TERMINAL_REGISTRY_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'terminalRegistryHealthCheckPath'
  },
  {
    service: 'service-telemetry-hub',
    routeGroup: 'terminal-and-telemetry',
    wave: 1,
    slice: 'terminal-and-telemetry',
    preflightGroup: 'Terminal And Telemetry',
    imageConfigKey: 'telemetryHubImageUri',
    imageEnvKey: 'TELEMETRY_HUB_IMAGE_URI',
    imageRequiredWhenEnabledOnly: true,
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'TELEMETRY_HUB_DESIRED_COUNT',
    desiredCountConfigKey: 'telemetryHubDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'TELEMETRY_HUB_CPU',
    cpuConfigKey: 'telemetryHubCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'TELEMETRY_HUB_MEMORY_MIB',
    memoryConfigKey: 'telemetryHubMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'TELEMETRY_HUB_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'telemetryHubHealthCheckPath'
  },
  {
    service: 'service-telemetry-dead-letter',
    routeGroup: 'terminal-and-telemetry',
    wave: 1,
    slice: 'terminal-and-telemetry',
    preflightGroup: 'Terminal And Telemetry',
    imageConfigKey: 'telemetryDeadLetterImageUri',
    imageEnvKey: 'TELEMETRY_DEAD_LETTER_IMAGE_URI',
    imageRequiredWhenEnabledOnly: true,
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'TELEMETRY_DEAD_LETTER_DESIRED_COUNT',
    desiredCountConfigKey: 'telemetryDeadLetterDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'TELEMETRY_DEAD_LETTER_CPU',
    cpuConfigKey: 'telemetryDeadLetterCpu',
    defaultMemoryMiB: 512,
    memoryEnvKey: 'TELEMETRY_DEAD_LETTER_MEMORY_MIB',
    memoryConfigKey: 'telemetryDeadLetterMemoryMiB',
    defaultHealthCheckPath: '/health/',
    healthCheckPathEnvKey: 'TELEMETRY_DEAD_LETTER_HEALTH_CHECK_PATH',
    healthCheckPathConfigKey: 'telemetryDeadLetterHealthCheckPath'
  },
  {
    service: 'service-telemetry-listener',
    routeGroup: 'terminal-and-telemetry',
    wave: 1,
    slice: 'terminal-and-telemetry',
    preflightGroup: 'Terminal And Telemetry',
    imageConfigKey: 'telemetryListenerImageUri',
    imageEnvKey: 'TELEMETRY_LISTENER_IMAGE_URI',
    imageRequiredWhenEnabledOnly: true,
    defaultDesiredCount: 0,
    desiredCountEnvKey: 'TELEMETRY_LISTENER_DESIRED_COUNT',
    desiredCountConfigKey: 'telemetryListenerDesiredCount',
    defaultCpu: 256,
    cpuEnvKey: 'TELEMETRY_LISTENER_CPU',
    cpuConfigKey: 'telemetryListenerCpu',
    defaultMemoryMiB: 512,
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

export function listCatalogImageEnvKeys(): ReadonlyArray<keyof NodeJS.ProcessEnv> {
  return serviceCatalogEntries.map((entry) => entry.imageEnvKey);
}

export function listCatalogEnabledPreflightGroups(config: PlatformConfig): readonly ServiceCatalogPreflightGroup[] {
  return serviceCatalogPreflightGroups.filter((group) =>
    serviceCatalogEntries.some(
      (entry) => entry.preflightGroup === group && getServiceDesiredCount(config, entry.service) > 0
    )
  );
}

export function getCatalogAppHostRuntimeMetadata(service: ReleaseManifestServiceName): AppHostRuntimeCatalogMetadata {
  const entry = getServiceCatalogEntry(service);
  if (!entry.appHostRuntime) {
    throw new Error(`Service catalog entry does not define app-host runtime metadata: ${service}`);
  }
  return entry.appHostRuntime;
}

export function getServiceDesiredCount(config: PlatformConfig, service: ReleaseManifestServiceName): number {
  const entry = getServiceCatalogEntry(service);
  return Number(config[entry.desiredCountConfigKey] ?? 0);
}

function sortCatalogEntries(entries: readonly ServiceCatalogEntry[]): readonly ServiceCatalogEntry[] {
  return [...entries].sort((left, right) => left.service.localeCompare(right.service));
}
