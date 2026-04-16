import type { PlatformConfig } from './config';
import {
  getServiceDesiredCount,
  listCatalogEntriesForRouteGroup,
  serviceCatalogRouteGroups,
  type ServiceCatalogRouteGroup
} from './serviceCatalog';

export const gatewayRouteGroups = serviceCatalogRouteGroups;

export type GatewayRouteGroup = ServiceCatalogRouteGroup;

export type GatewayRouteProfile = {
  profile: 'bootstrap-proof' | 'partial' | 'full';
  routeGroups: GatewayRouteGroup[];
};

export function buildGatewayRouteProfile(config: PlatformConfig): GatewayRouteProfile {
  if (config.runProfile === 'bootstrap-proof') {
    return {
      profile: 'bootstrap-proof',
      routeGroups: []
    };
  }

  const routeGroups = gatewayRouteGroups.filter((group) => hasEnabledRouteGroup(config, group));
  if (routeGroups.length === 0) {
    return {
      profile: 'bootstrap-proof',
      routeGroups: []
    };
  }

  if (routeGroups.length === gatewayRouteGroups.length) {
    return {
      profile: 'full',
      routeGroups
    };
  }

  return {
    profile: 'partial',
    routeGroups
  };
}

function hasEnabledRouteGroup(config: PlatformConfig, group: GatewayRouteGroup): boolean {
  return listCatalogEntriesForRouteGroup(group).some((entry) => getServiceDesiredCount(config, entry.service) > 0);
}
