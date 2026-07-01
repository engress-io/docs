# Narrative: Staging Environment — Phase 7a (June 30, 2026)

## "Every push was production"

Until P07A, `main` went straight to `engress-east`, `engress-west`, and `engress.io`. No gate. No place to break tunnels, TLS, or multi-port changes without touching real users. P04 gave us EKS; P03 gave us multi-region — but we still had one environment with a production label.

P07A adds a **staging lane**: same Helm/ECR/EKS path as prod, lighter scale, isolated data, staging-first CI.

**Status as of 2026-06-30:** Code and workflows **shipped** in PR #27. **Staging is not live** until operator setup (Neon, Clerk, Terraform, DNS, GitHub environments) completes. See [Operator checklist](#operator-checklist-what-you-still-need-to-do).

---

## Prologue: the old spec was wrong

The June 28 design assumed **EC2 + t4g.micro** (~$10–18/mo). Production had already moved to **EKS east + west + Global Accelerator**. Reusing EC2 for staging would have validated a deploy path we no longer run.

We rewrote the spec for EKS, east-only v1 (no GA, no west), and sized cost against the real AWS bill (~$13/mo prod) — not list-price EKS math.

---

## Chapter 1: "East had no name, west did"

Multi-region work (P03) left three naming conventions in parallel:

- Symmetric: `engress-east` / `engress-west`, `east-nlb-arn` / `west-nlb-arn`
- Asymmetric: `edge-origin` (implicit east) vs `edge-origin-west`
- Neutral: `engress-edge` binary/chart (correct — product name, not region)

P07A standardizes **bilateral explicit** names for operators:

| Layer | Before (east) | After |
|-------|---------------|-------|
| Edge origin DNS | `edge-origin.engress.io` | `edge-origin-east.engress.io` |
| Core origin DNS | `core-origin.engress.io` | `core-origin-east.engress.io` |
| SSM cluster | `engress-deploy-eks-cluster-name` | `engress-deploy-eks-east-cluster-name` (+ legacy alias) |
| Helm values | `values.yaml` (implicit) | `values-east.yaml` |

Tenant URLs stay `*.edge.engress.io` — GA handles region; customers never see `east`/`west`.

ADR: `specs/2026-06-30-p07a-east-west-naming-adr.md`

---

## Chapter 2: "Two workflows, one SHA"

### Staging (auto on `main`)

`deploy-staging.yml`:

1. Path-filter: SPA / core / edge / helm (same rules as old `deploy-k8s`)
2. Build → ECR tag = git SHA
3. Helm to `engress-staging-east` via `ENGRESS_ENV=staging`
4. `validate.sh` + staging agent binaries → `staging.engress.io/downloads/...`

If SSM has no staging cluster yet, jobs skip with a message — **prod is not deployed**.

### Production (gated)

`deploy-production.yml`:

1. Triggers when staging workflow succeeds, or manual dispatch with explicit SHA
2. GitHub **`production` environment** — required reviewers
3. Promotes **same SHA** (no rebuild): `helm-deploy-eks-east` + west edge
4. Smoke against `engress.io`

### Emergency path

`deploy-k8s.yml` is **manual only** — break-glass prod reconcile.

---

## Chapter 3: "What staging looks like"

| | Production | Staging |
|---|-----------|---------|
| Domain | `engress.io` | `staging.engress.io` |
| Tunnels | `*.edge.engress.io` | `*.edge.staging.engress.io` |
| Clusters | east + west + GA | east only (v1) |
| SSM prefix | `engress-deploy-*` | `engress-staging-deploy-*` |
| Neon / Clerk | prod | separate branch + app |
| ACME | production LE | LE staging endpoint |

Terraform: `environment = "staging"` + `deploy/terraform/env/staging.tfvars.example`  
Operator runbook: `deploy/docs/staging-setup.md`

---

## Chapter 4: "Misnamed rollout script"

`staging-rollout.sh` deployed to **production** (legacy CodePipeline + EC2). Renamed to `prod-rollout.sh`; old name is a deprecated shim that warns and delegates.

---

## What shipped (code)

- Specs: updated P07A design, east/west naming ADR
- Terraform: `environment` var, bilateral SSM, configurable node group sizes
- Helm: `values-east`, `values-staging`
- Scripts: `ssm-deploy-config.sh` (`ENGRESS_ENV`), `helm-deploy-eks-{east,staging}`, `validate.sh`, `stale-check.sh`, `build-agent-staging.sh`
- CI: `deploy-staging.yml`, `deploy-production.yml`
- Ops: `helm-deploy-staging`, `helm-deploy-east` in `dispatch-ops.sh` / `ops.yml`

## What did not ship (operator / phase 2)

- Live `staging.engress.io` DNS and CloudFront
- Neon staging branch + Clerk staging app in SSM
- Terraform apply for staging stack (isolated state)
- GitHub `staging` / `production` environment configuration
- P07B full tunnel lifecycle tests (validate.sh is v1 smoke + API)
- Staging west edge + GA (optional phase 2)

---

## Operator checklist: what you still need to do

Merge PR #27 (+ submodule PRs on `walter/p07a-staging-environment-7db0`), then:

### 1. External services (~30 min)

- **Neon:** create `staging` branch; store `engress-staging-neon-db-connection-string` in SSM
- **Clerk:** new staging app; store `engress-staging-clerk-secret-key` and `engress-staging-clerk-publishable-key` in SSM

### 2. Terraform (~1 apply window)

```bash
./deploy/scripts/terraform/publish-ssm-tfvars.sh \
  deploy/terraform/env/staging.tfvars.example \
  engress-terraform-tfvars-staging
```

Apply with **isolated state** (`engress/deploy/staging/...`). Until P08 per-stack split supports staging, use monolith + staging tfvars. Confirm `engress-staging-deploy-eks-east-cluster-name` appears in SSM.

### 3. DNS (Spaceship)

- `staging.engress.io` → staging CloudFront
- `*.edge.staging.engress.io` → staging east NLB IP
- `edge-origin-east.staging` / `core-origin.staging` → ALB CNAMEs

**Prod DNS (when ready):** add `edge-origin-east` CNAME; keep `edge-origin` as alias during migration.

### 4. GitHub (repo settings)

- Environment **`staging`** — no required reviewers
- Environment **`production`** — add yourself (and/or team) as required reviewers
- Optional secrets: `STAGING_SPA_BUCKET`, `STAGING_CLERK_PUBLISHABLE_KEY`

### 5. First validation

```bash
./deploy/agents/dispatch-ops.sh helm-deploy-staging
ENGRESS_ENV=staging ./deploy/scripts/smoke/validate.sh
curl -sf https://staging.engress.io/api/healthz
```

### 6. Cutover CI behavior

After staging is healthy, merge to `main` and confirm:

1. `deploy-staging` runs and passes
2. `deploy-production` waits for approval, then promotes same SHA

---

## Related

- Spec: `specs/2026-06-28-p07a-staging-environment-design.md`
- P07B validation: `specs/2026-06-28-p07b-infrastructure-validation-design.md`
- P08 deploy home: [P08 narrative](./2026-06-30-p08-deploy-submodule-and-infra-safety.md)
