import type { AppHostRuntimeService } from './ec2-bootstrap';
import type { GatewayRouteProfile } from './gatewayRouteProfile';

export function orderAppHostRuntimeServices(
  services: AppHostRuntimeService[],
  gatewayProfile: GatewayRouteProfile['profile']
): AppHostRuntimeService[] {
  const gatewayService = services.find((service) => service.id === 'GATEWAY');
  if (!gatewayService) {
    return [...services];
  }

  const servicesWithoutGateway = services.filter((service) => service.id !== 'GATEWAY');
  if (gatewayProfile === 'bootstrap-proof') {
    const organizationIndex = servicesWithoutGateway.findIndex((service) => service.id === 'ORGANIZATION');
    if (organizationIndex === -1) {
      return [...servicesWithoutGateway, gatewayService];
    }

    return [
      ...servicesWithoutGateway.slice(0, organizationIndex + 1),
      gatewayService,
      ...servicesWithoutGateway.slice(organizationIndex + 1)
    ];
  }

  return [...servicesWithoutGateway, gatewayService];
}
