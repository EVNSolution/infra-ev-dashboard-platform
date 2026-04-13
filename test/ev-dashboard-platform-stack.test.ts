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
      frontDesiredCount: 1,
      gatewayDesiredCount: 1,
      accountAccessDesiredCount: 1,
      frontCpu: 256,
      frontMemoryMiB: 512,
      gatewayCpu: 256,
      gatewayMemoryMiB: 512,
      accountAccessCpu: 256,
      accountAccessMemoryMiB: 512,
      frontHealthCheckPath: '/',
      gatewayHealthCheckPath: '/healthz',
      accountAccessHealthCheckPath: '/healthz'
    });

    const stack = new EvDashboardPlatformStack(app, 'TestStack', { config });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ECS::Service', 3);
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.resourceCountIs('AWS::ElastiCache::CacheCluster', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS'
    });
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'postgres',
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
  });
});
