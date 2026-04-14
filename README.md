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

## Deploy Contract

The deploy workflow expects explicit image URIs for all current slice services:

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

Image tags are SHA-only. This repo should not guess or discover a `latest` image on its own.

## Required GitHub Configuration

Repository or environment variables:

- `AWS_REGION`
- `HOSTED_ZONE_ID`
- `HOSTED_ZONE_NAME`
- `APEX_DOMAIN`
- `API_DOMAIN`
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
