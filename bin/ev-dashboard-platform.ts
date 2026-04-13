#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { buildPlatformConfigFromEnv } from '../lib/config';
import { EvDashboardPlatformStack } from '../lib/ev-dashboard-platform-stack';

const app = new cdk.App();
const config = buildPlatformConfigFromEnv(process.env);

new EvDashboardPlatformStack(app, 'EvDashboardPlatformStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.region
  },
  config
});
