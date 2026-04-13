Source: https://lessons.md

# infra-ev-dashboard-platform Lessons.md

Start with a single runtime slice. This repo owns the shared `ev-dashboard.com` ECS/CDK runtime only. Do not expand it into a catch-all infra repo before the first cutover passes real smoke checks.

Seed the repo before you wire the submodule. A brand-new empty remote cannot be added cleanly as a linked child repo until `main` has at least one commit.

Deploy from explicit image URIs. This repo should not infer "the latest front image" or guess a SHA from another repo. The operator must pass the three image URIs that belong to the rollout.
