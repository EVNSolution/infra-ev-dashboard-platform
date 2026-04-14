import { buildPlatformConfigFromEnv } from '../lib/config';

describe('buildPlatformConfigFromEnv', () => {
  test('treats empty optional environment values as defaults', () => {
    const config = buildPlatformConfigFromEnv({
      AWS_REGION: 'ap-northeast-2',
      HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
      HOSTED_ZONE_NAME: 'ev-dashboard.com',
      APEX_DOMAIN: 'next.ev-dashboard.com',
      API_DOMAIN: 'api.next.ev-dashboard.com',
      VPC_ID: 'vpc-015c89247f96e9221',
      PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
      AVAILABILITY_ZONES: 'ap-northeast-2a,ap-northeast-2c',
      SERVICE_CONNECT_NAMESPACE: '',
      FRONT_DESIRED_COUNT: '1',
      GATEWAY_DESIRED_COUNT: '0',
      ACCOUNT_ACCESS_DESIRED_COUNT: '0',
      ORGANIZATION_DESIRED_COUNT: '0',
      DRIVER_PROFILE_DESIRED_COUNT: '0',
      PERSONNEL_DOCUMENT_DESIRED_COUNT: '0',
      VEHICLE_ASSET_DESIRED_COUNT: '0',
      DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT: '0',
      FRONT_CPU: '',
      FRONT_MEMORY_MIB: '',
      GATEWAY_CPU: '',
      GATEWAY_MEMORY_MIB: '',
      ACCOUNT_ACCESS_CPU: '',
      ACCOUNT_ACCESS_MEMORY_MIB: '',
      ORGANIZATION_CPU: '',
      ORGANIZATION_MEMORY_MIB: '',
      DRIVER_PROFILE_CPU: '',
      DRIVER_PROFILE_MEMORY_MIB: '',
      PERSONNEL_DOCUMENT_CPU: '',
      PERSONNEL_DOCUMENT_MEMORY_MIB: '',
      VEHICLE_ASSET_CPU: '',
      VEHICLE_ASSET_MEMORY_MIB: '',
      DRIVER_VEHICLE_ASSIGNMENT_CPU: '',
      DRIVER_VEHICLE_ASSIGNMENT_MEMORY_MIB: '',
      FRONT_HEALTH_CHECK_PATH: '',
      GATEWAY_HEALTH_CHECK_PATH: '',
      ACCOUNT_ACCESS_HEALTH_CHECK_PATH: '',
      ORGANIZATION_HEALTH_CHECK_PATH: '',
      DRIVER_PROFILE_HEALTH_CHECK_PATH: '',
      PERSONNEL_DOCUMENT_HEALTH_CHECK_PATH: '',
      VEHICLE_ASSET_HEALTH_CHECK_PATH: '',
      DRIVER_VEHICLE_ASSIGNMENT_HEALTH_CHECK_PATH: '',
      FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
      GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
      ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
      ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test',
      DRIVER_PROFILE_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:test',
      PERSONNEL_DOCUMENT_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:test',
      VEHICLE_ASSET_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:test',
      DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-assignment:test'
    });

    expect(config.serviceConnectNamespace).toBe('ev-dashboard.internal');
    expect(config.frontCpu).toBe(256);
    expect(config.frontMemoryMiB).toBe(512);
    expect(config.frontHealthCheckPath).toBe('/healthz');
    expect(config.gatewayHealthCheckPath).toBe('/healthz');
    expect(config.accountAccessHealthCheckPath).toBe('/healthz');
    expect(config.organizationCpu).toBe(256);
    expect(config.organizationMemoryMiB).toBe(512);
    expect(config.organizationHealthCheckPath).toBe('/health/');
    expect(config.driverProfileCpu).toBe(256);
    expect(config.driverProfileMemoryMiB).toBe(512);
    expect(config.driverProfileHealthCheckPath).toBe('/health/');
    expect(config.personnelDocumentHealthCheckPath).toBe('/health/');
    expect(config.vehicleAssetHealthCheckPath).toBe('/health/');
    expect(config.driverVehicleAssignmentHealthCheckPath).toBe('/health/');
  });

  test('requires private subnets when account-access is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'next.ev-dashboard.com',
        API_DOMAIN: 'api.next.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        FRONT_DESIRED_COUNT: '1',
        GATEWAY_DESIRED_COUNT: '1',
        ACCOUNT_ACCESS_DESIRED_COUNT: '1',
        ORGANIZATION_DESIRED_COUNT: '0',
        FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
        GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
        ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
        ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test',
        DRIVER_PROFILE_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:test',
        PERSONNEL_DOCUMENT_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:test',
        VEHICLE_ASSET_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:test',
        DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-assignment:test'
      })
    ).toThrow('PRIVATE_SUBNET_IDS');
  });

  test('requires private subnets when organization slice is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'next.ev-dashboard.com',
        API_DOMAIN: 'api.next.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        FRONT_DESIRED_COUNT: '1',
        GATEWAY_DESIRED_COUNT: '1',
        ACCOUNT_ACCESS_DESIRED_COUNT: '0',
        ORGANIZATION_DESIRED_COUNT: '1',
        DRIVER_PROFILE_DESIRED_COUNT: '0',
        PERSONNEL_DOCUMENT_DESIRED_COUNT: '0',
        VEHICLE_ASSET_DESIRED_COUNT: '0',
        DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT: '0',
        FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
        GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
        ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
        ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test',
        DRIVER_PROFILE_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:test',
        PERSONNEL_DOCUMENT_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:test',
        VEHICLE_ASSET_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:test',
        DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-assignment:test'
      })
    ).toThrow('PRIVATE_SUBNET_IDS');
  });

  test('requires private subnets when people and assets slice is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'next.ev-dashboard.com',
        API_DOMAIN: 'api.next.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        FRONT_DESIRED_COUNT: '1',
        GATEWAY_DESIRED_COUNT: '1',
        ACCOUNT_ACCESS_DESIRED_COUNT: '0',
        ORGANIZATION_DESIRED_COUNT: '0',
        DRIVER_PROFILE_DESIRED_COUNT: '1',
        PERSONNEL_DOCUMENT_DESIRED_COUNT: '0',
        VEHICLE_ASSET_DESIRED_COUNT: '0',
        DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT: '0',
        FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
        GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
        ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
        ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test',
        DRIVER_PROFILE_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:test',
        PERSONNEL_DOCUMENT_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:test',
        VEHICLE_ASSET_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:test',
        DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-assignment:test'
      })
    ).toThrow('PRIVATE_SUBNET_IDS');
  });
});
