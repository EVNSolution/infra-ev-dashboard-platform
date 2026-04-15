import { buildPlatformConfigFromEnv } from '../lib/config';

describe('buildPlatformConfigFromEnv', () => {
  test('treats empty optional environment values as defaults', () => {
    const config = buildPlatformConfigFromEnv({
      AWS_REGION: 'ap-northeast-2',
      HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
      HOSTED_ZONE_NAME: 'ev-dashboard.com',
      APEX_DOMAIN: 'next.ev-dashboard.com',
      API_DOMAIN: 'api.next.ev-dashboard.com',
      COCKPIT_HOSTS: 'cheonha.ev-dashboard.com,hanbit.ev-dashboard.com',
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
      DISPATCH_REGISTRY_DESIRED_COUNT: '0',
      DELIVERY_RECORD_DESIRED_COUNT: '0',
      ATTENDANCE_REGISTRY_DESIRED_COUNT: '0',
      DISPATCH_OPS_DESIRED_COUNT: '0',
      DRIVER_OPS_DESIRED_COUNT: '0',
      VEHICLE_OPS_DESIRED_COUNT: '0',
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
      DISPATCH_REGISTRY_CPU: '',
      DISPATCH_REGISTRY_MEMORY_MIB: '',
      DELIVERY_RECORD_CPU: '',
      DELIVERY_RECORD_MEMORY_MIB: '',
      ATTENDANCE_REGISTRY_CPU: '',
      ATTENDANCE_REGISTRY_MEMORY_MIB: '',
      DISPATCH_OPS_CPU: '',
      DISPATCH_OPS_MEMORY_MIB: '',
      DRIVER_OPS_CPU: '',
      DRIVER_OPS_MEMORY_MIB: '',
      VEHICLE_OPS_CPU: '',
      VEHICLE_OPS_MEMORY_MIB: '',
      FRONT_HEALTH_CHECK_PATH: '',
      GATEWAY_HEALTH_CHECK_PATH: '',
      ACCOUNT_ACCESS_HEALTH_CHECK_PATH: '',
      ORGANIZATION_HEALTH_CHECK_PATH: '',
      DRIVER_PROFILE_HEALTH_CHECK_PATH: '',
      PERSONNEL_DOCUMENT_HEALTH_CHECK_PATH: '',
      VEHICLE_ASSET_HEALTH_CHECK_PATH: '',
      DRIVER_VEHICLE_ASSIGNMENT_HEALTH_CHECK_PATH: '',
      DISPATCH_REGISTRY_HEALTH_CHECK_PATH: '',
      DELIVERY_RECORD_HEALTH_CHECK_PATH: '',
      ATTENDANCE_REGISTRY_HEALTH_CHECK_PATH: '',
      DISPATCH_OPS_HEALTH_CHECK_PATH: '',
      DRIVER_OPS_HEALTH_CHECK_PATH: '',
      VEHICLE_OPS_HEALTH_CHECK_PATH: '',
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
      REGION_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
      REGION_ANALYTICS_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
      ANNOUNCEMENT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
      SUPPORT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
      NOTIFICATION_HUB_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
    });

    expect(config.serviceConnectNamespace).toBe('ev-dashboard.internal');
    expect(config.cockpitHosts).toEqual(['cheonha.ev-dashboard.com', 'hanbit.ev-dashboard.com']);
    expect(config.frontCpu).toBe(256);
    expect(config.frontMemoryMiB).toBe(512);
    expect(config.appHostVolumeSizeGiB).toBe(32);
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
    expect(config.dispatchRegistryHealthCheckPath).toBe('/health/');
    expect(config.deliveryRecordHealthCheckPath).toBe('/health/');
    expect(config.attendanceRegistryHealthCheckPath).toBe('/health/');
    expect(config.dispatchOpsHealthCheckPath).toBe('/health/');
    expect(config.driverOpsHealthCheckPath).toBe('/health/');
    expect(config.vehicleOpsHealthCheckPath).toBe('/health/');
    expect(config.settlementOpsBaseUrl).toBe('http://settlement-ops-api:8000');
    expect(config.telemetryHubBaseUrl).toBe('http://telemetry-hub-api:8000');
    expect(config.terminalRegistryBaseUrl).toBe('http://terminal-registry-api:8000');
  });

  test('forces ec2 bootstrap-proof config down to the proof-critical slice', () => {
    const config = buildPlatformConfigFromEnv({
      AWS_REGION: 'ap-northeast-2',
      RUN_PROFILE: 'bootstrap-proof',
      RUNTIME_MODE: 'ec2',
      HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
      HOSTED_ZONE_NAME: 'ev-dashboard.com',
      APEX_DOMAIN: 'candidate.ev-dashboard.com',
      API_DOMAIN: 'api.candidate.ev-dashboard.com',
      VPC_ID: 'vpc-015c89247f96e9221',
      PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
      PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
      APP_HOST_SUBNET_ID: 'subnet-aaa',
      DATA_HOST_SUBNET_ID: 'subnet-bbb',
      APP_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2a',
      DATA_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2b',
      FRONT_DESIRED_COUNT: '1',
      GATEWAY_DESIRED_COUNT: '1',
      ACCOUNT_ACCESS_DESIRED_COUNT: '1',
      ORGANIZATION_DESIRED_COUNT: '1',
      DRIVER_PROFILE_DESIRED_COUNT: '1',
      PERSONNEL_DOCUMENT_DESIRED_COUNT: '1',
      VEHICLE_ASSET_DESIRED_COUNT: '1',
      DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT: '1',
      DISPATCH_REGISTRY_DESIRED_COUNT: '1',
      DELIVERY_RECORD_DESIRED_COUNT: '1',
      ATTENDANCE_REGISTRY_DESIRED_COUNT: '1',
      DISPATCH_OPS_DESIRED_COUNT: '1',
      DRIVER_OPS_DESIRED_COUNT: '1',
      VEHICLE_OPS_DESIRED_COUNT: '1',
      SETTLEMENT_REGISTRY_DESIRED_COUNT: '1',
      SETTLEMENT_PAYROLL_DESIRED_COUNT: '1',
      SETTLEMENT_OPS_DESIRED_COUNT: '1',
      REGION_REGISTRY_DESIRED_COUNT: '1',
      REGION_ANALYTICS_DESIRED_COUNT: '1',
      ANNOUNCEMENT_REGISTRY_DESIRED_COUNT: '1',
      SUPPORT_REGISTRY_DESIRED_COUNT: '1',
      NOTIFICATION_HUB_DESIRED_COUNT: '1',
      TERMINAL_REGISTRY_DESIRED_COUNT: '1',
      TELEMETRY_HUB_DESIRED_COUNT: '1',
      TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '1',
      TELEMETRY_LISTENER_DESIRED_COUNT: '1',
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
      REGION_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
      REGION_ANALYTICS_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
      ANNOUNCEMENT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
      SUPPORT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
      NOTIFICATION_HUB_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test',
      TERMINAL_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-terminal-registry:test',
      TELEMETRY_HUB_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:test',
      TELEMETRY_DEAD_LETTER_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:test',
      TELEMETRY_LISTENER_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:test'
    });

    expect(config.runProfile).toBe('bootstrap-proof');
    expect(config.frontDesiredCount).toBe(1);
    expect(config.gatewayDesiredCount).toBe(1);
    expect(config.accountAccessDesiredCount).toBe(1);
    expect(config.organizationDesiredCount).toBe(1);
    expect(config.driverProfileDesiredCount).toBe(0);
    expect(config.settlementOpsDesiredCount).toBe(0);
    expect(config.notificationHubDesiredCount).toBe(0);
    expect(config.telemetryListenerDesiredCount).toBe(0);
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
        DRIVER_PROFILE_DESIRED_COUNT: '0',
        PERSONNEL_DOCUMENT_DESIRED_COUNT: '0',
        VEHICLE_ASSET_DESIRED_COUNT: '0',
        DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT: '0',
        DISPATCH_REGISTRY_DESIRED_COUNT: '0',
        DELIVERY_RECORD_DESIRED_COUNT: '0',
        ATTENDANCE_REGISTRY_DESIRED_COUNT: '0',
        DISPATCH_OPS_DESIRED_COUNT: '0',
        DRIVER_OPS_DESIRED_COUNT: '0',
        VEHICLE_OPS_DESIRED_COUNT: '0',
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
        REGION_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
        REGION_ANALYTICS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
        ANNOUNCEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
        SUPPORT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
        NOTIFICATION_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
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
        DISPATCH_REGISTRY_DESIRED_COUNT: '0',
        DELIVERY_RECORD_DESIRED_COUNT: '0',
        ATTENDANCE_REGISTRY_DESIRED_COUNT: '0',
        DISPATCH_OPS_DESIRED_COUNT: '0',
        DRIVER_OPS_DESIRED_COUNT: '0',
        VEHICLE_OPS_DESIRED_COUNT: '0',
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
        REGION_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
        REGION_ANALYTICS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
        ANNOUNCEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
        SUPPORT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
        NOTIFICATION_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
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
        DISPATCH_REGISTRY_DESIRED_COUNT: '0',
        DELIVERY_RECORD_DESIRED_COUNT: '0',
        ATTENDANCE_REGISTRY_DESIRED_COUNT: '0',
        DISPATCH_OPS_DESIRED_COUNT: '0',
        DRIVER_OPS_DESIRED_COUNT: '0',
        VEHICLE_OPS_DESIRED_COUNT: '0',
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
        REGION_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
        REGION_ANALYTICS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
        ANNOUNCEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
        SUPPORT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
        NOTIFICATION_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
      })
    ).toThrow('PRIVATE_SUBNET_IDS');
  });

  test('requires private subnets when dispatch inputs slice is enabled', () => {
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
        DRIVER_PROFILE_DESIRED_COUNT: '0',
        PERSONNEL_DOCUMENT_DESIRED_COUNT: '0',
        VEHICLE_ASSET_DESIRED_COUNT: '0',
        DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT: '0',
        DISPATCH_REGISTRY_DESIRED_COUNT: '1',
        DELIVERY_RECORD_DESIRED_COUNT: '0',
        ATTENDANCE_REGISTRY_DESIRED_COUNT: '0',
        DISPATCH_OPS_DESIRED_COUNT: '0',
        DRIVER_OPS_DESIRED_COUNT: '0',
        VEHICLE_OPS_DESIRED_COUNT: '0',
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
        REGION_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
        REGION_ANALYTICS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
        ANNOUNCEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
        SUPPORT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
        NOTIFICATION_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
      })
    ).toThrow('PRIVATE_SUBNET_IDS');
  });

  test('requires app host subnet when ec2 runtime mode is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'ev-dashboard.com',
        API_DOMAIN: 'api.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
        RUNTIME_MODE: 'ec2',
        DATA_HOST_SUBNET_ID: 'subnet-ddd',
        APP_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2c',
        DATA_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2b',
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
        REGION_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
        REGION_ANALYTICS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
        ANNOUNCEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
        SUPPORT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
        NOTIFICATION_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
      })
    ).toThrow('APP_HOST_SUBNET_ID');
  });

  test('requires app host subnet availability zone when ec2 runtime mode is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'ev-dashboard.com',
        API_DOMAIN: 'api.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
        RUNTIME_MODE: 'ec2',
        APP_HOST_SUBNET_ID: 'subnet-ccc',
        DATA_HOST_SUBNET_ID: 'subnet-ddd',
        DATA_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2b',
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
        REGION_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
        REGION_ANALYTICS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
        ANNOUNCEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
        SUPPORT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
        NOTIFICATION_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
      })
    ).toThrow('APP_HOST_SUBNET_AVAILABILITY_ZONE');
  });

  test('requires data host subnet when ec2 runtime mode is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'ev-dashboard.com',
        API_DOMAIN: 'api.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
        RUNTIME_MODE: 'ec2',
        APP_HOST_SUBNET_ID: 'subnet-ccc',
        APP_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2c',
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
        REGION_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
        REGION_ANALYTICS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
        ANNOUNCEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
        SUPPORT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
        NOTIFICATION_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
      })
    ).toThrow('DATA_HOST_SUBNET_ID');
  });

  test('requires data host subnet availability zone when ec2 runtime mode is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'ev-dashboard.com',
        API_DOMAIN: 'api.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
        RUNTIME_MODE: 'ec2',
        APP_HOST_SUBNET_ID: 'subnet-ccc',
        DATA_HOST_SUBNET_ID: 'subnet-ddd',
        APP_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2c',
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
        REGION_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
        REGION_ANALYTICS_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
        ANNOUNCEMENT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
        SUPPORT_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
        NOTIFICATION_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
      })
    ).toThrow('DATA_HOST_SUBNET_AVAILABILITY_ZONE');
  });

  test('returns ec2 runtime host defaults when ec2 runtime mode is enabled', () => {
    const config = buildPlatformConfigFromEnv({
      AWS_REGION: 'ap-northeast-2',
      HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
      HOSTED_ZONE_NAME: 'ev-dashboard.com',
      APEX_DOMAIN: 'ev-dashboard.com',
      API_DOMAIN: 'api.ev-dashboard.com',
      VPC_ID: 'vpc-015c89247f96e9221',
      PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
      PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
      RUNTIME_MODE: 'ec2',
      APP_HOST_SUBNET_ID: 'subnet-ccc',
      DATA_HOST_SUBNET_ID: 'subnet-ddd',
      APP_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2c',
      DATA_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2b',
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
      REGION_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
      REGION_ANALYTICS_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
      ANNOUNCEMENT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
      SUPPORT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
      NOTIFICATION_HUB_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
    });

    expect(config.runtimeMode).toBe('ec2');
    expect(config.appHostSubnetId).toBe('subnet-ccc');
    expect(config.dataHostSubnetId).toBe('subnet-ddd');
    expect(config.appHostSubnetAvailabilityZone).toBe('ap-northeast-2c');
    expect(config.dataHostSubnetAvailabilityZone).toBe('ap-northeast-2b');
    expect(config.appHostInstanceType).toBe('t3.small');
    expect(config.dataHostInstanceType).toBe('t4g.small');
    expect(config.dataVolumeSizeGiB).toBe(100);
  });

  test('allows overriding read-model bridge base urls from environment', () => {
    const config = buildPlatformConfigFromEnv({
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
      REGION_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test',
      REGION_ANALYTICS_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test',
      ANNOUNCEMENT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test',
      SUPPORT_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test',
      NOTIFICATION_HUB_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test',
      SETTLEMENT_OPS_BASE_URL: 'https://hub.evnlogistics.com/api/settlement-ops',
      TELEMETRY_HUB_BASE_URL: 'https://hub.evnlogistics.com/api/telemetry',
      TERMINAL_REGISTRY_BASE_URL: 'https://hub.evnlogistics.com/api/terminals'
    });

    expect(config.settlementOpsBaseUrl).toBe('https://hub.evnlogistics.com/api/settlement-ops');
    expect(config.telemetryHubBaseUrl).toBe('https://hub.evnlogistics.com/api/telemetry');
    expect(config.terminalRegistryBaseUrl).toBe('https://hub.evnlogistics.com/api/terminals');
  });
});
