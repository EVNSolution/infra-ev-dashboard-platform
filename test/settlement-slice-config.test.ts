import { buildPlatformConfigFromEnv } from '../lib/config';

describe('Settlement slice config', () => {
  test('reads settlement slice image, scaling, and health-check config', () => {
    const config: any = buildPlatformConfigFromEnv({
      AWS_REGION: 'ap-northeast-2',
      HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
      HOSTED_ZONE_NAME: 'ev-dashboard.com',
      APEX_DOMAIN: 'ev-dashboard.com',
      API_DOMAIN: 'api.ev-dashboard.com',
      VPC_ID: 'vpc-015c89247f96e9221',
      PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
      PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
      FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
      GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
      ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
      ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test',
      DRIVER_PROFILE_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:test',
      PERSONNEL_DOCUMENT_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:test',
      VEHICLE_ASSET_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:test',
      DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-assignment:test',
      DISPATCH_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-dispatch-registry:test',
      DELIVERY_RECORD_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-delivery-record:test',
      ATTENDANCE_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-attendance-registry:test',
      DISPATCH_OPS_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-dispatch-operations-view:test',
      DRIVER_OPS_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-operations-view:test',
      VEHICLE_OPS_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-operations-view:test',
      SETTLEMENT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-registry:test',
      SETTLEMENT_PAYROLL_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-payroll:test',
      SETTLEMENT_OPS_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-operations-view:test',
      SETTLEMENT_REGISTRY_DESIRED_COUNT: '1',
      SETTLEMENT_PAYROLL_DESIRED_COUNT: '1',
      SETTLEMENT_OPS_DESIRED_COUNT: '1',
      SETTLEMENT_REGISTRY_CPU: '512',
      SETTLEMENT_REGISTRY_MEMORY_MIB: '1024',
      SETTLEMENT_PAYROLL_CPU: '512',
      SETTLEMENT_PAYROLL_MEMORY_MIB: '1024',
      SETTLEMENT_OPS_CPU: '256',
      SETTLEMENT_OPS_MEMORY_MIB: '512',
      SETTLEMENT_REGISTRY_HEALTH_CHECK_PATH: '/health/',
      SETTLEMENT_PAYROLL_HEALTH_CHECK_PATH: '/health/',
      SETTLEMENT_OPS_HEALTH_CHECK_PATH: '/health/'
    });

    expect(config.settlementRegistryImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-registry:test'
    );
    expect(config.settlementPayrollImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-payroll:test'
    );
    expect(config.settlementOpsImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-operations-view:test'
    );
    expect(config.settlementRegistryDesiredCount).toBe(1);
    expect(config.settlementPayrollDesiredCount).toBe(1);
    expect(config.settlementOpsDesiredCount).toBe(1);
    expect(config.settlementRegistryCpu).toBe(512);
    expect(config.settlementRegistryMemoryMiB).toBe(1024);
    expect(config.settlementPayrollCpu).toBe(512);
    expect(config.settlementPayrollMemoryMiB).toBe(1024);
    expect(config.settlementOpsCpu).toBe(256);
    expect(config.settlementOpsMemoryMiB).toBe(512);
    expect(config.settlementRegistryHealthCheckPath).toBe('/health/');
    expect(config.settlementPayrollHealthCheckPath).toBe('/health/');
    expect(config.settlementOpsHealthCheckPath).toBe('/health/');
  });

  test('requires private subnets when settlement write services are enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'ev-dashboard.com',
        API_DOMAIN: 'api.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
        GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
        ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
        ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test',
        DRIVER_PROFILE_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:test',
        PERSONNEL_DOCUMENT_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:test',
        VEHICLE_ASSET_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:test',
        DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-assignment:test',
        DISPATCH_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-dispatch-registry:test',
        DELIVERY_RECORD_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-delivery-record:test',
        ATTENDANCE_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-attendance-registry:test',
        DISPATCH_OPS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-dispatch-operations-view:test',
        DRIVER_OPS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-operations-view:test',
        VEHICLE_OPS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-operations-view:test',
        SETTLEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-registry:test',
        SETTLEMENT_PAYROLL_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-payroll:test',
        SETTLEMENT_OPS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-operations-view:test',
        SETTLEMENT_REGISTRY_DESIRED_COUNT: '1',
        SETTLEMENT_PAYROLL_DESIRED_COUNT: '1',
        SETTLEMENT_OPS_DESIRED_COUNT: '1'
      })
    ).toThrow('PRIVATE_SUBNET_IDS');
  });
});
