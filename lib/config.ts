import type { ReleaseManifestServiceName } from './releaseManifest';
import { listServiceCatalogEntries } from './serviceCatalog';

export type PlatformConfigInput = {
  deployEnvironment?: 'dev' | 'stage' | 'prod';
  backendGunicornWorkers?: number;
  runProfile?: 'full' | 'bootstrap-proof' | 'incremental-expand' | 'smoke-only' | 'warm-host-partial';
  runtimeMode?: 'ecs' | 'ec2';
  releaseManifestPath?: string;
  region: string;
  hostedZoneId: string;
  hostedZoneName: string;
  apexDomain: string;
  apiDomain: string;
  cockpitHosts?: string[];
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds?: string[];
  availabilityZones?: string[];
  serviceConnectNamespace?: string;
  appHostSubnetId?: string;
  dataHostSubnetId?: string;
  appHostSubnetAvailabilityZone?: string;
  dataHostSubnetAvailabilityZone?: string;
  appHostInstanceType?: string;
  appHostVolumeSizeGiB?: number;
  dataHostInstanceType?: string;
  dataVolumeSizeGiB?: number;
  frontImageUri: string;
  gatewayImageUri: string;
  accountAccessImageUri: string;
  organizationImageUri: string;
  driverProfileImageUri: string;
  personnelDocumentImageUri: string;
  vehicleAssetImageUri: string;
  driverVehicleAssignmentImageUri: string;
  dispatchRegistryImageUri: string;
  deliveryRecordImageUri: string;
  attendanceRegistryImageUri: string;
  dispatchOpsImageUri: string;
  driverOpsImageUri: string;
  vehicleOpsImageUri: string;
  settlementRegistryImageUri: string;
  settlementPayrollImageUri: string;
  settlementOpsImageUri: string;
  regionRegistryImageUri: string;
  regionAnalyticsImageUri: string;
  announcementRegistryImageUri: string;
  supportRegistryImageUri: string;
  notificationHubImageUri: string;
  terminalRegistryImageUri?: string;
  telemetryHubImageUri?: string;
  telemetryDeadLetterImageUri?: string;
  telemetryListenerImageUri?: string;
  frontDesiredCount: number;
  gatewayDesiredCount: number;
  accountAccessDesiredCount: number;
  organizationDesiredCount: number;
  driverProfileDesiredCount: number;
  personnelDocumentDesiredCount: number;
  vehicleAssetDesiredCount: number;
  driverVehicleAssignmentDesiredCount: number;
  dispatchRegistryDesiredCount: number;
  deliveryRecordDesiredCount: number;
  attendanceRegistryDesiredCount: number;
  dispatchOpsDesiredCount: number;
  driverOpsDesiredCount: number;
  vehicleOpsDesiredCount: number;
  settlementRegistryDesiredCount: number;
  settlementPayrollDesiredCount: number;
  settlementOpsDesiredCount: number;
  regionRegistryDesiredCount: number;
  regionAnalyticsDesiredCount: number;
  announcementRegistryDesiredCount: number;
  supportRegistryDesiredCount: number;
  notificationHubDesiredCount: number;
  terminalRegistryDesiredCount?: number;
  telemetryHubDesiredCount?: number;
  telemetryDeadLetterDesiredCount?: number;
  telemetryListenerDesiredCount?: number;
  frontCpu: number;
  frontMemoryMiB: number;
  gatewayCpu: number;
  gatewayMemoryMiB: number;
  accountAccessCpu: number;
  accountAccessMemoryMiB: number;
  organizationCpu: number;
  organizationMemoryMiB: number;
  driverProfileCpu: number;
  driverProfileMemoryMiB: number;
  personnelDocumentCpu: number;
  personnelDocumentMemoryMiB: number;
  vehicleAssetCpu: number;
  vehicleAssetMemoryMiB: number;
  driverVehicleAssignmentCpu: number;
  driverVehicleAssignmentMemoryMiB: number;
  dispatchRegistryCpu: number;
  dispatchRegistryMemoryMiB: number;
  deliveryRecordCpu: number;
  deliveryRecordMemoryMiB: number;
  attendanceRegistryCpu: number;
  attendanceRegistryMemoryMiB: number;
  dispatchOpsCpu: number;
  dispatchOpsMemoryMiB: number;
  driverOpsCpu: number;
  driverOpsMemoryMiB: number;
  vehicleOpsCpu: number;
  vehicleOpsMemoryMiB: number;
  settlementRegistryCpu: number;
  settlementRegistryMemoryMiB: number;
  settlementPayrollCpu: number;
  settlementPayrollMemoryMiB: number;
  settlementOpsCpu: number;
  settlementOpsMemoryMiB: number;
  regionRegistryCpu: number;
  regionRegistryMemoryMiB: number;
  regionAnalyticsCpu: number;
  regionAnalyticsMemoryMiB: number;
  announcementRegistryCpu: number;
  announcementRegistryMemoryMiB: number;
  supportRegistryCpu: number;
  supportRegistryMemoryMiB: number;
  notificationHubCpu: number;
  notificationHubMemoryMiB: number;
  terminalRegistryCpu?: number;
  terminalRegistryMemoryMiB?: number;
  telemetryHubCpu?: number;
  telemetryHubMemoryMiB?: number;
  telemetryDeadLetterCpu?: number;
  telemetryDeadLetterMemoryMiB?: number;
  telemetryListenerCpu?: number;
  telemetryListenerMemoryMiB?: number;
  frontHealthCheckPath: string;
  gatewayHealthCheckPath: string;
  accountAccessHealthCheckPath: string;
  organizationHealthCheckPath: string;
  driverProfileHealthCheckPath: string;
  personnelDocumentHealthCheckPath: string;
  vehicleAssetHealthCheckPath: string;
  driverVehicleAssignmentHealthCheckPath: string;
  dispatchRegistryHealthCheckPath: string;
  deliveryRecordHealthCheckPath: string;
  attendanceRegistryHealthCheckPath: string;
  dispatchOpsHealthCheckPath: string;
  driverOpsHealthCheckPath: string;
  vehicleOpsHealthCheckPath: string;
  settlementRegistryHealthCheckPath: string;
  settlementPayrollHealthCheckPath: string;
  settlementOpsHealthCheckPath: string;
  regionRegistryHealthCheckPath: string;
  regionAnalyticsHealthCheckPath: string;
  announcementRegistryHealthCheckPath: string;
  supportRegistryHealthCheckPath: string;
  notificationHubHealthCheckPath: string;
  terminalRegistryHealthCheckPath?: string;
  telemetryHubHealthCheckPath?: string;
  telemetryDeadLetterHealthCheckPath?: string;
  settlementOpsBaseUrl: string;
  telemetryHubBaseUrl: string;
  terminalRegistryBaseUrl: string;
  telemetryListenerMqttHost?: string;
  telemetryListenerMqttPort?: number;
  telemetryListenerMqttTopics?: string[];
  telemetryListenerClientId?: string;
  telemetryListenerRetryCount?: number;
  telemetryListenerRetryBackoffSeconds?: number;
  telemetryListenerIdleSleepSeconds?: number;
};

export type PlatformConfig = PlatformConfigInput & {
  deployEnvironment: 'dev' | 'stage' | 'prod';
  runProfile: 'full' | 'bootstrap-proof' | 'incremental-expand' | 'smoke-only' | 'warm-host-partial';
  runtimeMode: 'ecs' | 'ec2';
  cockpitHosts: string[];
  availabilityZones: string[];
  privateSubnetIds: string[];
  serviceConnectNamespace: string;
  appHostSubnetId?: string;
  dataHostSubnetId?: string;
  appHostSubnetAvailabilityZone?: string;
  dataHostSubnetAvailabilityZone?: string;
  appHostInstanceType: string;
  appHostVolumeSizeGiB: number;
  dataHostInstanceType: string;
  dataVolumeSizeGiB: number;
};

export type CatalogBackedServiceSetting = {
  imageUri?: string;
  desiredCount: number;
  cpu: number;
  memoryMiB: number;
  healthCheckPath?: string;
};

export function buildPlatformConfig(input: PlatformConfigInput): PlatformConfig {
  const deployEnvironment = input.deployEnvironment ?? 'prod';
  const runProfile = input.runProfile ?? 'full';
  const runtimeMode = input.runtimeMode ?? 'ecs';
  if (runProfile === 'warm-host-partial' && !input.releaseManifestPath) {
    throw new Error('Missing required environment variable: RELEASE_MANIFEST_PATH');
  }

  const privateSubnetIds = input.privateSubnetIds ?? [];
  const requiresPrivateSubnets =
    input.accountAccessDesiredCount > 0 ||
    input.organizationDesiredCount > 0 ||
    input.driverProfileDesiredCount > 0 ||
    input.personnelDocumentDesiredCount > 0 ||
    input.vehicleAssetDesiredCount > 0 ||
    input.driverVehicleAssignmentDesiredCount > 0 ||
    input.dispatchRegistryDesiredCount > 0 ||
    input.deliveryRecordDesiredCount > 0 ||
    input.attendanceRegistryDesiredCount > 0 ||
    input.settlementRegistryDesiredCount > 0 ||
    input.settlementPayrollDesiredCount > 0 ||
    input.regionRegistryDesiredCount > 0 ||
    input.regionAnalyticsDesiredCount > 0 ||
    input.announcementRegistryDesiredCount > 0 ||
    input.supportRegistryDesiredCount > 0 ||
    input.notificationHubDesiredCount > 0 ||
    (input.terminalRegistryDesiredCount ?? 0) > 0 ||
    (input.telemetryHubDesiredCount ?? 0) > 0 ||
    (input.telemetryDeadLetterDesiredCount ?? 0) > 0;
  if (runtimeMode !== 'ec2' && requiresPrivateSubnets && privateSubnetIds.length === 0) {
    throw new Error('Missing required environment variable: PRIVATE_SUBNET_IDS');
  }

  if (runtimeMode === 'ec2' && !input.appHostSubnetId) {
    throw new Error('Missing required environment variable: APP_HOST_SUBNET_ID');
  }

  if (runtimeMode === 'ec2' && !input.dataHostSubnetId) {
    throw new Error('Missing required environment variable: DATA_HOST_SUBNET_ID');
  }

  if (runtimeMode === 'ec2' && !input.appHostSubnetAvailabilityZone) {
    throw new Error('Missing required environment variable: APP_HOST_SUBNET_AVAILABILITY_ZONE');
  }

  if (runtimeMode === 'ec2' && !input.dataHostSubnetAvailabilityZone) {
    throw new Error('Missing required environment variable: DATA_HOST_SUBNET_AVAILABILITY_ZONE');
  }

  const config: PlatformConfig = {
    ...input,
    deployEnvironment,
    runProfile,
    runtimeMode,
    cockpitHosts: normalizeHosts(input.cockpitHosts),
    privateSubnetIds,
    serviceConnectNamespace: input.serviceConnectNamespace ?? 'ev-dashboard.internal',
    appHostInstanceType: input.appHostInstanceType ?? 't3.small',
    appHostVolumeSizeGiB: input.appHostVolumeSizeGiB ?? 32,
    dataHostInstanceType: input.dataHostInstanceType ?? 't4g.small',
    dataVolumeSizeGiB: input.dataVolumeSizeGiB ?? 100,
    availabilityZones:
      input.availabilityZones ?? buildDefaultAvailabilityZones(input.region, input.publicSubnetIds.length)
  };

  if (config.runtimeMode === 'ec2' && config.runProfile === 'bootstrap-proof') {
    return {
      ...config,
      driverProfileDesiredCount: 0,
      personnelDocumentDesiredCount: 0,
      vehicleAssetDesiredCount: 0,
      driverVehicleAssignmentDesiredCount: 0,
      dispatchRegistryDesiredCount: 0,
      deliveryRecordDesiredCount: 0,
      attendanceRegistryDesiredCount: 0,
      dispatchOpsDesiredCount: 0,
      driverOpsDesiredCount: 0,
      vehicleOpsDesiredCount: 0,
      settlementRegistryDesiredCount: 0,
      settlementPayrollDesiredCount: 0,
      settlementOpsDesiredCount: 0,
      regionRegistryDesiredCount: 0,
      regionAnalyticsDesiredCount: 0,
      announcementRegistryDesiredCount: 0,
      supportRegistryDesiredCount: 0,
      notificationHubDesiredCount: 0,
      terminalRegistryDesiredCount: 0,
      telemetryHubDesiredCount: 0,
      telemetryDeadLetterDesiredCount: 0,
      telemetryListenerDesiredCount: 0
    };
  }

  return config;
}

export function buildPlatformConfigFromEnv(env: NodeJS.ProcessEnv): PlatformConfig {
  const serviceConnectNamespace = emptyToUndefined(env.SERVICE_CONNECT_NAMESPACE);
  const serviceSettings = buildCatalogBackedServiceSettings(env);
  const terminalRegistryDesiredCount = serviceSettings['service-terminal-registry'].desiredCount;
  const telemetryHubDesiredCount = serviceSettings['service-telemetry-hub'].desiredCount;
  const telemetryDeadLetterDesiredCount = serviceSettings['service-telemetry-dead-letter'].desiredCount;
  const telemetryListenerDesiredCount = serviceSettings['service-telemetry-listener'].desiredCount;
  const telemetryListenerMqttTopics = optionalList(env.TELEMETRY_LISTENER_MQTT_TOPICS) ?? ['telemetry/#'];

  return buildPlatformConfig({
    deployEnvironment: toDeployEnvironment(env.DEPLOY_ENVIRONMENT),
    backendGunicornWorkers: toOptionalPositiveInteger(
      env.BACKEND_GUNICORN_WORKERS,
      'BACKEND_GUNICORN_WORKERS'
    ),
    runProfile: toRunProfile(env.RUN_PROFILE),
    runtimeMode: toRuntimeMode(env.RUNTIME_MODE),
    releaseManifestPath: emptyToUndefined(env.RELEASE_MANIFEST_PATH),
    region: required(env.AWS_REGION ?? env.CDK_DEFAULT_REGION, 'AWS_REGION'),
    hostedZoneId: required(env.HOSTED_ZONE_ID, 'HOSTED_ZONE_ID'),
    hostedZoneName: required(env.HOSTED_ZONE_NAME, 'HOSTED_ZONE_NAME'),
    apexDomain: required(env.APEX_DOMAIN, 'APEX_DOMAIN'),
    apiDomain: required(env.API_DOMAIN, 'API_DOMAIN'),
    cockpitHosts: optionalList(env.COCKPIT_HOSTS),
    vpcId: required(env.VPC_ID, 'VPC_ID'),
    publicSubnetIds: required(env.PUBLIC_SUBNET_IDS, 'PUBLIC_SUBNET_IDS')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    privateSubnetIds: optionalList(env.PRIVATE_SUBNET_IDS),
    availabilityZones: optionalList(env.AVAILABILITY_ZONES),
    serviceConnectNamespace,
    appHostSubnetId: emptyToUndefined(env.APP_HOST_SUBNET_ID),
    dataHostSubnetId: emptyToUndefined(env.DATA_HOST_SUBNET_ID),
    appHostSubnetAvailabilityZone: emptyToUndefined(env.APP_HOST_SUBNET_AVAILABILITY_ZONE),
    dataHostSubnetAvailabilityZone: emptyToUndefined(env.DATA_HOST_SUBNET_AVAILABILITY_ZONE),
    appHostInstanceType: emptyToUndefined(env.APP_HOST_INSTANCE_TYPE),
    appHostVolumeSizeGiB: toNumber(env.APP_HOST_VOLUME_SIZE_GIB, 'APP_HOST_VOLUME_SIZE_GIB', 32),
    dataHostInstanceType: emptyToUndefined(env.DATA_HOST_INSTANCE_TYPE),
    dataVolumeSizeGiB: toNumber(env.DATA_VOLUME_SIZE_GIB, 'DATA_VOLUME_SIZE_GIB', 100),
    frontImageUri: serviceSettings['front-web-console'].imageUri!,
    gatewayImageUri: serviceSettings['edge-api-gateway'].imageUri!,
    accountAccessImageUri: serviceSettings['service-account-access'].imageUri!,
    organizationImageUri: serviceSettings['service-organization-registry'].imageUri!,
    driverProfileImageUri: serviceSettings['service-driver-profile'].imageUri!,
    personnelDocumentImageUri: serviceSettings['service-personnel-document-registry'].imageUri!,
    vehicleAssetImageUri: serviceSettings['service-vehicle-registry'].imageUri!,
    driverVehicleAssignmentImageUri: serviceSettings['service-vehicle-assignment'].imageUri!,
    dispatchRegistryImageUri: serviceSettings['service-dispatch-registry'].imageUri!,
    deliveryRecordImageUri: serviceSettings['service-delivery-record'].imageUri!,
    attendanceRegistryImageUri: serviceSettings['service-attendance-registry'].imageUri!,
    dispatchOpsImageUri: serviceSettings['service-dispatch-operations-view'].imageUri!,
    driverOpsImageUri: serviceSettings['service-driver-operations-view'].imageUri!,
    vehicleOpsImageUri: serviceSettings['service-vehicle-operations-view'].imageUri!,
    settlementRegistryImageUri: serviceSettings['service-settlement-registry'].imageUri!,
    settlementPayrollImageUri: serviceSettings['service-settlement-payroll'].imageUri!,
    settlementOpsImageUri: serviceSettings['service-settlement-operations-view'].imageUri!,
    regionRegistryImageUri: serviceSettings['service-region-registry'].imageUri!,
    regionAnalyticsImageUri: serviceSettings['service-region-analytics'].imageUri!,
    announcementRegistryImageUri: serviceSettings['service-announcement-registry'].imageUri!,
    supportRegistryImageUri: serviceSettings['service-support-registry'].imageUri!,
    notificationHubImageUri: serviceSettings['service-notification-hub'].imageUri!,
    terminalRegistryImageUri: serviceSettings['service-terminal-registry'].imageUri,
    telemetryHubImageUri: serviceSettings['service-telemetry-hub'].imageUri,
    telemetryDeadLetterImageUri: serviceSettings['service-telemetry-dead-letter'].imageUri,
    telemetryListenerImageUri: serviceSettings['service-telemetry-listener'].imageUri,
    frontDesiredCount: serviceSettings['front-web-console'].desiredCount,
    gatewayDesiredCount: serviceSettings['edge-api-gateway'].desiredCount,
    accountAccessDesiredCount: serviceSettings['service-account-access'].desiredCount,
    organizationDesiredCount: serviceSettings['service-organization-registry'].desiredCount,
    driverProfileDesiredCount: serviceSettings['service-driver-profile'].desiredCount,
    personnelDocumentDesiredCount: serviceSettings['service-personnel-document-registry'].desiredCount,
    vehicleAssetDesiredCount: serviceSettings['service-vehicle-registry'].desiredCount,
    driverVehicleAssignmentDesiredCount: serviceSettings['service-vehicle-assignment'].desiredCount,
    dispatchRegistryDesiredCount: serviceSettings['service-dispatch-registry'].desiredCount,
    deliveryRecordDesiredCount: serviceSettings['service-delivery-record'].desiredCount,
    attendanceRegistryDesiredCount: serviceSettings['service-attendance-registry'].desiredCount,
    dispatchOpsDesiredCount: serviceSettings['service-dispatch-operations-view'].desiredCount,
    driverOpsDesiredCount: serviceSettings['service-driver-operations-view'].desiredCount,
    vehicleOpsDesiredCount: serviceSettings['service-vehicle-operations-view'].desiredCount,
    settlementRegistryDesiredCount: serviceSettings['service-settlement-registry'].desiredCount,
    settlementPayrollDesiredCount: serviceSettings['service-settlement-payroll'].desiredCount,
    settlementOpsDesiredCount: serviceSettings['service-settlement-operations-view'].desiredCount,
    regionRegistryDesiredCount: serviceSettings['service-region-registry'].desiredCount,
    regionAnalyticsDesiredCount: serviceSettings['service-region-analytics'].desiredCount,
    announcementRegistryDesiredCount: serviceSettings['service-announcement-registry'].desiredCount,
    supportRegistryDesiredCount: serviceSettings['service-support-registry'].desiredCount,
    notificationHubDesiredCount: serviceSettings['service-notification-hub'].desiredCount,
    terminalRegistryDesiredCount,
    telemetryHubDesiredCount,
    telemetryDeadLetterDesiredCount,
    telemetryListenerDesiredCount,
    frontCpu: serviceSettings['front-web-console'].cpu,
    frontMemoryMiB: serviceSettings['front-web-console'].memoryMiB,
    gatewayCpu: serviceSettings['edge-api-gateway'].cpu,
    gatewayMemoryMiB: serviceSettings['edge-api-gateway'].memoryMiB,
    accountAccessCpu: serviceSettings['service-account-access'].cpu,
    accountAccessMemoryMiB: serviceSettings['service-account-access'].memoryMiB,
    organizationCpu: serviceSettings['service-organization-registry'].cpu,
    organizationMemoryMiB: serviceSettings['service-organization-registry'].memoryMiB,
    driverProfileCpu: serviceSettings['service-driver-profile'].cpu,
    driverProfileMemoryMiB: serviceSettings['service-driver-profile'].memoryMiB,
    personnelDocumentCpu: serviceSettings['service-personnel-document-registry'].cpu,
    personnelDocumentMemoryMiB: serviceSettings['service-personnel-document-registry'].memoryMiB,
    vehicleAssetCpu: serviceSettings['service-vehicle-registry'].cpu,
    vehicleAssetMemoryMiB: serviceSettings['service-vehicle-registry'].memoryMiB,
    driverVehicleAssignmentCpu: serviceSettings['service-vehicle-assignment'].cpu,
    driverVehicleAssignmentMemoryMiB: serviceSettings['service-vehicle-assignment'].memoryMiB,
    dispatchRegistryCpu: serviceSettings['service-dispatch-registry'].cpu,
    dispatchRegistryMemoryMiB: serviceSettings['service-dispatch-registry'].memoryMiB,
    deliveryRecordCpu: serviceSettings['service-delivery-record'].cpu,
    deliveryRecordMemoryMiB: serviceSettings['service-delivery-record'].memoryMiB,
    attendanceRegistryCpu: serviceSettings['service-attendance-registry'].cpu,
    attendanceRegistryMemoryMiB: serviceSettings['service-attendance-registry'].memoryMiB,
    dispatchOpsCpu: serviceSettings['service-dispatch-operations-view'].cpu,
    dispatchOpsMemoryMiB: serviceSettings['service-dispatch-operations-view'].memoryMiB,
    driverOpsCpu: serviceSettings['service-driver-operations-view'].cpu,
    driverOpsMemoryMiB: serviceSettings['service-driver-operations-view'].memoryMiB,
    vehicleOpsCpu: serviceSettings['service-vehicle-operations-view'].cpu,
    vehicleOpsMemoryMiB: serviceSettings['service-vehicle-operations-view'].memoryMiB,
    settlementRegistryCpu: serviceSettings['service-settlement-registry'].cpu,
    settlementRegistryMemoryMiB: serviceSettings['service-settlement-registry'].memoryMiB,
    settlementPayrollCpu: serviceSettings['service-settlement-payroll'].cpu,
    settlementPayrollMemoryMiB: serviceSettings['service-settlement-payroll'].memoryMiB,
    settlementOpsCpu: serviceSettings['service-settlement-operations-view'].cpu,
    settlementOpsMemoryMiB: serviceSettings['service-settlement-operations-view'].memoryMiB,
    regionRegistryCpu: serviceSettings['service-region-registry'].cpu,
    regionRegistryMemoryMiB: serviceSettings['service-region-registry'].memoryMiB,
    regionAnalyticsCpu: serviceSettings['service-region-analytics'].cpu,
    regionAnalyticsMemoryMiB: serviceSettings['service-region-analytics'].memoryMiB,
    announcementRegistryCpu: serviceSettings['service-announcement-registry'].cpu,
    announcementRegistryMemoryMiB: serviceSettings['service-announcement-registry'].memoryMiB,
    supportRegistryCpu: serviceSettings['service-support-registry'].cpu,
    supportRegistryMemoryMiB: serviceSettings['service-support-registry'].memoryMiB,
    notificationHubCpu: serviceSettings['service-notification-hub'].cpu,
    notificationHubMemoryMiB: serviceSettings['service-notification-hub'].memoryMiB,
    terminalRegistryCpu: serviceSettings['service-terminal-registry'].cpu,
    terminalRegistryMemoryMiB: serviceSettings['service-terminal-registry'].memoryMiB,
    telemetryHubCpu: serviceSettings['service-telemetry-hub'].cpu,
    telemetryHubMemoryMiB: serviceSettings['service-telemetry-hub'].memoryMiB,
    telemetryDeadLetterCpu: serviceSettings['service-telemetry-dead-letter'].cpu,
    telemetryDeadLetterMemoryMiB: serviceSettings['service-telemetry-dead-letter'].memoryMiB,
    telemetryListenerCpu: serviceSettings['service-telemetry-listener'].cpu,
    telemetryListenerMemoryMiB: serviceSettings['service-telemetry-listener'].memoryMiB,
    frontHealthCheckPath: serviceSettings['front-web-console'].healthCheckPath!,
    gatewayHealthCheckPath: serviceSettings['edge-api-gateway'].healthCheckPath!,
    accountAccessHealthCheckPath: serviceSettings['service-account-access'].healthCheckPath!,
    organizationHealthCheckPath: serviceSettings['service-organization-registry'].healthCheckPath!,
    driverProfileHealthCheckPath: serviceSettings['service-driver-profile'].healthCheckPath!,
    personnelDocumentHealthCheckPath: serviceSettings['service-personnel-document-registry'].healthCheckPath!,
    vehicleAssetHealthCheckPath: serviceSettings['service-vehicle-registry'].healthCheckPath!,
    driverVehicleAssignmentHealthCheckPath: serviceSettings['service-vehicle-assignment'].healthCheckPath!,
    dispatchRegistryHealthCheckPath: serviceSettings['service-dispatch-registry'].healthCheckPath!,
    deliveryRecordHealthCheckPath: serviceSettings['service-delivery-record'].healthCheckPath!,
    attendanceRegistryHealthCheckPath: serviceSettings['service-attendance-registry'].healthCheckPath!,
    dispatchOpsHealthCheckPath: serviceSettings['service-dispatch-operations-view'].healthCheckPath!,
    driverOpsHealthCheckPath: serviceSettings['service-driver-operations-view'].healthCheckPath!,
    vehicleOpsHealthCheckPath: serviceSettings['service-vehicle-operations-view'].healthCheckPath!,
    settlementRegistryHealthCheckPath: serviceSettings['service-settlement-registry'].healthCheckPath!,
    settlementPayrollHealthCheckPath: serviceSettings['service-settlement-payroll'].healthCheckPath!,
    settlementOpsHealthCheckPath: serviceSettings['service-settlement-operations-view'].healthCheckPath!,
    regionRegistryHealthCheckPath: serviceSettings['service-region-registry'].healthCheckPath!,
    regionAnalyticsHealthCheckPath: serviceSettings['service-region-analytics'].healthCheckPath!,
    announcementRegistryHealthCheckPath: serviceSettings['service-announcement-registry'].healthCheckPath!,
    supportRegistryHealthCheckPath: serviceSettings['service-support-registry'].healthCheckPath!,
    notificationHubHealthCheckPath: serviceSettings['service-notification-hub'].healthCheckPath!,
    terminalRegistryHealthCheckPath: serviceSettings['service-terminal-registry'].healthCheckPath,
    telemetryHubHealthCheckPath: serviceSettings['service-telemetry-hub'].healthCheckPath,
    telemetryDeadLetterHealthCheckPath: serviceSettings['service-telemetry-dead-letter'].healthCheckPath,
    settlementOpsBaseUrl: env.SETTLEMENT_OPS_BASE_URL || 'http://settlement-ops-api:8000',
    telemetryHubBaseUrl: env.TELEMETRY_HUB_BASE_URL || 'http://telemetry-hub-api:8000',
    terminalRegistryBaseUrl: env.TERMINAL_REGISTRY_BASE_URL || 'http://terminal-registry-api:8000',
    telemetryListenerMqttHost: emptyToUndefined(env.TELEMETRY_LISTENER_MQTT_HOST),
    telemetryListenerMqttPort: toNumber(
      env.TELEMETRY_LISTENER_MQTT_PORT,
      'TELEMETRY_LISTENER_MQTT_PORT',
      1883
    ),
    telemetryListenerMqttTopics,
    telemetryListenerClientId:
      emptyToUndefined(env.TELEMETRY_LISTENER_CLIENT_ID) ?? 'service-telemetry-listener',
    telemetryListenerRetryCount: toNumber(
      env.TELEMETRY_LISTENER_RETRY_COUNT,
      'TELEMETRY_LISTENER_RETRY_COUNT',
      3
    ),
    telemetryListenerRetryBackoffSeconds: toNumber(
      env.TELEMETRY_LISTENER_RETRY_BACKOFF_SECONDS,
      'TELEMETRY_LISTENER_RETRY_BACKOFF_SECONDS',
      1
    ),
    telemetryListenerIdleSleepSeconds: toNumber(
      env.TELEMETRY_LISTENER_IDLE_SLEEP_SECONDS,
      'TELEMETRY_LISTENER_IDLE_SLEEP_SECONDS',
      5
    )
  });
}

export function buildCatalogBackedServiceSettings(
  env: NodeJS.ProcessEnv
): Record<ReleaseManifestServiceName, CatalogBackedServiceSetting> {
  const settings = {} as Record<ReleaseManifestServiceName, CatalogBackedServiceSetting>;

  for (const entry of listServiceCatalogEntries()) {
    const desiredCount = toNumber(env[entry.desiredCountEnvKey], String(entry.desiredCountEnvKey), entry.defaultDesiredCount);
    const imageValue = entry.imageRequiredWhenEnabledOnly
      ? requiredWhenEnabled(env[entry.imageEnvKey], String(entry.imageEnvKey), desiredCount)
      : required(env[entry.imageEnvKey], String(entry.imageEnvKey));

    settings[entry.service] = {
      imageUri: imageValue,
      desiredCount,
      cpu: toNumber(env[entry.cpuEnvKey], String(entry.cpuEnvKey), entry.defaultCpu),
      memoryMiB: toNumber(env[entry.memoryEnvKey], String(entry.memoryEnvKey), entry.defaultMemoryMiB),
      healthCheckPath:
        entry.healthCheckPathEnvKey && entry.defaultHealthCheckPath
          ? emptyToUndefined(env[entry.healthCheckPathEnvKey]) ?? entry.defaultHealthCheckPath
          : undefined
    };
  }

  return settings;
}

function toDeployEnvironment(value: string | undefined): 'dev' | 'stage' | 'prod' | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === 'dev' || value === 'stage' || value === 'prod') {
    return value;
  }

  throw new Error(`Environment variable DEPLOY_ENVIRONMENT must be one of dev, stage, prod`);
}

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredWhenEnabled(value: string | undefined, name: string, desiredCount: number): string | undefined {
  if (desiredCount > 0) {
    return required(value, name);
  }

  return emptyToUndefined(value);
}

function toNumber(value: string | undefined, name: string, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

function toOptionalPositiveInteger(value: string | undefined, name: string): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return parsed;
}

function optionalList(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = normalizeHosts(value.split(','));

  return parsed.length > 0 ? parsed : undefined;
}

function normalizeHosts(values: string[] | undefined): string[] {
  if (!values) {
    return [];
  }

  const normalizedHosts: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    normalizedHosts.push(normalized);
  }

  return normalizedHosts;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function toRuntimeMode(value: string | undefined): 'ecs' | 'ec2' {
  if (!value || value.trim() === '') {
    return 'ecs';
  }

  if (value === 'ecs' || value === 'ec2') {
    return value;
  }

  throw new Error('Environment variable RUNTIME_MODE must be either ecs or ec2');
}

function toRunProfile(
  value: string | undefined
): 'full' | 'bootstrap-proof' | 'incremental-expand' | 'smoke-only' | 'warm-host-partial' {
  if (!value || value.trim() === '') {
    return 'full';
  }

  if (
    value === 'full' ||
    value === 'bootstrap-proof' ||
    value === 'incremental-expand' ||
    value === 'smoke-only' ||
    value === 'warm-host-partial'
  ) {
    return value;
  }

  throw new Error(
    'Environment variable RUN_PROFILE must be full, bootstrap-proof, incremental-expand, smoke-only, or warm-host-partial'
  );
}

function buildDefaultAvailabilityZones(region: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${region}${String.fromCharCode(97 + index)}`);
}
