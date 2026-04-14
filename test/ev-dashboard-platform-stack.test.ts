import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { buildPlatformConfig } from '../lib/config';
import { EvDashboardPlatformStack } from '../lib/ev-dashboard-platform-stack';

describe('EvDashboardPlatformStack', () => {
  test('synthesizes the first ev-dashboard ECS slice', () => {
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
      attendanceRegistryHealthCheckPath: '/health/'
    });

    const stack = new EvDashboardPlatformStack(app, 'TestStack', { config });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ECS::Service', 11);
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
    template.resourceCountIs('AWS::RDS::DBInstance', 9);
    template.resourceCountIs('AWS::ElastiCache::CacheCluster', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS'
    });
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'account_auth'
    }));
    template.hasResourceProperties('AWS::ElastiCache::CacheCluster', Match.objectLike({
      Engine: 'redis',
      NumCacheNodes: 1
    }));
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 5174,
      Protocol: 'HTTP'
    });
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: Match.arrayWith([
        Match.objectLike({
          Field: 'host-header',
          HostHeaderConfig: {
            Values: ['ev-dashboard.com']
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
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: Match.arrayWith([
        Match.objectLike({
          Field: 'host-header',
          HostHeaderConfig: {
            Values: ['api.ev-dashboard.com']
          }
        })
      ])
    });
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'front-web',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'web-console',
                Port: 5174
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'dispatch-registry-http',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'dispatch-registry-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'delivery-record-http',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'delivery-record-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'attendance-registry-http',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'attendance-registry-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'driver-profile-http',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'driver-profile-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'personnel-document-http',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'personnel-document-registry-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'vehicle-asset-http',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'vehicle-asset-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'driver-vehicle-assignment-http',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'driver-vehicle-assignment-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'account-auth',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'account-auth-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
      ServiceConnectConfiguration: Match.objectLike({
        Enabled: true,
        Namespace: 'ev-dashboard.internal',
        Services: Match.arrayWith([
          Match.objectLike({
            PortName: 'organization-http',
            ClientAliases: Match.arrayWith([
              Match.objectLike({
                DnsName: 'organization-master-api',
                Port: 8000
              })
            ])
          })
        ])
      })
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceAccountAccessContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_HOST', Value: Match.anyValue() }),
            Match.objectLike({ Name: 'POSTGRES_PORT', Value: Match.anyValue() }),
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'account_auth' }),
            Match.objectLike({ Name: 'REDIS_URL', Value: Match.anyValue() }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'api.ev-dashboard.com,account-auth-api,localhost,127.0.0.1' }),
            Match.objectLike({ Name: 'CSRF_TRUSTED_ORIGINS', Value: 'https://ev-dashboard.com,https://api.ev-dashboard.com' })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'organization_master'
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceOrganizationRegistryContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_HOST', Value: Match.anyValue() }),
            Match.objectLike({ Name: 'POSTGRES_PORT', Value: Match.anyValue() }),
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'organization_master' }),
            Match.objectLike({
              Name: 'DJANGO_ALLOWED_HOSTS',
              Value: 'organization-master-api,localhost,127.0.0.1'
            })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'driver_profile'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'personnel_document'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'vehicle_asset'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'driver_vehicle_assignment'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'dispatch_registry'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'delivery_record'
    }));
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
      EngineVersion: '16.13',
      PubliclyAccessible: false,
      DBName: 'attendance_registry'
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceDriverProfileContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'driver_profile' }),
            Match.objectLike({
              Name: 'DJANGO_ALLOWED_HOSTS',
              Value: 'driver-profile-api,localhost,127.0.0.1'
            })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServicePersonnelDocumentRegistryContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'personnel_document' }),
            Match.objectLike({ Name: 'DRIVER_PROFILE_BASE_URL', Value: 'http://driver-profile-api:8000' }),
            Match.objectLike({
              Name: 'DJANGO_ALLOWED_HOSTS',
              Value: 'personnel-document-registry-api,localhost,127.0.0.1'
            })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceVehicleRegistryContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'vehicle_asset' }),
            Match.objectLike({
              Name: 'DJANGO_ALLOWED_HOSTS',
              Value: 'vehicle-asset-api,localhost,127.0.0.1'
            })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceVehicleAssignmentContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'driver_vehicle_assignment' }),
            Match.objectLike({ Name: 'DRIVER_PROFILE_BASE_URL', Value: 'http://driver-profile-api:8000' }),
            Match.objectLike({ Name: 'VEHICLE_ASSET_BASE_URL', Value: 'http://vehicle-asset-api:8000' }),
            Match.objectLike({
              Name: 'DJANGO_ALLOWED_HOSTS',
              Value: 'driver-vehicle-assignment-api,localhost,127.0.0.1'
            })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceDispatchRegistryContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'dispatch_registry' }),
            Match.objectLike({ Name: 'VEHICLE_REGISTRY_BASE_URL', Value: 'http://vehicle-asset-api:8000' }),
            Match.objectLike({ Name: 'DRIVER_PROFILE_BASE_URL', Value: 'http://driver-profile-api:8000' }),
            Match.objectLike({ Name: 'DELIVERY_RECORD_BASE_URL', Value: 'http://delivery-record-api:8000' }),
            Match.objectLike({ Name: 'ATTENDANCE_REGISTRY_BASE_URL', Value: 'http://attendance-registry-api:8000' }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'dispatch-registry-api,localhost,127.0.0.1' })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceDeliveryRecordContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'delivery_record' }),
            Match.objectLike({ Name: 'ORGANIZATION_MASTER_BASE_URL', Value: 'http://organization-master-api:8000' }),
            Match.objectLike({ Name: 'DRIVER_PROFILE_BASE_URL', Value: 'http://driver-profile-api:8000' }),
            Match.objectLike({ Name: 'DISPATCH_REGISTRY_BASE_URL', Value: 'http://dispatch-registry-api:8000' }),
            Match.objectLike({ Name: 'ATTENDANCE_REGISTRY_BASE_URL', Value: 'http://attendance-registry-api:8000' }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'delivery-record-api,localhost,127.0.0.1' })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));
    template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'ServiceAttendanceRegistryContainer',
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_DB', Value: 'attendance_registry' }),
            Match.objectLike({ Name: 'DJANGO_ALLOWED_HOSTS', Value: 'attendance-registry-api,localhost,127.0.0.1' })
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'POSTGRES_USER' }),
            Match.objectLike({ Name: 'POSTGRES_PASSWORD' }),
            Match.objectLike({ Name: 'DJANGO_SECRET_KEY' }),
            Match.objectLike({ Name: 'JWT_SECRET_KEY' })
          ])
        })
      ])
    }));

    const services = template.findResources('AWS::ECS::Service');
    expect(services.EdgeApiGatewayServiceFF03CA41.DependsOn).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^FrontWebConsoleService/),
        'ServiceAccountAccessServiceA22C9E5C',
        'ServiceOrganizationRegistryService039B0502',
        expect.stringMatching(/^ServiceDriverProfileService/),
        expect.stringMatching(/^ServicePersonnelDocumentRegistryService/),
        expect.stringMatching(/^ServiceVehicleRegistryService/),
        expect.stringMatching(/^ServiceVehicleAssignmentService/),
        expect.stringMatching(/^ServiceDispatchRegistryService/),
        expect.stringMatching(/^ServiceDeliveryRecordService/),
        expect.stringMatching(/^ServiceAttendanceRegistryService/)
      ])
    );
  });
});
