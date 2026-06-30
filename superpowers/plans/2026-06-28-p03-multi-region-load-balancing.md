# P03 Multi-Region Load Balancing — Implementation Plan

> **Goal:** Deploy engress edge in us-east-2 + us-west-1 behind AWS Global Accelerator, with Spaceship DNS pointing `*.edge.engress.io` at GA anycast IPs.

**Design spec:** `specs/2026-06-28-p03-multi-region-load-balancing-design.md`

**Prerequisite:** P04 complete — EKS `engress-east`, Helm charts, LBC, `engress-deploy-target=eks`.

---

## Architecture (v1)

| Layer | Target |
|-------|--------|
| User edge traffic | `*.edge.engress.io` → GA anycast A → regional NLB/ALB |
| Control plane | CloudFront → `core-origin.engress.io` → **east core ALB only** |
| West cluster | **Edge pods only** — call east core via `https://core-origin.engress.io` |
| DB | Neon primary (east); optional west read replica for future west core |

---

## Operator checklist

### Phase 0 — Prerequisites

```bash
./scripts/deploy/scripts/p03-prereqs-check.sh
```

| Step | Action | Verify |
|------|--------|--------|
| 0.1 | Confirm Neon plan supports read replica in us-west-1 | Neon console |
| 0.2 | Apply `github_ops.tf` locally if GHA runs Terraform | `dispatch-ops.sh plan-eks` without laptop SSO |
| 0.3 | Budget sign-off (~$170–200/mo incremental) | — |
| 0.4 | Pin production tfvars | `enable_frontend=true`, `spa_bucket_name=flux-spa-327796148992`, `enable_eks=true`, `decommission_ec2=true` |

### Phase 1 — West EKS + ECR replication

```bash
cd core/deploy/terraform
terraform apply \
  -var="enable_eks=true" \
  -var="enable_eks_west=true" \
  -var="decommission_ec2=true" \
  -var="deploy_target=eks"
```

Or: `./scripts/agent/dispatch-ops.sh apply-eks-west`

Verify:

```bash
aws eks describe-cluster --name engress-west --region us-west-1
aws ssm get-parameter --name engress-deploy-eks-west-cluster-name --region us-east-2
```

### Phase 2 — West add-ons + Helm (edge only)

```bash
./scripts/agent/dispatch-ops.sh install-addons-west
./scripts/agent/dispatch-ops.sh helm-deploy-west
./scripts/agent/dispatch-ops.sh kubectl-status-west
```

Direct NLB smoke (pre-GA):

```bash
curl -sS "http://$(kubectl get svc engress-edge-nlb -n engress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' --context ...):80/healthz"
```

### Phase 3 — Neon read replica (optional west core)

1. Create read replica in Neon console (us-west-1)
2. Store DSN: `aws ssm put-parameter --name neon-db-read-replica-west-connection-string --type SecureString --value '...' --region us-east-2`
3. West core deploy deferred in v1 — east core unchanged

### Phase 4 — Global Accelerator

After both regions have NLB/ALB:

```bash
./scripts/deploy/scripts/collect-lb-arns.sh
./scripts/agent/dispatch-ops.sh apply-ga
```

Verify:

```bash
terraform output global_accelerator_ips
nc -zv <ga-ip> 4433
```

### Phase 5 — DNS cutover

```bash
./scripts/agent/dispatch-ops.sh dns-audit          # includes GA IP column
./scripts/deploy/scripts/phase-b-dns-ga.sh         # dry-run
PHASE_B_DRY_RUN=0 ./scripts/deploy/scripts/phase-b-dns-ga.sh
```

Rollback: restore `*.edge` to east NLB hostname from `dns-audit` output.

### Phase 6 — Validation

See smoke matrix in `docs/superpowers/narratives/2026-06-30-p03-multi-region-cutover.md`.

---

## Files added/changed

| Area | Path |
|------|------|
| West VPC/EKS | `core/deploy/terraform/vpc-west.tf`, `eks-west.tf` |
| ECR replication | `core/deploy/terraform/ecr-replication.tf` |
| Global Accelerator | `core/deploy/terraform/globalaccelerator.tf` |
| West SSM | `core/deploy/terraform/deploy-config.tf` |
| LB ARN collector | `scripts/deploy/scripts/collect-lb-arns.sh` |
| GA DNS | `scripts/deploy/scripts/phase-b-dns-ga.sh` |
| Helm west | `charts/engress-edge/values-west.yaml` |
| Multi-cluster deploy | `scripts/deploy/scripts/helm-deploy-eks.sh` |
| Ops | `.github/workflows/ops.yml`, `scripts/agent/dispatch-ops.sh` |
| Read replica config | `core/internal/config/secrets.go`, `core/internal/store/open.go` |
| CI | `.github/workflows/deploy-k8s.yml` |

---

## Status

| Step | Status |
|------|--------|
| Terraform west EKS + ECR replication | ✅ Code |
| Global Accelerator Terraform | ✅ Code |
| West Helm + deploy scripts | ✅ Code |
| Ops workflow (west + GA actions) | ✅ Code |
| GA DNS scripts | ✅ Code |
| Neon read replica (core code) | ✅ Code (optional west core) |
| Production apply + cutover | 🔲 Operator |
