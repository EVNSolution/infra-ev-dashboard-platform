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

## Operator Terms

This repo keeps the workflow input values as-is, but the operator-facing meaning should stay plain:

- `bootstrap-proof`
  - core-entry verification
  - deploys only the minimum user-entry services:
    - `front-web-console`
    - `edge-api-gateway`
    - `service-account-access`
    - `service-organization-registry`
- `full`
  - full-service verification
  - keeps the configured remaining business services enabled
- `warm-host-partial`
  - warm-host partial update
  - keeps the base stack alive and updates only manifest-listed services in fixed waves
  - not a new-service enable lane
- `smoke-only`
  - live-lane status recheck
  - does not change the stack

In prose, avoid old slice/proof shorthand. Use:

- `core-entry services`
- `remaining business services`
- `full-service bring-up`
- `warm-host partial update`
- `release impact`

## Warm-Host Partial Lane

`warm-host-partial` is the normal app-change lane once the base stack already exists.

- It is for updating services that are already part of the warm runtime.
- It is not the lane for turning on a service that is absent from the base stack.
- If a service is still disabled or missing from the base stack, use a bootstrap/baseline stack path first.

The lane is driven by `RELEASE_MANIFEST_PATH`, and the same manifest now flows through:

- `npm run preflight`
- preview
- wave reconcile on the app host
- scoped smoke
- rollback

### Release Manifest Impact

The manifest now supports an optional `impact` block:

```json
{
  "release_id": "dev-example",
  "impact": {
    "requires_gateway": true,
    "requires_front": false,
    "route_groups": ["people-and-assets"]
  },
  "services": {
    "service-driver-profile": {
      "action": "deploy",
      "image_uri": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-driver-profile:sha-driver"
    },
    "edge-api-gateway": {
      "action": "deploy",
      "image_uri": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:sha-gateway"
    }
  }
}
```

Use it like this:

- backend-only internal logic change
  - omit `impact` or leave every field false/empty
  - expected scope: backend only
- route-group or upstream routing change
  - set `impact.route_groups`
  - expected scope: backend + gateway
- public contract or shell change
  - set `impact.requires_front=true`
  - expected scope: backend + gateway + front

If the impact is ambiguous, prefer the conservative path:

- routing ambiguity -> include gateway
- public contract ambiguity -> include gateway and front

### What Preflight Will Now Block

For `warm-host-partial`, preflight now fails fast when:

- `RELEASE_MANIFEST_PATH` is missing or unreadable
- the base EC2 stack/app host is missing
- the manifest asks for a mutable or missing image tag
- `edge-api-gateway` is required by release impact but missing from the manifest
- `front-web-console` is required by release impact but missing from the manifest
- the app host reports `repairRequired=true`
- the app host detects runtime drift before the next release starts

This is intentional. The lane now prefers explicit operator correction over hidden stack churn.

### Drift, Repair, and Rollback

The app host keeps three state files:

- `/opt/ev-dashboard/state/current-state.json`
- `/opt/ev-dashboard/state/releases/<releaseId>.json`
- `/opt/ev-dashboard/state/last-known-good.json`

Current runtime policy is conservative:

- if runtime drift is detected, the next partial release is blocked
- if rollback fails, `repairRequired=true` is set and the next release is blocked
- there is no broad automatic self-heal yet
- only narrow self-heal is allowed:
  - the expected runtime spec still matches `current-state` and `last-known-good`
  - the container is only `missing` or `stopped`
  - image, port binding, and env hash are still aligned
  - in that case the host may recreate the same container spec before blocking the release

Operator response order:

1. inspect the current host state and release journal
2. identify whether the issue is drift, wave failure, or rollback failure
3. if drift or rollback failure set `repairRequired`, do not force the next release through
4. repair the host or restore the expected runtime state first
5. rerun preview -> preflight -> warm-host partial only after `repairRequired` is cleared

## Mandatory Preflight Gate

Before every `workflow_dispatch` deploy, run the same gate locally that the workflow now enforces in CI:

```bash
cd /Users/jiin/Documents/Files/02_EVnSolution/00_Source_code/CLEVER/clever-msa-platform/development/infra-ev-dashboard-platform
npm run preflight
npm test -- --runInBand
npx cdk synth
```

For EC2 runtime bring-up, use workflow `run_profile` instead of editing the YAML by hand:

- `full`
  - full-service verification
  - `preflight -> unit tests -> synth -> deploy -> post-deploy smoke`
- `bootstrap-proof`
  - core-entry verification
  - `synth -> deploy -> post-deploy smoke`
  - use this when the purpose is to validate stack/bootstrap/runtime bring-up quickly
  - in `RUNTIME_MODE=ec2`, this profile automatically narrows the runtime to `front-web-console + edge-api-gateway + service-account-access + service-organization-registry`
- `smoke-only`
  - live-lane status recheck
  - `post-deploy smoke` only against the current live lane
  - use this when stack topology is already up and only edge proof needs to be rerun

For EC2 lanes, keep user-data thin. The current contract is:

- user-data installs base packages and systemd units
- the Python bootstrap package is delivered as a CDK-managed S3 asset
- host bootstrap stays inside the packaged Python runtime, not inline user-data shell

If bootstrap package changes start inflating user-data again, stop and move the new logic into the packaged Python runtime instead of adding more inline shell.

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
- a remaining business service is enabled without the service groups it depends on
- `edge-api-gateway` is disabled while API slices are still enabled

Current EC2 core-entry verification is narrower than the long-term target, but that narrow scope now belongs to the `bootstrap-proof` profile, not to EC2 runtime as a whole. In this repo:

- `front-web-console`
- `edge-api-gateway`
- `service-account-access`
- `service-organization-registry`

- `bootstrap-proof` automatically forces all remaining business-service desired counts to `0` so stack, manifest, and smoke all see the same core-entry service scope.
- `full` keeps the configured remaining business-service desired counts and is the only honest profile for full-service bring-up.

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
- optional: `APP_HOST_VOLUME_SIZE_GIB`
- optional: `DATA_HOST_INSTANCE_TYPE`
- optional: `DATA_VOLUME_SIZE_GIB`
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

For canonical runtime deploys, set `RUNTIME_MODE=ec2`. In that mode, `APP_HOST_SUBNET_ID`, `DATA_HOST_SUBNET_ID`, `APP_HOST_SUBNET_AVAILABILITY_ZONE`, and `DATA_HOST_SUBNET_AVAILABILITY_ZONE` are required. The current default-VPC public-only EC2 lane expects both host subnets to be chosen from `PUBLIC_SUBNET_IDS`, and both hosts now force `associatePublicIpAddress: true` so bootstrap can reach SSM, ECR, Secrets Manager, and package mirrors even when the imported subnet metadata does not auto-assign public IPs. `PRIVATE_SUBNET_IDS` is optional for this EC2 lane and stays as network metadata for later hardening; the current verification does not place hosts in private lanes because that path still has no NAT or VPC endpoints. The default app host stays on x86_64 (`t3.small`) because the live service image fleet is still `linux/amd64` only, but that default is for `bootstrap-proof` only. If remaining business services are enabled under `RUN_PROFILE=full`, set `APP_HOST_INSTANCE_TYPE` explicitly to a non-burstable x86 host such as `m6i.2xlarge`; preflight now rejects t-family app hosts for full-service EC2 bring-up. The data host keeps its Graviton default (`t4g.small`) because it runs PostgreSQL and Redis locally and should avoid unnecessary EBS reattachment churn during verification updates. The EC2 data bootstrap currently expects the attached EBS volume at `/dev/sdf`; using `/dev/xvdf` on these Nitro instances leaves PostgreSQL and Redis permanently down even though the attachment exists.

GitHub variable scope matters for the EC2 runtime cutover. The shared network values in this repo currently live at repo scope, but the new host-placement keys (`APP_HOST_SUBNET_ID`, `DATA_HOST_SUBNET_ID`) may need environment-specific values. If those keys are absent from the selected GitHub Environment, the workflow still starts but preflight fails before deploy.

## Runtime Notes

- The stack issues its own ACM certificate from the hosted zone instead of importing a pre-created `CERTIFICATE_ARN`.
- The app host runs image-backed containers pulled from immutable ECR SHA tags.
- The data host owns PostgreSQL and Redis on EBS-backed storage.
- The current default-VPC public-only EC2 lane places both hosts in `PUBLIC_SUBNET_IDS` and relies on security groups, not private-only placement, to keep ingress narrow while NAT/VPC endpoints are still absent from the private-lane path.
- The current EC2 proof keeps the app host on x86_64 by default because the live service images are still `linux/amd64` only. Do not switch the app host to Graviton until the image fleet is published as multi-arch.
- The data host stays on its current Graviton default unless there is a deliberate PostgreSQL/Redis compatibility reason to move it. Changing the data-host family replaces the EC2 instance and can trigger EBS reattachment churn during a proof deploy.
- The current shell/auth/company-governance proof does not boot the full gateway route map. The app host writes a proof-only nginx config and mounts it into `edge-api-gateway` so the gateway can start with just:
  - `front-web-console`
  - `service-account-access`
  - `service-organization-registry`
  - docs/admin routes
- EC2 bootstrap changes only matter if the instances actually pick them up. In this repo that means app/data hosts must use `userDataCausesReplacement`, otherwise a successful stack update can still leave the old reconcile script and data bootstrap running on the existing instances.
- The ALB still routes `ev-dashboard.com/api/*` and `api.ev-dashboard.com/*` to the same edge entry on the app host so the front can keep same-host `/api` calls.
- The runtime image map is stored in SSM and consumed by the app-host bootstrap.
- App-host reconcile is boot/deploy scoped, not periodic. `userDataCausesReplacement` plus `runtimeFingerprint` already force host replacement when the manifest changes, so a timer that re-runs full reconcile on a live host only creates avoidable gateway churn.
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
