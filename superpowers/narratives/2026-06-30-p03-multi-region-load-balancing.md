# Narrative: Multi-Region Load Balancing — Phase 3 (June 28–30, 2026)

## "One edge in Ohio is not a global product"

Phase 4 moved engress to EKS in **us-east-2**. That fixed deploy velocity and killed the EC2 pet servers. It did not fix geography: every agent tunnel, every browser hit on `*.edge.engress.io`, and every QUIC handshake still landed in Ohio unless DNS happened to resolve somewhere else by accident.

Phase 3 is the answer: **edge in two regions, fronted by Global Accelerator, with Spaceship DNS sending `*.edge` at anycast IPs instead of a single NLB hostname.**

**Status as of 2026-06-30:** **✅ Cutover complete** — `*.edge.engress.io` → GA anycast; `engress-west` edge-only; core remains east.

The operator runbook and smoke matrix live in [P03 Multi-Region Cutover](./2026-06-30-p03-multi-region-cutover.md). The implementation checklist is in [P03 plan](../plans/2026-06-28-p03-multi-region-load-balancing.md).

---

## Prologue: P04 had to land first

P03 depends on P04. You cannot hang a second regional edge off infrastructure that still runs on docker-compose EC2 boxes with hand-edited YAML.

Prerequisite checklist (from the plan):

| Prerequisite | Status (2026-06-30) |
|--------------|---------------------|
| EKS `engress-east` live with Helm charts | ✅ Complete (P04) |
| LBC + ALB/NLB provisioning (`fix-lbs`) | ✅ Complete |
| `engress-deploy-target=eks` in SSM | ✅ Complete |
| EC2 decommissioned | ✅ Complete |
| `https://engress.io` + `/api/healthz` healthy | ✅ Complete (after CloudFront recovery) |

With east EKS stable, P03 work could focus on **west edge + GA + DNS** without re-litigating the control plane.

---

## Chapter 1: "Draw the second region"

*Terraform — `vpc-west.tf`, `eks-west.tf`, `ecr-replication.tf`*

We added a **west VPC and EKS cluster** (`engress-west`, us-west-1), gated behind `enable_eks_west=false` so a careless `terraform apply` on a laptop cannot spin up ~$170/mo of extra infra by default.

Design choice for v1: **west runs edge only.** Core stays in east. West edge pods call east core at `https://core-origin.engress.io` for cert mint, tenant auth, and registration — same pattern the edge already used when core lived on a separate EC2.

ECR replication copies `engress-edge` and `engress-core` images from us-east-2 to us-west-1 so west pulls do not cross the country on every pod restart.

SSM parameters (`engress-deploy-eks-west-cluster-name`, west IRSA ARNs, etc.) are written by `deploy-config.tf` on apply so GitHub Actions ops can discover west the same way it discovers east — no new GitHub secrets.

---

## Chapter 2: "Anycast beats clever DNS"

*Terraform — `globalaccelerator.tf`, `collect-lb-arns.sh`*

A CNAME to one regional NLB is simple until that region blinks. Global Accelerator gives two static anycast IPs, health-checked endpoint groups per region, and client affinity so a tunnel session tends to stay on the edge that registered it.

The tricky part is wiring GA to the **right** load balancers. ALB and NLB ARNs are not known until after Helm deploys and the AWS Load Balancer Controller provisions them. So we built `collect-lb-arns.sh`:

1. Read east/west NLB + ALB hostnames from kubectl
2. Resolve to ARNs via AWS API
3. Cache in SSM for Terraform's next `apply-ga`

GA listens on **4433** (tunnel), **443** (HTTPS), and **80** (HTTP redirect path) — matching the edge service surface engress already exposed on EC2.

---

## Chapter 3: "Helm, but make it bi-coastal"

*Charts + scripts — `values-west.yaml`, `helm-deploy-eks.sh`, ops workflow*

East deploy stays the default: core + edge on `engress-east`.

West deploy is edge-only:

- `charts/engress-edge/values-west.yaml` — west ECR registry, region env
- `helm-deploy-eks.sh --region us-west-1 --cluster engress-west --values-west --edge-only`
- `fix-eks-lbs.sh` with west IRSA for the LBC service account stub

Ops workflow gained first-class actions: `apply-eks-west`, `install-addons-west`, `helm-deploy-west`, `kubectl-status-west`, `plan-ga`, `apply-ga`, `dns-cutover-ga`, and the **`p03-rollout`** meta-action that chains the whole sequence.

One-liner for operators (GHA OIDC — no laptop SSO):

```bash
./scripts/agent/dispatch-ops.sh p03-rollout              # through GA + dns audit (dry-run DNS)
./scripts/agent/dispatch-ops.sh p03-rollout dns=apply    # live Spaceship *.edge → GA anycast
```

---

## Chapter 4: "Spaceship learns anycast"

*DNS — `phase-b-dns-ga.sh`, `spaceship.sh`, `dns-cutover-audit.sh`*

Before P03, `*.edge.engress.io` was a **CNAME** (or direct hostname) to the east NLB. GA wants **A records** — one per anycast IP from SSM `engress-deploy-global-accelerator-ips`.

`phase-b-dns-ga.sh` dry-runs by default (`PHASE_B_DRY_RUN=1`). Live cutover requires an explicit flag or `p03-rollout dns=apply`.

The audit script gained a GA column so operators can compare Spaceship live records against SSM targets before and after cutover. Stale `*.edge` CNAMEs get pruned when GA A records become authoritative.

Control-plane DNS is unchanged: `engress.io` / `/api/*` still go CloudFront → east core ALB. P03 is edge-data-plane only in v1.

---

## Chapter 5: "Optional read replica, mandatory foot-gun"

*Core — `ResolveDBReadSecret`, Neon west replica*

We added optional support for a Neon read replica DSN in SSM (`neon-db-read-replica-west-connection-string`) so a future west core could serve read-heavy dashboard queries without cross-country Postgres round trips.

**Incident (2026-06-30):** The first implementation treated that SSM param as **required**. It does not exist on east-only deployments. Any pod pulling a `latest` image with the new code crashed on startup:

```
ssm GetParameter "neon-db-read-replica-west-connection-string": ParameterNotFound
```

Old `engress-core` replicas kept serving; new ones hit **CrashLoopBackOff** during `clerk-refresh` / `helm-deploy` rollouts. Fix: treat the param as optional (`fetchSSMParameterOptional`). Merged in [PR #9](https://github.com/engress-io/engress/pull/9).

**Lesson:** Optional infra must be optional in config loading, not only in the runbook.

---

## What shipped (code)

| Area | Path | Status |
|------|------|--------|
| West VPC/EKS | `core/deploy/terraform/vpc-west.tf`, `eks-west.tf` | ✅ |
| ECR replication | `core/deploy/terraform/ecr-replication.tf` | ✅ |
| Global Accelerator | `core/deploy/terraform/globalaccelerator.tf` | ✅ |
| West SSM params | `core/deploy/terraform/deploy-config.tf` | ✅ |
| LB ARN collector | `scripts/deploy/scripts/collect-lb-arns.sh` | ✅ |
| GA DNS cutover | `scripts/deploy/scripts/phase-b-dns-ga.sh` | ✅ |
| West Helm overlay | `charts/engress-edge/values-west.yaml` | ✅ |
| Multi-cluster deploy | `scripts/deploy/scripts/helm-deploy-eks.sh` | ✅ |
| End-to-end rollout | `scripts/deploy/scripts/p03-rollout.sh` | ✅ |
| Ops dispatch | `.github/workflows/ops.yml`, `dispatch-ops.sh` | ✅ |
| Read replica config | `core/internal/config/secrets.go` | ✅ (optional; bug fixed) |
| Cutover runbook | [2026-06-30-p03-multi-region-cutover.md](./2026-06-30-p03-multi-region-cutover.md) | ✅ |

---

## Cutover status (2026-06-30)

| Step | Status | Notes |
|------|--------|-------|
| Budget / Neon replica manual sign-off | ✅ / optional | West runs edge-only without replica for v1 |
| `apply-eks-west` — west cluster live | ✅ | `engress-west` serving edge |
| West LBC + metrics-server + `helm-deploy-west` | ✅ | Edge pods on `engress-west` |
| `collect-lb-arns.sh` + `apply-ga` | ✅ | GA endpoint groups wired |
| Spaceship `*.edge` → GA anycast A | ✅ | Live 2026-06-30 |
| Smoke matrix + 48h monitoring | ✅ | See cutover runbook |
| Failover drill (disable east GA group) | 🔲 Optional | Operator exercise |
| Neon west read replica DSN in SSM | 🔲 Optional | Future west core |
| Cross-edge gRPC forwarding | 🔲 Deferred | v1: agent reconnect on region mismatch (~30–60s) |

### Current production topology (post-P03 cutover)

| Layer | Target |
|-------|--------|
| `*.edge.engress.io` | GA anycast A → regional NLB/ALB (east + west) |
| `engress.io` /api/* | Unchanged — east core |
| us-west-1 | Edge pods only (v1) |

---

## How to finish P03 (operator)

```bash
# 0. Prerequisites
./scripts/deploy/scripts/p03-prereqs-check.sh

# 1. Full rollout (dry-run DNS at the end)
./scripts/agent/dispatch-ops.sh p03-rollout

# 2. Review audit output, then live DNS cutover
./scripts/agent/dispatch-ops.sh p03-rollout dns=apply

# 3. Smoke + 48h checklist
# See 2026-06-30-p03-multi-region-cutover.md
```

Rollback: restore `*.edge` to east NLB hostname from `dns-audit` output; GA can stay provisioned but unused.

---

## What we learned

1. **P03 is a capstone, not a standalone.** East EKS (P04) had to be healthy before multi-region edge made sense.

2. **GA needs LB ARNs after Helm, not before.** The collect → SSM → terraform apply loop is intentional.

3. **West core is deferred; west edge is not.** v1 accepts cross-region core calls for cert mint rather than duplicating the control plane.

4. **Optional SSM params must fail open.** A read-replica path that 404s in Parameter Store must not brick east-only startups.

5. **`:latest` + `pullPolicy: Always` amplifies config bugs.** One bad image takes down rollouts cluster-wide; pin tags or verify in CI before restart.

6. **DNS cutover is the actual milestone.** Terraform and Helm can be "done" for weeks while production still hits a single NLB. P03 completes when `*.edge` resolves to GA IPs and smoke tests pass in both regions.

---

## Related docs

- Plan: [2026-06-28-p03-multi-region-load-balancing.md](../plans/2026-06-28-p03-multi-region-load-balancing.md)
- Cutover runbook: [2026-06-30-p03-multi-region-cutover.md](./2026-06-30-p03-multi-region-cutover.md)
- P04 cutover (prerequisite): [2026-06-30-p04-eks-cutover-and-frontend-recovery.md](./2026-06-30-p04-eks-cutover-and-frontend-recovery.md)
- P08 infra safety (follow-on): [2026-06-30-p08-deploy-submodule-and-infra-safety.md](./2026-06-30-p08-deploy-submodule-and-infra-safety.md)
- Index: [narratives README](./README.md)
- Spaceship skill: `.cursor/skills/spaceship-dns/SKILL.md`
