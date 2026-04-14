# infra-ev-dashboard-platform

ECS/CDK runtime infrastructure for `ev-dashboard.com`.

## Ownership

This repo owns the shared ECS/CDK runtime for the `ev-dashboard` slice:

- ALB
- ACM certificate issuance
- Route53 alias records
- ECS cluster and services
- Service Connect namespace
- deploy workflow

It does not own app code. Application source and image builds stay in:

- `front-web-console`
- `edge-api-gateway`
- `service-account-access`
- `service-organization-registry`
- `service-driver-profile`
- `service-personnel-document-registry`
- `service-vehicle-registry`
- `service-vehicle-assignment`
- `service-dispatch-registry`
- `service-delivery-record`
- `service-attendance-registry`
- `service-region-registry`
- `service-region-analytics`
- `service-announcement-registry`
- `service-support-registry`
- `service-notification-hub`
- `service-terminal-registry`
- `service-telemetry-hub`
- `service-telemetry-dead-letter`
- `service-telemetry-listener`

## Deploy Contract

The deploy workflow now reads immutable image URIs from repository variables for all current slice services:

- `front-web-console`
- `edge-api-gateway`
- `service-account-access`
- `service-organization-registry`
- `service-driver-profile`
- `service-personnel-document-registry`
- `service-vehicle-registry`
- `service-vehicle-assignment`
- `service-dispatch-registry`
- `service-delivery-record`
- `service-attendance-registry`
- `service-region-registry`
- `service-region-analytics`
- `service-announcement-registry`
- `service-support-registry`
- `service-notification-hub`
- `service-terminal-registry`
- `service-telemetry-hub`
- `service-telemetry-dead-letter`
- `service-telemetry-listener`

Image tags are SHA-only. This repo should not guess or discover a `latest` image on its own. Before a deploy, update the repo variables to the exact SHAs that belong to the rollout.

## Mandatory Preflight Gate

Before every `workflow_dispatch` deploy, run the same gate locally that the workflow now enforces in CI:

```bash
cd /Users/jiin/Documents/Files/02_EVnSolution/00_Source_code/CLEVER/clever-msa-platform/development/infra-ev-dashboard-platform
npm run preflight
npm test -- --runInBand
npx cdk synth
```

After `cdk deploy`, the workflow now runs `npm run smoke:postdeploy` automatically. A green deploy requires both:

- stack deploy success
- post-deploy public smoke success

You can run the same smoke locally if needed:

```bash
cd /Users/jiin/Documents/Files/02_EVnSolution/00_Source_code/CLEVER/clever-msa-platform/development/infra-ev-dashboard-platform
npm run smoke:postdeploy
```

`npm run preflight` is the contract gate for this repo. It fails fast when:

- a required deploy env value is missing
- a mutable image tag such as `:latest` is used
- the selected environment and domains do not match
- a later backend slice is enabled without the earlier slices it depends on
- `edge-api-gateway` is disabled while API slices are still enabled

The command also prints the expected deploy wait signals so operators do not overreact to normal `UPDATE_IN_PROGRESS` windows.

## Required GitHub Configuration

Repository or environment variables:

- `AWS_REGION`
- `HOSTED_ZONE_ID`
- `HOSTED_ZONE_NAME`
- `APEX_DOMAIN`
- `API_DOMAIN`
- `FRONT_IMAGE_URI`
- `GATEWAY_IMAGE_URI`
- `ACCOUNT_ACCESS_IMAGE_URI`
- `ORGANIZATION_IMAGE_URI`
- `DRIVER_PROFILE_IMAGE_URI`
- `PERSONNEL_DOCUMENT_IMAGE_URI`
- `VEHICLE_ASSET_IMAGE_URI`
- `DRIVER_VEHICLE_ASSIGNMENT_IMAGE_URI`
- `DISPATCH_REGISTRY_IMAGE_URI`
- `DELIVERY_RECORD_IMAGE_URI`
- `ATTENDANCE_REGISTRY_IMAGE_URI`
- `DISPATCH_OPS_IMAGE_URI`
- `DRIVER_OPS_IMAGE_URI`
- `VEHICLE_OPS_IMAGE_URI`
- `SETTLEMENT_REGISTRY_IMAGE_URI`
- `SETTLEMENT_PAYROLL_IMAGE_URI`
- `SETTLEMENT_OPS_IMAGE_URI`
- `REGION_REGISTRY_IMAGE_URI`
- `REGION_ANALYTICS_IMAGE_URI`
- `ANNOUNCEMENT_REGISTRY_IMAGE_URI`
- `SUPPORT_REGISTRY_IMAGE_URI`
- `NOTIFICATION_HUB_IMAGE_URI`
- `TERMINAL_REGISTRY_IMAGE_URI`
- `TELEMETRY_HUB_IMAGE_URI`
- `TELEMETRY_DEAD_LETTER_IMAGE_URI`
- `TELEMETRY_LISTENER_IMAGE_URI`
- `VPC_ID`
- `PUBLIC_SUBNET_IDS`
- optional: `PRIVATE_SUBNET_IDS`
- optional: `AVAILABILITY_ZONES`
- optional: `SERVICE_CONNECT_NAMESPACE`
- optional: `FRONT_DESIRED_COUNT`
- optional: `GATEWAY_DESIRED_COUNT`
- optional: `ACCOUNT_ACCESS_DESIRED_COUNT`
- optional: `ORGANIZATION_DESIRED_COUNT`
- optional: `DRIVER_PROFILE_DESIRED_COUNT`
- optional: `PERSONNEL_DOCUMENT_DESIRED_COUNT`
- optional: `VEHICLE_ASSET_DESIRED_COUNT`
- optional: `DRIVER_VEHICLE_ASSIGNMENT_DESIRED_COUNT`
- optional: `DISPATCH_REGISTRY_DESIRED_COUNT`
- optional: `DELIVERY_RECORD_DESIRED_COUNT`
- optional: `ATTENDANCE_REGISTRY_DESIRED_COUNT`
- optional: `REGION_REGISTRY_DESIRED_COUNT`
- optional: `REGION_ANALYTICS_DESIRED_COUNT`
- optional: `ANNOUNCEMENT_REGISTRY_DESIRED_COUNT`
- optional: `SUPPORT_REGISTRY_DESIRED_COUNT`
- optional: `NOTIFICATION_HUB_DESIRED_COUNT`
- optional: `TERMINAL_REGISTRY_DESIRED_COUNT`
- optional: `TELEMETRY_HUB_DESIRED_COUNT`
- optional: `TELEMETRY_DEAD_LETTER_DESIRED_COUNT`
- optional: `TELEMETRY_LISTENER_DESIRED_COUNT`
- optional: `FRONT_CPU`
- optional: `FRONT_MEMORY_MIB`
- optional: `GATEWAY_CPU`
- optional: `GATEWAY_MEMORY_MIB`
- optional: `ACCOUNT_ACCESS_CPU`
- optional: `ACCOUNT_ACCESS_MEMORY_MIB`
- optional: `ORGANIZATION_CPU`
- optional: `ORGANIZATION_MEMORY_MIB`
- optional: `DRIVER_PROFILE_CPU`
- optional: `DRIVER_PROFILE_MEMORY_MIB`
- optional: `PERSONNEL_DOCUMENT_CPU`
- optional: `PERSONNEL_DOCUMENT_MEMORY_MIB`
- optional: `VEHICLE_ASSET_CPU`
- optional: `VEHICLE_ASSET_MEMORY_MIB`
- optional: `DRIVER_VEHICLE_ASSIGNMENT_CPU`
- optional: `DRIVER_VEHICLE_ASSIGNMENT_MEMORY_MIB`
- optional: `DISPATCH_REGISTRY_CPU`
- optional: `DISPATCH_REGISTRY_MEMORY_MIB`
- optional: `DELIVERY_RECORD_CPU`
- optional: `DELIVERY_RECORD_MEMORY_MIB`
- optional: `ATTENDANCE_REGISTRY_CPU`
- optional: `ATTENDANCE_REGISTRY_MEMORY_MIB`
- optional: `REGION_REGISTRY_CPU`
- optional: `REGION_REGISTRY_MEMORY_MIB`
- optional: `REGION_ANALYTICS_CPU`
- optional: `REGION_ANALYTICS_MEMORY_MIB`
- optional: `ANNOUNCEMENT_REGISTRY_CPU`
- optional: `ANNOUNCEMENT_REGISTRY_MEMORY_MIB`
- optional: `SUPPORT_REGISTRY_CPU`
- optional: `SUPPORT_REGISTRY_MEMORY_MIB`
- optional: `NOTIFICATION_HUB_CPU`
- optional: `NOTIFICATION_HUB_MEMORY_MIB`
- optional: `TERMINAL_REGISTRY_CPU`
- optional: `TERMINAL_REGISTRY_MEMORY_MIB`
- optional: `TELEMETRY_HUB_CPU`
- optional: `TELEMETRY_HUB_MEMORY_MIB`
- optional: `TELEMETRY_DEAD_LETTER_CPU`
- optional: `TELEMETRY_DEAD_LETTER_MEMORY_MIB`
- optional: `TELEMETRY_LISTENER_CPU`
- optional: `TELEMETRY_LISTENER_MEMORY_MIB`
- optional: `FRONT_HEALTH_CHECK_PATH`
- optional: `GATEWAY_HEALTH_CHECK_PATH`
- optional: `ACCOUNT_ACCESS_HEALTH_CHECK_PATH`
- optional: `ORGANIZATION_HEALTH_CHECK_PATH`
- optional: `DRIVER_PROFILE_HEALTH_CHECK_PATH`
- optional: `PERSONNEL_DOCUMENT_HEALTH_CHECK_PATH`
- optional: `VEHICLE_ASSET_HEALTH_CHECK_PATH`
- optional: `DRIVER_VEHICLE_ASSIGNMENT_HEALTH_CHECK_PATH`
- optional: `DISPATCH_REGISTRY_HEALTH_CHECK_PATH`
- optional: `DELIVERY_RECORD_HEALTH_CHECK_PATH`
- optional: `ATTENDANCE_REGISTRY_HEALTH_CHECK_PATH`
- optional: `REGION_REGISTRY_HEALTH_CHECK_PATH`
- optional: `REGION_ANALYTICS_HEALTH_CHECK_PATH`
- optional: `ANNOUNCEMENT_REGISTRY_HEALTH_CHECK_PATH`
- optional: `SUPPORT_REGISTRY_HEALTH_CHECK_PATH`
- optional: `NOTIFICATION_HUB_HEALTH_CHECK_PATH`
- optional: `TERMINAL_REGISTRY_HEALTH_CHECK_PATH`
- optional: `TELEMETRY_HUB_HEALTH_CHECK_PATH`
- optional: `TELEMETRY_DEAD_LETTER_HEALTH_CHECK_PATH`
- optional: `TELEMETRY_LISTENER_MQTT_HOST`
- optional: `TELEMETRY_LISTENER_MQTT_PORT`
- optional: `TELEMETRY_LISTENER_MQTT_TOPICS`
- optional: `TELEMETRY_LISTENER_CLIENT_ID`
- optional: `TELEMETRY_LISTENER_RETRY_COUNT`
- optional: `TELEMETRY_LISTENER_RETRY_BACKOFF_SECONDS`
- optional: `TELEMETRY_LISTENER_IDLE_SLEEP_SECONDS`

Repository secrets:

- `GH_ACTIONS_INFRA_ROLE_ARN`

The workflow uses the selected GitHub Environment (`dev`, `stage`, `prod`) for approval gates. The actual CDK deploy runs with the shared infra role because the existing `GH_ACTIONS_*_DEPLOY_ROLE_ARN` roles remain EC2/SSM deploy roles for `clever-deploy-control`.

When any backend slice desired count is greater than `0`, `PRIVATE_SUBNET_IDS` becomes required. The stack uses those subnets for the dedicated service databases and Redis.

## Runtime Notes

- The stack issues its own ACM certificate from the hosted zone instead of importing a pre-created `CERTIFICATE_ARN`.
- The front service listens on `5174`, matching the existing container contract.
- The ALB routes `ev-dashboard.com/api/*` to `edge-api-gateway` so the front can keep same-host `/api` calls.
- When the auth slice is enabled, the stack creates dedicated private PostgreSQL 16 and Redis resources for `service-account-access` and injects the required runtime env/secrets into the task definition.
- When the company-governance slice is enabled, the stack creates a dedicated private PostgreSQL 16 instance for `service-organization-registry` and injects the same shared `JWT_SECRET_KEY` used by `service-account-access`.
- When the people-and-assets slice is enabled, the stack creates dedicated private PostgreSQL 16 instances for:
  - `service-driver-profile`
  - `service-personnel-document-registry`
  - `service-vehicle-registry`
  - `service-vehicle-assignment`
- `service-personnel-document-registry` receives `DRIVER_PROFILE_BASE_URL=http://driver-profile-api:8000`.
- `service-vehicle-assignment` receives:
  - `DRIVER_PROFILE_BASE_URL=http://driver-profile-api:8000`
  - `VEHICLE_ASSET_BASE_URL=http://vehicle-asset-api:8000`
- When the dispatch-inputs slice is enabled, the stack creates dedicated private PostgreSQL 16 instances for:
  - `service-dispatch-registry`
  - `service-delivery-record`
  - `service-attendance-registry`
- `service-dispatch-registry` receives:
  - `VEHICLE_REGISTRY_BASE_URL=http://vehicle-asset-api:8000`
  - `DRIVER_PROFILE_BASE_URL=http://driver-profile-api:8000`
  - `DELIVERY_RECORD_BASE_URL=http://delivery-record-api:8000`
  - `ATTENDANCE_REGISTRY_BASE_URL=http://attendance-registry-api:8000`
- `service-delivery-record` receives:
  - `ORGANIZATION_MASTER_BASE_URL=http://organization-master-api:8000`
  - `DRIVER_PROFILE_BASE_URL=http://driver-profile-api:8000`
  - `DISPATCH_REGISTRY_BASE_URL=http://dispatch-registry-api:8000`
  - `ATTENDANCE_REGISTRY_BASE_URL=http://attendance-registry-api:8000`
- ECS Service Connect provides the short names that `edge-api-gateway` already expects:
  - `web-console:5174`
  - `account-auth-api:8000`
  - `organization-master-api:8000`
  - `driver-profile-api:8000`
  - `personnel-document-registry-api:8000`
  - `vehicle-asset-api:8000`
  - `driver-vehicle-assignment-api:8000`
  - `dispatch-registry-api:8000`
  - `delivery-record-api:8000`
  - `attendance-registry-api:8000`
  - `region-registry-api:8000`
  - `region-analytics-api:8000`
  - `announcement-registry-api:8000`
  - `support-registry-api:8000`
- `notification-hub-api:8000`
- `terminal-registry-api:8000`
- `telemetry-hub-api:8000`
- `telemetry-dead-letter-api:8000`
- When the support-surface slice is enabled, the stack creates dedicated private PostgreSQL 16 instances for:
  - `service-region-registry`
  - `service-region-analytics`
  - `service-announcement-registry`
  - `service-support-registry`
  - `service-notification-hub`
- `service-support-registry` receives:
  - `NOTIFICATION_HUB_BASE_URL=http://notification-hub-api:8000`
- When the terminal-and-telemetry slice is enabled, the stack creates dedicated private PostgreSQL 16 instances for:
  - `service-terminal-registry`
  - `service-telemetry-hub`
  - `service-telemetry-dead-letter`
- `service-terminal-registry` receives:
  - `VEHICLE_REGISTRY_BASE_URL=http://vehicle-asset-api:8000`
- `service-telemetry-listener` runs as an internal worker service without an ALB target group and receives:
  - `TELEMETRY_HUB_BASE_URL=http://telemetry-hub-api:8000`
  - `TELEMETRY_DEAD_LETTER_BASE_URL=http://telemetry-dead-letter-api:8000`
  - `TELEMETRY_DEAD_LETTER_SOURCE_SERVICE=service-telemetry-listener`
  - `TELEMETRY_LISTENER_MQTT_*` worker settings from environment variables
