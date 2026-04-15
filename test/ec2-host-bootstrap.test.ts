import { renderAppHostBootstrap, renderDataHostBootstrap } from '../lib/ec2-bootstrap';

describe('EC2 host bootstrap renderers', () => {
  test('renders app host bootstrap with ECR image map inputs', () => {
    const script = renderAppHostBootstrap({
      region: 'ap-northeast-2',
      imageMapSsmParam: '/ev-dashboard/runtime/images'
    });

    expect(script).toContain('docker');
    expect(script).toContain('/ev-dashboard/runtime/images');
    expect(script).toContain('aws ecr get-login-password');
  });

  test('renders data host bootstrap with volume mount and postgres redis runtime', () => {
    const script = renderDataHostBootstrap({
      deviceName: '/dev/xvdf',
      mountPath: '/data',
      postgresVersion: '16',
      redisVersion: '7'
    });

    expect(script).toContain('/dev/xvdf');
    expect(script).toContain('/data');
    expect(script).toContain('postgres:16');
    expect(script).toContain('redis:7');
  });
});
