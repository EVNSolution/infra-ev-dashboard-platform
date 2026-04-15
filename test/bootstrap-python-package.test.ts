import * as fs from 'node:fs';
import * as path from 'node:path';

import { listBootstrapPackageFiles } from '../lib/bootstrapPackage';

function packageFilePath(fileName: string): string {
  return path.join(__dirname, '..', 'bootstrap', 'ev_dashboard_runtime', fileName);
}

describe('python bootstrap package', () => {
  test('stages the expected package files', () => {
    const files = listBootstrapPackageFiles();

    expect(files.map((file) => file.relativePath)).toEqual([
      'ev_dashboard_runtime/__init__.py',
      'ev_dashboard_runtime/app_host.py',
      'ev_dashboard_runtime/cli.py',
      'ev_dashboard_runtime/common.py',
      'ev_dashboard_runtime/data_host.py'
    ]);
  });

  test('cli exposes the required runtime entrypoints', () => {
    const cliSource = fs.readFileSync(packageFilePath('cli.py'), 'utf8');

    expect(cliSource).toContain('verify-app');
    expect(cliSource).toContain('verify-data');
    expect(cliSource).toContain('reconcile-app');
    expect(cliSource).toContain('bootstrap-data');
  });
});
