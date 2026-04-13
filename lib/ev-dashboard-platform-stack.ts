import * as cdk from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_elasticache as elasticache } from 'aws-cdk-lib';
import { aws_ecr as ecr } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';
import { aws_route53_targets as route53Targets } from 'aws-cdk-lib';
import { aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';
import { aws_servicediscovery as servicediscovery } from 'aws-cdk-lib';
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
    const privateSubnets = config.privateSubnetIds.map((subnetId, index) =>
      ec2.Subnet.fromSubnetId(this, `PrivateSubnet${index + 1}`, subnetId)
    );
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.hostedZoneName
    });
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: config.apexDomain,
      subjectAlternativeNames: [config.apiDomain],
      validation: acm.CertificateValidation.fromDns(hostedZone)
    });
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: 'ev-dashboard-platform',
      vpc,
      defaultCloudMapNamespace: {
        name: config.serviceConnectNamespace,
        type: servicediscovery.NamespaceType.DNS_PRIVATE,
        useForServiceConnect: true
      }
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
    serviceSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(5174), 'Front traffic');
    serviceSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(8080), 'Gateway traffic');
    serviceSecurityGroup.addIngressRule(serviceSecurityGroup, ec2.Port.tcp(5174), 'Gateway to front web console');
    serviceSecurityGroup.addIngressRule(serviceSecurityGroup, ec2.Port.tcp(8000), 'Gateway to account access');

    const dataSecurityGroup = new ec2.SecurityGroup(this, 'DataSecurityGroup', {
      vpc,
      description: 'Private data stores for service-account-access',
      allowAllOutbound: true
    });
    dataSecurityGroup.addIngressRule(serviceSecurityGroup, ec2.Port.tcp(5432), 'service-account-access postgres');
    dataSecurityGroup.addIngressRule(serviceSecurityGroup, ec2.Port.tcp(6379), 'service-account-access redis');

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
      containerPort: 5174,
      portMappingName: 'front-web',
      serviceName: 'front-web-console',
      serviceConnectDnsName: 'web-console',
      serviceConnectNamespace: config.serviceConnectNamespace,
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
      portMappingName: 'gateway-http',
      serviceName: 'edge-api-gateway',
      serviceConnectDnsName: 'edge-api-gateway',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets
    });

    let accountAccessEnvironment: Record<string, string> | undefined;
    let accountAccessSecrets: Record<string, ecs.Secret> | undefined;
    let accountAccessDependencies: Construct[] = [];

    if (config.accountAccessDesiredCount > 0) {
      const accountAccessDatabase = new rds.DatabaseInstance(this, 'AccountAccessDatabase', {
        vpc,
        vpcSubnets: { subnets: privateSubnets },
        securityGroups: [dataSecurityGroup],
        engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16_4 }),
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
        credentials: rds.Credentials.fromGeneratedSecret('account_auth'),
        databaseName: 'account_auth',
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: rds.StorageType.GP3,
        publiclyAccessible: false,
        multiAz: false,
        deletionProtection: false,
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });

      const accountAccessDatabaseSecret = accountAccessDatabase.secret;
      if (!accountAccessDatabaseSecret) {
        throw new Error('Account access database secret was not created');
      }

      const accountAccessRedisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'AccountAccessRedisSubnetGroup', {
        description: 'Private subnets for service-account-access redis',
        subnetIds: config.privateSubnetIds
      });
      const accountAccessRedis = new elasticache.CfnCacheCluster(this, 'AccountAccessRedis', {
        cacheNodeType: 'cache.t4g.micro',
        engine: 'redis',
        numCacheNodes: 1,
        vpcSecurityGroupIds: [dataSecurityGroup.securityGroupId],
        cacheSubnetGroupName: accountAccessRedisSubnetGroup.ref
      });

      const djangoSecretKey = new secretsmanager.Secret(this, 'AccountAccessDjangoSecretKey', {
        generateSecretString: {
          passwordLength: 64,
          excludePunctuation: true
        }
      });
      const jwtSecretKey = new secretsmanager.Secret(this, 'AccountAccessJwtSecretKey', {
        generateSecretString: {
          passwordLength: 64,
          excludePunctuation: true
        }
      });

      accountAccessEnvironment = {
        POSTGRES_HOST: accountAccessDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: accountAccessDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'account_auth',
        REDIS_URL: cdk.Fn.join('', [
          'redis://',
          accountAccessRedis.attrRedisEndpointAddress,
          ':',
          accountAccessRedis.attrRedisEndpointPort,
          '/0'
        ]),
        DJANGO_ALLOWED_HOSTS: `${config.apiDomain},account-auth-api,localhost,127.0.0.1`,
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      accountAccessSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(accountAccessDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(accountAccessDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(jwtSecretKey)
      };
      accountAccessDependencies = [accountAccessDatabase, accountAccessRedis];
    }

    const accountAccessService = this.createFargateService('ServiceAccountAccess', {
      cluster,
      imageUri: config.accountAccessImageUri,
      cpu: config.accountAccessCpu,
      memoryMiB: config.accountAccessMemoryMiB,
      desiredCount: config.accountAccessDesiredCount,
      containerPort: 8000,
      portMappingName: 'account-auth',
      serviceName: 'service-account-access',
      serviceConnectDnsName: 'account-auth-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: accountAccessEnvironment,
      secrets: accountAccessSecrets
    });
    accountAccessDependencies.forEach((dependency) => accountAccessService.node.addDependency(dependency));

    const frontTargetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontTargetGroup', {
      port: 5174,
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
      priority: 20,
      conditions: [elbv2.ListenerCondition.hostHeaders([config.apexDomain])],
      targetGroups: [frontTargetGroup]
    });

    httpsListener.addTargetGroups('ApexApiRule', {
      priority: 10,
      conditions: [
        elbv2.ListenerCondition.hostHeaders([config.apexDomain]),
        elbv2.ListenerCondition.pathPatterns(['/api/*'])
      ],
      targetGroups: [gatewayTargetGroup]
    });

    httpsListener.addTargetGroups('ApiRule', {
      priority: 30,
      conditions: [elbv2.ListenerCondition.hostHeaders([config.apiDomain])],
      targetGroups: [gatewayTargetGroup]
    });

    new route53.ARecord(this, 'ApexAliasRecord', {
      zone: hostedZone,
      recordName: this.recordName(config.apexDomain, config.hostedZoneName),
      target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(loadBalancer))
    });

    new route53.ARecord(this, 'ApiAliasRecord', {
      zone: hostedZone,
      recordName: this.recordName(config.apiDomain, config.hostedZoneName),
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
      portMappingName: string;
      serviceName: string;
      serviceConnectDnsName: string;
      serviceConnectNamespace: string;
      securityGroup: ec2.SecurityGroup;
      subnets: ec2.ISubnet[];
      environment?: Record<string, string>;
      secrets?: Record<string, ecs.Secret>;
    }
  ): ecs.FargateService {
    const taskDefinition = new ecs.FargateTaskDefinition(this, `${id}TaskDefinition`, {
      cpu: input.cpu,
      memoryLimitMiB: input.memoryMiB
    });
    taskDefinition.addContainer(`${id}Container`, {
      image: this.buildEcrContainerImage(`${id}Image`, input.imageUri),
      environment: input.environment,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: input.serviceName }),
      secrets: input.secrets,
      portMappings: [
        {
          name: input.portMappingName,
          containerPort: input.containerPort,
          appProtocol: ecs.AppProtocol.http
        }
      ]
    });

    return new ecs.FargateService(this, `${id}Service`, {
      cluster: input.cluster,
      taskDefinition,
      desiredCount: input.desiredCount,
      assignPublicIp: true,
      securityGroups: [input.securityGroup],
      vpcSubnets: { subnets: input.subnets },
      serviceName: input.serviceName,
      serviceConnectConfiguration: {
        namespace: input.serviceConnectNamespace,
        services: [
          {
            portMappingName: input.portMappingName,
            dnsName: input.serviceConnectDnsName,
            port: input.containerPort
          }
        ]
      }
    });
  }

  private buildEcrContainerImage(id: string, imageUri: string): ecs.ContainerImage {
    const { repositoryName, tag } = this.parseEcrImageUri(imageUri);
    const repository = ecr.Repository.fromRepositoryName(this, `${id}Repository`, repositoryName);
    return ecs.ContainerImage.fromEcrRepository(repository, tag);
  }

  private parseEcrImageUri(imageUri: string): { repositoryName: string; tag: string } {
    const match = imageUri.match(/^\d+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/(.+):([^:]+)$/);
    if (!match) {
      throw new Error(`Unsupported ECR image URI format: ${imageUri}`);
    }

    const [, repositoryName, tag] = match;
    return { repositoryName, tag };
  }

  private recordName(fqdn: string, hostedZoneName: string): string | undefined {
    if (fqdn === hostedZoneName) {
      return undefined;
    }

    const suffix = `.${hostedZoneName}`;
    return fqdn.endsWith(suffix) ? fqdn.slice(0, -suffix.length) : fqdn;
  }
}
