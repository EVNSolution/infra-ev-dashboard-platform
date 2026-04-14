export type PlatformConfigInput = {
  region: string;
  hostedZoneId: string;
  hostedZoneName: string;
  apexDomain: string;
  apiDomain: string;
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds?: string[];
  availabilityZones?: string[];
  serviceConnectNamespace?: string;
  frontImageUri: string;
  gatewayImageUri: string;
  accountAccessImageUri: string;
  organizationImageUri: string;
  driverProfileImageUri: string;
  personnelDocumentImageUri: string;
  vehicleAssetImageUri: string;
  driverVehicleAssignmentImageUri: string;
  frontDesiredCount: number;
  gatewayDesiredCount: number;
  accountAccessDesiredCount: number;
  organizationDesiredCount: number;
  driverProfileDesiredCount: number;
  personnelDocumentDesiredCount: number;
  vehicleAssetDesiredCount: number;
  driverVehicleAssignmentDesiredCount: number;
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
  frontHealthCheckPath: string;
  gatewayHealthCheckPath: string;
  accountAccessHealthCheckPath: string;
  organizationHealthCheckPath: string;
  driverProfileHealthCheckPath: string;
  personnelDocumentHealthCheckPath: string;
  vehicleAssetHealthCheckPath: string;
  driverVehicleAssignmentHealthCheckPath: string;
};

export type PlatformConfig = PlatformConfigInput & {
  availabilityZones: string[];
  privateSubnetIds: string[];
  serviceConnectNamespace: string;
};

export function buildPlatformConfig(input: PlatformConfigInput): PlatformConfig {
  const privateSubnetIds = input.privateSubnetIds ?? [];
  const requiresPrivateSubnets =
    input.accountAccessDesiredCount > 0 ||
    input.organizationDesiredCount > 0 ||
    input.driverProfileDesiredCount > 0 ||
    input.personnelDocumentDesiredCount > 0 ||
    input.vehicleAssetDesiredCount > 0 ||
    input.driverVehicleAssignmentDesiredCount > 0;
  if (requiresPrivateSubnets && privateSubnetIds.length === 0) {
    throw new Error('Missing required environment variable: PRIVATE_SUBNET_IDS');
  }

  return {
    ...input,
    privateSubnetIds,
    serviceConnectNamespace: input.serviceConnectNamespace ?? 'ev-dashboard.internal',
    availabilityZones:
      input.availabilityZones ?? buildDefaultAvailabilityZones(input.region, input.publicSubnetIds.length)
  };
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

  return buildPlatformConfig({
    region: required(env.AWS_REGION ?? env.CDK_DEFAULT_REGION, 'AWS_REGION'),
    hostedZoneId: required(env.HOSTED_ZONE_ID, 'HOSTED_ZONE_ID'),
    hostedZoneName: required(env.HOSTED_ZONE_NAME, 'HOSTED_ZONE_NAME'),
    apexDomain: required(env.APEX_DOMAIN, 'APEX_DOMAIN'),
    apiDomain: required(env.API_DOMAIN, 'API_DOMAIN'),
    vpcId: required(env.VPC_ID, 'VPC_ID'),
    publicSubnetIds: required(env.PUBLIC_SUBNET_IDS, 'PUBLIC_SUBNET_IDS')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    privateSubnetIds: optionalList(env.PRIVATE_SUBNET_IDS),
    availabilityZones: optionalList(env.AVAILABILITY_ZONES),
    serviceConnectNamespace,
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
    frontHealthCheckPath: frontHealthCheckPath ?? '/healthz',
    gatewayHealthCheckPath: gatewayHealthCheckPath ?? '/healthz',
    accountAccessHealthCheckPath: accountAccessHealthCheckPath ?? '/healthz',
    organizationHealthCheckPath: organizationHealthCheckPath ?? '/health/',
    driverProfileHealthCheckPath: driverProfileHealthCheckPath ?? '/health/',
    personnelDocumentHealthCheckPath: personnelDocumentHealthCheckPath ?? '/health/',
    vehicleAssetHealthCheckPath: vehicleAssetHealthCheckPath ?? '/health/',
    driverVehicleAssignmentHealthCheckPath: driverVehicleAssignmentHealthCheckPath ?? '/health/'
  });
}

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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

  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : undefined;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function buildDefaultAvailabilityZones(region: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${region}${String.fromCharCode(97 + index)}`);
}
