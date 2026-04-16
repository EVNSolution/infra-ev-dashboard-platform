export type PlatformConfigInput = {
  runProfile?: 'full' | 'bootstrap-proof' | 'smoke-only' | 'warm-host-partial';
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
  runProfile: 'full' | 'bootstrap-proof' | 'smoke-only' | 'warm-host-partial';
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

export function buildPlatformConfig(input: PlatformConfigInput): PlatformConfig {
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
  if (requiresPrivateSubnets && privateSubnetIds.length === 0) {
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
  const frontHealthCheckPath = emptyToUndefined(env.FRONT_HEALTH_CHECK_PATH);
  const gatewayHealthCheckPath = emptyToUndefined(env.GATEWAY_HEALTH_CHECK_PATH);
  const accountAccessHealthCheckPath = emptyToUndefined(env.ACCOUNT_ACCESS_HEALTH_CHECK_PATH);
  const organizationHealthCheckPath = emptyToUndefined(env.ORGANIZATION_HEALTH_CHECK_PATH);
  const driverProfileHealthCheckPath = emptyToUndefined(env.DRIVER_PROFILE_HEALTH_CHECK_PATH);
  const personnelDocumentHealthCheckPath = emptyToUndefined(env.PERSONNEL_DOCUMENT_HEALTH_CHECK_PATH);
  const vehicleAssetHealthCheckPath = emptyToUndefined(env.VEHICLE_ASSET_HEALTH_CHECK_PATH);
  const driverVehicleAssignmentHealthCheckPath = emptyToUndefined(env.DRIVER_VEHICLE_ASSIGNMENT_HEALTH_CHECK_PATH);
  const dispatchRegistryHealthCheckPath = emptyToUndefined(env.DISPATCH_REGISTRY_HEALTH_CHECK_PATH);
  const deliveryRecordHealthCheckPath = emptyToUndefined(env.DELIVERY_RECORD_HEALTH_CHECK_PATH);
  const attendanceRegistryHealthCheckPath = emptyToUndefined(env.ATTENDANCE_REGISTRY_HEALTH_CHECK_PATH);
  const dispatchOpsHealthCheckPath = emptyToUndefined(env.DISPATCH_OPS_HEALTH_CHECK_PATH);
  const driverOpsHealthCheckPath = emptyToUndefined(env.DRIVER_OPS_HEALTH_CHECK_PATH);
  const vehicleOpsHealthCheckPath = emptyToUndefined(env.VEHICLE_OPS_HEALTH_CHECK_PATH);
  const settlementRegistryHealthCheckPath = emptyToUndefined(env.SETTLEMENT_REGISTRY_HEALTH_CHECK_PATH);
  const settlementPayrollHealthCheckPath = emptyToUndefined(env.SETTLEMENT_PAYROLL_HEALTH_CHECK_PATH);
  const settlementOpsHealthCheckPath = emptyToUndefined(env.SETTLEMENT_OPS_HEALTH_CHECK_PATH);
  const regionRegistryHealthCheckPath = emptyToUndefined(env.REGION_REGISTRY_HEALTH_CHECK_PATH);
  const regionAnalyticsHealthCheckPath = emptyToUndefined(env.REGION_ANALYTICS_HEALTH_CHECK_PATH);
  const announcementRegistryHealthCheckPath = emptyToUndefined(env.ANNOUNCEMENT_REGISTRY_HEALTH_CHECK_PATH);
  const supportRegistryHealthCheckPath = emptyToUndefined(env.SUPPORT_REGISTRY_HEALTH_CHECK_PATH);
  const notificationHubHealthCheckPath = emptyToUndefined(env.NOTIFICATION_HUB_HEALTH_CHECK_PATH);
  const terminalRegistryHealthCheckPath = emptyToUndefined(env.TERMINAL_REGISTRY_HEALTH_CHECK_PATH);
  const telemetryHubHealthCheckPath = emptyToUndefined(env.TELEMETRY_HUB_HEALTH_CHECK_PATH);
  const telemetryDeadLetterHealthCheckPath = emptyToUndefined(env.TELEMETRY_DEAD_LETTER_HEALTH_CHECK_PATH);
  const terminalRegistryDesiredCount = toNumber(
    env.TERMINAL_REGISTRY_DESIRED_COUNT,
    'TERMINAL_REGISTRY_DESIRED_COUNT',
    0
  );
  const telemetryHubDesiredCount = toNumber(env.TELEMETRY_HUB_DESIRED_COUNT, 'TELEMETRY_HUB_DESIRED_COUNT', 0);
  const telemetryDeadLetterDesiredCount = toNumber(
    env.TELEMETRY_DEAD_LETTER_DESIRED_COUNT,
    'TELEMETRY_DEAD_LETTER_DESIRED_COUNT',
    0
  );
  const telemetryListenerDesiredCount = toNumber(
    env.TELEMETRY_LISTENER_DESIRED_COUNT,
    'TELEMETRY_LISTENER_DESIRED_COUNT',
    0
  );
  const telemetryListenerMqttTopics = optionalList(env.TELEMETRY_LISTENER_MQTT_TOPICS) ?? ['telemetry/#'];

  return buildPlatformConfig({
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
    frontImageUri: required(env.FRONT_IMAGE_URI, 'FRONT_IMAGE_URI'),
    gatewayImageUri: required(env.GATEWAY_IMAGE_URI, 'GATEWAY_IMAGE_URI'),
    accountAccessImageUri: required(env.ACCOUNT_ACCESS_IMAGE_URI, 'ACCOUNT_ACCESS_IMAGE_URI'),
    organizationImageUri: required(env.ORGANIZATION_IMAGE_URI, 'ORGANIZATION_IMAGE_URI'),
    driverProfileImageUri: required(env.DRIVER_PROFILE_IMAGE_URI, 'DRIVER_PROFILE_IMAGE_URI'),
    personnelDocumentImageUri: required(env.PERSONNEL_DOCUMENT_IMAGE_URI, 'PERSONNEL_DOCUMENT_IMAGE_URI'),
    vehicleAssetImageUri: required(env.VEHICLE_ASSET_IMAGE_URI, 'VEHICLE_ASSET_IMAGE_URI'),
    driverVehicleAssignmentImageUri: required(
      env.DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI,
      'DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI'
    ),
    dispatchRegistryImageUri: required(env.DISPATCH_REGISTRY_IMAGE_URI, 'DISPATCH_REGISTRY_IMAGE_URI'),
    deliveryRecordImageUri: required(env.DELIVERY_RECORD_IMAGE_URI, 'DELIVERY_RECORD_IMAGE_URI'),
    attendanceRegistryImageUri: required(env.ATTENDANCE_REGISTRY_IMAGE_URI, 'ATTENDANCE_REGISTRY_IMAGE_URI'),
    dispatchOpsImageUri: required(env.DISPATCH_OPS_IMAGE_URI, 'DISPATCH_OPS_IMAGE_URI'),
    driverOpsImageUri: required(env.DRIVER_OPS_IMAGE_URI, 'DRIVER_OPS_IMAGE_URI'),
    vehicleOpsImageUri: required(env.VEHICLE_OPS_IMAGE_URI, 'VEHICLE_OPS_IMAGE_URI'),
    settlementRegistryImageUri: required(env.SETTLEMENT_REGISTRY_IMAGE_URI, 'SETTLEMENT_REGISTRY_IMAGE_URI'),
    settlementPayrollImageUri: required(env.SETTLEMENT_PAYROLL_IMAGE_URI, 'SETTLEMENT_PAYROLL_IMAGE_URI'),
    settlementOpsImageUri: required(env.SETTLEMENT_OPS_IMAGE_URI, 'SETTLEMENT_OPS_IMAGE_URI'),
    regionRegistryImageUri: required(env.REGION_REGISTRY_IMAGE_URI, 'REGION_REGISTRY_IMAGE_URI'),
    regionAnalyticsImageUri: required(env.REGION_ANALYTICS_IMAGE_URI, 'REGION_ANALYTICS_IMAGE_URI'),
    announcementRegistryImageUri: required(
      env.ANNOUNCEMENT_REGISTRY_IMAGE_URI,
      'ANNOUNCEMENT_REGISTRY_IMAGE_URI'
    ),
    supportRegistryImageUri: required(env.SUPPORT_REGISTRY_IMAGE_URI, 'SUPPORT_REGISTRY_IMAGE_URI'),
    notificationHubImageUri: required(env.NOTIFICATION_HUB_IMAGE_URI, 'NOTIFICATION_HUB_IMAGE_URI'),
    terminalRegistryImageUri: requiredWhenEnabled(
      env.TERMINAL_REGISTRY_IMAGE_URI,
      'TERMINAL_REGISTRY_IMAGE_URI',
      terminalRegistryDesiredCount
    ),
    telemetryHubImageUri: requiredWhenEnabled(
      env.TELEMETRY_HUB_IMAGE_URI,
      'TELEMETRY_HUB_IMAGE_URI',
      telemetryHubDesiredCount
    ),
    telemetryDeadLetterImageUri: requiredWhenEnabled(
      env.TELEMETRY_DEAD_LETTER_IMAGE_URI,
      'TELEMETRY_DEAD_LETTER_IMAGE_URI',
      telemetryDeadLetterDesiredCount
    ),
    telemetryListenerImageUri: requiredWhenEnabled(
      env.TELEMETRY_LISTENER_IMAGE_URI,
      'TELEMETRY_LISTENER_IMAGE_URI',
      telemetryListenerDesiredCount
    ),
    frontDesiredCount: toNumber(env.FRONT_DESIRED_COUNT, 'FRONT_DESIRED_COUNT', 1),
    gatewayDesiredCount: toNumber(env.GATEWAY_DESIRED_COUNT, 'GATEWAY_DESIRED_COUNT', 1),
    accountAccessDesiredCount: toNumber(env.ACCOUNT_ACCESS_DESIRED_COUNT, 'ACCOUNT_ACCESS_DESIRED_COUNT', 1),
    organizationDesiredCount: toNumber(env.ORGANIZATION_DESIRED_COUNT, 'ORGANIZATION_DESIRED_COUNT', 0),
    driverProfileDesiredCount: toNumber(env.DRIVER_PROFILE_DESIRED_COUNT, 'DRIVER_PROFILE_DESIRED_COUNT', 0),
    personnelDocumentDesiredCount: toNumber(
      env.PERSONNEL_DOCUMENT_DESIRED_COUNT,
      'PERSONNEL_DOCUMENT_DESIRED_COUNT',
      0
    ),
    vehicleAssetDesiredCount: toNumber(env.VEHICLE_ASSET_DESIRED_COUNT, 'VEHICLE_ASSET_DESIRED_COUNT', 0),
    driverVehicleAssignmentDesiredCount: toNumber(
      env.DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT,
      'DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT',
      0
    ),
    dispatchRegistryDesiredCount: toNumber(env.DISPATCH_REGISTRY_DESIRED_COUNT, 'DISPATCH_REGISTRY_DESIRED_COUNT', 0),
    deliveryRecordDesiredCount: toNumber(env.DELIVERY_RECORD_DESIRED_COUNT, 'DELIVERY_RECORD_DESIRED_COUNT', 0),
    attendanceRegistryDesiredCount: toNumber(
      env.ATTENDANCE_REGISTRY_DESIRED_COUNT,
      'ATTENDANCE_REGISTRY_DESIRED_COUNT',
      0
    ),
    dispatchOpsDesiredCount: toNumber(env.DISPATCH_OPS_DESIRED_COUNT, 'DISPATCH_OPS_DESIRED_COUNT', 0),
    driverOpsDesiredCount: toNumber(env.DRIVER_OPS_DESIRED_COUNT, 'DRIVER_OPS_DESIRED_COUNT', 0),
    vehicleOpsDesiredCount: toNumber(env.VEHICLE_OPS_DESIRED_COUNT, 'VEHICLE_OPS_DESIRED_COUNT', 0),
    settlementRegistryDesiredCount: toNumber(
      env.SETTLEMENT_REGISTRY_DESIRED_COUNT,
      'SETTLEMENT_REGISTRY_DESIRED_COUNT',
      0
    ),
    settlementPayrollDesiredCount: toNumber(
      env.SETTLEMENT_PAYROLL_DESIRED_COUNT,
      'SETTLEMENT_PAYROLL_DESIRED_COUNT',
      0
    ),
    settlementOpsDesiredCount: toNumber(env.SETTLEMENT_OPS_DESIRED_COUNT, 'SETTLEMENT_OPS_DESIRED_COUNT', 0),
    regionRegistryDesiredCount: toNumber(env.REGION_REGISTRY_DESIRED_COUNT, 'REGION_REGISTRY_DESIRED_COUNT', 0),
    regionAnalyticsDesiredCount: toNumber(env.REGION_ANALYTICS_DESIRED_COUNT, 'REGION_ANALYTICS_DESIRED_COUNT', 0),
    announcementRegistryDesiredCount: toNumber(
      env.ANNOUNCEMENT_REGISTRY_DESIRED_COUNT,
      'ANNOUNCEMENT_REGISTRY_DESIRED_COUNT',
      0
    ),
    supportRegistryDesiredCount: toNumber(env.SUPPORT_REGISTRY_DESIRED_COUNT, 'SUPPORT_REGISTRY_DESIRED_COUNT', 0),
    notificationHubDesiredCount: toNumber(
      env.NOTIFICATION_HUB_DESIRED_COUNT,
      'NOTIFICATION_HUB_DESIRED_COUNT',
      0
    ),
    terminalRegistryDesiredCount,
    telemetryHubDesiredCount,
    telemetryDeadLetterDesiredCount,
    telemetryListenerDesiredCount,
    frontCpu: toNumber(env.FRONT_CPU, 'FRONT_CPU', 256),
    frontMemoryMiB: toNumber(env.FRONT_MEMORY_MIB, 'FRONT_MEMORY_MIB', 512),
    gatewayCpu: toNumber(env.GATEWAY_CPU, 'GATEWAY_CPU', 256),
    gatewayMemoryMiB: toNumber(env.GATEWAY_MEMORY_MIB, 'GATEWAY_MEMORY_MIB', 512),
    accountAccessCpu: toNumber(env.ACCOUNT_ACCESS_CPU, 'ACCOUNT_ACCESS_CPU', 256),
    accountAccessMemoryMiB: toNumber(env.ACCOUNT_ACCESS_MEMORY_MIB, 'ACCOUNT_ACCESS_MEMORY_MIB', 512),
    organizationCpu: toNumber(env.ORGANIZATION_CPU, 'ORGANIZATION_CPU', 256),
    organizationMemoryMiB: toNumber(env.ORGANIZATION_MEMORY_MIB, 'ORGANIZATION_MEMORY_MIB', 512),
    driverProfileCpu: toNumber(env.DRIVER_PROFILE_CPU, 'DRIVER_PROFILE_CPU', 256),
    driverProfileMemoryMiB: toNumber(env.DRIVER_PROFILE_MEMORY_MIB, 'DRIVER_PROFILE_MEMORY_MIB', 512),
    personnelDocumentCpu: toNumber(env.PERSONNEL_DOCUMENT_CPU, 'PERSONNEL_DOCUMENT_CPU', 256),
    personnelDocumentMemoryMiB: toNumber(
      env.PERSONNEL_DOCUMENT_MEMORY_MIB,
      'PERSONNEL_DOCUMENT_MEMORY_MIB',
      512
    ),
    vehicleAssetCpu: toNumber(env.VEHICLE_ASSET_CPU, 'VEHICLE_ASSET_CPU', 256),
    vehicleAssetMemoryMiB: toNumber(env.VEHICLE_ASSET_MEMORY_MIB, 'VEHICLE_ASSET_MEMORY_MIB', 512),
    driverVehicleAssignmentCpu: toNumber(
      env.DRIVER_VEHICLE_ASSIGNMENT_CPU,
      'DRIVER_VEHICLE_ASSIGNMENT_CPU',
      256
    ),
    driverVehicleAssignmentMemoryMiB: toNumber(
      env.DRIVER_VEHICLE_ASSIGNMENT_MEMORY_MIB,
      'DRIVER_VEHICLE_ASSIGNMENT_MEMORY_MIB',
      512
    ),
    dispatchRegistryCpu: toNumber(env.DISPATCH_REGISTRY_CPU, 'DISPATCH_REGISTRY_CPU', 256),
    dispatchRegistryMemoryMiB: toNumber(env.DISPATCH_REGISTRY_MEMORY_MIB, 'DISPATCH_REGISTRY_MEMORY_MIB', 512),
    deliveryRecordCpu: toNumber(env.DELIVERY_RECORD_CPU, 'DELIVERY_RECORD_CPU', 256),
    deliveryRecordMemoryMiB: toNumber(env.DELIVERY_RECORD_MEMORY_MIB, 'DELIVERY_RECORD_MEMORY_MIB', 512),
    attendanceRegistryCpu: toNumber(env.ATTENDANCE_REGISTRY_CPU, 'ATTENDANCE_REGISTRY_CPU', 256),
    attendanceRegistryMemoryMiB: toNumber(
      env.ATTENDANCE_REGISTRY_MEMORY_MIB,
      'ATTENDANCE_REGISTRY_MEMORY_MIB',
      512
    ),
    dispatchOpsCpu: toNumber(env.DISPATCH_OPS_CPU, 'DISPATCH_OPS_CPU', 256),
    dispatchOpsMemoryMiB: toNumber(env.DISPATCH_OPS_MEMORY_MIB, 'DISPATCH_OPS_MEMORY_MIB', 512),
    driverOpsCpu: toNumber(env.DRIVER_OPS_CPU, 'DRIVER_OPS_CPU', 256),
    driverOpsMemoryMiB: toNumber(env.DRIVER_OPS_MEMORY_MIB, 'DRIVER_OPS_MEMORY_MIB', 512),
    vehicleOpsCpu: toNumber(env.VEHICLE_OPS_CPU, 'VEHICLE_OPS_CPU', 256),
    vehicleOpsMemoryMiB: toNumber(env.VEHICLE_OPS_MEMORY_MIB, 'VEHICLE_OPS_MEMORY_MIB', 512),
    settlementRegistryCpu: toNumber(env.SETTLEMENT_REGISTRY_CPU, 'SETTLEMENT_REGISTRY_CPU', 256),
    settlementRegistryMemoryMiB: toNumber(
      env.SETTLEMENT_REGISTRY_MEMORY_MIB,
      'SETTLEMENT_REGISTRY_MEMORY_MIB',
      512
    ),
    settlementPayrollCpu: toNumber(env.SETTLEMENT_PAYROLL_CPU, 'SETTLEMENT_PAYROLL_CPU', 256),
    settlementPayrollMemoryMiB: toNumber(
      env.SETTLEMENT_PAYROLL_MEMORY_MIB,
      'SETTLEMENT_PAYROLL_MEMORY_MIB',
      512
    ),
    settlementOpsCpu: toNumber(env.SETTLEMENT_OPS_CPU, 'SETTLEMENT_OPS_CPU', 256),
    settlementOpsMemoryMiB: toNumber(env.SETTLEMENT_OPS_MEMORY_MIB, 'SETTLEMENT_OPS_MEMORY_MIB', 512),
    regionRegistryCpu: toNumber(env.REGION_REGISTRY_CPU, 'REGION_REGISTRY_CPU', 256),
    regionRegistryMemoryMiB: toNumber(env.REGION_REGISTRY_MEMORY_MIB, 'REGION_REGISTRY_MEMORY_MIB', 512),
    regionAnalyticsCpu: toNumber(env.REGION_ANALYTICS_CPU, 'REGION_ANALYTICS_CPU', 256),
    regionAnalyticsMemoryMiB: toNumber(
      env.REGION_ANALYTICS_MEMORY_MIB,
      'REGION_ANALYTICS_MEMORY_MIB',
      512
    ),
    announcementRegistryCpu: toNumber(env.ANNOUNCEMENT_REGISTRY_CPU, 'ANNOUNCEMENT_REGISTRY_CPU', 256),
    announcementRegistryMemoryMiB: toNumber(
      env.ANNOUNCEMENT_REGISTRY_MEMORY_MIB,
      'ANNOUNCEMENT_REGISTRY_MEMORY_MIB',
      512
    ),
    supportRegistryCpu: toNumber(env.SUPPORT_REGISTRY_CPU, 'SUPPORT_REGISTRY_CPU', 256),
    supportRegistryMemoryMiB: toNumber(env.SUPPORT_REGISTRY_MEMORY_MIB, 'SUPPORT_REGISTRY_MEMORY_MIB', 512),
    notificationHubCpu: toNumber(env.NOTIFICATION_HUB_CPU, 'NOTIFICATION_HUB_CPU', 256),
    notificationHubMemoryMiB: toNumber(
      env.NOTIFICATION_HUB_MEMORY_MIB,
      'NOTIFICATION_HUB_MEMORY_MIB',
      512
    ),
    terminalRegistryCpu: toNumber(env.TERMINAL_REGISTRY_CPU, 'TERMINAL_REGISTRY_CPU', 256),
    terminalRegistryMemoryMiB: toNumber(env.TERMINAL_REGISTRY_MEMORY_MIB, 'TERMINAL_REGISTRY_MEMORY_MIB', 512),
    telemetryHubCpu: toNumber(env.TELEMETRY_HUB_CPU, 'TELEMETRY_HUB_CPU', 256),
    telemetryHubMemoryMiB: toNumber(env.TELEMETRY_HUB_MEMORY_MIB, 'TELEMETRY_HUB_MEMORY_MIB', 512),
    telemetryDeadLetterCpu: toNumber(env.TELEMETRY_DEAD_LETTER_CPU, 'TELEMETRY_DEAD_LETTER_CPU', 256),
    telemetryDeadLetterMemoryMiB: toNumber(
      env.TELEMETRY_DEAD_LETTER_MEMORY_MIB,
      'TELEMETRY_DEAD_LETTER_MEMORY_MIB',
      512
    ),
    telemetryListenerCpu: toNumber(env.TELEMETRY_LISTENER_CPU, 'TELEMETRY_LISTENER_CPU', 256),
    telemetryListenerMemoryMiB: toNumber(env.TELEMETRY_LISTENER_MEMORY_MIB, 'TELEMETRY_LISTENER_MEMORY_MIB', 512),
    frontHealthCheckPath: frontHealthCheckPath ?? '/healthz',
    gatewayHealthCheckPath: gatewayHealthCheckPath ?? '/healthz',
    accountAccessHealthCheckPath: accountAccessHealthCheckPath ?? '/healthz',
    organizationHealthCheckPath: organizationHealthCheckPath ?? '/health/',
    driverProfileHealthCheckPath: driverProfileHealthCheckPath ?? '/health/',
    personnelDocumentHealthCheckPath: personnelDocumentHealthCheckPath ?? '/health/',
    vehicleAssetHealthCheckPath: vehicleAssetHealthCheckPath ?? '/health/',
    driverVehicleAssignmentHealthCheckPath: driverVehicleAssignmentHealthCheckPath ?? '/health/',
    dispatchRegistryHealthCheckPath: dispatchRegistryHealthCheckPath ?? '/health/',
    deliveryRecordHealthCheckPath: deliveryRecordHealthCheckPath ?? '/health/',
    attendanceRegistryHealthCheckPath: attendanceRegistryHealthCheckPath ?? '/health/',
    dispatchOpsHealthCheckPath: dispatchOpsHealthCheckPath ?? '/health/',
    driverOpsHealthCheckPath: driverOpsHealthCheckPath ?? '/health/',
    vehicleOpsHealthCheckPath: vehicleOpsHealthCheckPath ?? '/health/',
    settlementRegistryHealthCheckPath: settlementRegistryHealthCheckPath ?? '/health/',
    settlementPayrollHealthCheckPath: settlementPayrollHealthCheckPath ?? '/health/',
    settlementOpsHealthCheckPath: settlementOpsHealthCheckPath ?? '/health/',
    regionRegistryHealthCheckPath: regionRegistryHealthCheckPath ?? '/health/',
    regionAnalyticsHealthCheckPath: regionAnalyticsHealthCheckPath ?? '/health/',
    announcementRegistryHealthCheckPath: announcementRegistryHealthCheckPath ?? '/health/',
    supportRegistryHealthCheckPath: supportRegistryHealthCheckPath ?? '/health/',
    notificationHubHealthCheckPath: notificationHubHealthCheckPath ?? '/health/',
    terminalRegistryHealthCheckPath: terminalRegistryHealthCheckPath ?? '/health/',
    telemetryHubHealthCheckPath: telemetryHubHealthCheckPath ?? '/health/',
    telemetryDeadLetterHealthCheckPath: telemetryDeadLetterHealthCheckPath ?? '/health/',
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

function toRunProfile(value: string | undefined): 'full' | 'bootstrap-proof' | 'smoke-only' | 'warm-host-partial' {
  if (!value || value.trim() === '') {
    return 'full';
  }

  if (value === 'full' || value === 'bootstrap-proof' || value === 'smoke-only' || value === 'warm-host-partial') {
    return value;
  }

  throw new Error('Environment variable RUN_PROFILE must be full, bootstrap-proof, smoke-only, or warm-host-partial');
}

function buildDefaultAvailabilityZones(region: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${region}${String.fromCharCode(97 + index)}`);
}
