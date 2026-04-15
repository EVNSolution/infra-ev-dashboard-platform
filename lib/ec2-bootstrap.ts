import { Buffer } from 'node:buffer';

import { renderBootstrapPackageStageCommands } from './bootstrapPackage';

export type AppHostBootstrapProps = {
  region: string;
  imageMapSsmParam: string;
  dataHostAddress: string;
  apexDomain: string;
  apiDomain: string;
  accountAccessPostgresSecretArn?: string;
  accountAccessDjangoSecretArn?: string;
  accountAccessJwtSecretArn?: string;
};

export type DataHostDatabaseBootstrap = {
  databaseName: string;
  username: string;
  passwordSecretArn: string;
};

export type DataHostBootstrapProps = {
  region: string;
  deviceName: string;
  mountPath: string;
  postgresVersion: string;
  redisVersion: string;
  postgresSuperuserSecretArn: string;
  databases: DataHostDatabaseBootstrap[];
};

const BOOTSTRAP_ROOT = '/opt/ev-dashboard/bootstrap';
const PYTHON_CLI_PATH = `${BOOTSTRAP_ROOT}/ev_dashboard_runtime/cli.py`;

export function renderAppHostBootstrap(props: AppHostBootstrapProps): string {
  return [
    '#!/bin/bash',
    'set -euxo pipefail',
    'dnf install -y docker jq python3',
    'systemctl enable --now docker',
    'mkdir -p /opt/ev-dashboard /etc/systemd/system',
    ...renderBootstrapPackageStageCommands(BOOTSTRAP_ROOT),
    'cat <<EOF > /etc/systemd/system/ev-dashboard-app-reconcile.service',
    '[Unit]',
    'Description=Reconcile ev-dashboard app containers from runtime image map',
    'After=docker.service network-online.target',
    'Wants=docker.service network-online.target',
    '',
    '[Service]',
    'Type=oneshot',
    `Environment=PYTHONPATH=${BOOTSTRAP_ROOT}`,
    `Environment=IMAGE_MAP_PARAM=${props.imageMapSsmParam}`,
    `Environment=AWS_REGION=${props.region}`,
    `Environment=DATA_HOST_ADDRESS=${props.dataHostAddress}`,
    `Environment=APEX_DOMAIN=${props.apexDomain}`,
    `Environment=API_DOMAIN=${props.apiDomain}`,
    `Environment=ACCOUNT_ACCESS_POSTGRES_SECRET_ARN=${props.accountAccessPostgresSecretArn ?? ''}`,
    `Environment=ACCOUNT_ACCESS_DJANGO_SECRET_ARN=${props.accountAccessDjangoSecretArn ?? ''}`,
    `Environment=ACCOUNT_ACCESS_JWT_SECRET_ARN=${props.accountAccessJwtSecretArn ?? ''}`,
    `ExecStart=/usr/bin/python3 ${PYTHON_CLI_PATH} reconcile-app`,
    '',
    '[Install]',
    'WantedBy=multi-user.target',
    'EOF',
    "cat <<'EOF' > /etc/systemd/system/ev-dashboard-app-reconcile.timer",
    '[Unit]',
    'Description=Periodic reconcile for ev-dashboard app containers',
    '',
    '[Timer]',
    'OnBootSec=30sec',
    'OnUnitActiveSec=2min',
    'Unit=ev-dashboard-app-reconcile.service',
    '',
    '[Install]',
    'WantedBy=timers.target',
    'EOF',
    'systemctl daemon-reload',
    'systemctl enable --now ev-dashboard-app-reconcile.timer',
    'systemctl start ev-dashboard-app-reconcile.service'
  ].join('\n');
}

export function renderDataHostBootstrap(props: DataHostBootstrapProps): string {
  const databasesB64 = Buffer.from(JSON.stringify(props.databases), 'utf8').toString('base64');

  return [
    '#!/bin/bash',
    'set -euxo pipefail',
    'dnf install -y docker jq python3',
    'systemctl enable --now docker',
    'mkdir -p /opt/ev-dashboard /opt/ev-dashboard-data /etc/systemd/system',
    ...renderBootstrapPackageStageCommands(BOOTSTRAP_ROOT),
    'cat <<EOF > /etc/systemd/system/ev-dashboard-data-bootstrap.service',
    '[Unit]',
    'Description=Bootstrap ev-dashboard data host volumes and containers',
    'After=docker.service network-online.target',
    'Wants=docker.service network-online.target',
    '',
    '[Service]',
    'Type=oneshot',
    `Environment=PYTHONPATH=${BOOTSTRAP_ROOT}`,
    `Environment=DEVICE_NAME=${props.deviceName}`,
    `Environment=MOUNT_PATH=${props.mountPath}`,
    `Environment=AWS_REGION=${props.region}`,
    `Environment=POSTGRES_VERSION=${props.postgresVersion}`,
    `Environment=REDIS_VERSION=${props.redisVersion}`,
    `Environment=POSTGRES_SUPERUSER_SECRET_ARN=${props.postgresSuperuserSecretArn}`,
    `Environment=DATA_HOST_DATABASES_B64=${databasesB64}`,
    `ExecStart=/usr/bin/python3 ${PYTHON_CLI_PATH} bootstrap-data`,
    '',
    '[Install]',
    'WantedBy=multi-user.target',
    'EOF',
    'systemctl daemon-reload',
    'systemctl enable --now ev-dashboard-data-bootstrap.service'
  ].join('\n');
}
