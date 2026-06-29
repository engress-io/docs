# P04 Kubernetes Preparation — Implementation Plan

> **Goal:** Migrate engress from docker-compose on EC2 to Amazon EKS with Helm + GitHub Actions, keeping deploy configuration in SSM (not GitHub secrets).

**Design spec:** `specs/2026-06-28-p04-kubernetes-preparation-design.md`

---

## Why SSM instead of GitHub secrets?

| Value | Sensitive? | Where it lives |
|-------|-----------|----------------|
| `AWS_DEPLOY_ROLE_ARN` | No (public IAM ARN) | GitHub secret **or** repo variable — required **before** OIDC can call AWS |
| IRSA ARNs, hostnames, EKS cluster name, EC2 IPs | No | SSM `engress-deploy-*` — written by Terraform, read by CI after auth |
| Neon DSN, Clerk keys, metrics secret | Yes | SSM (already) — read by pods via IRSA / EC2 IAM |

**You do not need GitHub secrets for IRSA ARNs or hostnames.** Those were listed in the original runbook because Terraform outputs had to reach CI somehow; SSM is the single source of truth. Only `AWS_DEPLOY_ROLE_ARN` stays in GitHub (it bootstraps OIDC — chicken-and-egg if stored only in SSM).

---

## Operator checklist

### 1. Bootstrap Terraform remote state

State backend is configured in `core/deploy/terraform/backend.tf`. If the bucket does not exist yet:

```bash
./scripts/deploy/scripts/eks-migrate.sh state-bootstrap
```

Or manually: `terraform init -migrate-state` after the S3 bucket + DynamoDB table exist.

### 2. Create EKS cluster

```bash
cd core/deploy/terraform
terraform apply -var="enable_eks=true" -var="deploy_target=both"
```

This creates:
- VPC + EKS cluster `engress-east`
- IRSA roles for `engress-core` and `engress-edge`
- SSM parameters under `engress-deploy-*`

Verify SSM:

```bash
aws ssm get-parameter --name engress-deploy-eks-cluster-name --region us-east-2
aws ssm get-parameter --name engress-deploy-core-irsa-arn --region us-east-2
aws ssm get-parameter --name engress-deploy-edge-irsa-arn --region us-east-2
```

### 3. GitHub configuration

Set **one** GitHub Actions secret (or repo variable):

| Name | Value |
|------|-------|
| `AWS_DEPLOY_ROLE_ARN` | `terraform output -raw github_deploy_role_arn` |

Do **not** set `ENGRESS_*_IRSA_ARN`, `ENGRESS_*_HOST`, or `ENGRESS_*_IP` in GitHub — CI reads them from SSM.

### 4. Install cluster add-ons (one-time)

Before first Helm deploy, install on the cluster:
- AWS Load Balancer Controller
- metrics-server
- (Optional) Cluster Autoscaler, Datadog agent

### 5. Trigger K8s deploy

Push to `main` (or run **Deploy to EKS** workflow manually). Workflow skips when `engress-deploy-target=ec2`.

During parallel validation:

```bash
./scripts/deploy/scripts/eks-migrate.sh deploy-target both
```

### 6. Verify EKS workloads

```bash
aws eks update-kubeconfig --name engress-east --region us-east-2
kubectl get pods -n engress
kubectl get svc,ingress -n engress
```

Run smoke tests against EC2 IPs until DNS cutover (both targets share SSM IPs during migration).

### 7. DNS / Global Accelerator cutover

Point Spaceship DNS and Global Accelerator (P03) at EKS NLB + ALB hostnames. Manual step — update A/CNAME records for:
- `*.edge.engress.io` → GA anycast / NLB
- `edge-origin.engress.io` → edge ALB
- `core-origin.engress.io` → core ALB

Set deploy target to EKS-only:

```bash
./scripts/deploy/scripts/eks-migrate.sh deploy-target eks
```

### 8. Decommission EC2

After 24h stable on EKS:

```bash
./scripts/deploy/scripts/eks-migrate.sh decommission-ec2
```

Equivalent to:

```bash
terraform apply -var="enable_eks=true" -var="decommission_ec2=true" -var="deploy_target=eks"
```

---

## Files added/changed

| Area | Path |
|------|------|
| Terraform state | `core/deploy/terraform/state.tf` |
| EKS VPC | `core/deploy/terraform/vpc.tf` |
| EKS + IRSA | `core/deploy/terraform/eks.tf` |
| SSM deploy config | `core/deploy/terraform/deploy-config.tf` |
| Helm charts | `charts/engress-{edge,core}/` |
| K8s CI | `.github/workflows/deploy-k8s.yml` |
| SSM loader | `scripts/deploy/lib/ssm-deploy-config.sh` |
| Helm deploy | `scripts/deploy/scripts/helm-deploy-eks.sh` |
| Operator runbook | `scripts/deploy/scripts/eks-migrate.sh` |

---

## Status

| Step | Status |
|------|--------|
| S3 remote state backend config | ✅ `backend.tf` + `state.tf` |
| EKS Terraform (gated `enable_eks`) | ✅ Code complete |
| SSM deploy config (replaces GitHub secrets) | ✅ Code complete |
| Helm charts | ✅ Code complete |
| deploy-k8s workflow | ✅ Code complete |
| Cluster add-ons install | 🔲 Operator (one-time) |
| `terraform apply enable_eks=true` | 🔲 Operator |
| DNS / GA cutover | 🔲 Operator (depends on P03) |
| EC2 decommission | 🔲 Operator (after cutover) |
