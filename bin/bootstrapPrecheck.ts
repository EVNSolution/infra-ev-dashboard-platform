#!/usr/bin/env node

import {
  buildBootstrapPrecheckReport,
  formatBootstrapPrecheckReport,
  runBootstrapPrecheck
} from '../lib/bootstrapPrecheck';

const report = buildBootstrapPrecheckReport(process.env);
process.stdout.write(formatBootstrapPrecheckReport(report));

if (report.errors.length > 0) {
  process.exit(1);
}

try {
  const executionPlan = runBootstrapPrecheck(process.env);
  process.stdout.write(`Executed ${executionPlan.steps.length} bootstrap precheck step(s).\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
