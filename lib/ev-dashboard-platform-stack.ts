import * as cdk from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_elasticache as elasticache } from 'aws-cdk-lib';
import { aws_ecr as ecr } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2_targets as elbv2Targets } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';
import { aws_route53_targets as route53Targets } from 'aws-cdk-lib';
import { aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';
import { aws_servicediscovery as servicediscovery } from 'aws-cdk-lib';
import { aws_ssm as ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import type { PlatformConfig } from './config';
import { Ec2AppHost } from './ec2-app-host';
import { Ec2DataHost } from './ec2-data-host';

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
      description: 'Private data stores for ev-dashboard backend services',
      allowAllOutbound: true
    });
    dataSecurityGroup.addIngressRule(serviceSecurityGroup, ec2.Port.tcp(5432), 'backend postgres');
    dataSecurityGroup.addIngressRule(serviceSecurityGroup, ec2.Port.tcp(6379), 'backend redis');

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

    if (config.runtimeMode === 'ec2') {
      this.buildEc2Runtime({
        config,
        vpc,
        hostedZone,
        loadBalancer,
        httpsListener,
        serviceSecurityGroup,
        dataSecurityGroup
      });
      return;
    }

    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: 'ev-dashboard-platform',
      vpc,
      defaultCloudMapNamespace: {
        name: config.serviceConnectNamespace,
        type: servicediscovery.NamespaceType.DNS_PRIVATE,
        useForServiceConnect: true
      }
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
    gatewayService.node.addDependency(frontService);

    let accountAccessEnvironment: Record<string, string> | undefined;
    let accountAccessSecrets: Record<string, ecs.Secret> | undefined;
    let accountAccessDependencies: Construct[] = [];
    let organizationEnvironment: Record<string, string> | undefined;
    let organizationSecrets: Record<string, ecs.Secret> | undefined;
    let organizationDependencies: Construct[] = [];
    let driverProfileEnvironment: Record<string, string> | undefined;
    let driverProfileSecrets: Record<string, ecs.Secret> | undefined;
    let driverProfileDependencies: Construct[] = [];
    let personnelDocumentEnvironment: Record<string, string> | undefined;
    let personnelDocumentSecrets: Record<string, ecs.Secret> | undefined;
    let personnelDocumentDependencies: Construct[] = [];
    let vehicleAssetEnvironment: Record<string, string> | undefined;
    let vehicleAssetSecrets: Record<string, ecs.Secret> | undefined;
    let vehicleAssetDependencies: Construct[] = [];
    let driverVehicleAssignmentEnvironment: Record<string, string> | undefined;
    let driverVehicleAssignmentSecrets: Record<string, ecs.Secret> | undefined;
    let driverVehicleAssignmentDependencies: Construct[] = [];
    let dispatchRegistryEnvironment: Record<string, string> | undefined;
    let dispatchRegistrySecrets: Record<string, ecs.Secret> | undefined;
    let dispatchRegistryDependencies: Construct[] = [];
    let deliveryRecordEnvironment: Record<string, string> | undefined;
    let deliveryRecordSecrets: Record<string, ecs.Secret> | undefined;
    let deliveryRecordDependencies: Construct[] = [];
    let attendanceRegistryEnvironment: Record<string, string> | undefined;
    let attendanceRegistrySecrets: Record<string, ecs.Secret> | undefined;
    let attendanceRegistryDependencies: Construct[] = [];
    let dispatchOpsEnvironment: Record<string, string> | undefined;
    let dispatchOpsSecrets: Record<string, ecs.Secret> | undefined;
    let dispatchOpsDependencies: Construct[] = [];
    let driverOpsEnvironment: Record<string, string> | undefined;
    let driverOpsSecrets: Record<string, ecs.Secret> | undefined;
    let driverOpsDependencies: Construct[] = [];
    let vehicleOpsEnvironment: Record<string, string> | undefined;
    let vehicleOpsSecrets: Record<string, ecs.Secret> | undefined;
    let vehicleOpsDependencies: Construct[] = [];
    let settlementRegistryEnvironment: Record<string, string> | undefined;
    let settlementRegistrySecrets: Record<string, ecs.Secret> | undefined;
    let settlementRegistryDependencies: Construct[] = [];
    let settlementPayrollEnvironment: Record<string, string> | undefined;
    let settlementPayrollSecrets: Record<string, ecs.Secret> | undefined;
    let settlementPayrollDependencies: Construct[] = [];
    let settlementOpsEnvironment: Record<string, string> | undefined;
    let settlementOpsSecrets: Record<string, ecs.Secret> | undefined;
    let settlementOpsDependencies: Construct[] = [];
    let regionRegistryEnvironment: Record<string, string> | undefined;
    let regionRegistrySecrets: Record<string, ecs.Secret> | undefined;
    let regionRegistryDependencies: Construct[] = [];
    let regionAnalyticsEnvironment: Record<string, string> | undefined;
    let regionAnalyticsSecrets: Record<string, ecs.Secret> | undefined;
    let regionAnalyticsDependencies: Construct[] = [];
    let announcementRegistryEnvironment: Record<string, string> | undefined;
    let announcementRegistrySecrets: Record<string, ecs.Secret> | undefined;
    let announcementRegistryDependencies: Construct[] = [];
    let supportRegistryEnvironment: Record<string, string> | undefined;
    let supportRegistrySecrets: Record<string, ecs.Secret> | undefined;
    let supportRegistryDependencies: Construct[] = [];
    let notificationHubEnvironment: Record<string, string> | undefined;
    let notificationHubSecrets: Record<string, ecs.Secret> | undefined;
    let notificationHubDependencies: Construct[] = [];
    let terminalRegistryEnvironment: Record<string, string> | undefined;
    let terminalRegistrySecrets: Record<string, ecs.Secret> | undefined;
    let terminalRegistryDependencies: Construct[] = [];
    let telemetryHubEnvironment: Record<string, string> | undefined;
    let telemetryHubSecrets: Record<string, ecs.Secret> | undefined;
    let telemetryHubDependencies: Construct[] = [];
    let telemetryDeadLetterEnvironment: Record<string, string> | undefined;
    let telemetryDeadLetterSecrets: Record<string, ecs.Secret> | undefined;
    let telemetryDeadLetterDependencies: Construct[] = [];
    let telemetryListenerEnvironment: Record<string, string> | undefined;
    let telemetryListenerSecrets: Record<string, ecs.Secret> | undefined;
    let telemetryListenerDependencies: Construct[] = [];
    const platformJwtSecretKey =
      config.accountAccessDesiredCount > 0 ||
      config.organizationDesiredCount > 0 ||
      config.driverProfileDesiredCount > 0 ||
      config.personnelDocumentDesiredCount > 0 ||
      config.vehicleAssetDesiredCount > 0 ||
      config.driverVehicleAssignmentDesiredCount > 0 ||
      config.dispatchRegistryDesiredCount > 0 ||
      config.deliveryRecordDesiredCount > 0 ||
      config.attendanceRegistryDesiredCount > 0 ||
      config.dispatchOpsDesiredCount > 0 ||
      config.driverOpsDesiredCount > 0 ||
      config.vehicleOpsDesiredCount > 0 ||
      config.settlementRegistryDesiredCount > 0 ||
      config.settlementPayrollDesiredCount > 0 ||
      config.settlementOpsDesiredCount > 0 ||
      config.regionRegistryDesiredCount > 0 ||
      config.regionAnalyticsDesiredCount > 0 ||
      config.announcementRegistryDesiredCount > 0 ||
      config.supportRegistryDesiredCount > 0 ||
      config.notificationHubDesiredCount > 0 ||
      (config.terminalRegistryDesiredCount ?? 0) > 0 ||
      (config.telemetryHubDesiredCount ?? 0) > 0 ||
      (config.telemetryDeadLetterDesiredCount ?? 0) > 0
        ? new secretsmanager.Secret(this, 'PlatformJwtSecretKey', {
            generateSecretString: {
              passwordLength: 64,
              excludePunctuation: true
            }
          })
        : undefined;

    if (config.accountAccessDesiredCount > 0) {
      const accountAccessDatabase = this.createPostgresDatabaseInstance('AccountAccessDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'account_auth',
        databaseName: 'account_auth'
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

      const djangoSecretKey = this.createGeneratedSecret('AccountAccessDjangoSecretKey');
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
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      accountAccessDependencies = [accountAccessDatabase, accountAccessRedis];
    }

    if (config.organizationDesiredCount > 0) {
      const organizationDatabase = this.createPostgresDatabaseInstance('OrganizationDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'organization_master',
        databaseName: 'organization_master'
      });

      const organizationDatabaseSecret = organizationDatabase.secret;
      if (!organizationDatabaseSecret) {
        throw new Error('Organization database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('OrganizationDjangoSecretKey');

      organizationEnvironment = {
        POSTGRES_HOST: organizationDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: organizationDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'organization_master',
        DJANGO_ALLOWED_HOSTS: 'organization-master-api,localhost,127.0.0.1'
      };
      organizationSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(organizationDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(organizationDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      organizationDependencies = [organizationDatabase];
    }

    if (config.driverProfileDesiredCount > 0) {
      const driverProfileDatabase = this.createPostgresDatabaseInstance('DriverProfileDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'driver_profile',
        databaseName: 'driver_profile'
      });
      const driverProfileDatabaseSecret = driverProfileDatabase.secret;
      if (!driverProfileDatabaseSecret) {
        throw new Error('Driver profile database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('DriverProfileDjangoSecretKey');
      driverProfileEnvironment = {
        POSTGRES_HOST: driverProfileDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: driverProfileDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'driver_profile',
        DJANGO_ALLOWED_HOSTS: 'driver-profile-api,localhost,127.0.0.1'
      };
      driverProfileSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(driverProfileDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(driverProfileDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      driverProfileDependencies = [driverProfileDatabase];
    }

    if (config.personnelDocumentDesiredCount > 0) {
      const personnelDocumentDatabase = this.createPostgresDatabaseInstance('PersonnelDocumentDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'personnel_document',
        databaseName: 'personnel_document'
      });
      const personnelDocumentDatabaseSecret = personnelDocumentDatabase.secret;
      if (!personnelDocumentDatabaseSecret) {
        throw new Error('Personnel document database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('PersonnelDocumentDjangoSecretKey');
      personnelDocumentEnvironment = {
        POSTGRES_HOST: personnelDocumentDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: personnelDocumentDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'personnel_document',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000',
        DJANGO_ALLOWED_HOSTS: 'personnel-document-registry-api,localhost,127.0.0.1'
      };
      personnelDocumentSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(personnelDocumentDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(personnelDocumentDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      personnelDocumentDependencies = [personnelDocumentDatabase];
    }

    if (config.vehicleAssetDesiredCount > 0) {
      const vehicleAssetDatabase = this.createPostgresDatabaseInstance('VehicleAssetDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'vehicle_asset',
        databaseName: 'vehicle_asset'
      });
      const vehicleAssetDatabaseSecret = vehicleAssetDatabase.secret;
      if (!vehicleAssetDatabaseSecret) {
        throw new Error('Vehicle asset database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('VehicleAssetDjangoSecretKey');
      vehicleAssetEnvironment = {
        POSTGRES_HOST: vehicleAssetDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: vehicleAssetDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'vehicle_asset',
        DJANGO_ALLOWED_HOSTS: 'vehicle-asset-api,localhost,127.0.0.1'
      };
      vehicleAssetSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(vehicleAssetDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(vehicleAssetDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      vehicleAssetDependencies = [vehicleAssetDatabase];
    }

    if (config.driverVehicleAssignmentDesiredCount > 0) {
      const driverVehicleAssignmentDatabase = this.createPostgresDatabaseInstance('DriverVehicleAssignmentDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'driver_vehicle_assignment',
        databaseName: 'driver_vehicle_assignment'
      });
      const driverVehicleAssignmentDatabaseSecret = driverVehicleAssignmentDatabase.secret;
      if (!driverVehicleAssignmentDatabaseSecret) {
        throw new Error('Driver vehicle assignment database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('DriverVehicleAssignmentDjangoSecretKey');
      driverVehicleAssignmentEnvironment = {
        POSTGRES_HOST: driverVehicleAssignmentDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: driverVehicleAssignmentDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'driver_vehicle_assignment',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000',
        VEHICLE_ASSET_BASE_URL: 'http://vehicle-asset-api:8000',
        DJANGO_ALLOWED_HOSTS: 'driver-vehicle-assignment-api,localhost,127.0.0.1'
      };
      driverVehicleAssignmentSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(driverVehicleAssignmentDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(driverVehicleAssignmentDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      driverVehicleAssignmentDependencies = [driverVehicleAssignmentDatabase];
    }

    if (config.attendanceRegistryDesiredCount > 0) {
      const attendanceRegistryDatabase = this.createPostgresDatabaseInstance('AttendanceRegistryDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'attendance_registry',
        databaseName: 'attendance_registry'
      });
      const attendanceRegistryDatabaseSecret = attendanceRegistryDatabase.secret;
      if (!attendanceRegistryDatabaseSecret) {
        throw new Error('Attendance registry database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('AttendanceRegistryDjangoSecretKey');
      attendanceRegistryEnvironment = {
        POSTGRES_HOST: attendanceRegistryDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: attendanceRegistryDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'attendance_registry',
        DJANGO_ALLOWED_HOSTS: 'attendance-registry-api,localhost,127.0.0.1'
      };
      attendanceRegistrySecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(attendanceRegistryDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(attendanceRegistryDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      attendanceRegistryDependencies = [attendanceRegistryDatabase];
    }

    if (config.dispatchRegistryDesiredCount > 0) {
      const dispatchRegistryDatabase = this.createPostgresDatabaseInstance('DispatchRegistryDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'dispatch_registry',
        databaseName: 'dispatch_registry'
      });
      const dispatchRegistryDatabaseSecret = dispatchRegistryDatabase.secret;
      if (!dispatchRegistryDatabaseSecret) {
        throw new Error('Dispatch registry database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('DispatchRegistryDjangoSecretKey');
      dispatchRegistryEnvironment = {
        POSTGRES_HOST: dispatchRegistryDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: dispatchRegistryDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'dispatch_registry',
        VEHICLE_REGISTRY_BASE_URL: 'http://vehicle-asset-api:8000',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000',
        DELIVERY_RECORD_BASE_URL: 'http://delivery-record-api:8000',
        ATTENDANCE_REGISTRY_BASE_URL: 'http://attendance-registry-api:8000',
        DJANGO_ALLOWED_HOSTS: 'dispatch-registry-api,localhost,127.0.0.1'
      };
      dispatchRegistrySecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(dispatchRegistryDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(dispatchRegistryDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      dispatchRegistryDependencies = [dispatchRegistryDatabase];
    }

    if (config.deliveryRecordDesiredCount > 0) {
      const deliveryRecordDatabase = this.createPostgresDatabaseInstance('DeliveryRecordDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'delivery_record',
        databaseName: 'delivery_record'
      });
      const deliveryRecordDatabaseSecret = deliveryRecordDatabase.secret;
      if (!deliveryRecordDatabaseSecret) {
        throw new Error('Delivery record database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('DeliveryRecordDjangoSecretKey');
      deliveryRecordEnvironment = {
        POSTGRES_HOST: deliveryRecordDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: deliveryRecordDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'delivery_record',
        ORGANIZATION_MASTER_BASE_URL: 'http://organization-master-api:8000',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000',
        DISPATCH_REGISTRY_BASE_URL: 'http://dispatch-registry-api:8000',
        ATTENDANCE_REGISTRY_BASE_URL: 'http://attendance-registry-api:8000',
        DJANGO_ALLOWED_HOSTS: 'delivery-record-api,localhost,127.0.0.1'
      };
      deliveryRecordSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(deliveryRecordDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(deliveryRecordDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      deliveryRecordDependencies = [deliveryRecordDatabase];
    }

    if (config.dispatchOpsDesiredCount > 0) {
      const djangoSecretKey = this.createGeneratedSecret('DispatchOpsDjangoSecretKey');
      dispatchOpsEnvironment = {
        DISPATCH_REGISTRY_BASE_URL: 'http://dispatch-registry-api:8000',
        DRIVER_VEHICLE_ASSIGNMENT_BASE_URL: 'http://driver-vehicle-assignment-api:8000',
        VEHICLE_ASSET_BASE_URL: 'http://vehicle-asset-api:8000',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000',
        DJANGO_ALLOWED_HOSTS: 'dispatch-ops-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      dispatchOpsSecrets = {
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
    }

    if (config.driverOpsDesiredCount > 0) {
      const djangoSecretKey = this.createGeneratedSecret('DriverOpsDjangoSecretKey');
      driverOpsEnvironment = {
        ACCOUNT_AUTH_BASE_URL: 'http://account-auth-api:8000',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000',
        ORGANIZATION_MASTER_BASE_URL: 'http://organization-master-api:8000',
        SETTLEMENT_OPS_BASE_URL: config.settlementOpsBaseUrl,
        PERSONNEL_DOCUMENT_BASE_URL: 'http://personnel-document-registry-api:8000',
        DJANGO_ALLOWED_HOSTS: 'driver-ops-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      driverOpsSecrets = {
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
    }

    if (config.vehicleOpsDesiredCount > 0) {
      const djangoSecretKey = this.createGeneratedSecret('VehicleOpsDjangoSecretKey');
      vehicleOpsEnvironment = {
        VEHICLE_ASSET_BASE_URL: 'http://vehicle-asset-api:8000',
        DRIVER_VEHICLE_ASSIGNMENT_BASE_URL: 'http://driver-vehicle-assignment-api:8000',
        ORGANIZATION_MASTER_BASE_URL: 'http://organization-master-api:8000',
        TELEMETRY_HUB_BASE_URL: config.telemetryHubBaseUrl,
        TERMINAL_REGISTRY_BASE_URL: config.terminalRegistryBaseUrl,
        DJANGO_ALLOWED_HOSTS: 'vehicle-ops-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      vehicleOpsSecrets = {
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
    }

    if (config.settlementRegistryDesiredCount > 0) {
      const settlementRegistryDatabase = this.createPostgresDatabaseInstance('SettlementRegistryDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'settlement_registry',
        databaseName: 'settlement_registry'
      });
      const settlementRegistryDatabaseSecret = settlementRegistryDatabase.secret;
      if (!settlementRegistryDatabaseSecret) {
        throw new Error('Settlement registry database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('SettlementRegistryDjangoSecretKey');
      settlementRegistryEnvironment = {
        POSTGRES_HOST: settlementRegistryDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: settlementRegistryDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'settlement_registry',
        ORGANIZATION_MASTER_BASE_URL: 'http://organization-master-api:8000',
        DJANGO_ALLOWED_HOSTS: 'settlement-registry-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      settlementRegistrySecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(settlementRegistryDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(settlementRegistryDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      settlementRegistryDependencies = [settlementRegistryDatabase];
    }

    if (config.settlementPayrollDesiredCount > 0) {
      const settlementPayrollDatabase = this.createPostgresDatabaseInstance('SettlementPayrollDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'settlement_payroll',
        databaseName: 'settlement_payroll'
      });
      const settlementPayrollDatabaseSecret = settlementPayrollDatabase.secret;
      if (!settlementPayrollDatabaseSecret) {
        throw new Error('Settlement payroll database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('SettlementPayrollDjangoSecretKey');
      settlementPayrollEnvironment = {
        POSTGRES_HOST: settlementPayrollDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: settlementPayrollDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'settlement_payroll',
        SETTLEMENT_ORG_BASE_URL: 'http://organization-master-api:8000',
        SETTLEMENT_DRIVER_BASE_URL: 'http://driver-profile-api:8000',
        SETTLEMENT_REGISTRY_BASE_URL: 'http://settlement-registry-api:8000',
        DELIVERY_RECORD_BASE_URL: 'http://delivery-record-api:8000',
        DISPATCH_REGISTRY_BASE_URL: 'http://dispatch-registry-api:8000',
        ATTENDANCE_REGISTRY_BASE_URL: 'http://attendance-registry-api:8000',
        DJANGO_ALLOWED_HOSTS: 'settlement-payroll-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      settlementPayrollSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(settlementPayrollDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(settlementPayrollDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      settlementPayrollDependencies = [settlementPayrollDatabase];
    }

    if (config.settlementOpsDesiredCount > 0) {
      const djangoSecretKey = this.createGeneratedSecret('SettlementOpsDjangoSecretKey');
      settlementOpsEnvironment = {
        SETTLEMENT_PAYROLL_BASE_URL: 'http://settlement-payroll-api:8000',
        DELIVERY_RECORD_BASE_URL: 'http://delivery-record-api:8000',
        DRIVER_PROFILE_BASE_URL: 'http://driver-profile-api:8000',
        DJANGO_ALLOWED_HOSTS: 'settlement-ops-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      settlementOpsSecrets = {
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
    }

    if (config.regionRegistryDesiredCount > 0) {
      const regionRegistryDatabase = this.createPostgresDatabaseInstance('RegionRegistryDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'region_registry',
        databaseName: 'region_registry'
      });
      const regionRegistryDatabaseSecret = regionRegistryDatabase.secret;
      if (!regionRegistryDatabaseSecret) {
        throw new Error('Region registry database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('RegionRegistryDjangoSecretKey');
      regionRegistryEnvironment = {
        POSTGRES_HOST: regionRegistryDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: regionRegistryDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'region_registry',
        DJANGO_ALLOWED_HOSTS: 'region-registry-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      regionRegistrySecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(regionRegistryDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(regionRegistryDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      regionRegistryDependencies = [regionRegistryDatabase];
    }

    if (config.regionAnalyticsDesiredCount > 0) {
      const regionAnalyticsDatabase = this.createPostgresDatabaseInstance('RegionAnalyticsDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'region_analytics',
        databaseName: 'region_analytics'
      });
      const regionAnalyticsDatabaseSecret = regionAnalyticsDatabase.secret;
      if (!regionAnalyticsDatabaseSecret) {
        throw new Error('Region analytics database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('RegionAnalyticsDjangoSecretKey');
      regionAnalyticsEnvironment = {
        POSTGRES_HOST: regionAnalyticsDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: regionAnalyticsDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'region_analytics',
        DJANGO_ALLOWED_HOSTS: 'region-analytics-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      regionAnalyticsSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(regionAnalyticsDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(regionAnalyticsDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      regionAnalyticsDependencies = [regionAnalyticsDatabase];
    }

    if (config.announcementRegistryDesiredCount > 0) {
      const announcementRegistryDatabase = this.createPostgresDatabaseInstance('AnnouncementRegistryDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'announcement_registry',
        databaseName: 'announcement_registry'
      });
      const announcementRegistryDatabaseSecret = announcementRegistryDatabase.secret;
      if (!announcementRegistryDatabaseSecret) {
        throw new Error('Announcement registry database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('AnnouncementRegistryDjangoSecretKey');
      announcementRegistryEnvironment = {
        POSTGRES_HOST: announcementRegistryDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: announcementRegistryDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'announcement_registry',
        DJANGO_ALLOWED_HOSTS: 'announcement-registry-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      announcementRegistrySecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(announcementRegistryDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(announcementRegistryDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      announcementRegistryDependencies = [announcementRegistryDatabase];
    }

    if (config.notificationHubDesiredCount > 0) {
      const notificationHubDatabase = this.createPostgresDatabaseInstance('NotificationHubDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'notification_hub',
        databaseName: 'notification_hub'
      });
      const notificationHubDatabaseSecret = notificationHubDatabase.secret;
      if (!notificationHubDatabaseSecret) {
        throw new Error('Notification hub database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('NotificationHubDjangoSecretKey');
      notificationHubEnvironment = {
        POSTGRES_HOST: notificationHubDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: notificationHubDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'notification_hub',
        DJANGO_ALLOWED_HOSTS: 'notification-hub-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      notificationHubSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(notificationHubDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(notificationHubDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      notificationHubDependencies = [notificationHubDatabase];
    }

    if (config.supportRegistryDesiredCount > 0) {
      const supportRegistryDatabase = this.createPostgresDatabaseInstance('SupportRegistryDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'support_registry',
        databaseName: 'support_registry'
      });
      const supportRegistryDatabaseSecret = supportRegistryDatabase.secret;
      if (!supportRegistryDatabaseSecret) {
        throw new Error('Support registry database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('SupportRegistryDjangoSecretKey');
      supportRegistryEnvironment = {
        POSTGRES_HOST: supportRegistryDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: supportRegistryDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'support_registry',
        NOTIFICATION_HUB_BASE_URL: 'http://notification-hub-api:8000',
        DJANGO_ALLOWED_HOSTS: 'support-registry-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      supportRegistrySecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(supportRegistryDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(supportRegistryDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      supportRegistryDependencies = [supportRegistryDatabase];
    }

    let telemetryHubIngestKeySecret: secretsmanager.Secret | undefined;
    let telemetryDeadLetterHubKeySecret: secretsmanager.Secret | undefined;
    let telemetryDeadLetterListenerKeySecret: secretsmanager.Secret | undefined;

    if ((config.terminalRegistryDesiredCount ?? 0) > 0) {
      const terminalRegistryDatabase = this.createPostgresDatabaseInstance('TerminalRegistryDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'terminal_registry',
        databaseName: 'terminal_registry'
      });
      const terminalRegistryDatabaseSecret = terminalRegistryDatabase.secret;
      if (!terminalRegistryDatabaseSecret) {
        throw new Error('Terminal registry database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('TerminalRegistryDjangoSecretKey');
      terminalRegistryEnvironment = {
        POSTGRES_HOST: terminalRegistryDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: terminalRegistryDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'terminal_registry',
        VEHICLE_REGISTRY_BASE_URL: 'http://vehicle-asset-api:8000',
        DJANGO_ALLOWED_HOSTS: 'terminal-registry-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      terminalRegistrySecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(terminalRegistryDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(terminalRegistryDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!)
      };
      terminalRegistryDependencies = [terminalRegistryDatabase];
    }

    if ((config.telemetryHubDesiredCount ?? 0) > 0) {
      const telemetryHubDatabase = this.createPostgresDatabaseInstance('TelemetryHubDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'telemetry_hub',
        databaseName: 'telemetry_hub'
      });
      const telemetryHubDatabaseSecret = telemetryHubDatabase.secret;
      if (!telemetryHubDatabaseSecret) {
        throw new Error('Telemetry hub database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('TelemetryHubDjangoSecretKey');
      telemetryHubIngestKeySecret = this.createGeneratedSecret('TelemetryHubIngestKey');
      telemetryHubEnvironment = {
        POSTGRES_HOST: telemetryHubDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: telemetryHubDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'telemetry_hub',
        DJANGO_ALLOWED_HOSTS: 'telemetry-hub-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      telemetryHubSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(telemetryHubDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(telemetryHubDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!),
        TELEMETRY_HUB_INGEST_KEY: ecs.Secret.fromSecretsManager(telemetryHubIngestKeySecret)
      };
      telemetryHubDependencies = [telemetryHubDatabase];
    }

    if ((config.telemetryDeadLetterDesiredCount ?? 0) > 0) {
      const telemetryDeadLetterDatabase = this.createPostgresDatabaseInstance('TelemetryDeadLetterDatabase', {
        vpc,
        privateSubnets,
        dataSecurityGroup,
        username: 'telemetry_dead_letter',
        databaseName: 'telemetry_dead_letter'
      });
      const telemetryDeadLetterDatabaseSecret = telemetryDeadLetterDatabase.secret;
      if (!telemetryDeadLetterDatabaseSecret) {
        throw new Error('Telemetry dead-letter database secret was not created');
      }

      const djangoSecretKey = this.createGeneratedSecret('TelemetryDeadLetterDjangoSecretKey');
      telemetryDeadLetterListenerKeySecret = this.createGeneratedSecret(
        'TelemetryDeadLetterKeyServiceTelemetryListener'
      );
      telemetryDeadLetterHubKeySecret = this.createGeneratedSecret('TelemetryDeadLetterKeyServiceTelemetryHub');
      telemetryDeadLetterEnvironment = {
        POSTGRES_HOST: telemetryDeadLetterDatabase.dbInstanceEndpointAddress,
        POSTGRES_PORT: telemetryDeadLetterDatabase.dbInstanceEndpointPort,
        POSTGRES_DB: 'telemetry_dead_letter',
        DJANGO_ALLOWED_HOSTS: 'telemetry-dead-letter-api,localhost,127.0.0.1',
        CSRF_TRUSTED_ORIGINS: `https://${config.apexDomain},https://${config.apiDomain}`
      };
      telemetryDeadLetterSecrets = {
        POSTGRES_USER: ecs.Secret.fromSecretsManager(telemetryDeadLetterDatabaseSecret, 'username'),
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(telemetryDeadLetterDatabaseSecret, 'password'),
        DJANGO_SECRET_KEY: ecs.Secret.fromSecretsManager(djangoSecretKey),
        JWT_SECRET_KEY: ecs.Secret.fromSecretsManager(platformJwtSecretKey!),
        TELEMETRY_DEAD_LETTER_KEY_SERVICE_TELEMETRY_LISTENER: ecs.Secret.fromSecretsManager(
          telemetryDeadLetterListenerKeySecret
        ),
        TELEMETRY_DEAD_LETTER_KEY_SERVICE_TELEMETRY_HUB: ecs.Secret.fromSecretsManager(
          telemetryDeadLetterHubKeySecret
        )
      };
      telemetryDeadLetterDependencies = [telemetryDeadLetterDatabase];
    }

    if ((config.telemetryListenerDesiredCount ?? 0) > 0) {
      if (!telemetryHubIngestKeySecret || !telemetryDeadLetterListenerKeySecret) {
        throw new Error('Telemetry listener requires telemetry hub and dead-letter secrets to exist');
      }

      telemetryListenerEnvironment = {
        TELEMETRY_HUB_BASE_URL: 'http://telemetry-hub-api:8000',
        TELEMETRY_DEAD_LETTER_BASE_URL: 'http://telemetry-dead-letter-api:8000',
        TELEMETRY_DEAD_LETTER_SOURCE_SERVICE: 'service-telemetry-listener',
        TELEMETRY_LISTENER_MQTT_HOST: config.telemetryListenerMqttHost!,
        TELEMETRY_LISTENER_MQTT_PORT: String(config.telemetryListenerMqttPort ?? 1883),
        TELEMETRY_LISTENER_MQTT_TOPICS: (config.telemetryListenerMqttTopics ?? ['telemetry/#']).join(','),
        TELEMETRY_LISTENER_CLIENT_ID: config.telemetryListenerClientId ?? 'service-telemetry-listener',
        TELEMETRY_LISTENER_RETRY_COUNT: String(config.telemetryListenerRetryCount ?? 3),
        TELEMETRY_LISTENER_RETRY_BACKOFF_SECONDS: String(config.telemetryListenerRetryBackoffSeconds ?? 1),
        TELEMETRY_LISTENER_IDLE_SLEEP_SECONDS: String(config.telemetryListenerIdleSleepSeconds ?? 5)
      };
      telemetryListenerSecrets = {
        TELEMETRY_HUB_INGEST_KEY: ecs.Secret.fromSecretsManager(telemetryHubIngestKeySecret),
        TELEMETRY_DEAD_LETTER_KEY_SERVICE_TELEMETRY_LISTENER: ecs.Secret.fromSecretsManager(
          telemetryDeadLetterListenerKeySecret
        )
      };
      telemetryListenerDependencies = [];
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
    if (config.accountAccessDesiredCount > 0) {
      gatewayService.node.addDependency(accountAccessService);
    }

    const organizationService = this.createFargateService('ServiceOrganizationRegistry', {
      cluster,
      imageUri: config.organizationImageUri,
      cpu: config.organizationCpu,
      memoryMiB: config.organizationMemoryMiB,
      desiredCount: config.organizationDesiredCount,
      containerPort: 8000,
      portMappingName: 'organization-http',
      serviceName: 'service-organization-registry',
      serviceConnectDnsName: 'organization-master-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: organizationEnvironment,
      secrets: organizationSecrets
    });
    organizationDependencies.forEach((dependency) => organizationService.node.addDependency(dependency));
    if (config.organizationDesiredCount > 0) {
      gatewayService.node.addDependency(organizationService);
    }

    const driverProfileService = this.createFargateService('ServiceDriverProfile', {
      cluster,
      imageUri: config.driverProfileImageUri,
      cpu: config.driverProfileCpu,
      memoryMiB: config.driverProfileMemoryMiB,
      desiredCount: config.driverProfileDesiredCount,
      containerPort: 8000,
      portMappingName: 'driver-profile-http',
      serviceName: 'service-driver-profile',
      serviceConnectDnsName: 'driver-profile-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: driverProfileEnvironment,
      secrets: driverProfileSecrets
    });
    driverProfileDependencies.forEach((dependency) => driverProfileService.node.addDependency(dependency));
    if (config.driverProfileDesiredCount > 0) {
      gatewayService.node.addDependency(driverProfileService);
    }

    const vehicleAssetService = this.createFargateService('ServiceVehicleRegistry', {
      cluster,
      imageUri: config.vehicleAssetImageUri,
      cpu: config.vehicleAssetCpu,
      memoryMiB: config.vehicleAssetMemoryMiB,
      desiredCount: config.vehicleAssetDesiredCount,
      containerPort: 8000,
      portMappingName: 'vehicle-asset-http',
      serviceName: 'service-vehicle-registry',
      serviceConnectDnsName: 'vehicle-asset-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: vehicleAssetEnvironment,
      secrets: vehicleAssetSecrets
    });
    vehicleAssetDependencies.forEach((dependency) => vehicleAssetService.node.addDependency(dependency));
    if (config.vehicleAssetDesiredCount > 0) {
      gatewayService.node.addDependency(vehicleAssetService);
    }

    const personnelDocumentService = this.createFargateService('ServicePersonnelDocumentRegistry', {
      cluster,
      imageUri: config.personnelDocumentImageUri,
      cpu: config.personnelDocumentCpu,
      memoryMiB: config.personnelDocumentMemoryMiB,
      desiredCount: config.personnelDocumentDesiredCount,
      containerPort: 8000,
      portMappingName: 'personnel-document-http',
      serviceName: 'service-personnel-document-registry',
      serviceConnectDnsName: 'personnel-document-registry-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: personnelDocumentEnvironment,
      secrets: personnelDocumentSecrets
    });
    personnelDocumentDependencies.forEach((dependency) => personnelDocumentService.node.addDependency(dependency));
    if (config.driverProfileDesiredCount > 0) {
      personnelDocumentService.node.addDependency(driverProfileService);
    }
    if (config.personnelDocumentDesiredCount > 0) {
      gatewayService.node.addDependency(personnelDocumentService);
    }

    const driverVehicleAssignmentService = this.createFargateService('ServiceVehicleAssignment', {
      cluster,
      imageUri: config.driverVehicleAssignmentImageUri,
      cpu: config.driverVehicleAssignmentCpu,
      memoryMiB: config.driverVehicleAssignmentMemoryMiB,
      desiredCount: config.driverVehicleAssignmentDesiredCount,
      containerPort: 8000,
      portMappingName: 'driver-vehicle-assignment-http',
      serviceName: 'service-vehicle-assignment',
      serviceConnectDnsName: 'driver-vehicle-assignment-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: driverVehicleAssignmentEnvironment,
      secrets: driverVehicleAssignmentSecrets
    });
    driverVehicleAssignmentDependencies.forEach((dependency) => driverVehicleAssignmentService.node.addDependency(dependency));
    if (config.driverProfileDesiredCount > 0) {
      driverVehicleAssignmentService.node.addDependency(driverProfileService);
    }
    if (config.vehicleAssetDesiredCount > 0) {
      driverVehicleAssignmentService.node.addDependency(vehicleAssetService);
    }
    if (config.driverVehicleAssignmentDesiredCount > 0) {
      gatewayService.node.addDependency(driverVehicleAssignmentService);
    }

    const attendanceRegistryService = this.createFargateService('ServiceAttendanceRegistry', {
      cluster,
      imageUri: config.attendanceRegistryImageUri,
      cpu: config.attendanceRegistryCpu,
      memoryMiB: config.attendanceRegistryMemoryMiB,
      desiredCount: config.attendanceRegistryDesiredCount,
      containerPort: 8000,
      portMappingName: 'attendance-registry-http',
      serviceName: 'service-attendance-registry',
      serviceConnectDnsName: 'attendance-registry-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: attendanceRegistryEnvironment,
      secrets: attendanceRegistrySecrets
    });
    attendanceRegistryDependencies.forEach((dependency) => attendanceRegistryService.node.addDependency(dependency));
    if (config.attendanceRegistryDesiredCount > 0) {
      gatewayService.node.addDependency(attendanceRegistryService);
    }

    const dispatchRegistryService = this.createFargateService('ServiceDispatchRegistry', {
      cluster,
      imageUri: config.dispatchRegistryImageUri,
      cpu: config.dispatchRegistryCpu,
      memoryMiB: config.dispatchRegistryMemoryMiB,
      desiredCount: config.dispatchRegistryDesiredCount,
      containerPort: 8000,
      portMappingName: 'dispatch-registry-http',
      serviceName: 'service-dispatch-registry',
      serviceConnectDnsName: 'dispatch-registry-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: dispatchRegistryEnvironment,
      secrets: dispatchRegistrySecrets
    });
    dispatchRegistryDependencies.forEach((dependency) => dispatchRegistryService.node.addDependency(dependency));
    if (config.attendanceRegistryDesiredCount > 0) {
      dispatchRegistryService.node.addDependency(attendanceRegistryService);
    }
    if (config.dispatchRegistryDesiredCount > 0) {
      gatewayService.node.addDependency(dispatchRegistryService);
    }

    const deliveryRecordService = this.createFargateService('ServiceDeliveryRecord', {
      cluster,
      imageUri: config.deliveryRecordImageUri,
      cpu: config.deliveryRecordCpu,
      memoryMiB: config.deliveryRecordMemoryMiB,
      desiredCount: config.deliveryRecordDesiredCount,
      containerPort: 8000,
      portMappingName: 'delivery-record-http',
      serviceName: 'service-delivery-record',
      serviceConnectDnsName: 'delivery-record-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: deliveryRecordEnvironment,
      secrets: deliveryRecordSecrets
    });
    deliveryRecordDependencies.forEach((dependency) => deliveryRecordService.node.addDependency(dependency));
    if (config.attendanceRegistryDesiredCount > 0) {
      deliveryRecordService.node.addDependency(attendanceRegistryService);
    }
    if (config.deliveryRecordDesiredCount > 0) {
      gatewayService.node.addDependency(deliveryRecordService);
    }

    const dispatchOpsService = this.createFargateService('ServiceDispatchOperationsView', {
      cluster,
      imageUri: config.dispatchOpsImageUri,
      cpu: config.dispatchOpsCpu,
      memoryMiB: config.dispatchOpsMemoryMiB,
      desiredCount: config.dispatchOpsDesiredCount,
      containerPort: 8000,
      portMappingName: 'dispatch-ops-http',
      serviceName: 'service-dispatch-operations-view',
      serviceConnectDnsName: 'dispatch-ops-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: dispatchOpsEnvironment,
      secrets: dispatchOpsSecrets
    });
    dispatchOpsDependencies.forEach((dependency) => dispatchOpsService.node.addDependency(dependency));
    if (config.dispatchRegistryDesiredCount > 0) {
      dispatchOpsService.node.addDependency(dispatchRegistryService);
    }
    if (config.driverVehicleAssignmentDesiredCount > 0) {
      dispatchOpsService.node.addDependency(driverVehicleAssignmentService);
    }
    if (config.vehicleAssetDesiredCount > 0) {
      dispatchOpsService.node.addDependency(vehicleAssetService);
    }
    if (config.driverProfileDesiredCount > 0) {
      dispatchOpsService.node.addDependency(driverProfileService);
    }
    if (config.dispatchOpsDesiredCount > 0) {
      gatewayService.node.addDependency(dispatchOpsService);
    }

    const driverOpsService = this.createFargateService('ServiceDriverOperationsView', {
      cluster,
      imageUri: config.driverOpsImageUri,
      cpu: config.driverOpsCpu,
      memoryMiB: config.driverOpsMemoryMiB,
      desiredCount: config.driverOpsDesiredCount,
      containerPort: 8000,
      portMappingName: 'driver-ops-http',
      serviceName: 'service-driver-operations-view',
      serviceConnectDnsName: 'driver-ops-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: driverOpsEnvironment,
      secrets: driverOpsSecrets
    });
    driverOpsDependencies.forEach((dependency) => driverOpsService.node.addDependency(dependency));
    if (config.accountAccessDesiredCount > 0) {
      driverOpsService.node.addDependency(accountAccessService);
    }
    if (config.driverProfileDesiredCount > 0) {
      driverOpsService.node.addDependency(driverProfileService);
    }
    if (config.organizationDesiredCount > 0) {
      driverOpsService.node.addDependency(organizationService);
    }
    if (config.personnelDocumentDesiredCount > 0) {
      driverOpsService.node.addDependency(personnelDocumentService);
    }
    if (config.driverOpsDesiredCount > 0) {
      gatewayService.node.addDependency(driverOpsService);
    }

    const vehicleOpsService = this.createFargateService('ServiceVehicleOperationsView', {
      cluster,
      imageUri: config.vehicleOpsImageUri,
      cpu: config.vehicleOpsCpu,
      memoryMiB: config.vehicleOpsMemoryMiB,
      desiredCount: config.vehicleOpsDesiredCount,
      containerPort: 8000,
      portMappingName: 'vehicle-ops-http',
      serviceName: 'service-vehicle-operations-view',
      serviceConnectDnsName: 'vehicle-ops-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: vehicleOpsEnvironment,
      secrets: vehicleOpsSecrets
    });
    vehicleOpsDependencies.forEach((dependency) => vehicleOpsService.node.addDependency(dependency));
    if (config.vehicleAssetDesiredCount > 0) {
      vehicleOpsService.node.addDependency(vehicleAssetService);
    }
    if (config.driverVehicleAssignmentDesiredCount > 0) {
      vehicleOpsService.node.addDependency(driverVehicleAssignmentService);
    }
    if (config.organizationDesiredCount > 0) {
      vehicleOpsService.node.addDependency(organizationService);
    }
    if (config.vehicleOpsDesiredCount > 0) {
      gatewayService.node.addDependency(vehicleOpsService);
    }

    const settlementRegistryService = this.createFargateService('ServiceSettlementRegistry', {
      cluster,
      imageUri: config.settlementRegistryImageUri,
      cpu: config.settlementRegistryCpu,
      memoryMiB: config.settlementRegistryMemoryMiB,
      desiredCount: config.settlementRegistryDesiredCount,
      containerPort: 8000,
      portMappingName: 'settlement-registry-http',
      serviceName: 'service-settlement-registry',
      serviceConnectDnsName: 'settlement-registry-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: settlementRegistryEnvironment,
      secrets: settlementRegistrySecrets
    });
    settlementRegistryDependencies.forEach((dependency) => settlementRegistryService.node.addDependency(dependency));
    if (config.organizationDesiredCount > 0) {
      settlementRegistryService.node.addDependency(organizationService);
    }
    if (config.settlementRegistryDesiredCount > 0) {
      gatewayService.node.addDependency(settlementRegistryService);
    }

    const settlementPayrollService = this.createFargateService('ServiceSettlementPayroll', {
      cluster,
      imageUri: config.settlementPayrollImageUri,
      cpu: config.settlementPayrollCpu,
      memoryMiB: config.settlementPayrollMemoryMiB,
      desiredCount: config.settlementPayrollDesiredCount,
      containerPort: 8000,
      portMappingName: 'settlement-payroll-http',
      serviceName: 'service-settlement-payroll',
      serviceConnectDnsName: 'settlement-payroll-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: settlementPayrollEnvironment,
      secrets: settlementPayrollSecrets
    });
    settlementPayrollDependencies.forEach((dependency) => settlementPayrollService.node.addDependency(dependency));
    if (config.organizationDesiredCount > 0) {
      settlementPayrollService.node.addDependency(organizationService);
    }
    if (config.driverProfileDesiredCount > 0) {
      settlementPayrollService.node.addDependency(driverProfileService);
    }
    if (config.settlementRegistryDesiredCount > 0) {
      settlementPayrollService.node.addDependency(settlementRegistryService);
    }
    if (config.dispatchRegistryDesiredCount > 0) {
      settlementPayrollService.node.addDependency(dispatchRegistryService);
    }
    if (config.deliveryRecordDesiredCount > 0) {
      settlementPayrollService.node.addDependency(deliveryRecordService);
    }
    if (config.attendanceRegistryDesiredCount > 0) {
      settlementPayrollService.node.addDependency(attendanceRegistryService);
    }
    if (config.settlementPayrollDesiredCount > 0) {
      gatewayService.node.addDependency(settlementPayrollService);
    }

    const settlementOpsService = this.createFargateService('ServiceSettlementOperationsView', {
      cluster,
      imageUri: config.settlementOpsImageUri,
      cpu: config.settlementOpsCpu,
      memoryMiB: config.settlementOpsMemoryMiB,
      desiredCount: config.settlementOpsDesiredCount,
      containerPort: 8000,
      portMappingName: 'settlement-ops-http',
      serviceName: 'service-settlement-operations-view',
      serviceConnectDnsName: 'settlement-ops-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: settlementOpsEnvironment,
      secrets: settlementOpsSecrets
    });
    settlementOpsDependencies.forEach((dependency) => settlementOpsService.node.addDependency(dependency));
    if (config.settlementPayrollDesiredCount > 0) {
      settlementOpsService.node.addDependency(settlementPayrollService);
    }
    if (config.deliveryRecordDesiredCount > 0) {
      settlementOpsService.node.addDependency(deliveryRecordService);
    }
    if (config.driverProfileDesiredCount > 0) {
      settlementOpsService.node.addDependency(driverProfileService);
    }
    if (config.settlementOpsDesiredCount > 0) {
      gatewayService.node.addDependency(settlementOpsService);
    }

    const regionRegistryService = this.createFargateService('ServiceRegionRegistry', {
      cluster,
      imageUri: config.regionRegistryImageUri,
      cpu: config.regionRegistryCpu,
      memoryMiB: config.regionRegistryMemoryMiB,
      desiredCount: config.regionRegistryDesiredCount,
      containerPort: 8000,
      portMappingName: 'region-registry-http',
      serviceName: 'service-region-registry',
      serviceConnectDnsName: 'region-registry-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: regionRegistryEnvironment,
      secrets: regionRegistrySecrets
    });
    regionRegistryDependencies.forEach((dependency) => regionRegistryService.node.addDependency(dependency));
    if (config.regionRegistryDesiredCount > 0) {
      gatewayService.node.addDependency(regionRegistryService);
    }

    const regionAnalyticsService = this.createFargateService('ServiceRegionAnalytics', {
      cluster,
      imageUri: config.regionAnalyticsImageUri,
      cpu: config.regionAnalyticsCpu,
      memoryMiB: config.regionAnalyticsMemoryMiB,
      desiredCount: config.regionAnalyticsDesiredCount,
      containerPort: 8000,
      portMappingName: 'region-analytics-http',
      serviceName: 'service-region-analytics',
      serviceConnectDnsName: 'region-analytics-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: regionAnalyticsEnvironment,
      secrets: regionAnalyticsSecrets
    });
    regionAnalyticsDependencies.forEach((dependency) => regionAnalyticsService.node.addDependency(dependency));
    if (config.regionAnalyticsDesiredCount > 0) {
      gatewayService.node.addDependency(regionAnalyticsService);
    }

    const announcementRegistryService = this.createFargateService('ServiceAnnouncementRegistry', {
      cluster,
      imageUri: config.announcementRegistryImageUri,
      cpu: config.announcementRegistryCpu,
      memoryMiB: config.announcementRegistryMemoryMiB,
      desiredCount: config.announcementRegistryDesiredCount,
      containerPort: 8000,
      portMappingName: 'announcement-registry-http',
      serviceName: 'service-announcement-registry',
      serviceConnectDnsName: 'announcement-registry-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: announcementRegistryEnvironment,
      secrets: announcementRegistrySecrets
    });
    announcementRegistryDependencies.forEach((dependency) =>
      announcementRegistryService.node.addDependency(dependency)
    );
    if (config.announcementRegistryDesiredCount > 0) {
      gatewayService.node.addDependency(announcementRegistryService);
    }

    const notificationHubService = this.createFargateService('ServiceNotificationHub', {
      cluster,
      imageUri: config.notificationHubImageUri,
      cpu: config.notificationHubCpu,
      memoryMiB: config.notificationHubMemoryMiB,
      desiredCount: config.notificationHubDesiredCount,
      containerPort: 8000,
      portMappingName: 'notification-hub-http',
      serviceName: 'service-notification-hub',
      serviceConnectDnsName: 'notification-hub-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: notificationHubEnvironment,
      secrets: notificationHubSecrets
    });
    notificationHubDependencies.forEach((dependency) => notificationHubService.node.addDependency(dependency));
    if (config.notificationHubDesiredCount > 0) {
      gatewayService.node.addDependency(notificationHubService);
    }

    const supportRegistryService = this.createFargateService('ServiceSupportRegistry', {
      cluster,
      imageUri: config.supportRegistryImageUri,
      cpu: config.supportRegistryCpu,
      memoryMiB: config.supportRegistryMemoryMiB,
      desiredCount: config.supportRegistryDesiredCount,
      containerPort: 8000,
      portMappingName: 'support-registry-http',
      serviceName: 'service-support-registry',
      serviceConnectDnsName: 'support-registry-api',
      serviceConnectNamespace: config.serviceConnectNamespace,
      securityGroup: serviceSecurityGroup,
      subnets: publicSubnets,
      environment: supportRegistryEnvironment,
      secrets: supportRegistrySecrets
    });
    supportRegistryDependencies.forEach((dependency) => supportRegistryService.node.addDependency(dependency));
    if (config.notificationHubDesiredCount > 0) {
      supportRegistryService.node.addDependency(notificationHubService);
    }
    if (config.supportRegistryDesiredCount > 0) {
      gatewayService.node.addDependency(supportRegistryService);
    }

    if (config.terminalRegistryImageUri) {
      const terminalRegistryService = this.createFargateService('ServiceTerminalRegistry', {
        cluster,
        imageUri: config.terminalRegistryImageUri,
        cpu: config.terminalRegistryCpu ?? 256,
        memoryMiB: config.terminalRegistryMemoryMiB ?? 512,
        desiredCount: config.terminalRegistryDesiredCount ?? 0,
        containerPort: 8000,
        portMappingName: 'terminal-registry-http',
        serviceName: 'service-terminal-registry',
        serviceConnectDnsName: 'terminal-registry-api',
        serviceConnectNamespace: config.serviceConnectNamespace,
        securityGroup: serviceSecurityGroup,
        subnets: publicSubnets,
        environment: terminalRegistryEnvironment,
        secrets: terminalRegistrySecrets
      });
      terminalRegistryDependencies.forEach((dependency) => terminalRegistryService.node.addDependency(dependency));
      if (config.vehicleAssetDesiredCount > 0) {
        terminalRegistryService.node.addDependency(vehicleAssetService);
      }
      if ((config.terminalRegistryDesiredCount ?? 0) > 0) {
        gatewayService.node.addDependency(terminalRegistryService);
      }
    }

    let telemetryHubService: ecs.FargateService | undefined;
    if (config.telemetryHubImageUri) {
      telemetryHubService = this.createFargateService('ServiceTelemetryHub', {
        cluster,
        imageUri: config.telemetryHubImageUri,
        cpu: config.telemetryHubCpu ?? 256,
        memoryMiB: config.telemetryHubMemoryMiB ?? 512,
        desiredCount: config.telemetryHubDesiredCount ?? 0,
        containerPort: 8000,
        portMappingName: 'telemetry-hub-http',
        serviceName: 'service-telemetry-hub',
        serviceConnectDnsName: 'telemetry-hub-api',
        serviceConnectNamespace: config.serviceConnectNamespace,
        securityGroup: serviceSecurityGroup,
        subnets: publicSubnets,
        environment: telemetryHubEnvironment,
        secrets: telemetryHubSecrets
      });
      telemetryHubDependencies.forEach((dependency) => telemetryHubService!.node.addDependency(dependency));
      if ((config.telemetryHubDesiredCount ?? 0) > 0) {
        gatewayService.node.addDependency(telemetryHubService);
      }
    }

    let telemetryDeadLetterService: ecs.FargateService | undefined;
    if (config.telemetryDeadLetterImageUri) {
      telemetryDeadLetterService = this.createFargateService('ServiceTelemetryDeadLetter', {
        cluster,
        imageUri: config.telemetryDeadLetterImageUri,
        cpu: config.telemetryDeadLetterCpu ?? 256,
        memoryMiB: config.telemetryDeadLetterMemoryMiB ?? 512,
        desiredCount: config.telemetryDeadLetterDesiredCount ?? 0,
        containerPort: 8000,
        portMappingName: 'telemetry-dead-letter-http',
        serviceName: 'service-telemetry-dead-letter',
        serviceConnectDnsName: 'telemetry-dead-letter-api',
        serviceConnectNamespace: config.serviceConnectNamespace,
        securityGroup: serviceSecurityGroup,
        subnets: publicSubnets,
        environment: telemetryDeadLetterEnvironment,
        secrets: telemetryDeadLetterSecrets
      });
      telemetryDeadLetterDependencies.forEach((dependency) => telemetryDeadLetterService!.node.addDependency(dependency));
      if ((config.telemetryDeadLetterDesiredCount ?? 0) > 0) {
        gatewayService.node.addDependency(telemetryDeadLetterService);
      }
    }

    if (config.telemetryListenerImageUri) {
      const telemetryListenerService = this.createFargateWorkerService('ServiceTelemetryListener', {
        cluster,
        imageUri: config.telemetryListenerImageUri,
        cpu: config.telemetryListenerCpu ?? 256,
        memoryMiB: config.telemetryListenerMemoryMiB ?? 512,
        desiredCount: config.telemetryListenerDesiredCount ?? 0,
        serviceName: 'service-telemetry-listener',
        securityGroup: serviceSecurityGroup,
        subnets: publicSubnets,
        environment: telemetryListenerEnvironment,
        secrets: telemetryListenerSecrets
      });
      telemetryListenerDependencies.forEach((dependency) => telemetryListenerService.node.addDependency(dependency));
      if (telemetryHubService) {
        telemetryListenerService.node.addDependency(telemetryHubService);
      }
      if (telemetryDeadLetterService) {
        telemetryListenerService.node.addDependency(telemetryDeadLetterService);
      }
    }

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

  private buildEc2Runtime(input: {
    config: PlatformConfig;
    vpc: ec2.IVpc;
    hostedZone: route53.IHostedZone;
    loadBalancer: elbv2.ApplicationLoadBalancer;
    httpsListener: elbv2.ApplicationListener;
    serviceSecurityGroup: ec2.SecurityGroup;
    dataSecurityGroup: ec2.SecurityGroup;
  }): void {
    const { config, vpc, hostedZone, loadBalancer, httpsListener, serviceSecurityGroup, dataSecurityGroup } = input;
    const runtimeNamePrefix = this.stackName;
    const appHostSubnet = this.importSubnetWithAvailabilityZone('Ec2AppHostSubnet', config, config.appHostSubnetId!);
    const dataHostSubnet = this.importSubnetWithAvailabilityZone('Ec2DataHostSubnet', config, config.dataHostSubnetId!);
    const runtimeImageMap = this.buildRuntimeImageMap(config);
    const runtimeImageMapParam = new ssm.StringParameter(this, 'RuntimeImageMapParam', {
      parameterName: `/${runtimeNamePrefix}/runtime/images`,
      stringValue: JSON.stringify(runtimeImageMap)
    });
    const postgresSecret = this.createGeneratedSecret('PostgresPasswordSecret');

    const appHost = new Ec2AppHost(this, 'AppHost', {
      vpc,
      subnet: appHostSubnet,
      securityGroup: serviceSecurityGroup,
      instanceType: config.appHostInstanceType,
      imageMapSsmParam: runtimeImageMapParam.parameterName,
      region: config.region,
      instanceName: `${runtimeNamePrefix}-app-host`
    });
    runtimeImageMapParam.grantRead(appHost.role);
    postgresSecret.grantRead(appHost.role);

    const dataHost = new Ec2DataHost(this, 'DataHost', {
      vpc,
      subnet: dataHostSubnet,
      securityGroup: dataSecurityGroup,
      instanceType: config.dataHostInstanceType,
      dataVolumeSizeGiB: config.dataVolumeSizeGiB,
      mountPath: '/data',
      instanceName: `${runtimeNamePrefix}-data-host`
    });

    const frontTargetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontTargetGroup', {
      port: 5174,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      vpc,
      healthCheck: {
        path: config.frontHealthCheckPath
      }
    });
    frontTargetGroup.addTarget(new elbv2Targets.InstanceTarget(appHost.instance, 5174));

    const gatewayTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GatewayTargetGroup', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      vpc,
      healthCheck: {
        path: config.gatewayHealthCheckPath
      }
    });
    gatewayTargetGroup.addTarget(new elbv2Targets.InstanceTarget(appHost.instance, 8080));

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

    new cdk.CfnOutput(this, 'AppHostInstanceId', { value: appHost.instance.instanceId });
    new cdk.CfnOutput(this, 'DataHostInstanceId', { value: dataHost.instance.instanceId });
    new cdk.CfnOutput(this, 'RuntimeImageMapParameterName', { value: runtimeImageMapParam.parameterName });
    new cdk.CfnOutput(this, 'PostgresSecretName', { value: postgresSecret.secretName });
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

  private createFargateWorkerService(
    id: string,
    input: {
      cluster: ecs.Cluster;
      imageUri: string;
      cpu: number;
      memoryMiB: number;
      desiredCount: number;
      serviceName: string;
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
      secrets: input.secrets
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

  private createPostgresDatabaseInstance(
    id: string,
    input: {
      vpc: ec2.IVpc;
      privateSubnets: ec2.ISubnet[];
      dataSecurityGroup: ec2.SecurityGroup;
      username: string;
      databaseName: string;
    }
  ): rds.DatabaseInstance {
    return new rds.DatabaseInstance(this, id, {
      vpc: input.vpc,
      vpcSubnets: { subnets: input.privateSubnets },
      securityGroups: [input.dataSecurityGroup],
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.of('16.13', '16') }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret(input.username),
      databaseName: input.databaseName,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      publiclyAccessible: false,
      multiAz: false,
      deletionProtection: false,
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }

  private createGeneratedSecret(id: string): secretsmanager.Secret {
    return new secretsmanager.Secret(this, id, {
      generateSecretString: {
        passwordLength: 64,
        excludePunctuation: true
      }
    });
  }

  private recordName(fqdn: string, hostedZoneName: string): string | undefined {
    if (fqdn === hostedZoneName) {
      return undefined;
    }

    const suffix = `.${hostedZoneName}`;
    return fqdn.endsWith(suffix) ? fqdn.slice(0, -suffix.length) : fqdn;
  }

  private buildRuntimeImageMap(config: PlatformConfig): Record<string, string> {
    return {
      'front-web-console': config.frontImageUri,
      'edge-api-gateway': config.gatewayImageUri,
      'service-account-access': config.accountAccessImageUri,
      'service-organization-registry': config.organizationImageUri,
      'service-driver-profile': config.driverProfileImageUri,
      'service-personnel-document-registry': config.personnelDocumentImageUri,
      'service-vehicle-registry': config.vehicleAssetImageUri,
      'service-vehicle-assignment': config.driverVehicleAssignmentImageUri,
      'service-dispatch-registry': config.dispatchRegistryImageUri,
      'service-delivery-record': config.deliveryRecordImageUri,
      'service-attendance-registry': config.attendanceRegistryImageUri,
      'service-dispatch-operations-view': config.dispatchOpsImageUri,
      'service-driver-operations-view': config.driverOpsImageUri,
      'service-vehicle-operations-view': config.vehicleOpsImageUri,
      'service-settlement-registry': config.settlementRegistryImageUri,
      'service-settlement-payroll': config.settlementPayrollImageUri,
      'service-settlement-operations-view': config.settlementOpsImageUri,
      'service-region-registry': config.regionRegistryImageUri,
      'service-region-analytics': config.regionAnalyticsImageUri,
      'service-announcement-registry': config.announcementRegistryImageUri,
      'service-support-registry': config.supportRegistryImageUri,
      'service-notification-hub': config.notificationHubImageUri,
      ...(config.terminalRegistryImageUri ? { 'service-terminal-registry': config.terminalRegistryImageUri } : {}),
      ...(config.telemetryHubImageUri ? { 'service-telemetry-hub': config.telemetryHubImageUri } : {}),
      ...(config.telemetryDeadLetterImageUri
        ? { 'service-telemetry-dead-letter': config.telemetryDeadLetterImageUri }
        : {}),
      ...(config.telemetryListenerImageUri
        ? { 'service-telemetry-listener': config.telemetryListenerImageUri }
        : {})
    };
  }

  private importSubnetWithAvailabilityZone(
    id: string,
    config: PlatformConfig,
    subnetId: string
  ): ec2.ISubnet {
    return ec2.Subnet.fromSubnetAttributes(this, id, {
      subnetId,
      availabilityZone: this.lookupSubnetAvailabilityZone(config, subnetId)
    });
  }

  private lookupSubnetAvailabilityZone(config: PlatformConfig, subnetId: string): string {
    const privateIndex = config.privateSubnetIds.indexOf(subnetId);
    if (privateIndex >= 0 && config.availabilityZones[privateIndex]) {
      return config.availabilityZones[privateIndex];
    }

    const publicIndex = config.publicSubnetIds.indexOf(subnetId);
    if (publicIndex >= 0 && config.availabilityZones[publicIndex]) {
      return config.availabilityZones[publicIndex];
    }

    return config.availabilityZones[0];
  }
}
