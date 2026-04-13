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
      apexDomain: 'ev-dashboard.com',
      apiDomain: 'api.ev-dashboard.com',
      certificateArn: 'arn:aws:acm:ap-northeast-2:123456789012:certificate/example',
      vpcId: 'vpc-1234567890abcdef0',
      publicSubnetIds: ['subnet-aaa', 'subnet-bbb'],
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
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS'
    });
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: Match.arrayWith([
        Match.objectLike({
          Field: 'host-header',
          HostHeaderConfig: {
            Values: ['ev-dashboard.com']
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
  });
});
