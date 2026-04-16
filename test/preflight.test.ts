jest.mock('node:child_process', () => ({
  execFileSync: jest.fn()
}));

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
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
    APP_HOST_SUBNET_ID: 'subnet-aaa',
    DATA_HOST_SUBNET_ID: 'subnet-bbb',
    APP_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2a',
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

function createTempRepoRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-release-manifest-'));
}

function writeReleaseManifest(repoRoot: string, relativePath: string, content: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
  return absolutePath;
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

  test('requires release manifest path for warm-host partial deploys', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        RUN_PROFILE: 'warm-host-partial'
      })
    );

    expect(report.errors).toContain('Missing required environment variable: RELEASE_MANIFEST_PATH');
  });

  test('rejects warm-host partial deploys when the base stack is missing', () => {
    (childProcess.execFileSync as jest.Mock).mockImplementation((command: string, args?: string[]) => {
      if (command === 'aws' && args?.[0] === 'cloudformation') {
        throw new Error('Stack does not exist');
      }
      return '';
    });

    const repoRoot = createTempRepoRoot();
    writeReleaseManifest(
      repoRoot,
      'release-manifests/dev/account-access.json',
      JSON.stringify({
        release_id: 'dev-account-access-only',
        services: {
          'service-account-access': {
            action: 'deploy',
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account'
          }
        }
      })
    );

    const report = buildDeployPreflightReport(
      createBaseEnv({
        RUN_PROFILE: 'warm-host-partial',
        RELEASE_MANIFEST_PATH: 'release-manifests/dev/account-access.json',
        PREFLIGHT_REPO_ROOT: repoRoot,
        PREFLIGHT_SKIP_ECR_IMAGE_LOOKUP: '1',
        PREFLIGHT_SKIP_WARM_HOST_LOOKUP: '0'
      })
    );

    expect(report.errors).toContain(
      'Warm-host partial deploy requires an existing EC2 base stack and app host. Bring up the base stack first.'
    );
  });

  test('checks ECR tags only for services listed in the release manifest during warm-host partial deploys', () => {
    (childProcess.execFileSync as jest.Mock).mockImplementation((command: string, args?: string[]) => {
      if (command !== 'aws' || !args) {
        return '';
      }

      if (args[0] === 'cloudformation') {
        return 'UPDATE_COMPLETE';
      }

      if (args[0] === 'ecr') {
        const imageTagArgument = args.find((argument) => argument.startsWith('imageTag='));
        if (imageTagArgument === 'imageTag=sha-account') {
          return 'sha256:account';
        }
        throw new Error(`Unexpected ECR lookup: ${imageTagArgument ?? 'none'}`);
      }

      return '';
    });

    const repoRoot = createTempRepoRoot();
    writeReleaseManifest(
      repoRoot,
      'release-manifests/dev/account-access.json',
      JSON.stringify({
        release_id: 'dev-account-access-only',
        services: {
          'service-account-access': {
            action: 'deploy',
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account'
          }
        }
      })
    );

    const report = buildDeployPreflightReport(
      createBaseEnv({
        RUN_PROFILE: 'warm-host-partial',
        RELEASE_MANIFEST_PATH: 'release-manifests/dev/account-access.json',
        PREFLIGHT_REPO_ROOT: repoRoot,
        PREFLIGHT_SKIP_ECR_IMAGE_LOOKUP: '0',
        PREFLIGHT_SKIP_WARM_HOST_LOOKUP: '1',
        VEHICLE_ASSET_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:latest'
      })
    );

    expect(report.errors).toEqual([]);
    expect(childProcess.execFileSync).toHaveBeenCalledWith(
      'aws',
      expect.arrayContaining([
        'ecr',
        'describe-images',
        '--repository-name',
        'service-account-access',
        'imageTag=sha-account'
      ]),
      expect.any(Object)
    );
  });

  test('rejects warm-host partial deploy when gateway impact is required but gateway is missing', () => {
    const repoRoot = createTempRepoRoot();
    writeReleaseManifest(
      repoRoot,
      'release-manifests/dev/people-and-assets.json',
      JSON.stringify({
        release_id: 'dev-people-and-assets',
        impact: {
          route_groups: ['people-and-assets']
        },
        services: {
          'service-driver-profile': {
            action: 'deploy',
            image_uri:
              '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:sha-driver'
          }
        }
      })
    );

    const report = buildDeployPreflightReport(
      createBaseEnv({
        RUN_PROFILE: 'warm-host-partial',
        RELEASE_MANIFEST_PATH: 'release-manifests/dev/people-and-assets.json',
        PREFLIGHT_REPO_ROOT: repoRoot,
        PREFLIGHT_SKIP_WARM_HOST_LOOKUP: '1'
      })
    );

    expect(report.errors).toContain(
      'Release impact is gateway-required, but edge-api-gateway is not included in the release manifest.'
    );
  });

  test('rejects warm-host partial deploy when front impact is required but front is missing', () => {
    const repoRoot = createTempRepoRoot();
    writeReleaseManifest(
      repoRoot,
      'release-manifests/dev/front-contract.json',
      JSON.stringify({
        release_id: 'dev-front-contract',
        impact: {
          requires_front: true
        },
        services: {
          'edge-api-gateway': {
            action: 'deploy',
            image_uri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:sha-gateway'
          }
        }
      })
    );

    const report = buildDeployPreflightReport(
      createBaseEnv({
        RUN_PROFILE: 'warm-host-partial',
        RELEASE_MANIFEST_PATH: 'release-manifests/dev/front-contract.json',
        PREFLIGHT_REPO_ROOT: repoRoot,
        PREFLIGHT_SKIP_WARM_HOST_LOOKUP: '1'
      })
    );

    expect(report.errors).toContain(
      'Release impact is front-required, but front-web-console is not included in the release manifest.'
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

  test('allows company governance in ec2 runtime proof mode', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        ORGANIZATION_DESIRED_COUNT: '1'
      })
    );

    expect(report.errors).not.toContain(
      'Current EC2 verification scope supports front/gateway/auth/organization only. Set all remaining business-service desired counts to zero before deploy.'
    );
  });

  test('allows remaining business services in ec2 runtime when dependency rules are satisfied', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        APP_HOST_INSTANCE_TYPE: 'm6i.2xlarge',
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
        NOTIFICATION_HUB_DESIRED_COUNT: '1'
      })
    );

    expect(report.errors).not.toContain(
      'Current EC2 verification scope supports front/gateway/auth/organization only. Set all remaining business-service desired counts to zero before deploy.'
    );
  });

  test('rejects remaining business services in ec2 full profile when app host stays on a burstable t-family instance', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        APP_HOST_INSTANCE_TYPE: 't3.large',
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
        NOTIFICATION_HUB_DESIRED_COUNT: '1'
      })
    );

    expect(report.errors).toContain(
      'EC2 full-service verification requires a non-burstable x86 APP_HOST_INSTANCE_TYPE. Do not use the bootstrap-proof default t3.small or any t-family burstable host when remaining business services are enabled.'
    );
  });

  test('allows remaining business services in ec2 incremental-expand profile on a t-family app host', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        RUN_PROFILE: 'incremental-expand',
        APP_HOST_INSTANCE_TYPE: 't3.small',
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
        NOTIFICATION_HUB_DESIRED_COUNT: '1'
      })
    );

    expect(report.errors).not.toContain(
      'EC2 full-service verification requires a non-burstable x86 APP_HOST_INSTANCE_TYPE. Do not use the bootstrap-proof default t3.small or any t-family burstable host when remaining business services are enabled.'
    );
  });

  test('rejects ec2 proof when app host is outside public subnets', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        APP_HOST_SUBNET_ID: 'subnet-ccc',
        APP_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2c'
      })
    );

    expect(report.errors).toContain(
      'The default-VPC public-only EC2 lane requires APP_HOST_SUBNET_ID to be one of PUBLIC_SUBNET_IDS so the app host stays inside an ALB-enabled AZ and keeps direct internet egress for bootstrap.'
    );
  });

  test('rejects ec2 proof when data host is outside public subnets', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        DATA_HOST_SUBNET_ID: 'subnet-ddd',
        DATA_HOST_SUBNET_AVAILABILITY_ZONE: 'ap-northeast-2c'
      })
    );

    expect(report.errors).toContain(
      'The default-VPC public-only EC2 lane requires DATA_HOST_SUBNET_ID to be one of PUBLIC_SUBNET_IDS so the data host keeps direct internet egress for bootstrap.'
    );
  });

  test('summarizes enabled slices and wait signals', () => {
    const report = buildDeployPreflightReport(
      createBaseEnv({
        ORGANIZATION_DESIRED_COUNT: '1'
      })
    );
    const formatted = formatDeployPreflightReport(report);

    expect(report.runtimeMode).toBe('ec2');
    expect(report.enabledSlices).toEqual(['Auth Surface', 'Company Governance']);
    expect(report.waitSignals).toContain(
      'EC2 runtime mode is enabled. Expect instance launch, user-data bootstrap, and SSM reachability before public smoke settles.'
    );
    expect(report.waitSignals).toContain(
      'The default-VPC public-only EC2 lane expects app/data hosts in PUBLIC_SUBNET_IDS with explicit public IP assignment because bootstrap still depends on direct access to SSM, ECR, Secrets Manager, and package mirrors.'
    );
    expect(report.waitSignals).not.toContain(
      'New or updated direct Service Connect upstreams are enabled. Expect a later edge-api-gateway rollout after backend services register.'
    );
    expect(formatted).toContain('Runtime mode: ec2');
    expect(formatted).toContain('Enabled service groups: Auth Surface -> Company Governance');
    expect(formatted).toContain('ALB target draining can keep CloudFormation open for up to 300s');
  });
});
