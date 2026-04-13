export type PlatformConfigInput = {
  region: string;
  hostedZoneId: string;
  apexDomain: string;
  apiDomain: string;
  certificateArn: string;
  vpcId: string;
  publicSubnetIds: string[];
  availabilityZones?: string[];
  frontImageUri: string;
  gatewayImageUri: string;
  accountAccessImageUri: string;
  frontDesiredCount: number;
  gatewayDesiredCount: number;
  accountAccessDesiredCount: number;
  frontCpu: number;
  frontMemoryMiB: number;
  gatewayCpu: number;
  gatewayMemoryMiB: number;
  accountAccessCpu: number;
  accountAccessMemoryMiB: number;
  frontHealthCheckPath: string;
  gatewayHealthCheckPath: string;
  accountAccessHealthCheckPath: string;
};

export type PlatformConfig = PlatformConfigInput & {
  availabilityZones: string[];
};

export function buildPlatformConfig(input: PlatformConfigInput): PlatformConfig {
  return {
    ...input,
    availabilityZones:
      input.availabilityZones ?? buildDefaultAvailabilityZones(input.region, input.publicSubnetIds.length)
  };
}

export function buildPlatformConfigFromEnv(env: NodeJS.ProcessEnv): PlatformConfig {
  return buildPlatformConfig({
    region: required(env.AWS_REGION ?? env.CDK_DEFAULT_REGION, 'AWS_REGION'),
    hostedZoneId: required(env.HOSTED_ZONE_ID, 'HOSTED_ZONE_ID'),
    apexDomain: required(env.APEX_DOMAIN, 'APEX_DOMAIN'),
    apiDomain: required(env.API_DOMAIN, 'API_DOMAIN'),
    certificateArn: required(env.CERTIFICATE_ARN, 'CERTIFICATE_ARN'),
    vpcId: required(env.VPC_ID, 'VPC_ID'),
    publicSubnetIds: required(env.PUBLIC_SUBNET_IDS, 'PUBLIC_SUBNET_IDS')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    availabilityZones: optionalList(env.AVAILABILITY_ZONES),
    frontImageUri: required(env.FRONT_IMAGE_URI, 'FRONT_IMAGE_URI'),
    gatewayImageUri: required(env.GATEWAY_IMAGE_URI, 'GATEWAY_IMAGE_URI'),
    accountAccessImageUri: required(env.ACCOUNT_ACCESS_IMAGE_URI, 'ACCOUNT_ACCESS_IMAGE_URI'),
    frontDesiredCount: toNumber(env.FRONT_DESIRED_COUNT, 'FRONT_DESIRED_COUNT', 1),
    gatewayDesiredCount: toNumber(env.GATEWAY_DESIRED_COUNT, 'GATEWAY_DESIRED_COUNT', 1),
    accountAccessDesiredCount: toNumber(env.ACCOUNT_ACCESS_DESIRED_COUNT, 'ACCOUNT_ACCESS_DESIRED_COUNT', 1),
    frontCpu: toNumber(env.FRONT_CPU, 'FRONT_CPU', 256),
    frontMemoryMiB: toNumber(env.FRONT_MEMORY_MIB, 'FRONT_MEMORY_MIB', 512),
    gatewayCpu: toNumber(env.GATEWAY_CPU, 'GATEWAY_CPU', 256),
    gatewayMemoryMiB: toNumber(env.GATEWAY_MEMORY_MIB, 'GATEWAY_MEMORY_MIB', 512),
    accountAccessCpu: toNumber(env.ACCOUNT_ACCESS_CPU, 'ACCOUNT_ACCESS_CPU', 256),
    accountAccessMemoryMiB: toNumber(env.ACCOUNT_ACCESS_MEMORY_MIB, 'ACCOUNT_ACCESS_MEMORY_MIB', 512),
    frontHealthCheckPath: env.FRONT_HEALTH_CHECK_PATH ?? '/',
    gatewayHealthCheckPath: env.GATEWAY_HEALTH_CHECK_PATH ?? '/healthz',
    accountAccessHealthCheckPath: env.ACCOUNT_ACCESS_HEALTH_CHECK_PATH ?? '/healthz'
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

function buildDefaultAvailabilityZones(region: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${region}${String.fromCharCode(97 + index)}`);
}
