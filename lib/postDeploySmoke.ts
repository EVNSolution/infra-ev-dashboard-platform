import { buildPlatformConfigFromEnv } from './config';

export type PostDeploySmokeCheck = {
  name: string;
  url: string;
  expectedStatus: number;
  redirect?: 'follow' | 'manual';
};

export type PostDeploySmokeResult = {
  check: PostDeploySmokeCheck;
  ok: boolean;
  actualStatus?: number;
  error?: string;
};

export type PostDeploySmokeReport = {
  checks: PostDeploySmokeCheck[];
  results: PostDeploySmokeResult[];
  errors: string[];
};

type PostDeploySmokeOptions = {
  timeoutMs?: number;
  intervalMs?: number;
  requestTimeoutMs?: number;
  sleepImpl?: (ms: number) => Promise<void>;
};

const PLACEHOLDER_ENTITY_ID = '00000000-0000-0000-0000-000000000001';

export function buildPostDeploySmokeChecks(env: NodeJS.ProcessEnv): PostDeploySmokeCheck[] {
  const config = buildPlatformConfigFromEnv(env);
  const checks: PostDeploySmokeCheck[] = [];
  const apexUrl = `https://${trimTrailingSlash(config.apexDomain)}`;
  const apiUrl = `https://${trimTrailingSlash(config.apiDomain)}`;

  if (config.frontDesiredCount > 0) {
    checks.push({
      name: 'front shell',
      url: `${apexUrl}/`,
      expectedStatus: 200
    });

    for (const host of config.cockpitHosts) {
      checks.push({
        name: `cockpit shell: ${host}`,
        url: `https://${trimTrailingSlash(host)}/`,
        expectedStatus: 200
      });
    }
  }

  if (config.gatewayDesiredCount > 0 && config.accountAccessDesiredCount > 0) {
    checks.push(
      { name: 'auth health', url: `${apiUrl}/api/auth/health/`, expectedStatus: 200 },
      { name: 'openapi document', url: `${apiUrl}/openapi.yaml`, expectedStatus: 200 },
      { name: 'swagger ui', url: `${apiUrl}/swagger/`, expectedStatus: 200 },
      {
        name: 'account admin redirect',
        url: `${apiUrl}/admin/account-access/`,
        expectedStatus: 302,
        redirect: 'manual'
      },
      { name: 'account admin login', url: `${apiUrl}/admin/account-access/login/`, expectedStatus: 200 }
    );
  }

  if (config.organizationDesiredCount > 0) {
    checks.push(
      {
        name: 'organization health',
        url: `${apiUrl}/api/org/health/`,
        expectedStatus: 200
      },
      {
        name: 'company tenant resolve validation',
        url: `${apiUrl}/api/org/companies/public/resolve/?tenant_code=bootstrap-proof-smoke`,
        expectedStatus: 404
      }
    );
  }

  if (isPeopleAndAssetsEnabled(config)) {
    checks.push(
      { name: 'drivers protected list', url: `${apiUrl}/api/drivers/`, expectedStatus: 401 },
      {
        name: 'vehicle masters protected list',
        url: `${apiUrl}/api/vehicles/vehicle-masters/`,
        expectedStatus: 401
      },
      {
        name: 'personnel documents protected list',
        url: `${apiUrl}/api/personnel-documents/documents/`,
        expectedStatus: 401
      },
      {
        name: 'driver vehicle assignments protected list',
        url: `${apiUrl}/api/driver-vehicle-assignments/assignments/`,
        expectedStatus: 401
      }
    );
  }

  if (isDispatchInputsEnabled(config)) {
    checks.push(
      { name: 'dispatch health', url: `${apiUrl}/api/dispatch/health/`, expectedStatus: 200 },
      { name: 'dispatch plans protected list', url: `${apiUrl}/api/dispatch/plans/`, expectedStatus: 401 },
      { name: 'delivery record health', url: `${apiUrl}/api/delivery-record/health/`, expectedStatus: 200 },
      {
        name: 'delivery records protected list',
        url: `${apiUrl}/api/delivery-record/records/`,
        expectedStatus: 401
      },
      { name: 'attendance health', url: `${apiUrl}/api/attendance/health/`, expectedStatus: 200 },
      { name: 'attendance days protected list', url: `${apiUrl}/api/attendance/days/`, expectedStatus: 401 }
    );
  }

  if (isDispatchReadModelsEnabled(config)) {
    checks.push(
      { name: 'dispatch ops health', url: `${apiUrl}/api/dispatch-ops/health/`, expectedStatus: 200 },
      { name: 'driver ops health', url: `${apiUrl}/api/driver-ops/health/`, expectedStatus: 200 },
      { name: 'vehicle ops health', url: `${apiUrl}/api/vehicle-ops/health/`, expectedStatus: 200 }
    );
  }

  if (isSettlementEnabled(config)) {
    checks.push(
      {
        name: 'settlement registry health',
        url: `${apiUrl}/api/settlement-registry/health/`,
        expectedStatus: 200
      },
      { name: 'settlements health', url: `${apiUrl}/api/settlements/health/`, expectedStatus: 200 },
      { name: 'settlement ops health', url: `${apiUrl}/api/settlement-ops/health/`, expectedStatus: 200 },
      {
        name: 'settlement metadata protected read',
        url: `${apiUrl}/api/settlement-registry/settlement-config/metadata/`,
        expectedStatus: 401
      },
      {
        name: 'settlement runs protected list',
        url: `${apiUrl}/api/settlements/runs/`,
        expectedStatus: 401
      },
      { name: 'settlement ops protected runs', url: `${apiUrl}/api/settlement-ops/runs/`, expectedStatus: 401 }
    );
  }

  if (isSupportSurfaceEnabled(config)) {
    checks.push(
      { name: 'region registry health', url: `${apiUrl}/api/regions/health/`, expectedStatus: 200 },
      { name: 'region analytics health', url: `${apiUrl}/api/region-analytics/health/`, expectedStatus: 200 },
      { name: 'announcement registry health', url: `${apiUrl}/api/announcements/health/`, expectedStatus: 200 },
      { name: 'support registry health', url: `${apiUrl}/api/ticket/health/`, expectedStatus: 200 },
      { name: 'notification hub health', url: `${apiUrl}/api/notifications/health/`, expectedStatus: 200 },
      { name: 'regions protected list', url: `${apiUrl}/api/regions/`, expectedStatus: 401 },
      {
        name: 'region analytics protected list',
        url: `${apiUrl}/api/region-analytics/daily-statistics/`,
        expectedStatus: 401
      },
      { name: 'announcements protected list', url: `${apiUrl}/api/announcements/`, expectedStatus: 401 },
      { name: 'support tickets protected list', url: `${apiUrl}/api/ticket/tickets/`, expectedStatus: 401 },
      {
        name: 'notifications protected list',
        url: `${apiUrl}/api/notifications/general/`,
        expectedStatus: 401
      }
    );
  }

  if (isTerminalAndTelemetryEnabled(config)) {
    checks.push(
      { name: 'terminal registry health', url: `${apiUrl}/api/terminals/health/`, expectedStatus: 200 },
      { name: 'terminals protected list', url: `${apiUrl}/api/terminals/`, expectedStatus: 401 },
      { name: 'telemetry hub health', url: `${apiUrl}/api/telemetry/health/`, expectedStatus: 200 },
      {
        name: 'telemetry latest-location protected read',
        url: `${apiUrl}/api/telemetry/terminals/${PLACEHOLDER_ENTITY_ID}/latest-location/`,
        expectedStatus: 401
      },
      {
        name: 'telemetry dead-letter health',
        url: `${apiUrl}/api/telemetry-dead-letters/health/`,
        expectedStatus: 200
      },
      {
        name: 'telemetry dead-letter protected list',
        url: `${apiUrl}/api/telemetry-dead-letters/`,
        expectedStatus: 401
      }
    );
  }

  return checks;
}

export async function runPostDeploySmokeChecks(
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch,
  options: PostDeploySmokeOptions = {}
): Promise<PostDeploySmokeReport> {
  const config = buildPlatformConfigFromEnv(env);
  const checks = buildPostDeploySmokeChecks(env);
  const sleepImpl = options.sleepImpl ?? defaultSleep;
  const timeoutMs =
    options.timeoutMs ?? resolveDurationMs(env.POST_DEPLOY_SMOKE_TIMEOUT_SECONDS, config.runtimeMode === 'ec2' ? 420_000 : 30_000);
  const intervalMs =
    options.intervalMs ?? resolveDurationMs(env.POST_DEPLOY_SMOKE_POLL_SECONDS, config.runtimeMode === 'ec2' ? 15_000 : 5_000);
  const requestTimeoutMs =
    options.requestTimeoutMs ??
    resolveDurationMs(
      env.POST_DEPLOY_SMOKE_REQUEST_TIMEOUT_SECONDS,
      Math.max(1, Math.min(intervalMs, config.runtimeMode === 'ec2' ? 15_000 : 5_000))
    );
  const deadline = Date.now() + timeoutMs;
  let report = await executePostDeploySmokeChecks(checks, fetchImpl, requestTimeoutMs);

  while (report.errors.length > 0 && Date.now() < deadline) {
    await sleepImpl(intervalMs);
    report = await executePostDeploySmokeChecks(checks, fetchImpl, requestTimeoutMs);
  }

  return report;
}

export function formatPostDeploySmokeReport(report: PostDeploySmokeReport): string {
  const lines: string[] = [];
  lines.push('Post-deploy public smoke');
  lines.push(`Checks: ${report.checks.length}`);

  if (report.results.length > 0) {
    lines.push('Results:');
    for (const result of report.results) {
      if (result.ok) {
        lines.push(`- ok: ${result.check.name} -> ${result.actualStatus}`);
      } else if (typeof result.actualStatus === 'number') {
        lines.push(
          `- fail: ${result.check.name} expected ${result.check.expectedStatus} but got ${result.actualStatus}`
        );
      } else {
        lines.push(`- fail: ${result.check.name} request failed: ${result.error}`);
      }
    }
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const error of report.errors) {
      lines.push(`- ${error}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function isPeopleAndAssetsEnabled(config: ReturnType<typeof buildPlatformConfigFromEnv>): boolean {
  return (
    config.driverProfileDesiredCount > 0 ||
    config.personnelDocumentDesiredCount > 0 ||
    config.vehicleAssetDesiredCount > 0 ||
    config.driverVehicleAssignmentDesiredCount > 0
  );
}

async function executePostDeploySmokeChecks(
  checks: PostDeploySmokeCheck[],
  fetchImpl: typeof fetch,
  requestTimeoutMs: number
): Promise<PostDeploySmokeReport> {
  const results: PostDeploySmokeResult[] = [];
  const errors: string[] = [];

  for (const check of checks) {
    try {
      const response = await fetchWithTimeout(fetchImpl, check, requestTimeoutMs);
      const ok = response.status === check.expectedStatus;
      const result: PostDeploySmokeResult = {
        check,
        ok,
        actualStatus: response.status
      };
      results.push(result);

      if (!ok) {
        errors.push(
          `${check.name} expected ${check.expectedStatus} but received ${response.status} from ${check.url}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        check,
        ok: false,
        error: message
      });
      errors.push(`${check.name} request failed for ${check.url}: ${message}`);
    }
  }

  return { checks, results, errors };
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  check: PostDeploySmokeCheck,
  requestTimeoutMs: number
): Promise<Response> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(new Error('request timed out')), requestTimeoutMs);

  try {
    return await fetchImpl(check.url, {
      method: 'GET',
      redirect: check.redirect ?? 'follow',
      signal: abortController.signal
    });
  } catch (error) {
    if (abortController.signal.aborted) {
      const reason = abortController.signal.reason;
      if (reason instanceof Error) {
        throw reason;
      }

      throw new Error(typeof reason === 'string' && reason.trim() !== '' ? reason : 'request timed out');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function resolveDurationMs(rawValue: string | undefined, fallbackMs: number): number {
  if (!rawValue || rawValue.trim() === '') {
    return fallbackMs;
  }

  const parsedSeconds = Number(rawValue);
  if (!Number.isFinite(parsedSeconds) || parsedSeconds <= 0) {
    return fallbackMs;
  }

  return parsedSeconds * 1000;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDispatchInputsEnabled(config: ReturnType<typeof buildPlatformConfigFromEnv>): boolean {
  return (
    config.dispatchRegistryDesiredCount > 0 ||
    config.deliveryRecordDesiredCount > 0 ||
    config.attendanceRegistryDesiredCount > 0
  );
}

function isDispatchReadModelsEnabled(config: ReturnType<typeof buildPlatformConfigFromEnv>): boolean {
  return config.dispatchOpsDesiredCount > 0 || config.driverOpsDesiredCount > 0 || config.vehicleOpsDesiredCount > 0;
}

function isSettlementEnabled(config: ReturnType<typeof buildPlatformConfigFromEnv>): boolean {
  return (
    config.settlementRegistryDesiredCount > 0 ||
    config.settlementPayrollDesiredCount > 0 ||
    config.settlementOpsDesiredCount > 0
  );
}

function isSupportSurfaceEnabled(config: ReturnType<typeof buildPlatformConfigFromEnv>): boolean {
  return (
    config.regionRegistryDesiredCount > 0 ||
    config.regionAnalyticsDesiredCount > 0 ||
    config.announcementRegistryDesiredCount > 0 ||
    config.supportRegistryDesiredCount > 0 ||
    config.notificationHubDesiredCount > 0
  );
}

function isTerminalAndTelemetryEnabled(config: ReturnType<typeof buildPlatformConfigFromEnv>): boolean {
  return (
    (config.terminalRegistryDesiredCount ?? 0) > 0 ||
    (config.telemetryHubDesiredCount ?? 0) > 0 ||
    (config.telemetryDeadLetterDesiredCount ?? 0) > 0
  );
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
