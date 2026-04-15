import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('EC2 bootstrap-proof gateway contract', () => {
  test('runtime manifest passes gateway profile to the edge container', () => {
    const source = readFileSync(join(__dirname, '..', 'lib', 'ev-dashboard-platform-stack.ts'), 'utf8');
    const gatewayStart = source.indexOf("id: 'GATEWAY'");
    const driverStart = source.indexOf("id: 'DRIVER_PROFILE'");
    const gatewaySource = source.slice(gatewayStart, driverStart);

    expect(gatewayStart).toBeGreaterThanOrEqual(0);
    expect(driverStart).toBeGreaterThan(gatewayStart);
    expect(gatewaySource).toContain('GATEWAY_PROFILE');
    expect(gatewaySource).toContain("config.runProfile === 'bootstrap-proof'");
  });
});
