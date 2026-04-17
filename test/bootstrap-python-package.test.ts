import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  buildBootstrapPackageDigest,
  listBootstrapPackageFiles,
  listBootstrapPackageSourceIdentities,
  renderBootstrapPackageStageCommands
} from '../lib/bootstrapPackage';

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

  test('stages each bootstrap file as a single base64 decode command', () => {
    const commands = renderBootstrapPackageStageCommands('/opt/ev-dashboard/bootstrap');
    const cliStageCommand = commands.find((command) => command.includes('ev_dashboard_runtime/cli.py'));

    expect(cliStageCommand).toBeDefined();
    expect(cliStageCommand).toContain("printf '%s' '");
    expect(cliStageCommand).toContain('| base64 -d > /opt/ev-dashboard/bootstrap/ev_dashboard_runtime/cli.py');
    expect(cliStageCommand).not.toContain("cat <<'");
  });

  test('uses git-tracked source identities for bootstrap package digest input', () => {
    const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    }).trim();
    const trackedPaths = listBootstrapPackageFiles().map((file) => `bootstrap/${file.relativePath}`);
    const expected = execFileSync('git', ['ls-files', '-s', '--', ...trackedPaths], {
      cwd: repoRoot,
      encoding: 'utf8'
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [mode, objectId, stage, repoRelativePath] = line.split(/\s+/);
        return {
          mode,
          objectId,
          stage,
          relativePath: repoRelativePath.replace(/^bootstrap\//, '')
        };
      });

    expect(listBootstrapPackageSourceIdentities()).toEqual(
      expected.map(({ objectId, relativePath }) => ({
        objectId,
        relativePath
      }))
    );
  });

  test('keeps the bootstrap package digest stable for the same source identities regardless of ordering', () => {
    const identities = [
      { relativePath: 'ev_dashboard_runtime/cli.py', objectId: 'c72b31802abf78f66da2e548dd4d432fbd46332d' },
      { relativePath: 'ev_dashboard_runtime/app_host.py', objectId: '5d6979f377df9cd46c3fe136f8f8b1d1d56d070d' }
    ];

    expect(buildBootstrapPackageDigest(identities)).toEqual(buildBootstrapPackageDigest([...identities].reverse()));
  });
});
