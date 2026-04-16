import type { PlatformConfig } from './config';

export const gatewayRouteGroups = [
  'people-and-assets',
  'dispatch-inputs',
  'dispatch-read-models',
  'settlement',
  'support-surface',
  'terminal-and-telemetry'
] as const;

export type GatewayRouteGroup = (typeof gatewayRouteGroups)[number];

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
  switch (group) {
    case 'people-and-assets':
      return (
        config.driverProfileDesiredCount > 0 ||
        config.personnelDocumentDesiredCount > 0 ||
        config.vehicleAssetDesiredCount > 0 ||
        config.driverVehicleAssignmentDesiredCount > 0
      );
    case 'dispatch-inputs':
      return (
        config.dispatchRegistryDesiredCount > 0 ||
        config.deliveryRecordDesiredCount > 0 ||
        config.attendanceRegistryDesiredCount > 0
      );
    case 'dispatch-read-models':
      return (
        config.dispatchOpsDesiredCount > 0 ||
        config.driverOpsDesiredCount > 0 ||
        config.vehicleOpsDesiredCount > 0
      );
    case 'settlement':
      return (
        config.settlementRegistryDesiredCount > 0 ||
        config.settlementPayrollDesiredCount > 0 ||
        config.settlementOpsDesiredCount > 0
      );
    case 'support-surface':
      return (
        config.regionRegistryDesiredCount > 0 ||
        config.regionAnalyticsDesiredCount > 0 ||
        config.announcementRegistryDesiredCount > 0 ||
        config.supportRegistryDesiredCount > 0 ||
        config.notificationHubDesiredCount > 0
      );
    case 'terminal-and-telemetry':
      return (
        (config.terminalRegistryDesiredCount ?? 0) > 0 ||
        (config.telemetryHubDesiredCount ?? 0) > 0 ||
        (config.telemetryDeadLetterDesiredCount ?? 0) > 0 ||
        (config.telemetryListenerDesiredCount ?? 0) > 0
      );
  }
}
