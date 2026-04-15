import { renderAppHostBootstrap, renderDataHostBootstrap } from '../lib/ec2-bootstrap';

describe('EC2 host bootstrap renderers', () => {
  test('renders app host bootstrap with ECR image map inputs', () => {
    const script = renderAppHostBootstrap({
      region: 'ap-northeast-2',
      imageMapSsmParam: '/ev-dashboard/runtime/images',
      dataHostAddress: '10.20.1.15',
      apexDomain: 'candidate.ev-dashboard.com',
      apiDomain: 'api.candidate.ev-dashboard.com',
      accountAccessPostgresSecretArn: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:postgres',
      accountAccessDjangoSecretArn: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:django',
      accountAccessJwtSecretArn: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:jwt'
    });

    expect(script).toContain('docker');
    expect(script).toContain('/ev-dashboard/runtime/images');
    expect(script).toContain('aws ecr get-login-password');
    expect(script).toContain('ev-dashboard-app-reconcile.sh');
    expect(script).toContain('docker run -d --name web-console');
    expect(script).toContain('docker run -d --name account-auth-api');
    expect(script).toContain('docker run -d --name edge-api-gateway');
    expect(script).toContain('account-access.env');
    expect(script).toContain('nginx.ec2-proof.conf');
    expect(script).toContain('-v /opt/ev-dashboard/nginx.ec2-proof.conf:/etc/nginx/nginx.conf:ro');
  });

  test('renders data host bootstrap with volume mount and postgres redis runtime', () => {
    const script = renderDataHostBootstrap({
      region: 'ap-northeast-2',
      deviceName: '/dev/sdf',
      mountPath: '/data',
      postgresVersion: '16',
      redisVersion: '7',
      postgresSuperuserSecretArn: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:postgres-super',
      databases: [
        {
          databaseName: 'account_auth',
          username: 'account_auth',
          passwordSecretArn: 'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:account-auth'
        }
      ]
    });

    expect(script).toContain('/dev/sdf');
    expect(script).toContain('/data');
    expect(script).toContain('postgres:16');
    expect(script).toContain('redis:7');
    expect(script).toContain('ev-dashboard-data-bootstrap.sh');
    expect(script).toContain('pg_isready');
    expect(script).toContain('CREATE DATABASE account_auth OWNER account_auth');
    expect(script).toContain('DB_SECRET_VALUE_B64=$(printf');
    expect(script).toContain('docker exec -i ev-dashboard-postgres psql');
    expect(script).toContain('DO $$');
    expect(script).toContain("decode('${DB_SECRET_VALUE_B64}', 'base64')");
    expect(script).not.toContain('DB_PASSWORD=');
    expect(script).not.toContain('DO \\\\$\\\\$');
  });
});
