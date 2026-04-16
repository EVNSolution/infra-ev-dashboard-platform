import { type PlatformConfig, buildPlatformConfigFromEnv } from '../lib/config';
import {
  getServiceCatalogEntry,
  listCatalogEntriesForRouteGroup,
  listCatalogEntriesForWave,
  listServiceCatalogEntries
} from '../lib/serviceCatalog';

function createBaseEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    AWS_REGION: 'ap-northeast-2',
    HOSTED_ZONE_ID: 'Z1234567890',
    HOSTED_ZONE_NAME: 'ev-dashboard.com',
    APEX_DOMAIN: 'candidate.ev-dashboard.com',
    API_DOMAIN: 'api.candidate.ev-dashboard.com',
    VPC_ID: 'vpc-1234567890',
    PUBLIC_SUBNET_IDS: 'subnet-public-a,subnet-public-c',
    PRIVATE_SUBNET_IDS: 'subnet-private-a,subnet-private-c',
    FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front',
    GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:sha-gateway',
    ACCOUNT_ACCESS_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account',
    ORGANIZATION_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:sha-org',
    DRIVER_PROFILE_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:sha-driver',
    PERSONNEL_DOCUMENT_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:sha-personnel',
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
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:sha-region',
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
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-hub:sha-telemetry',
    TELEMETRY_DEAD_LETTER_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-dead-letter:sha-dead-letter',
    TELEMETRY_LISTENER_IMAGE_URI:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-telemetry-listener:sha-listener',
    ...overrides
  };
}

describe('service catalog', () => {
  test('returns metadata for a concrete service', () => {
    expect(getServiceCatalogEntry('service-settlement-registry')).toMatchObject({
      service: 'service-settlement-registry',
      routeGroup: 'settlement',
      wave: 1,
      slice: 'settlement',
      imageEnvKey: 'SETTLEMENT_REGISTRY_IMAGE_URI',
      desiredCountEnvKey: 'SETTLEMENT_REGISTRY_DESIRED_COUNT'
    });
  });

  test('lists route-group members from one source of truth', () => {
    expect(listCatalogEntriesForRouteGroup('support-surface').map((entry) => entry.service)).toEqual([
      'service-announcement-registry',
      'service-notification-hub',
      'service-region-analytics',
      'service-region-registry',
      'service-support-registry'
    ]);
  });

  test('lists wave members in sorted service order', () => {
    expect(listCatalogEntriesForWave(3).map((entry) => entry.service)).toEqual(['edge-api-gateway']);
    expect(listCatalogEntriesForWave(4).map((entry) => entry.service)).toEqual(['front-web-console']);
  });

  test('catalog covers every deployable service exactly once', () => {
    const services = listServiceCatalogEntries().map((entry) => entry.service);
    expect(new Set(services).size).toBe(services.length);
    expect(services).toContain('service-account-access');
    expect(services).toContain('service-telemetry-listener');
    expect(services).toHaveLength(26);
  });

  test('reads desired counts through catalog metadata', () => {
    const config = buildPlatformConfigFromEnv(
      createBaseEnv({
        DRIVER_PROFILE_DESIRED_COUNT: '1',
        DISPATCH_REGISTRY_DESIRED_COUNT: '1',
        SETTLEMENT_OPS_DESIRED_COUNT: '1'
      })
    );

    expect(readDesiredCount(config, 'service-driver-profile')).toBe(1);
    expect(readDesiredCount(config, 'service-dispatch-registry')).toBe(1);
    expect(readDesiredCount(config, 'service-settlement-operations-view')).toBe(1);
    expect(readDesiredCount(config, 'service-support-registry')).toBe(0);
  });
});

function readDesiredCount(config: PlatformConfig, service: Parameters<typeof getServiceCatalogEntry>[0]): number {
  const entry = getServiceCatalogEntry(service);
  return Number(config[entry.desiredCountConfigKey] ?? 0);
}
