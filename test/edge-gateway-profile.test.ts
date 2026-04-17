import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('EC2 bootstrap-proof gateway contract', () => {
  test('runtime manifest passes gateway profile to the edge container', () => {
    const source = readFileSync(join(__dirname, '..', 'lib', 'ev-dashboard-platform-stack.ts'), 'utf8');
    const gatewayStart = source.indexOf("id: 'GATEWAY'");
    const nextBackendMarker = source.indexOf("buildCatalogBackedAppHostRuntimeService('service-driver-profile'");
    const legacyDriverMarker = source.indexOf("id: 'DRIVER_PROFILE'");
    const gatewayEnd = nextBackendMarker >= 0 ? nextBackendMarker : legacyDriverMarker;
    const gatewaySource = source.slice(gatewayStart, gatewayEnd);

    expect(gatewayStart).toBeGreaterThanOrEqual(0);
    expect(gatewayEnd).toBeGreaterThan(gatewayStart);
    expect(source).toContain('buildGatewayRouteProfile');
    expect(gatewaySource).toContain('GATEWAY_PROFILE');
    expect(gatewaySource).toContain('GATEWAY_ROUTE_GROUPS');
  });
});
