import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { buildPlatformConfig } from '../lib/config';
import { EvDashboardPlatformStack } from '../lib/ev-dashboard-platform-stack';

describe('Support slice stack', () => {
  test('adds support-surface services, databases, and support to notification dependency', () => {
    const app = new App();
    const config = buildPlatformConfig({
      region: 'ap-northeast-2',
      hostedZoneId: 'Z0258898ULH367BASCGC',
      hostedZoneName: 'ev-dashboard.com',
      apexDomain: 'ev-dashboard.com',
      apiDomain: 'api.ev-dashboard.com',
      vpcId: 'vpc-1234567890abcdef0',
      publicSubnetIds: ['subnet-aaa', 'subnet-bbb'],
      privateSubnetIds: ['subnet-ccc', 'subnet-ddd'],
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
      settlementOpsBaseUrl: 'http://settlement-ops-api:8000',
      telemetryHubBaseUrl: 'https://hub.evnlogistics.com/api/telemetry',
      terminalRegistryBaseUrl: 'https://hub.evnlogistics.com/api/terminals'
    } as any);

    const stack = new EvDashboardPlatformStack(app, 'SupportSliceStack', { config });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECS::Service', 22);
    template.resourceCountIs('AWS::RDS::DBInstance', 16);

    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'region-registry-http',
            ClientAliases: Match.arrayWith([Match.objectLike({ DnsName: 'region-registry-api', Port: 8000 })])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'region-analytics-http',
            ClientAliases: Match.arrayWith([Match.objectLike({ DnsName: 'region-analytics-api', Port: 8000 })])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'announcement-registry-http',
            ClientAliases: Match.arrayWith([Match.objectLike({ DnsName: 'announcement-registry-api', Port: 8000 })])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'support-registry-http',
            ClientAliases: Match.arrayWith([Match.objectLike({ DnsName: 'support-registry-api', Port: 8000 })])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'notification-hub-http',
            ClientAliases: Match.arrayWith([Match.objectLike({ DnsName: 'notification-hub-api', Port: 8000 })])
          })
        ])
      })
    }));

    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'region_registry'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'region_analytics'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'announcement_registry'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'support_registry'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'notification_hub'
    }));

    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceSupportRegistryContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'support_registry' }),
            Match.objectLike({ Name: 'NOTIFICATION_HUB_BASE_URL', Value: 'http://notification-hub-api:8000' }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'support-registry-api,localhost,127.0.0.1' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceNotificationHubContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'notification_hub' }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'notification-hub-api,localhost,127.0.0.1' })
          ])
        })
      ])
    }));
  });
});
