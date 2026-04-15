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

Stateful AWS versions have to be tested against the target region, not assumed from docs or habits. This stack first failed on PostgreSQL `16.4`, then succeeded on `16.13` in `ap-northeast-2`. Pin the version that synth and deploy have actually proven in this account.

The first auth-slice deploy looked half-broken because `service-account-access` was healthy while `edge-api-gateway` still returned `504` and then `502`. The lesson is to separate infra readiness from edge readiness: RDS, Redis, and the Django task can be correct while the gateway still carries stale Compose-era assumptions.

ECS service updates can stay `UPDATE_IN_PROGRESS` in CloudFormation after the new task is already serving public traffic. Do not guess; keep checking public smoke, ECS deployment state, and CloudFormation together until all three agree.

Apex cutover can be mostly a config change when the runtime is already proven. For `ev-dashboard.com`, the successful cutover reused the same stable front/gateway/account-access images and changed only `APEX_DOMAIN` and `API_DOMAIN` before rerunning the deploy workflow.

Route53 alias updates can become visible before every local resolver follows along. During this cutover, public DNS already returned the ALB IPs while the local resolver still failed `curl https://ev-dashboard.com`. Use `dig` plus `curl --resolve` to verify the ALB path directly until local caches catch up.

The old runtime was not passive. `test-test-sh` could write the apex record from inside its task lifecycle, so cutting DNS over was only half of the job. The old service had to be scaled to `0` immediately after the new apex/API hosts answered correctly.

GitHub `workflow_dispatch` has a hard property cap. Once this repo crossed 25 inputs, manual deploys started failing with `HTTP 422: No more than 25 properties are allowed`. The deploy contract has to keep runtime images in repo vars and keep workflow inputs small, or the run never starts.

CloudFormation success is not a substitute for public slice smoke. Run `24372474821` finished `success` while `/api/org/*` still returned `502`. The root cause was gateway rollout semantics, not a failed stack resource.

When a gateway uses direct Service Connect upstreams, the stack should make the gateway wait for the backend services it depends on. The follow-up fix in `24373001123` added explicit dependencies on `front-web-console`, `service-account-access`, and `service-organization-registry` before rolling `edge-api-gateway`.

For the `Company Governance` slice, the honest production proof stayed read-only:

- `/api/org/companies/public/` -> `200`
- `/api/org/companies/` with admin JWT -> `200`
- `/api/org/fleets/` with admin JWT -> `200`

That closed the routing and auth path without mutating live data.

Do not poll deploys as if every signal means the same thing. In this stack, the useful wait order is:

1. GitHub Actions clears install, tests, and synth.
2. CloudFormation flips to `UPDATE_IN_PROGRESS`.
3. New `AWS::RDS::DBInstance` resources spend several minutes creating.
4. Only after that do new ECS services appear in `list-services`.
5. Only after that should repeated public smoke matter.

During step 3, `502` from new gateway routes is expected and usually means "backend service resource not created yet", not "nginx route is wrong". Use a slower `60-90s` polling cadence while DB resources are provisioning.

The second `502` window is a different signal. In Slice 2, `service-driver-profile`, `service-vehicle-registry`, `service-personnel-document-registry`, and `service-vehicle-assignment` all reached steady state before `edge-api-gateway` finished its own rollout. In that short period, edge logs showed `could not be resolved` for the new Service Connect names and then flipped to `401` once the new gateway task settled. If the backend services already exist, check `edge-api-gateway` deployment state and edge logs before changing config.

When a runtime mode changes, lock the host contract in config before touching the stack. For the EC2 app/data host migration, `RUNTIME_MODE=ec2` had to fail fast on `APP_HOST_SUBNET_ID` and `DATA_HOST_SUBNET_ID` in both config parsing and preflight tests before any topology rewrite started. That keeps later stack work from hiding simple operator input mistakes.

Slice 4 added one more wait pattern. Even after the new gateway task was serving good public smoke, the workflow and stack still stayed open because the old ALB target was draining. In this stack, `deregistration_delay.timeout_seconds` is `300`, so target draining can be the last long pole after the new tasks are already healthy. When the public endpoints have flipped to the expected `200/404` shape, check target-group draining before firing another redeploy.

Temporary bridge envs are runtime compatibility, not trust compatibility. `SETTLEMENT_OPS_BASE_URL`, `TELEMETRY_HUB_BASE_URL`, and `TERMINAL_REGISTRY_BASE_URL` can keep a Slice 4 task graph alive while later slices are still on the old public hub, but the old hub does not automatically trust the new platform JWT. If a bridge remains optional, the service code must degrade gracefully instead of expecting those upstream calls to succeed.

Public repo workflows are not a guaranteed build path in this account. Slice 3 hit a billing block where `service-dispatch-registry`, `service-delivery-record`, and `service-attendance-registry` image jobs never started. The practical fallback was local `docker buildx` plus ECR push, followed by the usual infra workflow with explicit image URIs.

For local Docker fallback builds, always push `linux/amd64`. The first local push failed only at ECS pull time because the manifest did not match the Fargate platform.

Slice 3 also proved that a new task definition is not the same as an honest slice proof. `service-delivery-record` and `service-attendance-registry` both needed production smoke on their real list endpoints before the rollout was trustworthy:

- `/api/delivery-record/records/`
- `/api/attendance/days/`

The prefix roots returned `404` once routing was correct. That was expected and should not be treated as slice failure.

When one backend service depends on another, the CDK dependency ordering shows up as quiet wait time in CloudFormation. In Slice 3, `service-attendance-registry` rolled first, then `service-delivery-record` updated only after attendance completed. That delay was intentional, not ignored image input.

Slice 5 added a more specific dependency lesson for direct gateway upstreams. CloudFormation created the new settlement services in the right order, but the first usable public proof still waited for `EdgeApiGatewayService` itself to roll after the settlement services were already present. Before that happened, gateway logs kept showing `settlement-*-api could not be resolved (3: Host not found)` even though the backend task definitions and databases were already created.

Treat that as a separate phase boundary:

1. settlement RDS instances `CREATE_COMPLETE`
2. settlement ECS services `running=1`
3. `EdgeApiGatewayService UPDATE_IN_PROGRESS`
4. public settlement health routes flip from `502` to `200`

Do not misread the earlier `502` as a bad gateway route when the real issue is late name availability for newly introduced Service Connect upstreams.

## Preflight Must Enforce The Repeated Lessons

This repo now owns the deploy gate as code, not just as prose. Before every slice deploy, run:

```bash
npm run preflight
npm test -- --runInBand
npx cdk synth
```

`npm run preflight` is where repeated rollout mistakes should graduate:

- missing deploy env
- mutable image tags
- wrong environment/domain pairing
- impossible slice ordering
- API slices enabled without `edge-api-gateway`

If the same class of prod surprise appears twice, add it to the preflight gate instead of only expanding `lesson.md`.

Support Surface added one more concrete wait pattern. The five new backend services all reached `running=1` before the stack closed, but public health still briefly split between `200` and `502` while `edge-api-gateway` was replacing its old task. The slice only became honestly closed when all three were true at the same time:

- GitHub Actions run `24384039348` reached `completed/success`
- `EvDashboardPlatformStack` returned to `UPDATE_COMPLETE`
- support health routes were all `200` and protected list routes were all `401`

Treat that as the final closure rule for direct-upstream slices with new Service Connect names. Service steady state alone is not enough, and public smoke alone is not enough.

Repo vars are part of deploy state in this repo, not just metadata. Because `workflow_dispatch` hit its property cap, image URIs live in repo vars and can silently drift away from what is actually present in ECR. Preflight now has to prove those tags exist in ECR before deploy. If a future rollout fails on a missing image tag after `cdk deploy` has already started, the gate is incomplete.

Slice 7 is intentionally split. `service-terminal-registry`, `service-telemetry-hub`, and `service-telemetry-dead-letter` closed as `7a`, but `service-telemetry-listener` remains a `desired=0` worker until a real MQTT broker endpoint and credentials are confirmed. Service creation in ECS is not permission to enable the listener.

Telemetry proof also needs real endpoints, not just the prefix name. The honest external proof for `7a` was:

- `/api/terminals/health/` -> `200`
- `/api/terminals/` -> `401`
- `/api/telemetry/health/` -> `200`
- `/api/telemetry/terminals/<uuid>/latest-location/` -> `401`
- `/api/telemetry-dead-letters/health/` -> `200`
- `/api/telemetry-dead-letters/` -> `401`

Deploy docs have to behave like an operator loop, not a history log. If a production rollout still requires jumping between repo lessons, root lessons, and rollout notes just to decide whether to wait or debug, the docs are not finished. The live operator path for this repo is now:

- preflight gate
- deploy operator loop
- UI smoke and decommission

Keep the timing baseline, wait signals, and stop-versus-debug rules in that runbook path, not only in retrospective lessons.

`cdk deploy` success is not enough for this repo. The same workflow has to run a post-deploy public smoke step and fail if the public edge still answers with the wrong status. Otherwise the operator is forced back into manual curl checks and the deploy loop becomes slow again.
