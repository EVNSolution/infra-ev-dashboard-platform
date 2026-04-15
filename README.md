# infra-ev-dashboard-platform

CDK runtime infrastructure for `ev-dashboard.com`.

## Ownership

This repo owns the shared CDK runtime for the `ev-dashboard` slice:

- ALB
- ACM certificate issuance
- Route53 alias records
- EC2 app host
- EC2 data host
- EBS-backed data volume
- runtime image-map parameter
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

If the change touches EC2 host bootstrap and the dev/candidate lane hosts already exist, run the bootstrap precheck before any full deploy:

```bash
cd /Users/jiin/Documents/Files/02_EVnSolution/00_Source_code/CLEVER/clever-msa-platform/development/infra-ev-dashboard-platform
BOOTSTRAP_LANE=dev \
BOOTSTRAP_PRECHECK_MODE=proof \
BOOTSTRAP_APP_HOST_INSTANCE_ID=i-xxxxxxxxxxxxxxxxx \
BOOTSTRAP_DATA_HOST_INSTANCE_ID=i-yyyyyyyyyyyyyyyyy \
npm run bootstrap:precheck
```

`bootstrap:precheck` syncs the current Python bootstrap package to the existing lane hosts over SSM and runs `verify-app` / `verify-data` there. Use it to validate bootstrap drift directly on the hosts before the next full `cdk deploy`.

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
- `RUNTIME_MODE=ec2` is missing app/data host subnet inputs
- a later backend slice is enabled without the earlier slices it depends on
- `edge-api-gateway` is disabled while API slices are still enabled

Current EC2 runtime proof is narrower than the long-term target. At this stage, `RUNTIME_MODE=ec2` only supports:

- `front-web-console`
- `edge-api-gateway`
- `service-account-access`

Keep all later slice desired counts at `0` until their host-level runtime contracts are implemented. The deploy gate now enforces that boundary.

The command also prints the expected deploy wait signals so operators do not overreact to normal `UPDATE_IN_PROGRESS` windows.

## Required GitHub Configuration

Repository or environment variables:

- `RUNTIME_MODE`
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
- `APP_HOST_SUBNET_ID`
- `DATA_HOST_SUBNET_ID`
- `APP_HOST_SUBNET_AVAILABILITY_ZONE`
- `DATA_HOST_SUBNET_AVAILABILITY_ZONE`
- optional: `PRIVATE_SUBNET_IDS`
- optional: `AVAILABILITY_ZONES`
- optional: `APP_HOST_INSTANCE_TYPE`
- optional: `DATA_HOST_INSTANCE_TYPE`
- optional: `DATA_VOLUME_SIZE_GIB`
- optional: `BOOTSTRAP_PRECHECK_MODE`
- optional: `BOOTSTRAP_LANE`
- optional: `BOOTSTRAP_APP_HOST_INSTANCE_ID`
- optional: `BOOTSTRAP_DATA_HOST_INSTANCE_ID`
- optional: `BOOTSTRAP_SYNC_ROOT`
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
- optional: `POST_DEPLOY_SMOKE_TIMEOUT_SECONDS`
- optional: `POST_DEPLOY_SMOKE_POLL_SECONDS`

Repository secrets:

- `GH_ACTIONS_INFRA_ROLE_ARN`

The workflow uses the selected GitHub Environment (`dev`, `stage`, `prod`) for approval gates. The actual CDK deploy runs with the shared infra role because the existing `GH_ACTIONS_*_DEPLOY_ROLE_ARN` roles remain EC2/SSM deploy roles for `clever-deploy-control`.

For canonical runtime deploys, set `RUNTIME_MODE=ec2`. In that mode, `APP_HOST_SUBNET_ID`, `DATA_HOST_SUBNET_ID`, `APP_HOST_SUBNET_AVAILABILITY_ZONE`, and `DATA_HOST_SUBNET_AVAILABILITY_ZONE` are required. The current shell/auth proof expects both host subnets to be chosen from `PUBLIC_SUBNET_IDS`, and both hosts must receive public IPs from those subnet defaults so bootstrap can reach SSM, ECR, Secrets Manager, and package mirrors. `PRIVATE_SUBNET_IDS` is still imported as network metadata for later hardening, but the current proof does not run the hosts inside those private lanes because the imported VPC has no NAT or VPC endpoints there yet. The default app host stays on x86_64 (`t3.small`) because the live service image fleet is still `linux/amd64` only. The data host keeps its Graviton default (`t4g.small`) because it runs PostgreSQL and Redis locally and should avoid unnecessary EBS reattachment churn during proof updates. The EC2 data bootstrap currently expects the attached EBS volume at `/dev/sdf`; using `/dev/xvdf` on these Nitro instances leaves PostgreSQL and Redis permanently down even though the attachment exists.

GitHub variable scope matters for the EC2 runtime cutover. The shared network values in this repo currently live at repo scope, but the new host-placement keys (`APP_HOST_SUBNET_ID`, `DATA_HOST_SUBNET_ID`) may need environment-specific values. If those keys are absent from the selected GitHub Environment, the workflow still starts but preflight fails before deploy.

## Runtime Notes

- The stack issues its own ACM certificate from the hosted zone instead of importing a pre-created `CERTIFICATE_ARN`.
- The app host runs image-backed containers pulled from immutable ECR SHA tags.
- The data host owns PostgreSQL and Redis on EBS-backed storage.
- The current EC2 proof places both hosts in `PUBLIC_SUBNET_IDS` and relies on security groups, not private-only placement, to keep ingress narrow while NAT/VPC endpoints are still absent from the imported private subnets.
- The current EC2 proof keeps the app host on x86_64 by default because the live service images are still `linux/amd64` only. Do not switch the app host to Graviton until the image fleet is published as multi-arch.
- The data host stays on its current Graviton default unless there is a deliberate PostgreSQL/Redis compatibility reason to move it. Changing the data-host family replaces the EC2 instance and can trigger EBS reattachment churn during a proof deploy.
- The current shell/auth proof does not boot the full gateway route map. The app host writes a proof-only nginx config and mounts it into `edge-api-gateway` so the gateway can start with just:
  - `front-web-console`
  - `service-account-access`
  - docs/admin routes
- EC2 bootstrap changes only matter if the instances actually pick them up. In this repo that means app/data hosts must use `userDataCausesReplacement`, otherwise a successful stack update can still leave the old reconcile script and data bootstrap running on the existing instances.
- The ALB still routes `ev-dashboard.com/api/*` and `api.ev-dashboard.com/*` to the same edge entry on the app host so the front can keep same-host `/api` calls.
- The runtime image map is stored in SSM and consumed by the app-host bootstrap.
- The post-deploy smoke step is allowed to poll for host readiness because CloudFormation can finish before a fresh EC2 app host completes `cloud-init`, Docker install, and the first reconcile loop.
- The runtime is no longer modeled as ECS services, Service Connect, dedicated RDS instances, or ElastiCache clusters in canonical mode.
- Frontend and gateway container contracts stay the same:
  - `front-web-console` serves on `5174`
  - `edge-api-gateway` serves on `8080`
  - backend services still expect the same internal upstream names and ports
- Host-level bootstrap must preserve the same internal names that `edge-api-gateway` already expects:
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
- Host bootstrap is responsible for wiring any cross-service base URLs such as:
  - `DRIVER_PROFILE_BASE_URL=http://driver-profile-api:8000`
  - `DISPATCH_REGISTRY_BASE_URL=http://dispatch-registry-api:8000`
  - `ATTENDANCE_REGISTRY_BASE_URL=http://attendance-registry-api:8000`
  - `NOTIFICATION_HUB_BASE_URL=http://notification-hub-api:8000`
  - `VEHICLE_REGISTRY_BASE_URL=http://vehicle-asset-api:8000`
  - `TELEMETRY_HUB_BASE_URL=http://telemetry-hub-api:8000`
  - `TELEMETRY_DEAD_LETTER_BASE_URL=http://telemetry-dead-letter-api:8000`
  - `TELEMETRY_DEAD_LETTER_SOURCE_SERVICE=service-telemetry-listener`
  - `TELEMETRY_LISTENER_MQTT_*` worker settings from environment variables
