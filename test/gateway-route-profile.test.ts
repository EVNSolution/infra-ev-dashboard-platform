import { buildPlatformConfigFromEnv } from '../lib/config';
import { buildGatewayRouteProfile } from '../lib/gatewayRouteProfile';

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

describe('gateway route profile selection', () => {
  test('keeps bootstrap-proof when only the core entry services are enabled', () => {
    const profile = buildGatewayRouteProfile(buildPlatformConfigFromEnv(createBaseEnv({ RUN_PROFILE: 'bootstrap-proof' })));

    expect(profile.profile).toBe('bootstrap-proof');
    expect(profile.routeGroups).toEqual([]);
  });

  test('uses partial profile for the people-and-assets slice', () => {
    const profile = buildGatewayRouteProfile(
      buildPlatformConfigFromEnv(
        createBaseEnv({
          DRIVER_PROFILE_DESIRED_COUNT: '1',
          PERSONNEL_DOCUMENT_DESIRED_COUNT: '1',
          VEHICLE_ASSET_DESIRED_COUNT: '1',
          DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT: '1'
        })
      )
    );

    expect(profile.profile).toBe('partial');
    expect(profile.routeGroups).toEqual(['people-and-assets']);
  });

  test('uses partial profile with ordered route groups for mixed later slices', () => {
    const profile = buildGatewayRouteProfile(
      buildPlatformConfigFromEnv(
        createBaseEnv({
          DRIVER_PROFILE_DESIRED_COUNT: '1',
          PERSONNEL_DOCUMENT_DESIRED_COUNT: '1',
          VEHICLE_ASSET_DESIRED_COUNT: '1',
          DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT: '1',
          DISPATCH_REGISTRY_DESIRED_COUNT: '1',
          DELIVERY_RECORD_DESIRED_COUNT: '1',
          ATTENDANCE_REGISTRY_DESIRED_COUNT: '1',
          SETTLEMENT_REGISTRY_DESIRED_COUNT: '1',
          SETTLEMENT_PAYROLL_DESIRED_COUNT: '1',
          SETTLEMENT_OPS_DESIRED_COUNT: '1'
        })
      )
    );

    expect(profile.profile).toBe('partial');
    expect(profile.routeGroups).toEqual(['people-and-assets', 'dispatch-inputs', 'settlement']);
  });
});
