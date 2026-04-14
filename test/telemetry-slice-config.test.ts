import { buildPlatformConfigFromEnv } from '../lib/config';
import { buildDeployPreflightReport } from '../lib/preflight';

describe('Terminal and telemetry slice config', () => {
  test('reads terminal and telemetry image, scaling, and worker config', () => {
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
      TERMINAL_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-terminal-registry:test',
      TELEMETRY_HUB_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:test',
      TELEMETRY_DEAD_LETTER_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:test',
      TELEMETRY_LISTENER_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:test',
      TERMINAL_REGISTRY_DESIRED_COUNT: '1',
      TELEMETRY_HUB_DESIRED_COUNT: '1',
      TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '1',
      TELEMETRY_LISTENER_DESIRED_COUNT: '1',
      TERMINAL_REGISTRY_CPU: '256',
      TERMINAL_REGISTRY_MEMORY_MIB: '512',
      TELEMETRY_HUB_CPU: '256',
      TELEMETRY_HUB_MEMORY_MIB: '512',
      TELEMETRY_DEAD_LETTER_CPU: '256',
      TELEMETRY_DEAD_LETTER_MEMORY_MIB: '512',
      TELEMETRY_LISTENER_CPU: '256',
      TELEMETRY_LISTENER_MEMORY_MIB: '512',
      TERMINAL_REGISTRY_HEALTH_CHECK_PATH: '/health/',
      TELEMETRY_HUB_HEALTH_CHECK_PATH: '/health/',
      TELEMETRY_DEAD_LETTER_HEALTH_CHECK_PATH: '/health/',
      TELEMETRY_LISTENER_MQTT_HOST: 'mqtt-prod.example.internal',
      TELEMETRY_LISTENER_MQTT_PORT: '1883',
      TELEMETRY_LISTENER_MQTT_TOPICS: 'telemetry/#',
      TELEMETRY_LISTENER_CLIENT_ID: 'service-telemetry-listener',
      TELEMETRY_LISTENER_IDLE_SLEEP_SECONDS: '5',
      TELEMETRY_LISTENER_RETRY_COUNT: '3',
      TELEMETRY_LISTENER_RETRY_BACKOFF_SECONDS: '1'
    });

    expect(config.terminalRegistryImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-terminal-registry:test'
    );
    expect(config.telemetryHubImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:test'
    );
    expect(config.telemetryDeadLetterImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:test'
    );
    expect(config.telemetryListenerImageUri).toBe(
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:test'
    );
    expect(config.terminalRegistryDesiredCount).toBe(1);
    expect(config.telemetryHubDesiredCount).toBe(1);
    expect(config.telemetryDeadLetterDesiredCount).toBe(1);
    expect(config.telemetryListenerDesiredCount).toBe(1);
    expect(config.telemetryListenerMqttHost).toBe('mqtt-prod.example.internal');
    expect(config.telemetryListenerMqttPort).toBe(1883);
    expect(config.telemetryListenerMqttTopics).toEqual(['telemetry/#']);
  });

  test('preflight rejects terminal and telemetry slice when support slice is not enabled first', () => {
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
      TERMINAL_REGISTRY_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-terminal-registry:test',
      TELEMETRY_HUB_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:test',
      TELEMETRY_DEAD_LETTER_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:test',
      TELEMETRY_LISTENER_IMAGE_URI:
        '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:test',
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
      REGION_REGISTRY_DESIRED_COUNT: '0',
      REGION_ANALYTICS_DESIRED_COUNT: '0',
      ANNOUNCEMENT_REGISTRY_DESIRED_COUNT: '0',
      SUPPORT_REGISTRY_DESIRED_COUNT: '0',
      NOTIFICATION_HUB_DESIRED_COUNT: '0',
      TERMINAL_REGISTRY_DESIRED_COUNT: '1',
      TELEMETRY_HUB_DESIRED_COUNT: '1',
      TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '1',
      TELEMETRY_LISTENER_DESIRED_COUNT: '1',
      TELEMETRY_LISTENER_MQTT_HOST: 'mqtt-prod.example.internal'
    });

    expect(report.errors).toContain('Terminal And Telemetry slice requires Support Surface to stay enabled.');
  });
});
