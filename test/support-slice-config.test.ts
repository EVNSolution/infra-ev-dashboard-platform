import { buildPlatformConfigFromEnv } from '../lib/config';
import { buildDeployPreflightReport } from '../lib/preflight';

describe('Support slice config', () => {
  test('reads support-surface image, scaling, and health-check config', () => {
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
      REGION_REGISTRY_DESIRED_COUNT: '1',
      REGION_ANALYTICS_DESIRED_COUNT: '1',
      ANNOUNCEMENT_REGISTRY_DESIRED_COUNT: '1',
      SUPPORT_REGISTRY_DESIRED_COUNT: '1',
      NOTIFICATION_HUB_DESIRED_COUNT: '1',
      REGION_REGISTRY_CPU: '256',
      REGION_REGISTRY_MEMORY_MIB: '512',
      REGION_ANALYTICS_CPU: '256',
      REGION_ANALYTICS_MEMORY_MIB: '512',
      ANNOUNCEMENT_REGISTRY_CPU: '256',
      ANNOUNCEMENT_REGISTRY_MEMORY_MIB: '512',
      SUPPORT_REGISTRY_CPU: '256',
      SUPPORT_REGISTRY_MEMORY_MIB: '512',
      NOTIFICATION_HUB_CPU: '256',
      NOTIFICATION_HUB_MEMORY_MIB: '512',
      REGION_REGISTRY_HEALTH_CHECK_PATH: '/health/',
      REGION_ANALYTICS_HEALTH_CHECK_PATH: '/health/',
      ANNOUNCEMENT_REGISTRY_HEALTH_CHECK_PATH: '/health/',
      SUPPORT_REGISTRY_HEALTH_CHECK_PATH: '/health/',
      NOTIFICATION_HUB_HEALTH_CHECK_PATH: '/health/'
    });

    expect(config.regionRegistryImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:test'
    );
    expect(config.regionAnalyticsImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:test'
    );
    expect(config.announcementRegistryImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:test'
    );
    expect(config.supportRegistryImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:test'
    );
    expect(config.notificationHubImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:test'
    );
    expect(config.regionRegistryDesiredCount).toBe(1);
    expect(config.regionAnalyticsDesiredCount).toBe(1);
    expect(config.announcementRegistryDesiredCount).toBe(1);
    expect(config.supportRegistryDesiredCount).toBe(1);
    expect(config.notificationHubDesiredCount).toBe(1);
    expect(config.supportRegistryHealthCheckPath).toBe('/health/');
    expect(config.notificationHubHealthCheckPath).toBe('/health/');
  });

  test('preflight rejects support slice without settlement enabled first', () => {
    const report = buildDeployPreflightReport({
      DEPLOY_ENVIRONMENT: 'prod',
      INFRA_ROLE_ARN: 'arn:aws:iam::902837199612:role/GitHubActionsRole',
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
      SETTLEMENT_REGISTRY_DESIRED_COUNT: '0',
      SETTLEMENT_PAYROLL_DESIRED_COUNT: '0',
      SETTLEMENT_OPS_DESIRED_COUNT: '0',
      REGION_REGISTRY_DESIRED_COUNT: '1',
      REGION_ANALYTICS_DESIRED_COUNT: '1',
      ANNOUNCEMENT_REGISTRY_DESIRED_COUNT: '1',
      SUPPORT_REGISTRY_DESIRED_COUNT: '1',
      NOTIFICATION_HUB_DESIRED_COUNT: '1'
    });

    expect(report.errors).toContain('Support Surface slice requires Settlement to stay enabled.');
  });
});
