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
    const platformJwtSecretKey =
      config.accountAccessDesiredCount > 0 ||
      config.organizationDesiredCount > 0 ||
      config.driverProfileDesiredCount > 0 ||
      config.personnelDocumentDesiredCount > 0 ||
      config.vehicleAssetDesiredCount > 0 ||
      config.driverVehicleAssignmentDesiredCount > 0 ||
      config.dispatchRegistryDesiredCount > 0 ||
      config.deliveryRecordDesiredCount > 0 ||
      config.attendanceRegistryDesiredCount > 0
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
}
