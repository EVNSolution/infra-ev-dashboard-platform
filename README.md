# infra-ev-dashboard-platform

ECS/CDK runtime infrastructure for `ev-dashboard.com`.

## Ownership

This repo owns the shared ECS/CDK runtime for the `ev-dashboard` slice:

- ALB
- ACM
- Route53 alias records
- ECS cluster and services
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
- `APEX_DOMAIN`
- `API_DOMAIN`
- `CERTIFICATE_ARN`
- `VPC_ID`
- `PUBLIC_SUBNET_IDS`
- optional: `AVAILABILITY_ZONES`
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

- `GH_ACTIONS_DEV_DEPLOY_ROLE_ARN`
- `GH_ACTIONS_STAGE_DEPLOY_ROLE_ARN`
- `GH_ACTIONS_PROD_DEPLOY_ROLE_ARN`

The workflow uses the selected GitHub Environment (`dev`, `stage`, `prod`) for approval gates, but the role secret names stay aligned with the current CLEVER deploy naming.
