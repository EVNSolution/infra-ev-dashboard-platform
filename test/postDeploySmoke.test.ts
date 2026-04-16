import {
  buildPostDeploySmokeChecks,
  formatPostDeploySmokeReport,
  runPostDeploySmokeChecks
} from '../lib/postDeploySmoke';

function createBaseEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    AWS_REGION: 'ap-northeast-2',
    RUNTIME_MODE: 'ec2',
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
    ACCOUNT_ACCESS_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account',
    ORGANIZATION_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:sha-organization',
    DRIVER_PROFILE_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:sha-driver',
    PERSONNEL_DOCUMENT_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:sha-document',
    VEHICLE_ASSET_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:sha-vehicle',
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
    TERMINAL_REGISTRY_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-terminal-registry:sha-terminal',
    TELEMETRY_HUB_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:sha-telemetry-hub',
    TELEMETRY_DEAD_LETTER_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:sha-dead-letter',
    TELEMETRY_LISTENER_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:sha-listener',
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
    TELEMETRY_LISTENER_DESIRED_COUNT: '0',
    ...overrides
  };
}

describe('post-deploy smoke', () => {
  test('builds shared and slice-specific public smoke checks from env', () => {
    const checks = buildPostDeploySmokeChecks(
      createBaseEnv({
        COCKPIT_HOSTS: 'cheonha.ev-dashboard.com',
        REGION_REGISTRY_DESIRED_COUNT: '0',
        REGION_ANALYTICS_DESIRED_COUNT: '0',
        ANNOUNCEMENT_REGISTRY_DESIRED_COUNT: '0',
        SUPPORT_REGISTRY_DESIRED_COUNT: '0',
        NOTIFICATION_HUB_DESIRED_COUNT: '0',
        TERMINAL_REGISTRY_DESIRED_COUNT: '0',
        TELEMETRY_HUB_DESIRED_COUNT: '0',
        TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '0'
      })
    );

    expect(checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'front shell',
          url: 'https://ev-dashboard.com/',
          expectedStatus: 200
        }),
        expect.objectContaining({
          name: 'cockpit shell: cheonha.ev-dashboard.com',
          url: 'https://cheonha.ev-dashboard.com/',
          expectedStatus: 200
        }),
        expect.objectContaining({
          name: 'auth health',
          url: 'https://api.ev-dashboard.com/api/auth/health/',
          expectedStatus: 200
        }),
        expect.objectContaining({
          name: 'swagger ui',
          url: 'https://api.ev-dashboard.com/swagger/',
          expectedStatus: 200
        }),
        expect.objectContaining({
          name: 'account admin redirect',
          url: 'https://api.ev-dashboard.com/admin/account-access/',
          expectedStatus: 302,
          redirect: 'manual'
        }),
        expect.objectContaining({
          name: 'organization health',
          url: 'https://api.ev-dashboard.com/api/org/health/',
          expectedStatus: 200
        }),
        expect.objectContaining({
          name: 'company tenant resolve validation',
          url: 'https://api.ev-dashboard.com/api/org/companies/public/resolve/?tenant_code=bootstrap-proof-smoke',
          expectedStatus: 404
        }),
        expect.objectContaining({
          name: 'drivers protected list',
          url: 'https://api.ev-dashboard.com/api/drivers/',
          expectedStatus: 401
        }),
        expect.objectContaining({
          name: 'dispatch health',
          url: 'https://api.ev-dashboard.com/api/dispatch/health/',
          expectedStatus: 200
        }),
        expect.objectContaining({
          name: 'settlement runs protected list',
          url: 'https://api.ev-dashboard.com/api/settlements/runs/',
          expectedStatus: 401
        })
      ])
    );
    expect(checks).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'terminal registry health'
        })
      ])
    );
  });

  test('limits bootstrap-proof smoke to the core-entry services even when remaining service env counts are set', () => {
    const checks = buildPostDeploySmokeChecks(
      createBaseEnv({
        RUN_PROFILE: 'bootstrap-proof',
        ORGANIZATION_DESIRED_COUNT: '1',
        DRIVER_PROFILE_DESIRED_COUNT: '1',
        DISPATCH_REGISTRY_DESIRED_COUNT: '1',
        SETTLEMENT_REGISTRY_DESIRED_COUNT: '1',
        SUPPORT_REGISTRY_DESIRED_COUNT: '1',
        NOTIFICATION_HUB_DESIRED_COUNT: '1',
        COCKPIT_HOSTS: 'cheonha.candidate.ev-dashboard.com'
      })
    );

    expect(checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'front shell' }),
        expect.objectContaining({ name: 'cockpit shell: cheonha.candidate.ev-dashboard.com' }),
        expect.objectContaining({ name: 'auth health' }),
        expect.objectContaining({ name: 'organization health' })
      ])
    );
    expect(checks).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'dispatch health' }),
        expect.objectContaining({ name: 'settlement registry health' }),
        expect.objectContaining({ name: 'support registry health' })
      ])
    );
  });

  test('uses release-manifest scoped smoke checks for warm-host partial deploys', () => {
    const repoRoot = process.cwd();
    const checks = buildPostDeploySmokeChecks(
      createBaseEnv({
        RUN_PROFILE: 'warm-host-partial',
        RELEASE_MANIFEST_PATH: 'release-manifests/examples/core-entry-sample.json',
        POST_DEPLOY_REPO_ROOT: repoRoot
      })
    );

    expect(checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'auth health' }),
        expect.objectContaining({ name: 'organization health' }),
        expect.objectContaining({ name: 'front shell' })
      ])
    );
    expect(checks).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'dispatch health' }),
        expect.objectContaining({ name: 'terminal registry health' })
      ])
    );
  });

  test('passes when every required endpoint returns its expected status', async () => {
    const fetchMock = jest.fn(async (input: string, init?: RequestInit) => {
      if (String(input).includes('/companies/public/resolve/')) {
        return { status: 404 } as Response;
      }

      const status = init?.redirect === 'manual' ? 302 : 200;
      return { status } as Response;
    });

    const report = await runPostDeploySmokeChecks(
      createBaseEnv({
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
        TERMINAL_REGISTRY_DESIRED_COUNT: '0',
        TELEMETRY_HUB_DESIRED_COUNT: '0',
        TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '0'
      }),
      fetchMock as typeof fetch
    );

    expect(report.errors).toEqual([]);
    expect(report.results.every((result) => result.ok)).toBe(true);
    expect(formatPostDeploySmokeReport(report)).toContain('Post-deploy public smoke');
  });

  test('fails with a readable mismatch report when an endpoint returns the wrong status', async () => {
    const fetchMock = jest.fn(async (input: string, init?: RequestInit) => {
      if (String(input).includes('/api/auth/health/')) {
        return { status: 502 } as Response;
      }
      if (String(input).includes('/companies/public/resolve/')) {
        return { status: 404 } as Response;
      }

      return { status: init?.redirect === 'manual' ? 302 : 200 } as Response;
    });

    const report = await runPostDeploySmokeChecks(
      createBaseEnv({
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
        TERMINAL_REGISTRY_DESIRED_COUNT: '0',
        TELEMETRY_HUB_DESIRED_COUNT: '0',
        TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '0'
      }),
      fetchMock as typeof fetch,
      {
        timeoutMs: 1,
        intervalMs: 1,
        sleepImpl: async () => {}
      }
    );

    expect(report.errors).toContain(
      'auth health expected 200 but received 502 from https://api.ev-dashboard.com/api/auth/health/'
    );
    expect(formatPostDeploySmokeReport(report)).toContain('Errors:');
  });

  test('retries before failing when ec2 smoke checks need host bootstrap time', async () => {
    let attempt = 0;
    const fetchMock = jest.fn(async (_input: string, init?: RequestInit) => {
      attempt += 1;
      if (attempt <= 6) {
        return { status: 502 } as Response;
      }

      return { status: init?.redirect === 'manual' ? 302 : 200 } as Response;
    });

    const sleepMock = jest.fn(async () => {});

    const report = await runPostDeploySmokeChecks(
      createBaseEnv({
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
        TERMINAL_REGISTRY_DESIRED_COUNT: '0',
        TELEMETRY_HUB_DESIRED_COUNT: '0',
        TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '0',
        POST_DEPLOY_SMOKE_TIMEOUT_SECONDS: '30',
        POST_DEPLOY_SMOKE_POLL_SECONDS: '1'
      }),
      fetchMock as typeof fetch,
      {
        sleepImpl: sleepMock,
        timeoutMs: 30_000,
        intervalMs: 1_000
      }
    );

    expect(report.errors).toEqual([]);
    expect(sleepMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
  });

  test('aborts a hanging request instead of letting the whole smoke step hang forever', async () => {
    const fetchMock = jest.fn((_input: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new Error('request timed out'));
        });
      });
    });

    const report = await runPostDeploySmokeChecks(
      createBaseEnv({
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
        TERMINAL_REGISTRY_DESIRED_COUNT: '0',
        TELEMETRY_HUB_DESIRED_COUNT: '0',
        TELEMETRY_DEAD_LETTER_DESIRED_COUNT: '0'
      }),
      fetchMock as typeof fetch,
      {
        timeoutMs: 1,
        intervalMs: 1,
        sleepImpl: async () => {}
      }
    );

    expect(report.errors[0]).toContain('request timed out');
  });
});
