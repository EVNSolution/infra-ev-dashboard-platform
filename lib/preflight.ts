import { buildPlatformConfigFromEnv, PlatformConfig } from './config';

export type DeployPreflightReport = {
  environment: string;
  enabledSlices: string[];
  warnings: string[];
  errors: string[];
  waitSignals: string[];
};

type SliceState = {
  authSurface: boolean;
  companyGovernance: boolean;
  peopleAndAssets: boolean;
  dispatchInputs: boolean;
  dispatchReadModels: boolean;
  settlement: boolean;
};

const IMAGE_ENV_KEYS: Array<keyof NodeJS.ProcessEnv> = [
  'FRONT_IMAGE_URI',
  'GATEWAY_IMAGE_URI',
  'ACCOUNT_ACCESS_IMAGE_URI',
  'ORGANIZATION_IMAGE_URI',
  'DRIVER_PROFILE_IMAGE_URI',
  'PERSONNEL_DOCUMENT_IMAGE_URI',
  'VEHICLE_ASSET_IMAGE_URI',
  'DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI',
  'DISPATCH_REGISTRY_IMAGE_URI',
  'DELIVERY_RECORD_IMAGE_URI',
  'ATTENDANCE_REGISTRY_IMAGE_URI',
  'DISPATCH_OPS_IMAGE_URI',
  'DRIVER_OPS_IMAGE_URI',
  'VEHICLE_OPS_IMAGE_URI',
  'SETTLEMENT_REGISTRY_IMAGE_URI',
  'SETTLEMENT_PAYROLL_IMAGE_URI',
  'SETTLEMENT_OPS_IMAGE_URI'
];

export function buildDeployPreflightReport(env: NodeJS.ProcessEnv): DeployPreflightReport {
  const environment = normalizeEnvironment(env.DEPLOY_ENVIRONMENT);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!env.INFRA_ROLE_ARN) {
    errors.push('INFRA_ROLE_ARN is required for deploy preflight.');
  }

  if (!['dev', 'stage', 'prod'].includes(environment)) {
    errors.push(`DEPLOY_ENVIRONMENT must be one of dev, stage, prod. Received: ${environment}`);
  }

  let config: PlatformConfig | undefined;
  try {
    config = buildPlatformConfigFromEnv(env);
  } catch (error) {
    errors.push((error as Error).message);
  }

  if (!config) {
    return {
      environment,
      enabledSlices: [],
      warnings,
      errors,
      waitSignals: []
    };
  }

  validateImageUris(env, errors);
  validateEnvironmentDomains(environment, config, errors);

  const slices = getSliceState(config);
  validateSliceDependencies(config, slices, errors, warnings);

  return {
    environment,
    enabledSlices: formatEnabledSlices(slices),
    warnings,
    errors,
    waitSignals: buildWaitSignals(config, slices)
  };
}

export function formatDeployPreflightReport(report: DeployPreflightReport): string {
  const lines: string[] = [];

  lines.push('ev-dashboard deploy preflight');
  lines.push(`Environment: ${report.environment}`);
  lines.push(`Enabled slices: ${report.enabledSlices.length > 0 ? report.enabledSlices.join(' -> ') : 'none'}`);

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const error of report.errors) {
      lines.push(`- ${error}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  if (report.waitSignals.length > 0) {
    lines.push('Wait signals:');
    for (const signal of report.waitSignals) {
      lines.push(`- ${signal}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function validateImageUris(env: NodeJS.ProcessEnv, errors: string[]): void {
  for (const key of IMAGE_ENV_KEYS) {
    const value = env[key];
    if (!value) {
      continue;
    }

    if (value.endsWith(':latest')) {
      errors.push(`${key} must not use the mutable "latest" tag. Use an immutable SHA-style tag instead.`);
      continue;
    }

    if (!hasTagOrDigest(value)) {
      errors.push(`${key} must include an explicit image tag or digest.`);
    }
  }
}

function validateEnvironmentDomains(environment: string, config: PlatformConfig, errors: string[]): void {
  const hostedZoneName = trimDot(config.hostedZoneName);
  const apexDomain = trimDot(config.apexDomain);
  const apiDomain = trimDot(config.apiDomain);

  if (!apexDomain.endsWith(hostedZoneName) || !apiDomain.endsWith(hostedZoneName)) {
    errors.push('APEX_DOMAIN and API_DOMAIN must both belong to HOSTED_ZONE_NAME.');
  }

  if (environment === 'prod') {
    if (apexDomain !== 'ev-dashboard.com' || apiDomain !== 'api.ev-dashboard.com') {
      errors.push('prod deploys must target ev-dashboard.com and api.ev-dashboard.com.');
    }
    return;
  }

  if (apexDomain === 'ev-dashboard.com' || apiDomain === 'api.ev-dashboard.com') {
    errors.push('dev/stage deploys must not target the production domains.');
  }
}

function validateSliceDependencies(
  config: PlatformConfig,
  slices: SliceState,
  errors: string[],
  warnings: string[]
): void {
  const anyApiSliceEnabled = Object.values(slices).some(Boolean);

  if (anyApiSliceEnabled && config.gatewayDesiredCount === 0) {
    errors.push('Gateway desired count must stay above zero when any API slice is enabled.');
  }

  if ((slices.companyGovernance || slices.peopleAndAssets || slices.dispatchInputs || slices.dispatchReadModels || slices.settlement) && !slices.authSurface) {
    errors.push('Auth Surface must stay enabled before any later slice can deploy.');
  }

  if (slices.peopleAndAssets && !slices.companyGovernance) {
    errors.push('People And Assets slice requires Company Governance to stay enabled.');
  }

  if (slices.dispatchInputs && !slices.peopleAndAssets) {
    errors.push('Dispatch inputs slice requires the full people-and-assets slice to stay enabled.');
  }

  if (slices.dispatchReadModels && !slices.dispatchInputs) {
    errors.push('Dispatch read-model slice requires the full dispatch-inputs slice to stay enabled.');
  }

  if (slices.settlement && !slices.dispatchInputs) {
    errors.push('Settlement slice requires the full dispatch-inputs slice to stay enabled.');
  }

  if (config.frontDesiredCount === 0) {
    warnings.push('front-web-console desired count is zero. Public apex smoke will not prove the full user path.');
  }
}

function buildWaitSignals(config: PlatformConfig, slices: SliceState): string[] {
  const signals: string[] = [
    'Run the gate in this order: npm run preflight -> npm test -- --runInBand -> npx cdk synth -> deploy workflow.',
    'ALB target draining can keep CloudFormation open for up to 300s after public smoke already looks healthy.'
  ];

  if (hasStatefulSlices(slices)) {
    signals.push(
      'Stateful slices are enabled. Expect an RDS create-or-update quiet period before public smoke settles.'
    );
  }

  if (hasDirectUpstreamSlices(slices) && config.gatewayDesiredCount > 0) {
    signals.push(
      'New or updated direct Service Connect upstreams are enabled. Expect a later edge-api-gateway rollout after backend services register.'
    );
  }

  return signals;
}

function getSliceState(config: PlatformConfig): SliceState {
  return {
    authSurface: config.accountAccessDesiredCount > 0,
    companyGovernance: config.organizationDesiredCount > 0,
    peopleAndAssets:
      config.driverProfileDesiredCount > 0 ||
      config.personnelDocumentDesiredCount > 0 ||
      config.vehicleAssetDesiredCount > 0 ||
      config.driverVehicleAssignmentDesiredCount > 0,
    dispatchInputs:
      config.dispatchRegistryDesiredCount > 0 ||
      config.deliveryRecordDesiredCount > 0 ||
      config.attendanceRegistryDesiredCount > 0,
    dispatchReadModels:
      config.dispatchOpsDesiredCount > 0 || config.driverOpsDesiredCount > 0 || config.vehicleOpsDesiredCount > 0,
    settlement:
      config.settlementRegistryDesiredCount > 0 ||
      config.settlementPayrollDesiredCount > 0 ||
      config.settlementOpsDesiredCount > 0
  };
}

function formatEnabledSlices(slices: SliceState): string[] {
  const labels: string[] = [];

  if (slices.authSurface) {
    labels.push('Auth Surface');
  }
  if (slices.companyGovernance) {
    labels.push('Company Governance');
  }
  if (slices.peopleAndAssets) {
    labels.push('People And Assets');
  }
  if (slices.dispatchInputs) {
    labels.push('Dispatch Inputs');
  }
  if (slices.dispatchReadModels) {
    labels.push('Dispatch Read Models');
  }
  if (slices.settlement) {
    labels.push('Settlement');
  }

  return labels;
}

function hasStatefulSlices(slices: SliceState): boolean {
  return (
    slices.authSurface ||
    slices.companyGovernance ||
    slices.peopleAndAssets ||
    slices.dispatchInputs ||
    slices.settlement
  );
}

function hasDirectUpstreamSlices(slices: SliceState): boolean {
  return (
    slices.authSurface ||
    slices.companyGovernance ||
    slices.peopleAndAssets ||
    slices.dispatchInputs ||
    slices.dispatchReadModels ||
    slices.settlement
  );
}

function hasTagOrDigest(imageUri: string): boolean {
  const afterSlash = imageUri.substring(imageUri.lastIndexOf('/') + 1);
  return afterSlash.includes(':') || imageUri.includes('@sha256:');
}

function trimDot(value: string): string {
  return value.endsWith('.') ? value.slice(0, -1) : value;
}

function normalizeEnvironment(value: string | undefined): string {
  return (value ?? 'dev').trim().toLowerCase();
}
