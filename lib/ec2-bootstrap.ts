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

export function renderAppHostBootstrap(props: AppHostBootstrapProps): string {
  const accountAccessLines = buildAccountAccessEnvLines(props);

  return [
    '#!/bin/bash',
    'set -euxo pipefail',
    'dnf install -y docker jq',
    'systemctl enable --now docker',
    'mkdir -p /opt/ev-dashboard /usr/local/bin /etc/systemd/system',
    `IMAGE_MAP_PARAM="${props.imageMapSsmParam}"`,
    `AWS_REGION="${props.region}"`,
    `DATA_HOST_ADDRESS="${props.dataHostAddress}"`,
    `APEX_DOMAIN="${props.apexDomain}"`,
    `API_DOMAIN="${props.apiDomain}"`,
    `ACCOUNT_ACCESS_POSTGRES_SECRET_ARN="${props.accountAccessPostgresSecretArn ?? ''}"`,
    `ACCOUNT_ACCESS_DJANGO_SECRET_ARN="${props.accountAccessDjangoSecretArn ?? ''}"`,
    `ACCOUNT_ACCESS_JWT_SECRET_ARN="${props.accountAccessJwtSecretArn ?? ''}"`,
    "cat <<'EOF' > /usr/local/bin/ev-dashboard-app-reconcile.sh",
    '#!/bin/bash',
    'set -euxo pipefail',
    'mkdir -p /opt/ev-dashboard',
    'aws ssm get-parameter --name "$IMAGE_MAP_PARAM" --with-decryption --region "$AWS_REGION" --query Parameter.Value --output text > /opt/ev-dashboard/runtime-images.json',
    'FRONT_IMAGE=$(jq -r \'.["front-web-console"]\' /opt/ev-dashboard/runtime-images.json)',
    'GATEWAY_IMAGE=$(jq -r \'.["edge-api-gateway"]\' /opt/ev-dashboard/runtime-images.json)',
    'ACCOUNT_ACCESS_IMAGE=$(jq -r \'.["service-account-access"]\' /opt/ev-dashboard/runtime-images.json)',
    'jq -r \'to_entries[] | .value\' /opt/ev-dashboard/runtime-images.json | cut -d"/" -f1 | sort -u | while read -r registry; do',
    '  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$registry"',
    'done',
    'docker network inspect ev-dashboard >/dev/null 2>&1 || docker network create ev-dashboard',
    'if [ -n "$ACCOUNT_ACCESS_POSTGRES_SECRET_ARN" ]; then',
    '  ACCOUNT_ACCESS_POSTGRES_PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$ACCOUNT_ACCESS_POSTGRES_SECRET_ARN" --region "$AWS_REGION" --query SecretString --output text)',
    '  ACCOUNT_ACCESS_DJANGO_SECRET=$(aws secretsmanager get-secret-value --secret-id "$ACCOUNT_ACCESS_DJANGO_SECRET_ARN" --region "$AWS_REGION" --query SecretString --output text)',
    '  ACCOUNT_ACCESS_JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id "$ACCOUNT_ACCESS_JWT_SECRET_ARN" --region "$AWS_REGION" --query SecretString --output text)',
    '  cat <<ENVEOF > /opt/ev-dashboard/account-access.env',
    ...accountAccessLines,
    'ENVEOF',
    'fi',
    'docker rm -f web-console account-auth-api edge-api-gateway >/dev/null 2>&1 || true',
    'docker pull "$FRONT_IMAGE"',
    'docker run -d --name web-console --restart unless-stopped --network ev-dashboard -p 5174:5174 "$FRONT_IMAGE"',
    'docker pull "$ACCOUNT_ACCESS_IMAGE"',
    'docker run -d --name account-auth-api --restart unless-stopped --network ev-dashboard --env-file /opt/ev-dashboard/account-access.env -p 8000:8000 "$ACCOUNT_ACCESS_IMAGE"',
    'docker pull "$GATEWAY_IMAGE"',
    'docker run -d --name edge-api-gateway --restart unless-stopped --network ev-dashboard -p 8080:8080 "$GATEWAY_IMAGE"',
    'EOF',
    'chmod +x /usr/local/bin/ev-dashboard-app-reconcile.sh',
    'cat <<EOF > /etc/systemd/system/ev-dashboard-app-reconcile.service',
    '[Unit]',
    'Description=Reconcile ev-dashboard app containers from runtime image map',
    'After=docker.service network-online.target',
    'Wants=docker.service network-online.target',
    '',
    '[Service]',
    'Type=oneshot',
    'Environment=IMAGE_MAP_PARAM=${IMAGE_MAP_PARAM}',
    'Environment=AWS_REGION=${AWS_REGION}',
    'Environment=DATA_HOST_ADDRESS=${DATA_HOST_ADDRESS}',
    'Environment=APEX_DOMAIN=${APEX_DOMAIN}',
    'Environment=API_DOMAIN=${API_DOMAIN}',
    'Environment=ACCOUNT_ACCESS_POSTGRES_SECRET_ARN=${ACCOUNT_ACCESS_POSTGRES_SECRET_ARN}',
    'Environment=ACCOUNT_ACCESS_DJANGO_SECRET_ARN=${ACCOUNT_ACCESS_DJANGO_SECRET_ARN}',
    'Environment=ACCOUNT_ACCESS_JWT_SECRET_ARN=${ACCOUNT_ACCESS_JWT_SECRET_ARN}',
    'ExecStart=/usr/local/bin/ev-dashboard-app-reconcile.sh',
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
  const databaseInitScript = renderDataHostDatabaseInit(props);

  return [
    '#!/bin/bash',
    'set -euxo pipefail',
    'dnf install -y docker jq',
    'systemctl enable --now docker',
    'mkdir -p /opt/ev-dashboard-data /usr/local/bin /etc/systemd/system',
    `DEVICE_NAME="${props.deviceName}"`,
    `MOUNT_PATH="${props.mountPath}"`,
    `AWS_REGION="${props.region}"`,
    `POSTGRES_SUPERUSER_SECRET_ARN="${props.postgresSuperuserSecretArn}"`,
    "cat <<'EOF' > /usr/local/bin/ev-dashboard-data-bootstrap.sh",
    '#!/bin/bash',
    'set -euxo pipefail',
    'for _ in $(seq 1 60); do',
    '  if [ -b "$DEVICE_NAME" ]; then',
    '    break',
    '  fi',
    '  sleep 5',
    'done',
    'if [ ! -b "$DEVICE_NAME" ]; then',
    '  echo "Device $DEVICE_NAME did not appear in time" >&2',
    '  exit 1',
    'fi',
    'if ! blkid "$DEVICE_NAME" >/dev/null 2>&1; then',
    '  mkfs -t xfs "$DEVICE_NAME"',
    'fi',
    'mkdir -p "$MOUNT_PATH"/{postgres,redis}',
    'grep -q "$DEVICE_NAME" /etc/fstab || echo "$DEVICE_NAME $MOUNT_PATH xfs defaults,nofail 0 2" >> /etc/fstab',
    'mount -a',
    'POSTGRES_SUPERUSER_PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$POSTGRES_SUPERUSER_SECRET_ARN" --region "$AWS_REGION" --query SecretString --output text)',
    'cat <<ENVEOF > /opt/ev-dashboard-data/postgres.env',
    'POSTGRES_USER=postgres',
    'POSTGRES_DB=postgres',
    'POSTGRES_PASSWORD=${POSTGRES_SUPERUSER_PASSWORD}',
    'ENVEOF',
    'docker rm -f ev-dashboard-postgres ev-dashboard-redis >/dev/null 2>&1 || true',
    `docker pull postgres:${props.postgresVersion}`,
    `docker run -d --name ev-dashboard-postgres --restart unless-stopped --env-file /opt/ev-dashboard-data/postgres.env -p 5432:5432 -v ${props.mountPath}/postgres:/var/lib/postgresql/data postgres:${props.postgresVersion}`,
    `docker pull redis:${props.redisVersion}`,
    `docker run -d --name ev-dashboard-redis --restart unless-stopped -p 6379:6379 -v ${props.mountPath}/redis:/data redis:${props.redisVersion} redis-server --appendonly yes`,
    'until docker exec ev-dashboard-postgres pg_isready -U postgres >/dev/null 2>&1; do',
    '  sleep 2',
    'done',
    databaseInitScript,
    'EOF',
    'chmod +x /usr/local/bin/ev-dashboard-data-bootstrap.sh',
    'cat <<EOF > /etc/systemd/system/ev-dashboard-data-bootstrap.service',
    '[Unit]',
    'Description=Bootstrap ev-dashboard data host volumes and containers',
    'After=docker.service network-online.target',
    'Wants=docker.service network-online.target',
    '',
    '[Service]',
    'Type=oneshot',
    'Environment=DEVICE_NAME=${DEVICE_NAME}',
    'Environment=MOUNT_PATH=${MOUNT_PATH}',
    'Environment=AWS_REGION=${AWS_REGION}',
    'Environment=POSTGRES_SUPERUSER_SECRET_ARN=${POSTGRES_SUPERUSER_SECRET_ARN}',
    'ExecStart=/usr/local/bin/ev-dashboard-data-bootstrap.sh',
    '',
    '[Install]',
    'WantedBy=multi-user.target',
    'EOF',
    'systemctl daemon-reload',
    'systemctl enable --now ev-dashboard-data-bootstrap.service'
  ].join('\n');
}

function buildAccountAccessEnvLines(props: AppHostBootstrapProps): string[] {
  return [
    'POSTGRES_HOST=${DATA_HOST_ADDRESS}',
    'POSTGRES_PORT=5432',
    'POSTGRES_DB=account_auth',
    'POSTGRES_USER=account_auth',
    'POSTGRES_PASSWORD=${ACCOUNT_ACCESS_POSTGRES_PASSWORD}',
    'REDIS_URL=redis://${DATA_HOST_ADDRESS}:6379/0',
    'DJANGO_SECRET_KEY=${ACCOUNT_ACCESS_DJANGO_SECRET}',
    'JWT_SECRET_KEY=${ACCOUNT_ACCESS_JWT_SECRET}',
    'DJANGO_ALLOWED_HOSTS=${API_DOMAIN},account-auth-api,localhost,127.0.0.1',
    'CSRF_TRUSTED_ORIGINS=https://${APEX_DOMAIN},https://${API_DOMAIN}'
  ];
}

function renderDataHostDatabaseInit(props: DataHostBootstrapProps): string {
  return props.databases
    .flatMap((database) => [
      `DB_SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id "${database.passwordSecretArn}" --region "$AWS_REGION" --query SecretString --output text)`,
      `docker exec -e DB_PASSWORD="$DB_SECRET_VALUE" ev-dashboard-postgres psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO \\\\\\$\\\\\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${database.username}') THEN CREATE ROLE ${database.username} LOGIN PASSWORD '$DB_PASSWORD'; ELSE ALTER ROLE ${database.username} WITH LOGIN PASSWORD '$DB_PASSWORD'; END IF; END \\\\\\$\\\\\\$;"`,
      `docker exec ev-dashboard-postgres psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${database.databaseName}'" | grep -q 1 || docker exec ev-dashboard-postgres psql -U postgres -d postgres -c "CREATE DATABASE ${database.databaseName} OWNER ${database.username};"`
    ])
    .join('\n');
}
