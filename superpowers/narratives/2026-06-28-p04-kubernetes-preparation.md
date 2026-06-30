# Narrative: Kubernetes Preparation — Phase 4 (June 29, 2026)

## "engress leaves the nest"

EC2 docker-compose got engress to production. Phase 4 is the move to EKS: stateless pods, Helm deploys, IRSA for secrets, and one place for deploy configuration.

**Cutover completed 2026-06-30.** See [EKS cutover & frontend recovery](./2026-06-30-p04-eks-cutover-and-frontend-recovery.md) for the decommission incident and CloudFront recovery.

## The GitHub secrets question

The original P04 runbook listed five GitHub secrets:

- `ENGRESS_CORE_IRSA_ARN`
- `ENGRESS_EDGE_IRSA_ARN`
- `ENGRESS_EDGE_HOST`
- `ENGRESS_CORE_HOST`
- (plus `AWS_DEPLOY_ROLE_ARN`)

Only the last one belongs in GitHub — and it is not even a secret. It is a public IAM role ARN used to bootstrap OIDC before GitHub Actions can call AWS at all. Everything else is infrastructure output that Terraform already knows after `apply`.

**Decision:** Terraform writes all deploy config to SSM Parameter Store under `engress-deploy-*`. CI loads them via `scripts/deploy/lib/ssm-deploy-config.sh` after OIDC auth. Application secrets (Neon, Clerk, metrics) stay in SSM as they always have — pods read them via IRSA on EKS or instance profiles on EC2.

| Parameter | Purpose |
|-----------|---------|
| `engress-deploy-github-role-arn` | Same as GitHub secret (reference copy) |
| `engress-deploy-target` | `ec2`, `eks`, or `both` — gates which CI jobs run |
| `engress-deploy-edge-ip` / `core-ip` | Smoke tests during migration |
| `engress-deploy-edge-host` / `core-host` | Helm ingress hostnames |
| `engress-deploy-eks-cluster-name` | `aws eks update-kubeconfig` |
| `engress-deploy-core-irsa-arn` / `edge-irsa-arn` | Helm serviceAccount annotations |

## What we built

### Terraform

- **`state.tf`** — S3 bucket + DynamoDB lock table for remote state (fixes the "local state only" blocker from Phase 2)
- **`vpc.tf` + `eks.tf`** — EKS 1.31 on Graviton (`t4g.medium`), gated by `enable_eks=false` default so existing EC2 is untouched until operator opts in
- **`deploy-config.tf`** — SSM parameters synced on every apply
- **`decommission_ec2`** — destroys edge/control instances after cutover without touching EKS

GitHub deploy role gets EKS cluster admin via access entries so `helm upgrade` works from Actions.

### Helm + CI

- Charts at `charts/engress-edge` and `charts/engress-core` — mirror docker-compose env (`FLUX_USE_SSM=1`, health probes, HPA, PDB)
- `.github/workflows/deploy-k8s.yml` — builds images, runs `helm-deploy-eks.sh`, skips when `engress-deploy-target=ec2`
- `.github/workflows/ci.yml` — reads deploy target from SSM; skips EC2 deploy when target is `eks`

### Operator scripts

- `eks-migrate.sh` — runbook wrapper for state bootstrap, EKS apply, deploy-target flip, EC2 decommission
- `terraform-state-bootstrap.sh` — one-time S3 backend bootstrap
- `fix-cloudfront-recovery.sh` — two-phase CloudFront recovery after bad decommission
- `dispatch-ops.sh` — `fix-lbs`, `dns-audit`, `recover-frontend`, `decommission-ec2`

## Migration sequence (operator)

1. `./scripts/deploy/scripts/eks-migrate.sh state-bootstrap`
2. `./scripts/deploy/scripts/eks-migrate.sh apply-eks`
3. Set GitHub secret `AWS_DEPLOY_ROLE_ARN` only
4. Install LBC + metrics-server on cluster (`dispatch-ops.sh install-addons`)
5. Push to `main` → K8s workflow deploys Helm releases
6. `eks-migrate.sh deploy-target both` → validate parallel
7. Cut DNS to EKS ALBs/NLBs (`dispatch-ops.sh dns-audit`)
8. `eks-migrate.sh decommission-ec2` — **requires complete `terraform.tfvars`** (see recovery narrative)

## Status (2026-06-30)

### Done

- ✅ S3 remote state backend
- ✅ EKS cluster `engress-east` + IRSA
- ✅ SSM deploy config (`engress-deploy-target=eks`)
- ✅ Helm charts + deploy-k8s workflow
- ✅ LBC fix + ALB/NLB provisioned
- ✅ DNS cutover to EKS load balancers
- ✅ EC2 decommissioned
- ✅ `https://engress.io` restored after CloudFront recovery

### Remaining

- 🔲 Apply `github_ops.tf` so GHA can run Terraform without laptop SSO
- 🔲 us-west-1 region (P03 multi-region)
- 🔲 Optional: Amplify SPA migration (blocked on org deploy keys)

## Files changed

- `core/deploy/terraform/{state,vpc,eks,deploy-config,frontend}.tf`
- `core/deploy/terraform/fix-cloudfront-recovery.sh`
- `charts/engress-{edge,core}/`
- `.github/workflows/{ci,deploy-k8s,ops}.yml`
- `scripts/deploy/lib/{ssm-deploy-config,terraform-tfvars}.sh`
- `scripts/deploy/scripts/{helm-deploy-eks,eks-migrate,recover-frontend-terraform,ops-terraform}.sh`
- `scripts/agent/dispatch-ops.sh`
