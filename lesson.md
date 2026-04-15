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

EC2 host paths need stronger imported subnet metadata than ECS task paths. `ec2.Instance` on imported subnets broke until the stack switched from `Subnet.fromSubnetId()` to `Subnet.fromSubnetAttributes()` with an explicit availability zone lookup. Keep that helper local to infra and reuse it for future EC2-based surfaces instead of rediscovering the same failure in each stack.

Deploy gates have to speak the active runtime, not the previous one. Once `runtimeMode=ec2` existed, leaving ECS-era wait signals like RDS quiet periods and Service Connect rollout hints inside preflight made the operator loop misleading. Make preflight and post-deploy smoke runtime-aware as soon as a new topology path is introduced.

`cdk synth` is not a standalone truth command in this repo; it is an env-backed verification step. The first bare synth failed immediately on missing deploy variables, while the same command passed with a representative EC2 runtime env contract. For this stack, verify synth either through workflow-provided env or an explicit local env block, not an empty shell.

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

## GitHub Variable Scope Can Block A Runtime Switch Before CloudFormation Starts

The first EC2 runtime rehearsal proved that repo-scope deploy vars and environment-scope deploy vars are different operational state, not interchangeable documentation. `AWS_REGION`, hosted zone, VPC, and subnet list values were present at repo scope, but the new `APP_HOST_SUBNET_ID` and `DATA_HOST_SUBNET_ID` keys were missing in both `dev` and `prod` environment scopes. Because the workflow now exports those keys directly into the deploy job, preflight fails before CloudFormation starts if the selected environment does not provide them.

For future runtime-mode changes:

- check repo-scope vars and environment-scope vars separately
- treat new required host-placement keys as rollout prerequisites
- record whether a key is expected to be repo-global or environment-specific before editing the workflow

## A Candidate Lane Needs Stack Identity Separation, Not Just Different Vars

The first EC2 rehearsal also exposed a deeper issue: a `dev` workflow input is not a real candidate lane if the CDK stack id and fixed resource names stay identical. With `EvDashboardPlatformStack` hard-coded, a `dev` run in the same account and region would still target the production stack. The runtime image-map SSM parameter had the same problem when it was fixed at `/ev-dashboard/runtime/images`.

For future temporary lanes:

- make the stack id and stack name environment-aware
- scope any fixed resource names, especially SSM parameters, to the lane
- treat different domains without different stack identity as a false separation

## Subnet IDs And Availability Zones Need An Explicit Pair, Not An Ordered Guess

The first EC2 dev rehearsal reached CloudFormation and then rolled back because the app and data hosts were launched with the wrong availability zones for their subnets. Mapping `PRIVATE_SUBNET_IDS` to `AVAILABILITY_ZONES` by list index was not trustworthy in this account. The actual AWS subnet metadata said:

- `subnet-0c11dd64028c21521` -> `ap-northeast-2c`
- `subnet-06906a03d6e956a4f` -> `ap-northeast-2b`

Future EC2 runtime cutovers must carry explicit host subnet AZ values:

- `APP_HOST_SUBNET_ID` + `APP_HOST_SUBNET_AVAILABILITY_ZONE`
- `DATA_HOST_SUBNET_ID` + `DATA_HOST_SUBNET_AVAILABILITY_ZONE`

Do not infer host subnet AZ from shared subnet lists.

The first honest EC2 proof has to be narrower than the final topology. App host bootstrap was initially only strong enough to fetch image metadata, not to start containers, and the data host still needed explicit DB/user provisioning. The pragmatic fix was to codify a shell/auth-only proof first:

- `front-web-console`
- `edge-api-gateway`
- `service-account-access`

If the host-level runtime contract does not exist yet, do not pretend a later slice is ready just because its image URI exists. Make preflight fail until the host bootstrap can actually run that slice.

The next honest expansion was not "all later slices". It was `service-organization-registry` only. Company cockpit login depends on both tenant resolve (`/api/org/companies/public/resolve/`) and `workspace-bootstrap`, so the first cockpit-ready proof lane had to become `shell/auth/company-governance`, not a generic shell/auth lane. In this repo that means:

- data host bootstraps both `account_auth` and `organization_master`
- app host reconciles `organization-master-api`
- proof nginx exposes `/api/org/*`
- auth/bootstrap env keeps `ORGANIZATION_MASTER_BASE_URL=http://organization-master-api:8000`
- CSRF trusted origins include cockpit hosts, not just apex/api

EC2 image deploys need a host-side reconcile loop, not just user-data that runs once. Updating the runtime image-map SSM parameter does nothing for a running EC2 host unless the host has a timer or explicit deploy command that re-pulls images and restarts containers. For this repo, the app host now needs a reconcile service/timer, not just boot-time ECR login.

The first EC2 shell/auth candidate also proved that bootstrap reachability and ALB reachability are separate checks. The app host can be in the same VPC and still fail public smoke if:

- its AZ is not enabled on the ALB target group
- its subnet has no outbound path to package mirrors, SSM, ECR, or Secrets Manager

For the current proof lane, that means app/data hosts have to live in the imported public subnets. The private subnets in this VPC are not usable proof lanes yet because their route table only has the local route.

The first EC2 proof also showed that instance-family cost optimizations come after image compatibility, not before it. The live front/gateway/account-access image fleet is still `linux/amd64` only, so the app host must stay on x86_64 (`t3.small`) until multi-arch images are real. Picking Graviton first only creates a false failure mode where the host is healthy but `docker pull` cannot find an `arm64` manifest.

Do not widen that conclusion to the data host. PostgreSQL and Redis on the data host do not need the app image architecture, and changing the data-host family forces an EC2 replacement plus EBS reattachment. For the current proof lane, keep the data host on its existing Graviton default unless there is a separate data-runtime reason to move it.

CloudFormation finishing an EC2 app-host update is not the same thing as the app being ready. In this proof lane, the new x86 host needed extra time for `cloud-init`, `dnf install docker jq`, Docker enablement, and the first reconcile loop before ALB health checks and public smoke could pass. The post-deploy smoke gate needs a retry window for EC2 runtimes, or it will report a false failure even when the host is still progressing normally.

The first EC2 shell/auth proof also showed that a partial slice cannot reuse the full gateway route map verbatim. `edge-api-gateway` crashed on boot because nginx resolves static upstream names at startup, and the shell/auth proof intentionally does not start `driver-profile-api` or the later slice services. For the current narrow proof lane, the app host has to mount a proof-only nginx config that exposes only:

- `front-web-console`
- `service-account-access`
- `service-organization-registry`
- docs/admin routes

Cockpit candidate proof also needs one more operational check after deploy: confirm the app host actually pulled the new image SHAs from the runtime image-map parameter. In the first `cheonha` proof, CloudFormation and post-deploy smoke both passed while `organization-master-api`, `account-auth-api`, and `web-console` were still old images on the host. The honest order is:

1. build service images on each repo `main`
2. update `*_IMAGE_URI` vars in the selected infra environment
3. deploy the stack
4. verify app-host container image SHAs
5. only then seed cockpit tenant data and debug `/api/org/companies/public/resolve/`

Do not call a shell/auth/company-governance EC2 proof "failed" just because the full route map is absent; the route map has to match the slice.

Nitro device naming matters on the data host. The EBS attachment was present, but the bootstrap service waited forever for `/dev/xvdf` while the instance exposed the attached disk as `/dev/sdf -> /dev/nvme1n1`. For this repo's current EC2 proof, keep the attachment and bootstrap device path aligned on `/dev/sdf` or PostgreSQL/Redis will never start.

EC2 runtime fixes are not real until the hosts ingest the new bootstrap. The first patch added a proof-only gateway config and corrected the data device name, but the live candidate still booted the old scripts because the instances were updated in place. For this repo, app/data hosts must treat user-data drift as replacement-worthy (`userDataCausesReplacement`) or CloudFormation can report success while the hosts keep running stale bootstrap logic.

That rule applies even more strongly to the data host than to the app host. When a slice adds a new Postgres database or role to the data-host bootstrap contract, an in-place update can leave the old instance alive with the old bootstrap state. The symptom looks like an application wiring bug (`password authentication failed` from the new service), but the real fix is to force data-host replacement so the new DB/role bootstrap actually runs.

For the current proof lane, detachable EBS reattachment is the wrong optimization. Switching the data host to `userDataCausesReplacement: true` while keeping a separate `CfnVolumeAttachment` just moved the failure: CloudFormation tried to attach the existing volume to the new instance before the old attachment was gone and rolled back with `AlreadyExists`. In a no-migration proof lane, the honest shape is launch-time block-device EBS on the instance itself so host replacement and storage lifecycle move together.

Once bootstrap moved into a Python package, repeating the full release workflow for every bootstrap bug stopped making sense. The honest fix is not a report-only precheck layer; it is a separate fast deploy profile. For this repo:

Cockpit host support is only half-merged if the stack code changes but the deploy workflow never exports `COCKPIT_HOSTS`. In this repo, domain readiness for company cockpits now means all three layers agree:

- config parses `COCKPIT_HOSTS`
- workflow exports `COCKPIT_HOSTS`
- post-deploy smoke probes each cockpit host shell, not just the apex shell

If one of those is missing, the branch can look correct in synth/tests while the live deploy still ignores the new host.

1. keep `full` for release-grade proof
2. use `bootstrap-proof` when the goal is `synth -> deploy -> smoke`
3. use `smoke-only` when the stack already exists and only edge verification needs rerun

If a bootstrap helper becomes slower than the stack update it is supposed to save, remove it and collapse back to the smallest honest workflow profile.

`24446648973` proved the replacement. The `bootstrap-proof` profile skipped preflight and unit tests, still synthesized, deployed, and passed public smoke in under a minute. Keep that profile for dev/candidate EC2 bring-up; use `full` only when release-grade proof is the goal.

Deleted paths are not really gone if generated output still emits them. This repo ignores `dist/`, so a source cleanup can leave dead compiled entrypoints behind and create false noise in later audits. Keep the build contract explicit:

- `npm run build` must start by deleting `dist/`
- cleanup is not complete until regenerated `dist/` no longer contains the removed path

If a deleted runtime helper survives only in compiled debris, treat that as unfinished cleanup, not harmless leftovers.

EC2 user-data size is a real deployment limit, not an academic warning. The first `EvDashboardPlatformDevStack` create failed before either host booted because the data-host user-data exceeded EC2's 16 KB raw limit when the Python bootstrap package was inlined with `cat <<EOF` blocks. For this repo's EC2 lanes:

- keep user-data thin enough to install packages, fetch assets, and register systemd units
- stage the Python bootstrap runtime as a CDK S3 asset and download it on the host
- add or keep a user-data length assertion in tests so future bootstrap growth fails before CloudFormation

If a bootstrap change requires copying real source files into user-data, that change is pointed at the wrong layer.

Deploy-time tokens cannot be frozen into static runtime manifests. The widened EC2 app-host proof failed even with a healthy data host because the app service manifest was written through `JSON.stringify(...)` into an S3 asset, which turned `dataHost.instance.instancePrivateIp` into a literal `${Token[TOKEN...]}` string. Django then tried to connect to PostgreSQL and Redis at that fake hostname. For this repo, any runtime manifest that contains deploy-time values must be delivered through a deploy-time-resolved carrier such as Secrets Manager or SSM, not a static asset file produced directly from tokenized CDK objects.

For `bootstrap-proof`, service startup order is part of the deploy contract, not an implementation detail. The EC2 app host reconciles containers sequentially, so if `edge-api-gateway` is listed after the later slices, every slow image pull or later-slice failure turns `api.candidate.ev-dashboard.com` smoke into a structural false negative. Keep the runtime manifest ordered so the edge proof comes up first:

- `FRONT`
- `ACCOUNT_ACCESS`
- `ORGANIZATION`
- `GATEWAY`
- later slices after that

If the proof goal is shell/auth/org reachability, do not bury the gateway behind services that the smoke does not need.

`bootstrap-proof` also needs a config-level scope override, not just a faster workflow path. Leaving all later slice desired counts at `1` while only changing the smoke steps still forces the EC2 app host to spend minutes pulling and starting the full fleet, and a single slow later slice can make the proof look broken. For this repo:

- `bootstrap-proof` must coerce the effective desired counts down to `front + gateway + auth + organization`
- stack synthesis, runtime manifest generation, and public smoke all need to read that same narrowed config
- `full` is the only profile that should attempt full-fleet EC2 bring-up

If the proof scope lives only in docs or operator habit, reruns become noisy and structurally misleading again.

Post-deploy smoke needs a per-request timeout as well as an overall retry budget. The EC2 proof lane hit a state where ALB target health and manual curls were already green, but the workflow could still stay `in_progress` forever because one `fetch(...)` never returned. For this repo:

- each smoke request must run under an `AbortController` timeout
- the report should surface a hung endpoint as `request timed out`
- only the outer loop should own the longer EC2 grace window

Smoke URLs must also match the real application contract. The `company tenant resolve` check failed even after the host was healthy because the smoke called `/api/org/companies/public/resolve/` without the required `tenant_code` query string and got `400`. Validation smokes should probe the honest contract shape, then assert the expected semantic result such as `404`.
