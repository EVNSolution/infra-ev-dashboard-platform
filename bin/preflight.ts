#!/usr/bin/env node

import { buildDeployPreflightReport, formatDeployPreflightReport } from '../lib/preflight';

const report = buildDeployPreflightReport(process.env);
const formatted = formatDeployPreflightReport(report);

if (report.errors.length > 0) {
  process.stderr.write(formatted);
  process.exit(1);
}

process.stdout.write(formatted);
