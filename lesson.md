Source: https://lessons.md

# infra-ev-dashboard-platform Lessons.md

Start with a single runtime slice. This repo owns the shared `ev-dashboard.com` ECS/CDK runtime only. Do not expand it into a catch-all infra repo before the first cutover passes real smoke checks.

Seed the repo before you wire the submodule. A brand-new empty remote cannot be added cleanly as a linked child repo until `main` has at least one commit.

Deploy from explicit image URIs. This repo should not infer "the latest front image" or guess a SHA from another repo. The operator must pass the three image URIs that belong to the rollout.

Own the certificate in the stack when the hosted zone is already under our control. Importing a not-yet-created `CERTIFICATE_ARN` adds a manual dependency that blocks the first rehearsal for no gain.

Mirror the live runtime contract exactly. `front-web-console` is not an `80` port app just because it sits behind a browser; it listens on `5174`, and `edge-api-gateway` already expects short upstream names like `web-console` and `account-auth-api`. The ECS slice has to preserve those names and ports or the gateway will fail even if the ALB looks healthy.
