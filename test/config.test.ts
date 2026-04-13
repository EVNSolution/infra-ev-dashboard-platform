import { buildPlatformConfigFromEnv } from '../lib/config';

describe('buildPlatformConfigFromEnv', () => {
  test('treats empty optional environment values as defaults', () => {
    const config = buildPlatformConfigFromEnv({
      AWS_REGION: 'ap-northeast-2',
      HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
      HOSTED_ZONE_NAME: 'ev-dashboard.com',
      APEX_DOMAIN: 'next.ev-dashboard.com',
      API_DOMAIN: 'api.next.ev-dashboard.com',
      VPC_ID: 'vpc-015c89247f96e9221',
      PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
      AVAILABILITY_ZONES: 'ap-northeast-2a,ap-northeast-2c',
      SERVICE_CONNECT_NAMESPACE: '',
      FRONT_DESIRED_COUNT: '1',
      GATEWAY_DESIRED_COUNT: '0',
      ACCOUNT_ACCESS_DESIRED_COUNT: '0',
      ORGANIZATION_DESIRED_COUNT: '0',
      FRONT_CPU: '',
      FRONT_MEMORY_MIB: '',
      GATEWAY_CPU: '',
      GATEWAY_MEMORY_MIB: '',
      ACCOUNT_ACCESS_CPU: '',
      ACCOUNT_ACCESS_MEMORY_MIB: '',
      ORGANIZATION_CPU: '',
      ORGANIZATION_MEMORY_MIB: '',
      FRONT_HEALTH_CHECK_PATH: '',
      GATEWAY_HEALTH_CHECK_PATH: '',
      ACCOUNT_ACCESS_HEALTH_CHECK_PATH: '',
      ORGANIZATION_HEALTH_CHECK_PATH: '',
      FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
      GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
      ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
      ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test'
    });

    expect(config.serviceConnectNamespace).toBe('ev-dashboard.internal');
    expect(config.frontCpu).toBe(256);
    expect(config.frontMemoryMiB).toBe(512);
    expect(config.frontHealthCheckPath).toBe('/healthz');
    expect(config.gatewayHealthCheckPath).toBe('/healthz');
    expect(config.accountAccessHealthCheckPath).toBe('/healthz');
    expect(config.organizationCpu).toBe(256);
    expect(config.organizationMemoryMiB).toBe(512);
    expect(config.organizationHealthCheckPath).toBe('/health/');
  });

  test('requires private subnets when account-access is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'next.ev-dashboard.com',
        API_DOMAIN: 'api.next.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        FRONT_DESIRED_COUNT: '1',
        GATEWAY_DESIRED_COUNT: '1',
        ACCOUNT_ACCESS_DESIRED_COUNT: '1',
        ORGANIZATION_DESIRED_COUNT: '0',
        FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
        GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
        ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
        ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test'
      })
    ).toThrow('PRIVATE_SUBNET_IDS');
  });

  test('requires private subnets when organization slice is enabled', () => {
    expect(() =>
      buildPlatformConfigFromEnv({
        AWS_REGION: 'ap-northeast-2',
        HOSTED_ZONE_ID: 'Z0258898ULH367BASCGC',
        HOSTED_ZONE_NAME: 'ev-dashboard.com',
        APEX_DOMAIN: 'next.ev-dashboard.com',
        API_DOMAIN: 'api.next.ev-dashboard.com',
        VPC_ID: 'vpc-015c89247f96e9221',
        PUBLIC_SUBNET_IDS: 'subnet-aaa,subnet-bbb',
        FRONT_DESIRED_COUNT: '1',
        GATEWAY_DESIRED_COUNT: '1',
        ACCOUNT_ACCESS_DESIRED_COUNT: '0',
        ORGANIZATION_DESIRED_COUNT: '1',
        FRONT_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:test',
        GATEWAY_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:test',
        ACCOUNT_ACCESS_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:test',
        ORGANIZATION_IMAGE_URI: '123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-organization-registry:test'
      })
    ).toThrow('PRIVATE_SUBNET_IDS');
  });
});
