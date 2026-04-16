import { gatewayRouteGroups, type GatewayRouteGroup } from './gatewayRouteProfile';
import type { ReleaseManifest, ReleaseManifestServiceName } from './releaseManifest';
import { getServiceCatalogEntry } from './serviceCatalog';

export type ReleaseImpactClassification = 'backend-only' | 'gateway-required' | 'front-required';

export type ReleaseImpact = {
  classification: ReleaseImpactClassification;
  requiresGateway: boolean;
  requiresFront: boolean;
  routeGroups: GatewayRouteGroup[];
  touchedRouteGroups: GatewayRouteGroup[];
};

export const releaseImpactRouteGroups = gatewayRouteGroups;

export function buildReleaseImpact(manifest: Pick<ReleaseManifest, 'services' | 'impact'>): ReleaseImpact {
  const includesGateway = manifest.services.some((service) => service.service === 'edge-api-gateway');
  const includesFront = manifest.services.some((service) => service.service === 'front-web-console');
  const routeGroups = sortRouteGroups(manifest.impact.routeGroups);
  const touchedRouteGroups = sortRouteGroups(
    manifest.services
      .map((service) => getRouteGroupForService(service.service))
      .filter((group): group is GatewayRouteGroup => group !== undefined)
  );

  const requiresFront = includesFront || manifest.impact.requiresFront;
  const requiresGateway = requiresFront || includesGateway || manifest.impact.requiresGateway || routeGroups.length > 0;

  if (requiresFront) {
    return {
      classification: 'front-required',
      requiresGateway: true,
      requiresFront: true,
      routeGroups,
      touchedRouteGroups
    };
  }

  if (requiresGateway) {
    return {
      classification: 'gateway-required',
      requiresGateway: true,
      requiresFront: false,
      routeGroups,
      touchedRouteGroups
    };
  }

  return {
    classification: 'backend-only',
    requiresGateway: false,
    requiresFront: false,
    routeGroups,
    touchedRouteGroups
  };
}

function getRouteGroupForService(service: ReleaseManifestServiceName): GatewayRouteGroup | undefined {
  return getServiceCatalogEntry(service).routeGroup;
}

function sortRouteGroups(routeGroups: GatewayRouteGroup[]): GatewayRouteGroup[] {
  const seen = new Set<GatewayRouteGroup>();
  const normalized: GatewayRouteGroup[] = [];
  for (const routeGroup of releaseImpactRouteGroups) {
    if (routeGroups.includes(routeGroup) && !seen.has(routeGroup)) {
      seen.add(routeGroup);
      normalized.push(routeGroup);
    }
  }
  return normalized;
}
