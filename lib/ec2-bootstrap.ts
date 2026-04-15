export type AppHostBootstrapProps = {
  region: string;
  imageMapSsmParam: string;
};

export type DataHostBootstrapProps = {
  deviceName: string;
  mountPath: string;
  postgresVersion: string;
  redisVersion: string;
};

export function renderAppHostBootstrap(props: AppHostBootstrapProps): string {
  return [
    '#!/bin/bash',
    'set -euxo pipefail',
    'dnf install -y docker jq',
    'systemctl enable --now docker',
    'mkdir -p /opt/ev-dashboard',
    `IMAGE_MAP_PARAM="${props.imageMapSsmParam}"`,
    `AWS_REGION="${props.region}"`,
    'aws ssm get-parameter --name "$IMAGE_MAP_PARAM" --with-decryption --region "$AWS_REGION" --query Parameter.Value --output text > /opt/ev-dashboard/runtime-images.json',
    'jq -r \'to_entries[] | .value\' /opt/ev-dashboard/runtime-images.json | cut -d"/" -f1 | sort -u | while read -r registry; do',
    '  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$registry"',
    'done'
  ].join('\n');
}

export function renderDataHostBootstrap(props: DataHostBootstrapProps): string {
  return [
    '#!/bin/bash',
    'set -euxo pipefail',
    'dnf install -y docker',
    'systemctl enable --now docker',
    `DEVICE_NAME="${props.deviceName}"`,
    `MOUNT_PATH="${props.mountPath}"`,
    'if ! blkid "$DEVICE_NAME"; then',
    '  mkfs -t xfs "$DEVICE_NAME"',
    'fi',
    'mkdir -p "$MOUNT_PATH"/{postgres,redis}',
    'grep -q "$DEVICE_NAME" /etc/fstab || echo "$DEVICE_NAME $MOUNT_PATH xfs defaults,nofail 0 2" >> /etc/fstab',
    'mount -a',
    'mkdir -p /opt/ev-dashboard-data',
    "cat <<'EOF' > /opt/ev-dashboard-data/docker-compose.yml",
    'services:',
    '  postgres:',
    `    image: postgres:${props.postgresVersion}`,
    '    restart: unless-stopped',
    '    environment:',
    '      POSTGRES_PASSWORD: change-me',
    '    ports:',
    '      - "5432:5432"',
    `    volumes:`,
    `      - ${props.mountPath}/postgres:/var/lib/postgresql/data`,
    '  redis:',
    `    image: redis:${props.redisVersion}`,
    '    restart: unless-stopped',
    '    command: ["redis-server", "--appendonly", "yes"]',
    '    ports:',
    '      - "6379:6379"',
    '    volumes:',
    `      - ${props.mountPath}/redis:/data`,
    'EOF',
    'docker compose -f /opt/ev-dashboard-data/docker-compose.yml up -d'
  ].join('\n');
}
