import { buildDeployPreflightReport, formatDeployPreflightReport } from '../lib/preflight';

function createBaseEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    DEPLOY_ENVIRONMENT: 'prod',
    AWS_REGION: 'ap-northeast-2',
    HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
    HOSTED_ZONE_NAME: 'ev-dashboard.com',
    APEX_DOMAIN: 'ev-dashboard.com',
    API_DOMAIN: 'api.ev-dashboard.com',
    VPC_ID: 'vpc-015c89247f96e9221',
    PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
    PRIVATE_SUBNET_IDS: 'subnet-ccc,subnet-ddd',
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
    ...overrides
  };
}

describe('deploy preflight', () => {
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
        DISPATCH_REGISTRY_DESIRED_COUNT: '0',
        DELIVERY_RECORD_DESIRED_COUNT: '0',
        ATTENDANCE_REGISTRY_DESIRED_COUNT: '0'
      })
    );

    expect(report.errors).toContain(
      'Dispatch read-model slice requires the full dispatch-inputs slice to stay enabled.'
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

  test('summarizes enabled slices and wait signals', () => {
    const report = buildDeployPreflightReport(createBaseEnv());
    const formatted = formatDeployPreflightReport(report);

    expect(report.enabledSlices).toEqual([
      'Auth Surface',
      'Company Governance',
      'People And Assets',
      'Dispatch Inputs',
      'Dispatch Read Models',
      'Settlement'
    ]);
    expect(report.waitSignals).toContain(
      'Stateful slices are enabled. Expect an RDS create-or-update quiet period before public smoke settles.'
    );
    expect(report.waitSignals).toContain(
      'New or updated direct Service Connect upstreams are enabled. Expect a later edge-api-gateway rollout after backend services register.'
    );
    expect(formatted).toContain('Enabled slices: Auth Surface -> Company Governance -> People And Assets');
    expect(formatted).toContain('ALB target draining can keep CloudFormation open for up to 300s');
  });
});
