import { aws_ec2 as ec2, aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { DataHostDatabaseBootstrap, renderDataHostBootstrap } from './ec2-bootstrap';

export type Ec2DataHostProps = {
  vpc: ec2.IVpc;
  subnet: ec2.ISubnet;
  securityGroup: ec2.ISecurityGroup;
  instanceType: string;
  dataVolumeSizeGiB: number;
  region: string;
  bootstrapPackageBucketName: string;
  bootstrapPackageObjectKey: string;
  postgresSuperuserSecretArn: string;
  databases?: DataHostDatabaseBootstrap[];
  mountPath?: string;
  instanceName?: string;
};

export class Ec2DataHost extends Construct {
  readonly instance: ec2.Instance;
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: Ec2DataHostProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')]
    });
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: ['*']
      })
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      ...renderDataHostBootstrap({
        region: props.region,
        deviceName: '/dev/sdf',
        mountPath: props.mountPath ?? '/data',
        postgresVersion: '16',
        redisVersion: '7',
        bootstrapPackageBucketName: props.bootstrapPackageBucketName,
        bootstrapPackageObjectKey: props.bootstrapPackageObjectKey,
        postgresSuperuserSecretArn: props.postgresSuperuserSecretArn,
        databases: props.databases ?? []
      })
    );

    this.instance = new ec2.Instance(this, 'Instance', {
      vpc: props.vpc,
      vpcSubnets: { subnets: [props.subnet] },
      associatePublicIpAddress: true,
      securityGroup: props.securityGroup,
      instanceType: new ec2.InstanceType(props.instanceType),
      machineImage: machineImageForInstanceType(props.instanceType),
      role: this.role,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/sdf',
          volume: ec2.BlockDeviceVolume.ebs(props.dataVolumeSizeGiB, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: true
          })
        }
      ],
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
