import * as cdk from 'aws-cdk-lib';

import { renderBootstrapPackageFetchCommands } from './bootstrapPackage';

export type AppHostBootstrapProps = {
  region: string;
  imageMapSsmParam: string;
  bootstrapPackageBucketName: string;
  bootstrapPackageObjectKey: string;
  serviceManifestBucketName: string;
  serviceManifestObjectKey: string;
  services: AppHostRuntimeService[];
};

export type AppHostRuntimeService = {
  id: string;
  imageMapKey: string;
  containerName: string;
  enabled: boolean;
  containerPort?: number;
  hostPort?: number;
  environment?: Record<string, string>;
  secretArns?: Record<string, string>;
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
  bootstrapPackageBucketName: string;
  bootstrapPackageObjectKey: string;
  postgresSuperuserSecretArn: string;
  databases: DataHostDatabaseBootstrap[];
};

const BOOTSTRAP_ROOT = '/opt/ev-dashboard/bootstrap';
const PYTHON_CLI_PATH = `${BOOTSTRAP_ROOT}/ev_dashboard_runtime/cli.py`;
const APP_RECONCILE_UNIT_PATH = '/etc/systemd/system/ev-dashboard-app-reconcile.service';
const DATA_BOOTSTRAP_UNIT_PATH = '/etc/systemd/system/ev-dashboard-data-bootstrap.service';
const APP_SERVICE_MANIFEST_PATH = '/opt/ev-dashboard/manifests/app-services.json';

export function renderAppHostBootstrap(props: AppHostBootstrapProps): string[] {
  return [
    'set -euxo pipefail',
    'dnf install -y docker jq python3 unzip',
    'systemctl enable --now docker',
    'mkdir -p /opt/ev-dashboard /opt/ev-dashboard/manifests /etc/systemd/system',
    ...renderBootstrapPackageFetchCommands(
      BOOTSTRAP_ROOT,
      props.bootstrapPackageBucketName,
      props.bootstrapPackageObjectKey
    ),
    renderS3CopyCommand(props.serviceManifestBucketName, props.serviceManifestObjectKey, APP_SERVICE_MANIFEST_PATH),
    `cat <<'EOF' > ${APP_RECONCILE_UNIT_PATH}`,
    '[Unit]',
    'Description=Reconcile ev-dashboard app containers from runtime image map',
    'After=docker.service network-online.target',
    'Wants=docker.service network-online.target',
    '',
    '[Service]',
    'Type=oneshot',
    `Environment=PYTHONPATH=${BOOTSTRAP_ROOT}`,
    'EOF',
    appendTokenizedEnvironmentLine(APP_RECONCILE_UNIT_PATH, 'IMAGE_MAP_PARAM', 'ImageMapParam', props.imageMapSsmParam),
    `printf '%s\n' 'Environment=AWS_REGION=${props.region}' >> ${APP_RECONCILE_UNIT_PATH}`,
    `printf '%s\n' 'Environment=SERVICE_MANIFEST_PATH=${APP_SERVICE_MANIFEST_PATH}' >> ${APP_RECONCILE_UNIT_PATH}`,
    ...renderAppServiceSecretEnvironmentUnitLines(props.services),
    `cat <<'EOF' >> ${APP_RECONCILE_UNIT_PATH}`,
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
  ];
}

function renderAppServiceSecretEnvironmentUnitLines(services: AppHostRuntimeService[]): string[] {
  return services.flatMap((service) => {
    const prefix = `SERVICE_${service.id}`;
    const secretKeys = Object.keys(service.secretArns ?? {});

    if (secretKeys.length === 0) {
      return [];
    }

    return [
      `printf '%s\n' 'Environment=${prefix}_SECRET_KEYS=${secretKeys.join(',')}' >> ${APP_RECONCILE_UNIT_PATH}`,
      ...secretKeys.map((key) =>
        appendTokenizedEnvironmentLine(
          APP_RECONCILE_UNIT_PATH,
          `${prefix}_SECRET_${key}`,
          `${prefix}Secret${normalizeEnvironmentVariableSegment(key)}`,
          (service.secretArns ?? {})[key]
        )
      )
    ];
  });
}

export function renderDataHostBootstrap(props: DataHostBootstrapProps): string[] {
  return [
    'set -euxo pipefail',
    'dnf install -y docker jq python3 unzip',
    'systemctl enable --now docker',
    'mkdir -p /opt/ev-dashboard /opt/ev-dashboard-data /etc/systemd/system',
    ...renderBootstrapPackageFetchCommands(
      BOOTSTRAP_ROOT,
      props.bootstrapPackageBucketName,
      props.bootstrapPackageObjectKey
    ),
    `cat <<'EOF' > ${DATA_BOOTSTRAP_UNIT_PATH}`,
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
    'EOF',
    appendTokenizedEnvironmentLine(
      DATA_BOOTSTRAP_UNIT_PATH,
      'POSTGRES_SUPERUSER_SECRET_ARN',
      'PostgresSuperuserSecretArn',
      props.postgresSuperuserSecretArn
    ),
    `printf '%s\n' 'Environment=BOOTSTRAP_DATABASE_COUNT=${props.databases.length}' >> ${DATA_BOOTSTRAP_UNIT_PATH}`,
    ...props.databases.flatMap((database, index) => {
      const number = index + 1;

      return [
        `printf '%s\n' 'Environment=BOOTSTRAP_DATABASE_${number}_NAME=${database.databaseName}' >> ${DATA_BOOTSTRAP_UNIT_PATH}`,
        `printf '%s\n' 'Environment=BOOTSTRAP_DATABASE_${number}_USERNAME=${database.username}' >> ${DATA_BOOTSTRAP_UNIT_PATH}`,
        appendTokenizedEnvironmentLine(
          DATA_BOOTSTRAP_UNIT_PATH,
          `BOOTSTRAP_DATABASE_${number}_PASSWORD_SECRET_ARN`,
          `Database${number}PasswordSecretArn`,
          database.passwordSecretArn
        )
      ];
    }),
    `cat <<'EOF' >> ${DATA_BOOTSTRAP_UNIT_PATH}`,
    `ExecStart=/usr/bin/python3 ${PYTHON_CLI_PATH} bootstrap-data`,
    '',
    '[Install]',
    'WantedBy=multi-user.target',
    'EOF',
    'systemctl daemon-reload',
    'systemctl enable --now ev-dashboard-data-bootstrap.service'
  ];
}

function appendTokenizedEnvironmentLine(
  unitPath: string,
  envName: string,
  variableName: string,
  value: string
): string {
  return cdk.Fn.sub(`printf '%s\\n' 'Environment=${envName}=\${${variableName}}' >> ${unitPath}`, {
    [variableName]: value
  });
}

function normalizeEnvironmentVariableSegment(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join('');
}

function renderS3CopyCommand(bucketName: string, objectKey: string, targetPath: string): string {
  return cdk.Fn.sub(`aws s3 cp s3://\${BucketName}/\${ObjectKey} ${targetPath}`, {
    BucketName: bucketName,
    ObjectKey: objectKey
  });
}
