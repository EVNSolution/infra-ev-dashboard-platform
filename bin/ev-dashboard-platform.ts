#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { buildPlatformConfigFromEnv } from '../lib/config';
import { EvDashboardPlatformStack } from '../lib/ev-dashboard-platform-stack';

const app = new cdk.App();
const config = buildPlatformConfigFromEnv(process.env);
const deployEnvironment = normalizeDeployEnvironment(process.env.DEPLOY_ENVIRONMENT);
const stackId =
  deployEnvironment === 'prod'
    ? 'EvDashboardPlatformStack'
    : `EvDashboardPlatform${capitalize(deployEnvironment)}Stack`;

new EvDashboardPlatformStack(app, stackId, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.region
  },
  stackName: stackId,
  config
});

function normalizeDeployEnvironment(value: string | undefined): 'dev' | 'stage' | 'prod' {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'dev' || normalized === 'stage' || normalized === 'prod') {
    return normalized;
  }

  return 'prod';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
