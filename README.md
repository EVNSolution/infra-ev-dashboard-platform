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

## Deploy Contract

The deploy workflow expects explicit image URIs for all three services:

- `front-web-console`
- `edge-api-gateway`
- `service-account-access`

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
- optional: `FRONT_CPU`
- optional: `FRONT_MEMORY_MIB`
- optional: `GATEWAY_CPU`
- optional: `GATEWAY_MEMORY_MIB`
- optional: `ACCOUNT_ACCESS_CPU`
- optional: `ACCOUNT_ACCESS_MEMORY_MIB`
- optional: `FRONT_HEALTH_CHECK_PATH`
- optional: `GATEWAY_HEALTH_CHECK_PATH`
- optional: `ACCOUNT_ACCESS_HEALTH_CHECK_PATH`

Repository secrets:

- `GH_ACTIONS_INFRA_ROLE_ARN`

The workflow uses the selected GitHub Environment (`dev`, `stage`, `prod`) for approval gates. The actual CDK deploy runs with the shared infra role because the existing `GH_ACTIONS_*_DEPLOY_ROLE_ARN` roles remain EC2/SSM deploy roles for `clever-deploy-control`.

When `ACCOUNT_ACCESS_DESIRED_COUNT` is greater than `0`, `PRIVATE_SUBNET_IDS` becomes required. The stack uses those subnets for the dedicated `service-account-access` PostgreSQL and Redis resources.

## Runtime Notes

- The stack issues its own ACM certificate from the hosted zone instead of importing a pre-created `CERTIFICATE_ARN`.
- The front service listens on `5174`, matching the existing container contract.
- The ALB routes `ev-dashboard.com/api/*` to `edge-api-gateway` so the front can keep same-host `/api` calls.
- When the auth slice is enabled, the stack creates dedicated private PostgreSQL 16 and Redis resources for `service-account-access` and injects the required runtime env/secrets into the task definition.
- ECS Service Connect provides the short names that `edge-api-gateway` already expects:
  - `web-console:5174`
  - `account-auth-api:8000`
