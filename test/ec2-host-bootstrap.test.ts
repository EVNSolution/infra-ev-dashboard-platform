import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { renderAppHostBootstrap, renderDataHostBootstrap } from '../lib/ec2-bootstrap';

describe('EC2 host bootstrap renderers', () => {
  test('renders thin app host bootstrap that stages python runtime package', () => {
    const script = renderAppHostBootstrap({
      region: 'ap-northeast-2',
      imageMapSsmParam: '/ev-dashboard/runtime/images',
      bootstrapPackageBucketName: 'clever-bootstrap-bucket',
      bootstrapPackageObjectKey: 'bootstrap/runtime.zip',
      serviceManifestBucketName: 'clever-manifest-bucket',
      serviceManifestObjectKey: 'runtime/app-services.json',
      serviceSecretMapSecretArn:
        'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:app-service-secret-map'
    }).join('\n');

    expect(script).toContain('docker');
    expect(script).toContain('python3');
    expect(script).toContain('/opt/ev-dashboard/bootstrap/ev_dashboard_runtime/cli.py');
    expect(script).toContain('dnf install -y docker jq python3 unzip');
    expect(script).toContain('aws s3 cp s3://clever-bootstrap-bucket/bootstrap/runtime.zip /tmp/ev-dashboard-bootstrap.zip');
    expect(script).toContain('unzip -o /tmp/ev-dashboard-bootstrap.zip -d /opt/ev-dashboard/bootstrap');
    expect(script).toContain('/opt/ev-dashboard/manifests/app-services.json');
    expect(script).toContain('python3 /opt/ev-dashboard/bootstrap/ev_dashboard_runtime/cli.py reconcile-app');
    expect(script.length).toBeLessThan(16384);
    expect(script).not.toContain('docker run -d --name web-console');
    expect(script).not.toContain('docker run -d --name account-auth-api');
    expect(script).not.toContain('docker run -d --name edge-api-gateway');
    expect(script).not.toContain('aws ecr get-login-password');
    expect(script).not.toContain('common.py');
    expect(script).not.toContain('app_host.py');
    expect(script).not.toContain('data_host.py');
  });

  test('renders thin data host bootstrap that stages python runtime package', () => {
    const script = renderDataHostBootstrap({
      region: 'ap-northeast-2',
      deviceName: '/dev/sdf',
      mountPath: '/data',
      postgresVersion: '16',
      redisVersion: '7',
      bootstrapPackageBucketName: 'clever-bootstrap-bucket',
      bootstrapPackageObjectKey: 'bootstrap/runtime.zip',
      postgresSuperuserSecretArn: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:postgres-super',
      databases: [
        {
          databaseName: 'account_auth',
          username: 'account_auth',
          passwordSecretArn: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:account-auth'
        }
      ]
    }).join('\n');

    expect(script).toContain('/dev/sdf');
    expect(script).toContain('/data');
    expect(script).toContain('python3');
    expect(script).toContain('aws s3 cp s3://clever-bootstrap-bucket/bootstrap/runtime.zip /tmp/ev-dashboard-bootstrap.zip');
    expect(script).toContain('unzip -o /tmp/ev-dashboard-bootstrap.zip -d /opt/ev-dashboard/bootstrap');
    expect(script).toContain('python3 /opt/ev-dashboard/bootstrap/ev_dashboard_runtime/cli.py bootstrap-data');
    expect(script).toContain('BOOTSTRAP_DATABASE_1_NAME=account_auth');
    expect(script).toContain('BOOTSTRAP_DATABASE_1_USERNAME=account_auth');
    expect(script.length).toBeLessThan(16384);
    expect(script).not.toContain('docker pull postgres:16');
    expect(script).not.toContain('docker pull redis:7');
    expect(script).not.toContain('ev-dashboard-data-bootstrap.sh');
    expect(script).not.toContain('ExecStart=/usr/local/bin/ev-dashboard-data-bootstrap.sh');
    expect(script).not.toContain('common.py');
    expect(script).not.toContain('data_host.py');
  });

  test('keeps app host user data under the EC2 limit even with many services', () => {
    const services = Array.from({ length: 24 }, (_, index) => ({
      id: `SERVICE_${index + 1}`,
      imageMapKey: `service-${index + 1}`,
      containerName: `service-${index + 1}`,
      enabled: true,
      containerPort: 8000,
      environment: {
        POSTGRES_HOST: '10.20.1.15',
        POSTGRES_DB: `service_${index + 1}`,
        DJANGO_ALLOWED_HOSTS: 'api.ev-dashboard.com'
      },
      secretArns: {
        POSTGRES_PASSWORD:
          'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:postgres-super-long-secret-name',
        DJANGO_SECRET_KEY:
          'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:django-super-long-secret-name',
        JWT_SECRET_KEY:
          'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:jwt-super-long-secret-name'
      }
    }));

    const script = renderAppHostBootstrap({
      region: 'ap-northeast-2',
      imageMapSsmParam: '/ev-dashboard/runtime/images',
      bootstrapPackageBucketName: 'clever-bootstrap-bucket',
      bootstrapPackageObjectKey: 'bootstrap/runtime.zip',
      serviceManifestBucketName: 'clever-manifest-bucket',
      serviceManifestObjectKey: 'runtime/app-services.json',
      serviceSecretMapSecretArn:
        'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:app-service-secret-map'
    }).join('\n');

    expect(script.length).toBeLessThan(25600);
  });

  test('runtime package reconciles generic services without proof-only gateway overrides', () => {
    const source = readFileSync(
      join(__dirname, '..', 'bootstrap', 'ev_dashboard_runtime', 'app_host.py'),
      'utf8'
    );

    expect(source).toContain('SERVICE_MANIFEST_PATH');
    expect(source).toContain('SERVICE_SECRET_MAP_SECRET_ARN');
    expect(source).toContain('SERVICE_ENV_DIR');
    expect(source).not.toContain('PROOF_GATEWAY_CONFIG_PATH');
    expect(source).not.toContain('render_proof_gateway_config');
  });

  test('data host construct treats bootstrap drift as replacement-worthy', () => {
    const source = readFileSync(join(__dirname, '..', 'lib', 'ec2-data-host.ts'), 'utf8');

    expect(source).toContain('userDataCausesReplacement: true');
    expect(source).toContain('blockDevices:');
    expect(source).not.toContain('CfnVolumeAttachment');
  });
});
