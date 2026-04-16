import * as fs from 'node:fs';
import * as path from 'node:path';

const RELEASE_MANIFEST_SERVICE_KEYS = [
  'edge-api-gateway',
  'front-web-console',
  'service-account-access',
  'service-announcement-registry',
  'service-attendance-registry',
  'service-delivery-record',
  'service-dispatch-operations-view',
  'service-dispatch-registry',
  'service-driver-operations-view',
  'service-driver-profile',
  'service-notification-hub',
  'service-organization-registry',
  'service-personnel-document-registry',
  'service-region-analytics',
  'service-region-registry',
  'service-settlement-operations-view',
  'service-settlement-payroll',
  'service-settlement-registry',
  'service-support-registry',
  'service-telemetry-dead-letter',
  'service-telemetry-hub',
  'service-telemetry-listener',
  'service-terminal-registry',
  'service-vehicle-assignment',
  'service-vehicle-operations-view',
  'service-vehicle-registry'
] as const;

export type ReleaseManifestServiceName = (typeof RELEASE_MANIFEST_SERVICE_KEYS)[number];

export const RELEASE_MANIFEST_IMAGE_ENV_KEYS: Record<
  ReleaseManifestServiceName,
  keyof NodeJS.ProcessEnv
> = {
  'edge-api-gateway': 'GATEWAY_IMAGE_URI',
  'front-web-console': 'FRONT_IMAGE_URI',
  'service-account-access': 'ACCOUNT_ACCESS_IMAGE_URI',
  'service-announcement-registry': 'ANNOUNCEMENT_REGISTRY_IMAGE_URI',
  'service-attendance-registry': 'ATTENDANCE_REGISTRY_IMAGE_URI',
  'service-delivery-record': 'DELIVERY_RECORD_IMAGE_URI',
  'service-dispatch-operations-view': 'DISPATCH_OPS_IMAGE_URI',
  'service-dispatch-registry': 'DISPATCH_REGISTRY_IMAGE_URI',
  'service-driver-operations-view': 'DRIVER_OPS_IMAGE_URI',
  'service-driver-profile': 'DRIVER_PROFILE_IMAGE_URI',
  'service-notification-hub': 'NOTIFICATION_HUB_IMAGE_URI',
  'service-organization-registry': 'ORGANIZATION_IMAGE_URI',
  'service-personnel-document-registry': 'PERSONNEL_DOCUMENT_IMAGE_URI',
  'service-region-analytics': 'REGION_ANALYTICS_IMAGE_URI',
  'service-region-registry': 'REGION_REGISTRY_IMAGE_URI',
  'service-settlement-operations-view': 'SETTLEMENT_OPS_IMAGE_URI',
  'service-settlement-payroll': 'SETTLEMENT_PAYROLL_IMAGE_URI',
  'service-settlement-registry': 'SETTLEMENT_REGISTRY_IMAGE_URI',
  'service-support-registry': 'SUPPORT_REGISTRY_IMAGE_URI',
  'service-telemetry-dead-letter': 'TELEMETRY_DEAD_LETTER_IMAGE_URI',
  'service-telemetry-hub': 'TELEMETRY_HUB_IMAGE_URI',
  'service-telemetry-listener': 'TELEMETRY_LISTENER_IMAGE_URI',
  'service-terminal-registry': 'TERMINAL_REGISTRY_IMAGE_URI',
  'service-vehicle-assignment': 'DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI',
  'service-vehicle-operations-view': 'VEHICLE_OPS_IMAGE_URI',
  'service-vehicle-registry': 'VEHICLE_ASSET_IMAGE_URI'
};

export type ReleaseManifestService = {
  service: ReleaseManifestServiceName;
  imageUri: string;
};

export type ReleaseManifest = {
  manifestPath: string;
  manifestAbsolutePath: string;
  releaseId: string;
  services: ReleaseManifestService[];
};

type ParsedString = {
  value: string;
  nextIndex: number;
};

const RELEASE_MANIFEST_SERVICE_KEY_SET = new Set<string>(RELEASE_MANIFEST_SERVICE_KEYS);

export function getReleaseManifestServiceNames(): readonly ReleaseManifestServiceName[] {
  return RELEASE_MANIFEST_SERVICE_KEYS;
}

export function loadReleaseManifest(repoRoot: string, manifestPath: string): ReleaseManifest {
  if (!manifestPath.trim()) {
    throw new Error('Release manifest path is required.');
  }

  if (path.isAbsolute(manifestPath)) {
    throw new Error('Release manifest path must be repo-relative.');
  }

  const manifestAbsolutePath = path.resolve(repoRoot, manifestPath);
  const relativeFromRoot = path.relative(repoRoot, manifestAbsolutePath);
  if (relativeFromRoot.startsWith('..') || path.isAbsolute(relativeFromRoot)) {
    throw new Error('Release manifest path must stay inside the infra repo.');
  }

  let rawManifest = '';
  try {
    rawManifest = fs.readFileSync(manifestAbsolutePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Release manifest file does not exist: ${manifestPath}`);
    }
    throw error;
  }

  const duplicateServiceKeys = findDuplicateServiceKeys(rawManifest);
  if (duplicateServiceKeys.length > 0) {
    throw new Error(`Release manifest contains duplicate service key: ${duplicateServiceKeys[0]}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawManifest);
  } catch {
    throw new Error(`Release manifest file is not valid JSON: ${manifestPath}`);
  }

  if (!isRecord(parsed)) {
    throw new Error('Release manifest root must be a JSON object.');
  }

  const releaseId = parsed.release_id;
  if (typeof releaseId !== 'string' || !releaseId.trim()) {
    throw new Error('Release manifest must include a non-empty "release_id" string.');
  }

  const services = parsed.services;
  if (!isRecord(services)) {
    throw new Error('Release manifest must include a "services" object.');
  }

  const normalizedServices = Object.entries(services).map(([service, value]) => {
    if (!RELEASE_MANIFEST_SERVICE_KEY_SET.has(service)) {
      throw new Error(`Release manifest contains unknown service: ${service}`);
    }

    if (!isRecord(value)) {
      throw new Error(`Release manifest service ${service} must be an object.`);
    }

    const imageUri = value.image_uri;
    if (typeof imageUri !== 'string' || !imageUri.trim()) {
      throw new Error(`Release manifest service ${service} must include a non-empty "image_uri".`);
    }

    if (usesMutableLatestTag(imageUri)) {
      throw new Error(`Release manifest service ${service} must not use the mutable "latest" tag.`);
    }

    return {
      service: service as ReleaseManifestServiceName,
      imageUri: imageUri.trim()
    };
  });

  if (normalizedServices.length === 0) {
    throw new Error('Release manifest must include at least one changed service.');
  }

  normalizedServices.sort((left, right) => left.service.localeCompare(right.service));

  return {
    manifestPath,
    manifestAbsolutePath,
    releaseId: releaseId.trim(),
    services: normalizedServices
  };
}

function usesMutableLatestTag(imageUri: string): boolean {
  return imageUri.trim().endsWith(':latest');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findDuplicateServiceKeys(rawManifest: string): string[] {
  const servicesObjectRange = findTopLevelPropertyObjectRange(rawManifest, 'services');
  if (!servicesObjectRange) {
    return [];
  }

  const serviceKeys = readTopLevelObjectKeys(rawManifest, servicesObjectRange.start, servicesObjectRange.end);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const serviceKey of serviceKeys) {
    if (seen.has(serviceKey)) {
      duplicates.add(serviceKey);
      continue;
    }
    seen.add(serviceKey);
  }
  return [...duplicates];
}

function findTopLevelPropertyObjectRange(
  rawManifest: string,
  targetProperty: string
): { start: number; end: number } | null {
  let index = skipWhitespace(rawManifest, 0);
  if (rawManifest[index] !== '{') {
    return null;
  }

  index += 1;
  while (index < rawManifest.length) {
    index = skipWhitespace(rawManifest, index);
    if (rawManifest[index] === '}') {
      return null;
    }

    const parsedKey = parseJsonString(rawManifest, index);
    const key = parsedKey.value;
    index = skipWhitespace(rawManifest, parsedKey.nextIndex);
    if (rawManifest[index] !== ':') {
      throw new Error('Release manifest file is not valid JSON.');
    }

    index = skipWhitespace(rawManifest, index + 1);
    if (key === targetProperty) {
      if (rawManifest[index] !== '{') {
        return null;
      }
      return {
        start: index,
        end: findMatchingObjectEnd(rawManifest, index)
      };
    }

    index = skipJsonValue(rawManifest, index);
    index = skipWhitespace(rawManifest, index);
    if (rawManifest[index] === ',') {
      index += 1;
    }
  }

  return null;
}

function readTopLevelObjectKeys(rawManifest: string, start: number, end: number): string[] {
  const keys: string[] = [];
  let index = start + 1;

  while (index < end) {
    index = skipWhitespace(rawManifest, index);
    if (index >= end || rawManifest[index] === '}') {
      break;
    }

    const parsedKey = parseJsonString(rawManifest, index);
    keys.push(parsedKey.value);
    index = skipWhitespace(rawManifest, parsedKey.nextIndex);
    if (rawManifest[index] !== ':') {
      throw new Error('Release manifest file is not valid JSON.');
    }

    index = skipWhitespace(rawManifest, index + 1);
    index = skipJsonValue(rawManifest, index);
    index = skipWhitespace(rawManifest, index);
    if (rawManifest[index] === ',') {
      index += 1;
    }
  }

  return keys;
}

function skipJsonValue(rawManifest: string, index: number): number {
  const current = rawManifest[index];
  if (current === '{') {
    return findMatchingObjectEnd(rawManifest, index) + 1;
  }
  if (current === '[') {
    return findMatchingArrayEnd(rawManifest, index) + 1;
  }
  if (current === '"') {
    return parseJsonString(rawManifest, index).nextIndex;
  }
  return skipPrimitiveValue(rawManifest, index);
}

function skipPrimitiveValue(rawManifest: string, index: number): number {
  let cursor = index;
  while (cursor < rawManifest.length) {
    const current = rawManifest[cursor];
    if (current === ',' || current === '}' || current === ']' || /\s/.test(current)) {
      return cursor;
    }
    cursor += 1;
  }
  return cursor;
}

function findMatchingObjectEnd(rawManifest: string, start: number): number {
  let depth = 0;
  let index = start;
  let inString = false;
  let escapeNext = false;

  while (index < rawManifest.length) {
    const current = rawManifest[index];
    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (current === '\\') {
        escapeNext = true;
      } else if (current === '"') {
        inString = false;
      }
      index += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
      index += 1;
      continue;
    }

    if (current === '{') {
      depth += 1;
    } else if (current === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }

    index += 1;
  }

  throw new Error('Release manifest file is not valid JSON.');
}

function findMatchingArrayEnd(rawManifest: string, start: number): number {
  let depth = 0;
  let index = start;
  let inString = false;
  let escapeNext = false;

  while (index < rawManifest.length) {
    const current = rawManifest[index];
    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (current === '\\') {
        escapeNext = true;
      } else if (current === '"') {
        inString = false;
      }
      index += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
      index += 1;
      continue;
    }

    if (current === '[') {
      depth += 1;
    } else if (current === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }

    index += 1;
  }

  throw new Error('Release manifest file is not valid JSON.');
}

function parseJsonString(rawManifest: string, start: number): ParsedString {
  if (rawManifest[start] !== '"') {
    throw new Error('Release manifest file is not valid JSON.');
  }

  let index = start + 1;
  let escapeNext = false;
  while (index < rawManifest.length) {
    const current = rawManifest[index];
    if (escapeNext) {
      escapeNext = false;
      index += 1;
      continue;
    }
    if (current === '\\') {
      escapeNext = true;
      index += 1;
      continue;
    }
    if (current === '"') {
      const rawString = rawManifest.slice(start, index + 1);
      return {
        value: JSON.parse(rawString) as string,
        nextIndex: index + 1
      };
    }
    index += 1;
  }

  throw new Error('Release manifest file is not valid JSON.');
}

function skipWhitespace(rawManifest: string, index: number): number {
  let cursor = index;
  while (cursor < rawManifest.length && /\s/.test(rawManifest[cursor])) {
    cursor += 1;
  }
  return cursor;
}
