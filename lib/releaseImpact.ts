import { gatewayRouteGroups, type GatewayRouteGroup } from './gatewayRouteProfile';
import type { ReleaseManifest, ReleaseManifestServiceName } from './releaseManifest';

export type ReleaseImpactClassification = 'backend-only' | 'gateway-required' | 'front-required';

export type ReleaseImpact = {
  classification: ReleaseImpactClassification;
  requiresGateway: boolean;
  requiresFront: boolean;
  routeGroups: GatewayRouteGroup[];
  touchedRouteGroups: GatewayRouteGroup[];
};

export const releaseImpactRouteGroups = gatewayRouteGroups;

const serviceRouteGroupMap: Partial<Record<ReleaseManifestServiceName, GatewayRouteGroup>> = {
  'service-driver-profile': 'people-and-assets',
  'service-personnel-document-registry': 'people-and-assets',
  'service-vehicle-registry': 'people-and-assets',
  'service-vehicle-assignment': 'people-and-assets',
  'service-dispatch-registry': 'dispatch-inputs',
  'service-delivery-record': 'dispatch-inputs',
  'service-attendance-registry': 'dispatch-inputs',
  'service-dispatch-operations-view': 'dispatch-read-models',
  'service-driver-operations-view': 'dispatch-read-models',
  'service-vehicle-operations-view': 'dispatch-read-models',
  'service-settlement-registry': 'settlement',
  'service-settlement-payroll': 'settlement',
  'service-settlement-operations-view': 'settlement',
  'service-region-registry': 'support-surface',
  'service-region-analytics': 'support-surface',
  'service-announcement-registry': 'support-surface',
  'service-support-registry': 'support-surface',
  'service-notification-hub': 'support-surface',
  'service-terminal-registry': 'terminal-and-telemetry',
  'service-telemetry-hub': 'terminal-and-telemetry',
  'service-telemetry-dead-letter': 'terminal-and-telemetry',
  'service-telemetry-listener': 'terminal-and-telemetry'
};

export function buildReleaseImpact(manifest: Pick<ReleaseManifest, 'services' | 'impact'>): ReleaseImpact {
  const includesGateway = manifest.services.some((service) => service.service === 'edge-api-gateway');
  const includesFront = manifest.services.some((service) => service.service === 'front-web-console');
  const routeGroups = sortRouteGroups(manifest.impact.routeGroups);
  const touchedRouteGroups = sortRouteGroups(
    manifest.services
      .map((service) => serviceRouteGroupMap[service.service])
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
