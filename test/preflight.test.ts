jest.mock('node:child_process', () => ({
  execFileSync: jest.fn()
}));

import * as childProcess from 'node:child_process';

import { buildDeployPreflightReport, formatDeployPreflightReport } from '../lib/preflight';

function createBaseEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    DEPLOY_ENVIRONMENT: 'prod',
    RUNTIME_MODE: 'ec2',
    INFRA_ROLE_ARN: 'arn:aws:iam::902837199612:role/GitHubActionsRole',
    AWS_REGION: 'ap-northeast-2',
    HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
    HOSTED_ZONE_NAME: 'ev-dashboard.com',
    APEX_DOMAIN: 'ev-dashboard.com',
    API_DOMAIN: 'api.ev-dashboard.com',
    VPC_ID: 'vpc-015c89247f96e9221',
    PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
    PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
    APP_HOST_SUBNET_ID: 'subnet-ccc',
    DATA_HOST_SUBNET_ID: 'subnet-ddd',
    APP_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2c',
    DATA_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2b',
    FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front',
    GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:sha-gateway',
    ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account',
    ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:sha-organization',
    DRIVER_PROFILE_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:sha-driver',
    PERSONNEL_DOCUMENT_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:sha-document',
    VEHICLE_ASSET_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:sha-vehicle',
    DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-assignment:sha-assignment',
    DISPATCH_REGISTRY_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-dispatch-registry:sha-dispatch',
    DELIVERY_RECORD_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-delivery-record:sha-delivery',
    ATTENDANCE_REGISTRY_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-attendance-registry:sha-attendance',
    DISPATCH_OPS_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-dispatch-operations-view:sha-dispatch-ops',
    DRIVER_OPS_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-operations-view:sha-driver-ops',
    VEHICLE_OPS_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-operations-view:sha-vehicle-ops',
    SETTLEMENT_REGISTRY_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-registry:sha-settlement-registry',
    SETTLEMENT_PAYROLL_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-payroll:sha-settlement-payroll',
    SETTLEMENT_OPS_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-operations-view:sha-settlement-ops',
    REGION_REGISTRY_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:sha-region-registry',
    REGION_ANALYTICS_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:sha-region-analytics',
    ANNOUNCEMENT_REGISTRY_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:sha-announcement',
    SUPPORT_REGISTRY_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:sha-support',
    NOTIFICATION_HUB_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:sha-notification',
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
    SETTLEMENT_REGISTRY_DESIRED_COUNT: '0',
    SETTLEMENT_PAYROLL_DESIRED_COUNT: '0',
    SETTLEMENT_OPS_DESIRED_COUNT: '0',
    REGION_REGISTRY_DESIRED_COUNT: '0',
    REGION_ANALYTICS_DESIRED_COUNT: '0',
    ANNOUNCEMENT_REGISTRY_DESIRED_COUNT: '0',
    SUPPORT_REGISTRY_DESIRED_COUNT: '0',
    NOTIFICATION_HUB_DESIRED_COUNT: '0',
    PREFLIGHT_SKIP_ECR_IMAGE_LOOKUP: '1',
    ...overrides
  };
}

describe('deploy preflight', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('rejects mutable latest image tags', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:latest'
      })
    );

    expect(report.errors).toContain(
      'FRONT_IMAGE_URI must not use the mutable "latest" tag. Use an immutable SHA-style tag instead.'
    );
  });

  test('rejects dispatch read models when dispatch inputs are not enabled', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        DISPATCH_OPS_DESIRED_COUNT: '1',
        DRIVER_OPS_DESIRED_COUNT: '1',
        VEHICLE_OPS_DESIRED_COUNT: '1',
        DISPATCH_REGISTRY_DESIRED_COUNT: '0',
        DELIVERY_RECORD_DESIRED_COUNT: '0',
        ATTENDANCE_REGISTRY_DESIRED_COUNT: '0'
      })
    );

    expect(report.errors).toContain(
      'Dispatch read-model slice requires the full dispatch-inputs slice to stay enabled.'
    );
  });

  test('rejects terminal and telemetry slice when support surface is not enabled', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        TERMINAL_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-terminal-registry:sha-terminal',
        TELEMETRY_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:sha-telemetry-hub',
        TELEMETRY_DEAD_LETTER_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:sha-dead-letter',
        TELEMETRY_LISTENER_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:sha-listener',
        TERMINAL_REGISTRY_DESIRED_COUNT: '1',
        TELEMETRY_HUB_DESIRED_COUNT: '1',
        TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '1',
        TELEMETRY_LISTENER_DESIRED_COUNT: '1',
        TELEMETRY_LISTENER_MQTT_HOST: 'mqtt-prod.example.internal'
      })
    );

    expect(report.errors).toContain('Terminal And Telemetry slice requires Support Surface to stay enabled.');
  });

  test('rejects telemetry listener when required worker connectivity config is missing', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        REGION_REGISTRY_DESIRED_COUNT: '1',
        REGION_ANALYTICS_DESIRED_COUNT: '1',
        ANNOUNCEMENT_REGISTRY_DESIRED_COUNT: '1',
        SUPPORT_REGISTRY_DESIRED_COUNT: '1',
        NOTIFICATION_HUB_DESIRED_COUNT: '1',
        TERMINAL_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-terminal-registry:sha-terminal',
        TELEMETRY_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:sha-telemetry-hub',
        TELEMETRY_DEAD_LETTER_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:sha-dead-letter',
        TELEMETRY_LISTENER_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:sha-listener',
        TERMINAL_REGISTRY_DESIRED_COUNT: '1',
        TELEMETRY_HUB_DESIRED_COUNT: '1',
        TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '1',
        TELEMETRY_LISTENER_DESIRED_COUNT: '1'
      })
    );

    expect(report.errors).toContain(
      'TELEMETRY_LISTENER_MQTT_HOST is required when telemetry listener desired count is above zero.'
    );
  });

  test('rejects terminal and telemetry slice when bridge base URLs still point to the old public hub', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        REGION_REGISTRY_DESIRED_COUNT: '1',
        REGION_ANALYTICS_DESIRED_COUNT: '1',
        ANNOUNCEMENT_REGISTRY_DESIRED_COUNT: '1',
        SUPPORT_REGISTRY_DESIRED_COUNT: '1',
        NOTIFICATION_HUB_DESIRED_COUNT: '1',
        TERMINAL_REGISTRY_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-terminal-registry:sha-terminal',
        TELEMETRY_HUB_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:sha-telemetry-hub',
        TELEMETRY_DEAD_LETTER_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:sha-dead-letter',
        TELEMETRY_LISTENER_IMAGE_URI:
          '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:sha-listener',
        TERMINAL_REGISTRY_DESIRED_COUNT: '1',
        TELEMETRY_HUB_DESIRED_COUNT: '1',
        TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '1',
        TELEMETRY_LISTENER_DESIRED_COUNT: '0',
        TERMINAL_REGISTRY_BASE_URL: 'https://hub.evnlogistics.com/api/terminals',
        TELEMETRY_HUB_BASE_URL: 'https://hub.evnlogistics.com/api/telemetry'
      })
    );

    expect(report.errors).toContain(
      'Terminal And Telemetry slice requires internal bridge URLs: TERMINAL_REGISTRY_BASE_URL=http://terminal-registry-api:8000 and TELEMETRY_HUB_BASE_URL=http://telemetry-hub-api:8000.'
    );
  });

  test('rejects non-production domains for a prod deploy', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        APEX_DOMAIN: 'next.ev-dashboard.com',
        API_DOMAIN: 'api.next.ev-dashboard.com'
      })
    );

    expect(report.errors).toContain('prod deploys must target ev-dashboard.com and api.ev-dashboard.com.');
  });

  test('surfaces ec2 runtime host input errors through preflight', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        APP_HOST_SUBNET_ID: ''
      })
    );

    expect(report.errors).toContain('Missing required environment variable: APP_HOST_SUBNET_ID');
  });

  test('surfaces ec2 runtime host availability-zone input errors through preflight', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        APP_HOST_SUBNET_AVAILABILITY_ZONE: ''
      })
    );

    expect(report.errors).toContain('Missing required environment variable: APP_HOST_SUBNET_AVAILABILITY_ZONE');
  });

  test('rejects image tags that do not exist in ECR', () => {
    (childProcess.execFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Image not found');
    });

    const report = buildDeployPreflightReport(
      createBaseEnv({
        PREFLIGHT_SKIP_ECR_IMAGE_LOOKUP: '0'
      })
    );

    expect(report.errors).toContain(
      'VEHICLE_ASSET_IMAGE_URI points to an ECR tag that does not exist: 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:sha-vehicle'
    );
  });

  test('rejects later slices in ec2 runtime proof mode', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        ORGANIZATION_DESIRED_COUNT: '1'
      })
    );

    expect(report.errors).toContain(
      'Current EC2 runtime proof only supports the shell/auth slice: front-web-console + edge-api-gateway + service-account-access. Set all later slice desired counts to zero before deploy.'
    );
  });

  test('summarizes enabled slices and wait signals', () => {
    const report = buildDeployPreflightReport(createBaseEnv());
    const formatted = formatDeployPreflightReport(report);

    expect(report.runtimeMode).toBe('ec2');
    expect(report.enabledSlices).toEqual(['Auth Surface']);
    expect(report.waitSignals).toContain(
      'EC2 runtime mode is enabled. Expect instance launch, user-data bootstrap, and SSM reachability before public smoke settles.'
    );
    expect(report.waitSignals).toContain(
      'Current EC2 runtime proof is shell/auth only. Keep later slice desired counts at zero until host-level runtime contracts for those services exist.'
    );
    expect(report.waitSignals).not.toContain(
      'New or updated direct Service Connect upstreams are enabled. Expect a later edge-api-gateway rollout after backend services register.'
    );
    expect(formatted).toContain('Runtime mode: ec2');
    expect(formatted).toContain('Enabled slices: Auth Surface');
    expect(formatted).toContain('ALB target draining can keep CloudFormation open for up to 300s');
  });
});
