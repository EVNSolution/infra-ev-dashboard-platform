import { aws_ec2 as ec2, aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { renderAppHostBootstrap } from './ec2-bootstrap';

export type Ec2AppHostProps = {
  vpc: ec2.IVpc;
  subnet: ec2.ISubnet;
  securityGroup: ec2.ISecurityGroup;
  instanceType: string;
  rootVolumeSizeGiB: number;
  imageMapSsmParam: string;
  region: string;
  bootstrapPackageBucketName: string;
  bootstrapPackageObjectKey: string;
  serviceManifestSecretArn: string;
  serviceSecretMapSecretArn: string;
  instanceName?: string;
};

export class Ec2AppHost extends Construct {
  readonly instance: ec2.Instance;
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: Ec2AppHostProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')]
    });
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: ['*']
      })
    );
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*']
      })
    );
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer', 'ecr:BatchCheckLayerAvailability'],
        resources: ['*']
      })
    );
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: ['*']
      })
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      ...renderAppHostBootstrap({
        region: props.region,
        imageMapSsmParam: props.imageMapSsmParam,
        bootstrapPackageBucketName: props.bootstrapPackageBucketName,
        bootstrapPackageObjectKey: props.bootstrapPackageObjectKey,
        serviceManifestSecretArn: props.serviceManifestSecretArn,
        serviceSecretMapSecretArn: props.serviceSecretMapSecretArn
      })
    );

    this.instance = new ec2.Instance(this, 'Instance', {
      vpc: props.vpc,
      vpcSubnets: { subnets: [props.subnet] },
      securityGroup: props.securityGroup,
      instanceType: new ec2.InstanceType(props.instanceType),
      machineImage: machineImageForInstanceType(props.instanceType),
      role: this.role,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(props.rootVolumeSizeGiB, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: true
          })
        }
      ],
      userData,
      userDataCausesReplacement: true
    });

    if (props.instanceName) {
      this.instance.instance.addPropertyOverride('Tags', [
        { Key: 'Name', Value: props.instanceName }
      ]);
    }
  }
}

function machineImageForInstanceType(instanceType: string): ec2.IMachineImage {
  return ec2.MachineImage.latestAmazonLinux2023({
    cpuType: isArmInstanceType(instanceType) ? ec2.AmazonLinuxCpuType.ARM_64 : ec2.AmazonLinuxCpuType.X86_64
  });
}

function isArmInstanceType(instanceType: string): boolean {
  return /(g\.)/.test(instanceType);
}
