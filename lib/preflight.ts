import * as childProcess from 'node:child_process';

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
  supportSurface: boolean;
  terminalAndTelemetry: boolean;
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
  'SETTLEMENT_OPS_IMAGE_URI',
  'REGION_REGISTRY_IMAGE_URI',
  'REGION_ANALYTICS_IMAGE_URI',
  'ANNOUNCEMENT_REGISTRY_IMAGE_URI',
  'SUPPORT_REGISTRY_IMAGE_URI',
  'NOTIFICATION_HUB_IMAGE_URI',
  'TERMINAL_REGISTRY_IMAGE_URI',
  'TELEMETRY_HUB_IMAGE_URI',
  'TELEMETRY_DEAD_LETTER_IMAGE_URI',
  'TELEMETRY_LISTENER_IMAGE_URI'
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
  validateEcrImageAvailability(env, errors);
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

function validateEcrImageAvailability(env: NodeJS.ProcessEnv, errors: string[]): void {
  if (env.PREFLIGHT_SKIP_ECR_IMAGE_LOOKUP === '1') {
    return;
  }

  const region = env.AWS_REGION ?? env.CDK_DEFAULT_REGION;
  if (!region) {
    errors.push('AWS_REGION is required to validate ECR image availability.');
    return;
  }

  for (const key of IMAGE_ENV_KEYS) {
    const imageUri = env[key];
    if (!imageUri || !hasTagOrDigest(imageUri) || imageUri.includes('@sha256:') || imageUri.endsWith(':latest')) {
      continue;
    }

    const parsedImage = parseTaggedEcrImageUri(imageUri);
    if (!parsedImage) {
      continue;
    }

    try {
      const digest = childProcess
        .execFileSync(
          'aws',
          [
            'ecr',
            'describe-images',
            '--region',
            region,
            '--repository-name',
            parsedImage.repositoryName,
            '--image-ids',
            `imageTag=${parsedImage.tag}`,
            '--query',
            'imageDetails[0].imageDigest',
            '--output',
            'text'
          ],
          {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe']
          }
        )
        .trim();

      if (!digest || digest === 'None' || digest === 'null') {
        errors.push(`${key} points to an ECR tag that does not exist: ${imageUri}`);
      }
    } catch {
      errors.push(`${key} points to an ECR tag that does not exist: ${imageUri}`);
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
  const listenerEnabled = (config.telemetryListenerDesiredCount ?? 0) > 0;

  if ((anyApiSliceEnabled || listenerEnabled) && config.gatewayDesiredCount === 0) {
    errors.push('Gateway desired count must stay above zero when any API slice is enabled.');
  }

  if (
    (
      slices.companyGovernance ||
      slices.peopleAndAssets ||
      slices.dispatchInputs ||
      slices.dispatchReadModels ||
      slices.settlement ||
      slices.supportSurface
    ) &&
    !slices.authSurface
  ) {
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

  if (slices.supportSurface && !slices.settlement) {
    errors.push('Support Surface slice requires Settlement to stay enabled.');
  }

  if (slices.terminalAndTelemetry && !slices.supportSurface) {
    errors.push('Terminal And Telemetry slice requires Support Surface to stay enabled.');
  }

  if (
    slices.terminalAndTelemetry &&
    (config.terminalRegistryBaseUrl !== 'http://terminal-registry-api:8000' ||
      config.telemetryHubBaseUrl !== 'http://telemetry-hub-api:8000')
  ) {
    errors.push(
      'Terminal And Telemetry slice requires internal bridge URLs: TERMINAL_REGISTRY_BASE_URL=http://terminal-registry-api:8000 and TELEMETRY_HUB_BASE_URL=http://telemetry-hub-api:8000.'
    );
  }

  if ((config.telemetryListenerDesiredCount ?? 0) > 0 && !config.telemetryListenerMqttHost) {
    errors.push('TELEMETRY_LISTENER_MQTT_HOST is required when telemetry listener desired count is above zero.');
  }

  if (
    (config.telemetryListenerDesiredCount ?? 0) > 0 &&
    ((config.telemetryHubDesiredCount ?? 0) === 0 || (config.telemetryDeadLetterDesiredCount ?? 0) === 0)
  ) {
    errors.push('Telemetry listener requires telemetry hub and telemetry dead-letter services to stay enabled.');
  }

  if (config.frontDesiredCount === 0) {
    warnings.push('front-web-console desired count is zero. Public apex smoke will not prove the full user path.');
  }

  if (slices.terminalAndTelemetry && (config.telemetryListenerDesiredCount ?? 0) === 0) {
    warnings.push(
      'Telemetry listener desired count is zero. Terminal and telemetry APIs can migrate, but live MQTT ingest remains disabled until a broker endpoint is known.'
    );
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
      config.settlementOpsDesiredCount > 0,
    supportSurface:
      config.regionRegistryDesiredCount > 0 ||
      config.regionAnalyticsDesiredCount > 0 ||
      config.announcementRegistryDesiredCount > 0 ||
      config.supportRegistryDesiredCount > 0 ||
      config.notificationHubDesiredCount > 0,
    terminalAndTelemetry:
      (config.terminalRegistryDesiredCount ?? 0) > 0 ||
      (config.telemetryHubDesiredCount ?? 0) > 0 ||
      (config.telemetryDeadLetterDesiredCount ?? 0) > 0 ||
      (config.telemetryListenerDesiredCount ?? 0) > 0
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
  if (slices.supportSurface) {
    labels.push('Support Surface');
  }
  if (slices.terminalAndTelemetry) {
    labels.push('Terminal And Telemetry');
  }

  return labels;
}

function hasStatefulSlices(slices: SliceState): boolean {
  return (
    slices.authSurface ||
    slices.companyGovernance ||
    slices.peopleAndAssets ||
    slices.dispatchInputs ||
    slices.settlement ||
    slices.supportSurface ||
    slices.terminalAndTelemetry
  );
}

function hasDirectUpstreamSlices(slices: SliceState): boolean {
  return (
    slices.authSurface ||
    slices.companyGovernance ||
    slices.peopleAndAssets ||
    slices.dispatchInputs ||
    slices.dispatchReadModels ||
    slices.settlement ||
    slices.supportSurface ||
    slices.terminalAndTelemetry
  );
}

function hasTagOrDigest(imageUri: string): boolean {
  const afterSlash = imageUri.substring(imageUri.lastIndexOf('/') + 1);
  return afterSlash.includes(':') || imageUri.includes('@sha256:');
}

function parseTaggedEcrImageUri(imageUri: string): { repositoryName: string; tag: string } | undefined {
  const match = imageUri.match(/^\d+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/(.+):([^:]+)$/);
  if (!match) {
    return undefined;
  }

  return {
    repositoryName: match[1],
    tag: match[2]
  };
}

function trimDot(value: string): string {
  return value.endsWith('.') ? value.slice(0, -1) : value;
}

function normalizeEnvironment(value: string | undefined): string {
  return (value ?? 'dev').trim().toLowerCase();
}
