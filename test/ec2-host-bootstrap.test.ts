import { renderAppHostBootstrap, renderDataHostBootstrap } from '../lib/ec2-bootstrap';

describe('EC2 host bootstrap renderers', () => {
  test('renders thin app host bootstrap that stages python runtime package', () => {
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
    expect(script).toContain('python3');
    expect(script).toContain('/opt/ev-dashboard/bootstrap/ev_dashboard_runtime/cli.py');
    expect(script).toContain('dnf install -y docker jq python3');
    expect(script).toContain('mkdir -p /opt/ev-dashboard/bootstrap/ev_dashboard_runtime');
    expect(script).toContain('common.py');
    expect(script).toContain('app_host.py');
    expect(script).toContain('data_host.py');
    expect(script).toContain('cli.py');
    expect(script).toContain('python3 /opt/ev-dashboard/bootstrap/ev_dashboard_runtime/cli.py reconcile-app');
    expect(script).not.toContain('docker run -d --name web-console');
    expect(script).not.toContain('docker run -d --name account-auth-api');
    expect(script).not.toContain('docker run -d --name edge-api-gateway');
    expect(script).not.toContain('aws ecr get-login-password');
  });

  test('renders thin data host bootstrap that stages python runtime package', () => {
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
    expect(script).toContain('python3');
    expect(script).toContain('mkdir -p /opt/ev-dashboard/bootstrap/ev_dashboard_runtime');
    expect(script).toContain('python3 /opt/ev-dashboard/bootstrap/ev_dashboard_runtime/cli.py bootstrap-data');
    expect(script).toContain('common.py');
    expect(script).toContain('data_host.py');
    expect(script).not.toContain('docker pull postgres:16');
    expect(script).not.toContain('docker pull redis:7');
    expect(script).not.toContain('ev-dashboard-data-bootstrap.sh');
    expect(script).not.toContain('ExecStart=/usr/local/bin/ev-dashboard-data-bootstrap.sh');
  });
});
