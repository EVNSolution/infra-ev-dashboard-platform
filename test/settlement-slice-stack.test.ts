import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { buildPlatformConfig } from '../lib/config';
import { EvDashboardPlatformStack } from '../lib/ev-dashboard-platform-stack';

describe('Settlement slice stack', () => {
  test('adds settlement registry, payroll, and ops services with runtime dependencies', () => {
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
      settlementOpsBaseUrl: 'http://settlement-ops-api:8000',
      telemetryHubBaseUrl: 'https://hub.evnlogistics.com/api/telemetry',
      terminalRegistryBaseUrl: 'https://hub.evnlogistics.com/api/terminals'
    } as any);

    const stack = new EvDashboardPlatformStack(app, 'SettlementSliceStack', { config });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECS::Service', 17);
    template.resourceCountIs('AWS::RDS::DBInstance', 11);

    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'settlement-registry-http',
            ClientAliases: Match.arrayWith([Match.objectLike({ DnsName: 'settlement-registry-api', Port: 8000 })])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'settlement-payroll-http',
            ClientAliases: Match.arrayWith([Match.objectLike({ DnsName: 'settlement-payroll-api', Port: 8000 })])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'settlement-ops-http',
            ClientAliases: Match.arrayWith([Match.objectLike({ DnsName: 'settlement-ops-api', Port: 8000 })])
          })
        ])
      })
    }));

    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'settlement_registry'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'settlement_payroll'
    }));

    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceSettlementRegistryContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'settlement_registry' }),
            Match.objectLike({ Name: 'ORGANIZATION_MASTER_BASE_URL', Value: 'http://organization-master-api:8000' }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'settlement-registry-api,localhost,127.0.0.1' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceSettlementPayrollContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'settlement_payroll' }),
            Match.objectLike({ Name: 'SETTLEMENT_ORG_BASE_URL', Value: 'http://organization-master-api:8000' }),
            Match.objectLike({ Name: 'SETTLEMENT_DRIVER_BASE_URL', Value: 'http://driver-profile-api:8000' }),
            Match.objectLike({ Name: 'SETTLEMENT_REGISTRY_BASE_URL', Value: 'http://settlement-registry-api:8000' }),
            Match.objectLike({ Name: 'DELIVERY_RECORD_BASE_URL', Value: 'http://delivery-record-api:8000' }),
            Match.objectLike({ Name: 'DISPATCH_REGISTRY_BASE_URL', Value: 'http://dispatch-registry-api:8000' }),
            Match.objectLike({ Name: 'ATTENDANCE_REGISTRY_BASE_URL', Value: 'http://attendance-registry-api:8000' }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'settlement-payroll-api,localhost,127.0.0.1' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceSettlementOperationsViewContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'SETTLEMENT_PAYROLL_BASE_URL', Value: 'http://settlement-payroll-api:8000' }),
            Match.objectLike({ Name: 'DELIVERY_RECORD_BASE_URL', Value: 'http://delivery-record-api:8000' }),
            Match.objectLike({ Name: 'DRIVER_PROFILE_BASE_URL', Value: 'http://driver-profile-api:8000' }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'settlement-ops-api,localhost,127.0.0.1' })
          ])
        })
      ])
    }));
  });
});
