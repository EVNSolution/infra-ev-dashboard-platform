import * as cdk from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';
import { aws_route53_targets as route53Targets } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import type { PlatformConfig } from './config';

type EvDashboardPlatformStackProps = cdk.StackProps & {
  config: PlatformConfig;
};

export class EvDashboardPlatformStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EvDashboardPlatformStackProps) {
    super(scope, id, props);

    const { config } = props;
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'Vpc', {
      vpcId: config.vpcId,
      availabilityZones: config.availabilityZones,
      publicSubnetIds: config.publicSubnetIds
    });
    const publicSubnets = config.publicSubnetIds.map((subnetId, index) =>
      ec2.Subnet.fromSubnetId(this, `PublicSubnet${index + 1}`, subnetId)
    );
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.apexDomain
    });
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', config.certificateArn);
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: 'ev-dashboard-platform',
      vpc
    });

    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Public ALB access for ev-dashboard.com',
      allowAllOutbound: true
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    const serviceSecurityGroup = new ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
      vpc,
      description: 'Application tasks for ev-dashboard ECS slice',
      allowAllOutbound: true
    });
    serviceSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(80), 'Front traffic');
    serviceSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(8080), 'Gateway traffic');
    serviceSecurityGroup.addIngressRule(serviceSecurityGroup, ec2.Port.tcp(8000), 'Gateway to account access');

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnets: publicSubnets }
    });

    loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true
      })
    });

    const httpsListener = loadBalancer.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'not found'
      })
    });

    const frontService = this.createFargateService('FrontWebConsole', {
      cluster,
      imageUri: config.frontImageUri,
      cpu: config.frontCpu,
      memoryMiB: config.frontMemoryMiB,
      desiredCount: config.frontDesiredCount,
      containerPort: 80,
      serviceName: 'front-web-console',
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets
    });

    const gatewayService = this.createFargateService('EdgeApiGateway', {
      cluster,
      imageUri: config.gatewayImageUri,
      cpu: config.gatewayCpu,
      memoryMiB: config.gatewayMemoryMiB,
      desiredCount: config.gatewayDesiredCount,
      containerPort: 8080,
      serviceName: 'edge-api-gateway',
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets
    });

    this.createFargateService('ServiceAccountAccess', {
      cluster,
      imageUri: config.accountAccessImageUri,
      cpu: config.accountAccessCpu,
      memoryMiB: config.accountAccessMemoryMiB,
      desiredCount: config.accountAccessDesiredCount,
      containerPort: 8000,
      serviceName: 'service-account-access',
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets
    });

    const frontTargetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontTargetGroup', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc,
      healthCheck: {
        path: config.frontHealthCheckPath
      }
    });
    frontService.attachToApplicationTargetGroup(frontTargetGroup);

    const gatewayTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GatewayTargetGroup', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc,
      healthCheck: {
        path: config.gatewayHealthCheckPath
      }
    });
    gatewayService.attachToApplicationTargetGroup(gatewayTargetGroup);

    httpsListener.addTargetGroups('FrontRule', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.hostHeaders([config.apexDomain])],
      targetGroups: [frontTargetGroup]
    });

    httpsListener.addTargetGroups('ApiRule', {
      priority: 20,
      conditions: [elbv2.ListenerCondition.hostHeaders([config.apiDomain])],
      targetGroups: [gatewayTargetGroup]
    });

    new route53.ARecord(this, 'ApexAliasRecord', {
      zone: hostedZone,
      recordName: config.apexDomain,
      target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(loadBalancer))
    });

    new route53.ARecord(this, 'ApiAliasRecord', {
      zone: hostedZone,
      recordName: this.relativeRecordName(config.apiDomain, config.apexDomain),
      target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(loadBalancer))
    });
  }

  private createFargateService(
    id: string,
    input: {
      cluster: ecs.Cluster;
      imageUri: string;
      cpu: number;
      memoryMiB: number;
      desiredCount: number;
      containerPort: number;
      serviceName: string;
      securityGroup: ec2.SecurityGroup;
      subnets: ec2.ISubnet[];
    }
  ): ecs.FargateService {
    const taskDefinition = new ecs.FargateTaskDefinition(this, `${id}TaskDefinition`, {
      cpu: input.cpu,
      memoryLimitMiB: input.memoryMiB
    });
    taskDefinition.addContainer(`${id}Container`, {
      image: ecs.ContainerImage.fromRegistry(input.imageUri),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: input.serviceName }),
      portMappings: [{ containerPort: input.containerPort }]
    });

    return new ecs.FargateService(this, `${id}Service`, {
      cluster: input.cluster,
      taskDefinition,
      desiredCount: input.desiredCount,
      assignPublicIp: true,
      securityGroups: [input.securityGroup],
      vpcSubnets: { subnets: input.subnets },
      serviceName: input.serviceName
    });
  }

  private relativeRecordName(fqdn: string, apexDomain: string): string {
    const suffix = `.${apexDomain}`;
    return fqdn.endsWith(suffix) ? fqdn.slice(0, -suffix.length) : fqdn;
  }
}
