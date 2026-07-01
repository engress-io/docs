# Narrative: Deploy Submodule & Infra Safety — Phase 8 (June 30, 2026)

## "One apply deleted Ohio *and* California"

We had just finished P03 multi-region: `engress-west` in us-west-1, Global Accelerator fronting both edges, Spaceship DNS on anycast A records. Production was healthy. Then someone ran `apply-eks` with **partial `-var` flags** — `enable_eks=true` but no `enable_eks_west` or `enable_global_accelerator`. Terraform read the missing vars as `false` and planned destroys for the west cluster and GA.

Recovery took hours. The fix is not "be more careful." The fix is **structure**: one deploy home, one source of intent, guards that refuse protected destroys.

**Status as of 2026-06-30:** Phases 0–2 and 4 largely shipped. Phase 3 (per-stack state split) pending maintenance window.

---

## Prologue: deploy was everywhere

Before P08, "deploy" was not a repo — it was a scavenger hunt:

| Location | Owned |
|----------|--------|
| `core/deploy/terraform/` | VPC, EKS, GA, CloudFront, IAM |
| `scripts/deploy/` | 66 operator scripts |
| `charts/` (superproject root) | Helm |
| `.github/workflows/` | CI, ops, deploy-k8s |
| `scripts/agent/` | dispatch-ops, DNS, Clerk |

Each path had different path resolution, different assumptions about where tfvars live, and no guard against deleting production.

---

## Chapter 1: "The incident"

*Trigger: `ops-terraform.sh apply-eks` with partial `-var` overrides*

Terraform compared state (west + GA exist) against intent (vars default false) and produced a destroy plan. Operator applied. **`engress-west` gone. GA gone.** East kept running; `*.edge.engress.io` fell back or broke depending on DNS timing.

Manual recovery:

1. Re-apply with full tfvars restoring west EKS + GA
2. `helm-deploy-west`, `collect-lb-arns.sh`, `apply-ga`
3. Spaceship `*.edge` back to GA anycast A records

Same week, P04's decommission apply had nearly deleted CloudFront for a different reason (incomplete tfvars, `enable_frontend=false`). **Two foot-guns, same root cause: intent drift.**

---

## Chapter 2: "Safety rails first" (Phase 1)

*Shipped in `scripts/` + `core/deploy/terraform/` before submodule migration*

### SSM tfvars as sole intent

`engress-terraform-tfvars` in SSM is the **only** source of `enable_*` flags. `ops-terraform.sh` no longer passes `-var enable_eks=true` style overrides.

Required pins (operator must publish via `publish-ssm-tfvars.sh`):

```hcl
enable_eks                = true
enable_eks_west           = true
enable_global_accelerator = true
deploy_target             = "eks"
```

### plan-guard

`plan-guard.sh` parses `terraform show -json` and **blocks** destroys of:

- EKS clusters (east + west)
- Global Accelerator
- SPA S3 bucket (`flux-spa-*`)
- VPC (when so configured)

Override only with `ALLOW_INFRA_DESTROY=1` — loud, logged, discouraged.

### prevent_destroy

Terraform `lifecycle { prevent_destroy = true }` on the same critical resources — belt and suspenders.

### Helm pin

GHA ops workflow uses git SHA for image tags, not `:latest`. Fixed `CORE_VALUES[@]` empty-array bash bug under `set -u`.

---

## Chapter 3: "One repo to rule deploy" (Phase 0 + 2)

*New submodule: `github.com/engress-io/deploy` → `deploy/`*

```
deploy/
├── terraform/          # legacy monolith + future per-stack state
├── helm/               # engress-core, engress-edge
├── docker/             # container Dockerfiles
├── scripts/            # guards, terraform, cluster, workload, smoke
└── agents/             # dispatch-ops, DNS, Clerk
```

Superproject `.gitmodules` adds `deploy/`. Old paths become **shims** that `exec` into deploy:

- `scripts/deploy/scripts/ops-terraform.sh` → `deploy/scripts/terraform/ops-terraform.sh`
- `charts/` → prefer `deploy/helm/`
- `core/deploy/terraform/` → compatibility shim during migration

Layer model:

| Layer | Tool | Frequency |
|-------|------|-----------|
| L1 Foundation | Terraform stacks | Rare |
| L2 Cluster | kubectl + addons | Occasional |
| L3 Workloads | Helm + SPA | Daily |

**Invariant:** L3 cannot call L1 `apply` without plan-guard + GHA `production` environment approval.

---

## Chapter 4: "Stack applies without west destroys" (Phase 3 — partial)

`apply-stack.sh` targets subsets of the legacy monolith:

```bash
./deploy/agents/dispatch-ops.sh plan-stack stack=eks-east
./deploy/agents/dispatch-ops.sh apply-stack stack=eks-east
```

Stacks: `eks-east`, `eks-west`, `edge-routing`, etc. Full state split into separate S3 keys is documented in `deploy/scripts/terraform/migrate-state.sh` — **not done**; needs maintenance window + `terraform state mv` with 0-change verification.

---

## Chapter 5: "GHA checks out deploy" (Phase 4)

- `.github/workflows/ops.yml` — checkout `engress-io/deploy`, `plan-stack` / `apply-stack`
- `.github/workflows/ci.yml`, `deploy-k8s.yml` — deploy repo for Helm/scripts paths
- `production` environment gate on foundation applies
- Plan artifacts uploaded for audit

Phase numbering note: this work was briefly mislabeled **P06**; **P06 is subscription billing**. Deploy submodule is **P08**.

---

## What shipped

| Deliverable | Status |
|-------------|--------|
| `plan-guard.sh` + wiring in ops-terraform + GHA | ✅ |
| SSM-only tfvars (no `-var enable_*` overrides) | ✅ |
| `prevent_destroy` on EKS, GA, SPA bucket | ✅ |
| `engress-io/deploy` submodule | ✅ |
| Helm + scripts + docker moved to deploy | ✅ |
| Shims from old paths | ✅ |
| `apply-stack.sh` (targeted monolith applies) | ✅ |
| `audit-ssm-tfvars.sh`, `publish-ssm-tfvars.sh` | ✅ |
| Per-stack Terraform state | 🔲 Operator window |
| Delete shims / `core/deploy/terraform/` | 🔲 After state split |
| Oasis infra panel (plan-guard status, tfvars drift) | 🔲 Phase 5 |
| Selective deployment (Phase 4.5) | ✅ Component-scoped CI + dispatch rules |

---

## Chapter 6: "Stop redeploying everything" (Phase 4.5)

*Trigger: UI change ran full EKS pipeline — east, west, Helm, SPA*

P08 solved **infra safety** (plan-guard, SSM tfvars). It did not solve **workload granularity**: `deploy-k8s.yml` still built both images and rolled east + west + SPA on any matched path.

**Fix:** deployment matrix in `deploy/docs/deployment-matrix.md`:

- `core/web/**` → SPA only
- `core/**` (backend) → core image + Helm east core
- `edge/**` → edge image + Helm east edge + west edge
- `deploy/helm/**` → Helm only (no ECR)
- Full stack → manual `helm-deploy-all` or workflow_dispatch scope=full

CI uses `dorny/paths-filter` to run only the matching component jobs. Agents get mandatory rules: never dispatch `helm-deploy-all` unless the task explicitly requires it.

---

## Operator checklist

```bash
# 1. Publish production intent (one-time / when flags change)
./deploy/scripts/terraform/publish-ssm-tfvars.sh

# 2. Audit before any foundation work
./deploy/agents/dispatch-ops.sh audit-ssm-tfvars

# 3. Plan + apply by stack
./deploy/agents/dispatch-ops.sh plan-stack stack=eks-east
./deploy/agents/dispatch-ops.sh apply-stack stack=eks-east
```

---

## What we learned

1. **Partial `-var` flags are load-bearing lies** — Terraform merges CLI vars over tfvars; omitted flags revert to defaults and destroy real resources.

2. **Intent must live in one place** — SSM SecureString `engress-terraform-tfvars`, not operator memory or GHA env snippets.

3. **Guards before gitops** — plan-guard shipped in days; full state split can wait.

4. **Phase numbers are API** — P06 was already billing; renumbering deploy work to P08 avoids doc and roadmap collisions.

5. **Narratives are part of the deliverable** — if we don't write the story, the next agent repeats the incident.

---

## Related docs

- Design: `specs/2026-06-30-p08-deploy-submodule-design.md`
- Plan: [2026-06-30-p08-deploy-submodule.md](../plans/2026-06-30-p08-deploy-submodule.md)
- P03 incident context: [2026-06-30-p03-multi-region-load-balancing.md](./2026-06-30-p03-multi-region-load-balancing.md)
- P04 frontend incident: [2026-06-30-p04-eks-cutover-and-frontend-recovery.md](./2026-06-30-p04-eks-cutover-and-frontend-recovery.md)
- Index: [narratives README](./README.md)
