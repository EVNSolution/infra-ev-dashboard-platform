#!/usr/bin/env node

import { buildBootstrapPrecheckReport, formatBootstrapPrecheckReport } from '../lib/bootstrapPrecheck';

const report = buildBootstrapPrecheckReport(process.env);
const formatted = formatBootstrapPrecheckReport(report);

if (report.errors.length > 0) {
  process.stderr.write(formatted);
  process.exit(1);
}

process.stdout.write(formatted);
