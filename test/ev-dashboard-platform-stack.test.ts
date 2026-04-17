import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { buildPlatformConfig } from '../lib/config';
import { buildAppRuntimeFingerprint, buildAppRuntimeReplacementPayload, EvDashboardPlatformStack } from '../lib/ev-dashboard-platform-stack';
import type { AppHostRuntimeService } from '../lib/ec2-bootstrap';

function baseEc2RuntimeInput() {
  return {
    runtimeMode: 'ec2' as const,
    region: 'ap-northeast-2',
    hostedZoneId: 'Z0258898ULH367BASCGC',
    hostedZoneName: 'ev-dashboard.com',
    apexDomain: 'ev-dashboard.com',
    apiDomain: 'api.ev-dashboard.com',
    cockpitHosts: ['cheonha.ev-dashboard.com'],
    vpcId: 'vpc-1234567890abcdef0',
    publicSubnetIds: ['subnet-aaa', 'subnet-bbb'],
    appHostSubnetId: 'subnet-aaa',
    dataHostSubnetId: 'subnet-bbb',
    appHostSubnetAvailabilityZone: 'ap-northeast-2a',
    dataHostSubnetAvailabilityZone: 'ap-northeast-2c',
    frontImageUri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front',
    gatewayImageUri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:sha-gateway',
    accountAccessImageUri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account',
    organizationImageUri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:sha-organization',
    driverProfileImageUri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:sha-driver',
    personnelDocumentImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-personnel-document-registry:sha-document',
    vehicleAssetImageUri: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-registry:sha-vehicle',
    driverVehicleAssignmentImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-assignment:sha-assignment',
    dispatchRegistryImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-dispatch-registry:sha-dispatch',
    deliveryRecordImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-delivery-record:sha-delivery',
    attendanceRegistryImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-attendance-registry:sha-attendance',
    dispatchOpsImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-dispatch-operations-view:sha-dispatch-ops',
    driverOpsImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-operations-view:sha-driver-ops',
    vehicleOpsImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-vehicle-operations-view:sha-vehicle-ops',
    settlementRegistryImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-registry:sha-settlement-registry',
    settlementPayrollImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-payroll:sha-settlement-payroll',
    settlementOpsImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-settlement-operations-view:sha-settlement-ops',
    regionRegistryImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-registry:sha-region-registry',
    regionAnalyticsImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-region-analytics:sha-region-analytics',
    announcementRegistryImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-announcement-registry:sha-announcement',
    supportRegistryImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-support-registry:sha-support',
    notificationHubImageUri:
      '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-notification-hub:sha-notification',
    frontDesiredCount: 1,
    gatewayDesiredCount: 1,
    accountAccessDesiredCount: 1,
    organizationDesiredCount: 1,
    driverProfileDesiredCount: 1,
    personnelDocumentDesiredCount: 1,
    vehicleAssetDesiredCount: 1,
    driverVehicleAssignmentDesiredCount: 1,
    dispatchRegistryDesiredCount: 1,
    deliveryRecordDesiredCount: 1,
    attendanceRegistryDesiredCount: 1,
    dispatchOpsDesiredCount: 1,
    driverOpsDesiredCount: 1,
    vehicleOpsDesiredCount: 1,
    settlementRegistryDesiredCount: 1,
    settlementPayrollDesiredCount: 1,
    settlementOpsDesiredCount: 1,
    regionRegistryDesiredCount: 1,
    regionAnalyticsDesiredCount: 1,
    announcementRegistryDesiredCount: 1,
    supportRegistryDesiredCount: 1,
    notificationHubDesiredCount: 1,
    frontCpu: 256,
    frontMemoryMiB: 512,
    gatewayCpu: 256,
    gatewayMemoryMiB: 512,
    accountAccessCpu: 256,
    accountAccessMemoryMiB: 512,
    organizationCpu: 256,
    organizationMemoryMiB: 512,
    driverProfileCpu: 256,
    driverProfileMemoryMiB: 512,
    personnelDocumentCpu: 256,
    personnelDocumentMemoryMiB: 512,
    vehicleAssetCpu: 256,
    vehicleAssetMemoryMiB: 512,
    driverVehicleAssignmentCpu: 256,
    driverVehicleAssignmentMemoryMiB: 512,
    dispatchRegistryCpu: 256,
    dispatchRegistryMemoryMiB: 512,
    deliveryRecordCpu: 256,
    deliveryRecordMemoryMiB: 512,
    attendanceRegistryCpu: 256,
    attendanceRegistryMemoryMiB: 512,
    dispatchOpsCpu: 256,
    dispatchOpsMemoryMiB: 512,
    driverOpsCpu: 256,
    driverOpsMemoryMiB: 512,
    vehicleOpsCpu: 256,
    vehicleOpsMemoryMiB: 512,
    settlementRegistryCpu: 256,
    settlementRegistryMemoryMiB: 512,
    settlementPayrollCpu: 256,
    settlementPayrollMemoryMiB: 512,
    settlementOpsCpu: 256,
    settlementOpsMemoryMiB: 512,
    regionRegistryCpu: 256,
    regionRegistryMemoryMiB: 512,
    regionAnalyticsCpu: 256,
    regionAnalyticsMemoryMiB: 512,
    announcementRegistryCpu: 256,
    announcementRegistryMemoryMiB: 512,
    supportRegistryCpu: 256,
    supportRegistryMemoryMiB: 512,
    notificationHubCpu: 256,
    notificationHubMemoryMiB: 512,
    frontHealthCheckPath: '/',
    gatewayHealthCheckPath: '/healthz',
    accountAccessHealthCheckPath: '/healthz',
    organizationHealthCheckPath: '/health/',
    driverProfileHealthCheckPath: '/health/',
    personnelDocumentHealthCheckPath: '/health/',
    vehicleAssetHealthCheckPath: '/health/',
    driverVehicleAssignmentHealthCheckPath: '/health/',
    dispatchRegistryHealthCheckPath: '/health/',
    deliveryRecordHealthCheckPath: '/health/',
    attendanceRegistryHealthCheckPath: '/health/',
    dispatchOpsHealthCheckPath: '/health/',
    driverOpsHealthCheckPath: '/health/',
    vehicleOpsHealthCheckPath: '/health/',
    settlementRegistryHealthCheckPath: '/health/',
    settlementPayrollHealthCheckPath: '/health/',
    settlementOpsHealthCheckPath: '/health/',
    regionRegistryHealthCheckPath: '/health/',
    regionAnalyticsHealthCheckPath: '/health/',
    announcementRegistryHealthCheckPath: '/health/',
    supportRegistryHealthCheckPath: '/health/',
    notificationHubHealthCheckPath: '/health/',
    settlementOpsBaseUrl: 'https://ev-dashboard.com/api/settlement-ops',
    telemetryHubBaseUrl: 'https://api.ev-dashboard.com/api/telemetry',
    terminalRegistryBaseUrl: 'https://api.ev-dashboard.com/api/terminals'
  };
}

function extractAppServiceManifestEnvironment(
  template: Template,
  containerName: string
): Record<string, string> | undefined {
  const rendered = template.toJSON();
  const secrets = Object.values(rendered.Resources).filter(
    (resource: any) =>
      resource.Type === 'AWS::SecretsManager::Secret' &&
      resource.Properties?.Description === 'Resolved runtime manifest for ev-dashboard EC2 app host services'
  ) as Array<{ Properties: { SecretString: { 'Fn::Join': [string, Array<string | Record<string, unknown>>] } } }>;

  const appManifest = secrets[0];
  const secretStringParts = appManifest.Properties.SecretString['Fn::Join'][1];
  const serializedManifest = secretStringParts
    .map((part) => (typeof part === 'string' ? part : '__TOKEN__'))
    .join('');
  const manifest = JSON.parse(serializedManifest) as Array<{
    containerName: string;
    environment?: Record<string, string>;
  }>;

  return manifest.find((service) => service.containerName === containerName)?.environment;
}

function extractRuntimeImageMap(template: Template): Record<string, string> {
  const rendered = template.toJSON();
  const parameters = Object.values(rendered.Resources).filter(
    (resource: any) =>
      resource.Type === 'AWS::SSM::Parameter' && resource.Properties?.Name === '/TestStack/runtime/images'
  ) as Array<{ Properties: { Value: string } }>;

  return JSON.parse(parameters[0].Properties.Value) as Record<string, string>;
}

function buildReplacementPayloadInput(input?: {
  enabledAccountImage?: string;
  disabledTelemetryImage?: string;
  accountEnvironment?: Record<string, string>;
  bootstrapPackageDigest?: string;
  reverseServiceOrder?: boolean;
}): {
  runtimeImageMap: Record<string, string>;
  appServices: AppHostRuntimeService[];
  bootstrapPackageDigest: string;
} {
  const appServices: AppHostRuntimeService[] = [
    {
      id: 'ACCOUNT_ACCESS',
      imageMapKey: 'service-account-access',
      containerName: 'account-auth-api',
      enabled: true,
      containerPort: 8000,
      hostPort: 8000,
      environment: input?.accountEnvironment ?? {
        DJANGO_ALLOWED_HOSTS: 'api.ev-dashboard.com'
      }
    },
    {
      id: 'TELEMETRY_LISTENER',
      imageMapKey: 'service-telemetry-listener',
      containerName: 'telemetry-listener',
      enabled: false,
      environment: {
        TELEMETRY_LISTENER_MQTT_HOST: 'mqtt.example.internal'
      }
    }
  ];

  return {
    runtimeImageMap: {
      'service-account-access': input?.enabledAccountImage ?? 'account@sha256:enabled-a',
      'service-telemetry-listener': input?.disabledTelemetryImage ?? 'listener@sha256:disabled-a'
    },
    appServices: input?.reverseServiceOrder ? [...appServices].reverse() : appServices,
    bootstrapPackageDigest: input?.bootstrapPackageDigest ?? 'bootstrap-digest-a'
  };
}

describe('EvDashboardPlatformStack', () => {
  test('keeps the replacement fingerprint stable for the same resolved runtime', () => {
    expect(
      buildAppRuntimeFingerprint(
        buildReplacementPayloadInput({
          accountEnvironment: {
            DJANGO_ALLOWED_HOSTS: 'api.ev-dashboard.com',
            POSTGRES_HOST: 'postgres.internal'
          },
          reverseServiceOrder: false
        })
      )
    ).toEqual(
      buildAppRuntimeFingerprint(
        buildReplacementPayloadInput({
          accountEnvironment: {
            POSTGRES_HOST: 'postgres.internal',
            DJANGO_ALLOWED_HOSTS: 'api.ev-dashboard.com'
          },
          reverseServiceOrder: true
        })
      )
    );
  });

  test('ignores disabled-service image changes in the replacement payload', () => {
    expect(
      buildAppRuntimeReplacementPayload(
        buildReplacementPayloadInput({ disabledTelemetryImage: 'listener@sha256:disabled-a' })
      )
    ).toEqual(
      buildAppRuntimeReplacementPayload(
        buildReplacementPayloadInput({ disabledTelemetryImage: 'listener@sha256:disabled-b' })
      )
    );
  });

  test('changes the replacement payload when an enabled-service image changes', () => {
    expect(
      buildAppRuntimeReplacementPayload(
        buildReplacementPayloadInput({ enabledAccountImage: 'account@sha256:enabled-a' })
      )
    ).not.toEqual(
      buildAppRuntimeReplacementPayload(
        buildReplacementPayloadInput({ enabledAccountImage: 'account@sha256:enabled-b' })
      )
    );
  });

  test('changes the replacement payload when an enabled-service runtime spec changes', () => {
    expect(
      buildAppRuntimeReplacementPayload(
        buildReplacementPayloadInput({
          accountEnvironment: { DJANGO_ALLOWED_HOSTS: 'api.ev-dashboard.com' }
        })
      )
    ).not.toEqual(
      buildAppRuntimeReplacementPayload(
        buildReplacementPayloadInput({
          accountEnvironment: { DJANGO_ALLOWED_HOSTS: 'api-next.ev-dashboard.com' }
        })
      )
    );
  });

  test('changes the replacement fingerprint when the bootstrap package digest changes', () => {
    expect(
      buildAppRuntimeFingerprint(
        buildReplacementPayloadInput({ bootstrapPackageDigest: 'bootstrap-digest-a' })
      )
    ).not.toEqual(
      buildAppRuntimeFingerprint(
        buildReplacementPayloadInput({ bootstrapPackageDigest: 'bootstrap-digest-b' })
      )
    );
  });

  test('sources core backend app-host runtime base metadata from the service catalog', () => {
    const source = readFileSync(join(__dirname, '..', 'lib', 'ev-dashboard-platform-stack.ts'), 'utf8');

    expect(source).toContain('buildCatalogBackedAppHostRuntimeService');
    expect(source).toContain("buildCatalogBackedAppHostRuntimeService('service-account-access'");
    expect(source).toContain("buildCatalogBackedAppHostRuntimeService('service-organization-registry'");
    expect(source).toContain("buildCatalogBackedAppHostRuntimeService('service-driver-profile'");
    expect(source).toContain("buildCatalogBackedAppHostRuntimeService('service-dispatch-operations-view'");
    expect(source).toContain("buildCatalogBackedAppHostRuntimeService('service-settlement-operations-view'");
    expect(source).not.toContain("buildCatalogBackedAppHostRuntimeService('front-web-console'");
    expect(source).not.toContain("buildCatalogBackedAppHostRuntimeService('edge-api-gateway'");
  });

  test('sources runtime image-map entries for catalog-backed services from the service catalog', () => {
    const source = readFileSync(join(__dirname, '..', 'lib', 'ev-dashboard-platform-stack.ts'), 'utf8');

    expect(source).toContain('buildCatalogBackedRuntimeImageMapEntries');
    expect(source).not.toContain("'service-driver-profile': config.driverProfileImageUri");
    expect(source).not.toContain("'service-dispatch-operations-view': config.dispatchOpsImageUri");
    expect(source).not.toContain("'service-settlement-operations-view': config.settlementOpsImageUri");
  });

  test('synthesizes the ev-dashboard canonical runtime as EC2 app and data hosts', () => {
    const app = new App();
    const config = buildPlatformConfig({
      ...baseEc2RuntimeInput(),
      deployEnvironment: 'prod'
    });

    const stack = new EvDashboardPlatformStack(app, 'TestStack', { config });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::EC2::Instance', 2);
    template.resourceCountIs('AWS::EC2::Volume', 0);
    template.resourceCountIs('AWS::ECS::Service', 0);
    template.resourceCountIs('AWS::ECS::Cluster', 0);
    template.resourceCountIs('AWS::RDS::DBInstance', 0);
    template.resourceCountIs('AWS::ElastiCache::CacheCluster', 0);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
    template.resourceCountIs('AWS::Route53::RecordSet', 3);

    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'ev-dashboard.com',
      SubjectAlternativeNames: Match.arrayWith(['api.ev-dashboard.com', 'cheonha.ev-dashboard.com'])
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: Match.arrayWith([
        Match.objectLike({
          Field: 'host-header',
          HostHeaderConfig: {
            Values: ['ev-dashboard.com', 'cheonha.ev-dashboard.com']
          }
        })
      ])
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: Match.arrayWith([
        Match.objectLike({
          Field: 'host-header',
          HostHeaderConfig: {
            Values: ['ev-dashboard.com', 'cheonha.ev-dashboard.com']
          }
        }),
        Match.objectLike({
          Field: 'path-pattern',
          PathPatternConfig: {
            Values: ['/api/*']
          }
        })
      ])
    });

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'cheonha.ev-dashboard.com.',
      Type: 'A',
      AliasTarget: Match.anyValue()
    });

    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Description: 'Resolved runtime manifest for ev-dashboard EC2 app host services'
    });

    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Description: 'Resolved secret ARN map for ev-dashboard EC2 app host services'
    });

    const instanceResources = template.findResources('AWS::EC2::Instance');
    expect(Object.keys(instanceResources)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^AppHostInstance2DFF863A[a-f0-9]{16}$/),
        expect.stringMatching(/^DataHostInstance4BFB8F49(?:[a-f0-9]{16})?$/)
      ])
    );

    template.hasResourceProperties('AWS::EC2::Instance', {
      BlockDeviceMappings: Match.arrayWith([
        Match.objectLike({
          DeviceName: '/dev/xvda',
          Ebs: Match.objectLike({
            DeleteOnTermination: true,
            Encrypted: true,
            VolumeSize: 32,
            VolumeType: 'gp3'
          })
        })
      ])
    });

    template.hasResourceProperties('AWS::EC2::Instance', {
      BlockDeviceMappings: Match.arrayWith([
        Match.objectLike({
          DeviceName: '/dev/sdf',
          Ebs: Match.objectLike({
            DeleteOnTermination: true,
            Encrypted: true,
            VolumeSize: 100,
            VolumeType: 'gp3'
          })
        })
      ])
    });

    template.hasResourceProperties('AWS::EC2::Instance', {
      NetworkInterfaces: Match.arrayWith([
        Match.objectLike({
          AssociatePublicIpAddress: true
        })
      ])
    });
  });

  test('injects GUNICORN_WORKERS=1 into backend service manifests for dev only', () => {
    const devApp = new App();
    const devConfig = buildPlatformConfig({
      ...baseEc2RuntimeInput(),
      deployEnvironment: 'dev',
      apexDomain: 'candidate.ev-dashboard.com',
      apiDomain: 'api.candidate.ev-dashboard.com'
    });
    const devStack = new EvDashboardPlatformStack(devApp, 'DevTestStack', { config: devConfig });
    const devTemplate = Template.fromStack(devStack);

    expect(extractAppServiceManifestEnvironment(devTemplate, 'account-auth-api')).toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
    expect(extractAppServiceManifestEnvironment(devTemplate, 'dispatch-ops-api')).toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
    expect(extractAppServiceManifestEnvironment(devTemplate, 'settlement-ops-api')).toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1',
        SETTLEMENT_PAYROLL_BASE_URL: 'http://settlement-payroll-api:8000',
        DELIVERY_RECORD_BASE_URL: 'http://delivery-record-api:8000',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000'
      })
    );
    expect(extractAppServiceManifestEnvironment(devTemplate, 'edge-api-gateway')).not.toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
  });

  test('does not inject the dev Gunicorn override into prod backend service manifests', () => {
    const prodApp = new App();
    const prodConfig = buildPlatformConfig({
      ...baseEc2RuntimeInput(),
      deployEnvironment: 'prod'
    });
    const prodStack = new EvDashboardPlatformStack(prodApp, 'ProdTestStack', { config: prodConfig });
    const prodTemplate = Template.fromStack(prodStack);

    expect(extractAppServiceManifestEnvironment(prodTemplate, 'account-auth-api')).not.toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
    expect(extractAppServiceManifestEnvironment(prodTemplate, 'dispatch-ops-api')).not.toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
    expect(extractAppServiceManifestEnvironment(prodTemplate, 'settlement-ops-api')).not.toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
  });

  test('injects configured gunicorn workers into prod backend service manifests when overridden', () => {
    const prodApp = new App();
    const prodConfig = buildPlatformConfig({
      ...baseEc2RuntimeInput(),
      deployEnvironment: 'prod',
      backendGunicornWorkers: 1
    });
    const prodStack = new EvDashboardPlatformStack(prodApp, 'ProdWorkerOverrideStack', { config: prodConfig });
    const prodTemplate = Template.fromStack(prodStack);

    expect(extractAppServiceManifestEnvironment(prodTemplate, 'account-auth-api')).toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
    expect(extractAppServiceManifestEnvironment(prodTemplate, 'dispatch-ops-api')).toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
    expect(extractAppServiceManifestEnvironment(prodTemplate, 'settlement-ops-api')).toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1',
        SETTLEMENT_PAYROLL_BASE_URL: 'http://settlement-payroll-api:8000',
        DELIVERY_RECORD_BASE_URL: 'http://delivery-record-api:8000',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000'
      })
    );
    expect(extractAppServiceManifestEnvironment(prodTemplate, 'edge-api-gateway')).not.toEqual(
      expect.objectContaining({
        GUNICORN_WORKERS: '1'
      })
    );
  });

  test('omits optional terminal and telemetry images from the runtime image map when undefined', () => {
    const app = new App();
    const config = buildPlatformConfig({
      ...baseEc2RuntimeInput(),
      deployEnvironment: 'prod',
      terminalRegistryImageUri: undefined,
      telemetryHubImageUri: undefined,
      telemetryDeadLetterImageUri: undefined,
      telemetryListenerImageUri: undefined,
      terminalRegistryDesiredCount: 0,
      telemetryHubDesiredCount: 0,
      telemetryDeadLetterDesiredCount: 0,
      telemetryListenerDesiredCount: 0
    });
    const stack = new EvDashboardPlatformStack(app, 'TestStack', { config });
    const template = Template.fromStack(stack);
    const runtimeImageMap = extractRuntimeImageMap(template);

    expect(runtimeImageMap['service-terminal-registry']).toBeUndefined();
    expect(runtimeImageMap['service-telemetry-hub']).toBeUndefined();
    expect(runtimeImageMap['service-telemetry-dead-letter']).toBeUndefined();
    expect(runtimeImageMap['service-telemetry-listener']).toBeUndefined();
  });
});
