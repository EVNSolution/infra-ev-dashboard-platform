#!/usr/bin/env node

import { formatPostDeploySmokeReport, runPostDeploySmokeChecks } from '../lib/postDeploySmoke';

async function main(): Promise<void> {
  const report = await runPostDeploySmokeChecks(process.env);
  const formatted = formatPostDeploySmokeReport(report);

  if (report.errors.length > 0) {
    process.stderr.write(formatted);
    process.exit(1);
  }

  process.stdout.write(formatted);
}

void main();
