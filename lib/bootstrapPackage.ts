import * as fs from 'node:fs';
import * as path from 'node:path';

export type BootstrapPackageFile = {
  absolutePath: string;
  relativePath: string;
  contents: string;
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

export function renderBootstrapPackageStageCommands(targetRoot: string): string[] {
  const lines = [`mkdir -p ${targetRoot}/ev_dashboard_runtime`];

  for (const file of listBootstrapPackageFiles()) {
    const targetPath = path.posix.join(targetRoot, file.relativePath);
    const marker = `BOOTSTRAP_${file.relativePath.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;

    lines.push(`cat <<'${marker}' > ${targetPath}`);
    lines.push(file.contents.trimEnd());
    lines.push(marker);
  }

  return lines;
}
