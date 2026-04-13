Source: https://lessons.md

# infra-ev-dashboard-platform Lessons.md

Start with a single runtime slice. This repo owns the shared `ev-dashboard.com` ECS/CDK runtime only. Do not expand it into a catch-all infra repo before the first cutover passes real smoke checks.

Seed the repo before you wire the submodule. A brand-new empty remote cannot be added cleanly as a linked child repo until `main` has at least one commit.

Deploy from explicit image URIs. This repo should not infer "the latest front image" or guess a SHA from another repo. The operator must pass the three image URIs that belong to the rollout.

Own the certificate in the stack when the hosted zone is already under our control. Importing a not-yet-created `CERTIFICATE_ARN` adds a manual dependency that blocks the first rehearsal for no gain.

Mirror the live runtime contract exactly. `front-web-console` is not an `80` port app just because it sits behind a browser; it listens on `5174`, and `edge-api-gateway` already expects short upstream names like `web-console` and `account-auth-api`. The ECS slice has to preserve those names and ports or the gateway will fail even if the ALB looks healthy.

Do not reuse the current `GH_ACTIONS_*_DEPLOY_ROLE_ARN` roles for CDK/ECS. In this environment those roles are still EC2/SSM deploy roles for `clever-deploy-control`. The ECS platform workflow needs a dedicated infra-capable role, even if the GitHub Environment names stay `dev`, `stage`, and `prod`.

Blank GitHub variables are not the same as "unset". The first deploy failed because empty strings from repo variables overrode CDK defaults for the service-connect namespace and health check paths. Parse optional config so empty values collapse back to `undefined` before the stack consumes them.

The first successful dev rehearsal was workflow run `24340628586`. It used `GH_ACTIONS_INFRA_ROLE_ARN`, created `EvDashboardPlatformStack`, issued the ACM certificate in-stack, and exposed `https://next.ev-dashboard.com` over ALB. That success only came after adding CDK bootstrap bucket permissions to the infra role; the EC2 deploy roles were the wrong trust and permission boundary.

ACM DNS validation is slow enough to look like a hung deploy. In this stack, Route53 validation records appeared immediately, but GitHub Actions stayed in `cdk deploy` until ACM flipped the cert to `ISSUED` several minutes later. Check the certificate state before killing the run.

Front-first means only the front should be considered ready. With `front-web-console` desired count `1` and `edge-api-gateway` desired count `0`, `next.ev-dashboard.com` returned `200` while `api.next.ev-dashboard.com` returned `503`. That is the expected state for a front-only rehearsal and should be documented so operators do not chase a fake API outage.
