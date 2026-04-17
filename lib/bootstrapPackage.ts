import * as crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type BootstrapPackageFile = {
  absolutePath: string;
  relativePath: string;
  contents: string;
};

export type BootstrapPackageSourceIdentity = {
  relativePath: string;
  objectId: string;
};

export function listBootstrapPackageFiles(): BootstrapPackageFile[] {
  const packageRoot = getBootstrapPackageRoot();
  const fileNames = fs.readdirSync(packageRoot).filter((entry) => entry.endsWith('.py')).sort();

  return fileNames.map((fileName) => {
    const absolutePath = path.join(packageRoot, fileName);

    return {
      absolutePath,
      relativePath: path.posix.join('ev_dashboard_runtime', fileName),
      contents: fs.readFileSync(absolutePath, 'utf8')
    };
  });
}

export function getBootstrapPackageRoot(): string {
  return path.resolve(__dirname, '..', 'bootstrap', 'ev_dashboard_runtime');
}

export function getBootstrapAssetRoot(): string {
  return path.resolve(__dirname, '..', 'bootstrap');
}

export function listBootstrapPackageSourceIdentities(
  files: BootstrapPackageFile[] = listBootstrapPackageFiles()
): BootstrapPackageSourceIdentity[] {
  const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: getBootstrapAssetRoot(),
    encoding: 'utf8'
  }).trim();
  const repoRelativePaths = files.map((file) => path.posix.join('bootstrap', file.relativePath));
  const dirtyStatus = execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', ...repoRelativePaths], {
    cwd: repoRoot,
    encoding: 'utf8'
  }).trim();

  if (dirtyStatus.length > 0) {
    throw new Error(`Bootstrap package sources must be committed before digesting:\n${dirtyStatus}`);
  }

  const trackedFiles = execFileSync('git', ['ls-files', '-s', '--', ...repoRelativePaths], {
    cwd: repoRoot,
    encoding: 'utf8'
  })
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [, objectId, , repoRelativePath] = line.split(/\s+/);
      return {
        relativePath: repoRelativePath.replace(/^bootstrap\//, ''),
        objectId
      };
    });

  if (trackedFiles.length !== repoRelativePaths.length) {
    throw new Error('Bootstrap package sources must be git-tracked before digesting.');
  }

  return trackedFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

export function buildBootstrapPackageDigest(
  identities: BootstrapPackageSourceIdentity[] = listBootstrapPackageSourceIdentities()
): string {
  const normalizedFiles = [...identities]
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  return crypto.createHash('sha256').update(JSON.stringify(normalizedFiles)).digest('hex');
}

export function renderBootstrapPackageStageCommands(targetRoot: string): string[] {
  const lines = [`mkdir -p ${targetRoot}/ev_dashboard_runtime`];

  for (const file of listBootstrapPackageFiles()) {
    const targetPath = path.posix.join(targetRoot, file.relativePath);
    const encoded = Buffer.from(file.contents, 'utf8').toString('base64');

    lines.push(`printf '%s' '${encoded}' | base64 -d > ${targetPath}`);
  }

  return lines;
}

export function renderBootstrapPackageFetchCommands(
  targetRoot: string,
  bucketName: string,
  objectKey: string
): string[] {
  const archivePath = '/tmp/ev-dashboard-bootstrap.zip';

  return [
    `mkdir -p ${targetRoot}`,
    'command -v aws >/dev/null 2>&1 || dnf install -y awscli',
    `rm -rf ${targetRoot}/ev_dashboard_runtime`,
    `aws s3 cp s3://${bucketName}/${objectKey} ${archivePath}`,
    `unzip -o ${archivePath} -d ${targetRoot}`,
    `rm -f ${archivePath}`
  ];
}
