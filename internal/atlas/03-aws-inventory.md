---
title: AWS inventory
sidebar_position: 4
---

# AWS inventory

**Last verified:** 2026-07-01

## Live verification (2026-07-01)

| Check | Value |
|-------|-------|
| API health | `https://engress.io/api/healthz` → HTTP 200 |
| Core version | `e8ba319` (image tag in EKS) |
| Deploy target | `eks` |
| EKS cluster | `engress-east` (4 nodes, 4/4 Ready) |
| Core replicas | 2/2 `@ e8ba319` |
| Edge replicas | 2/2 `@ e8ba319` |
| CloudFront | `E1H1FGG5MSUPN5` / `d1y7wdtfae903c.cloudfront.net` |
| GA anycast IPs | `166.117.111.75`, `166.117.142.224` |
| Edge NLB | `k8s-engress-engresse-07cd533391-9e85f5e66eeb6988.elb.us-east-2.amazonaws.com` |
| Core ALB | `k8s-engress-engressc-0e6d362187-1276529689.us-east-2.elb.amazonaws.com` |

See [appendix-live.md](appendix-live.md) for full collector output.

## Account and regions

| Item | Value |
|------|-------|
| AWS account | `327796148992` |
| Local profile | `ghostweasel-flux` (auto-set by `scripts/deploy/lib/workspace.sh`) |
| Primary region | `us-east-2` |
| West region | `us-west-1` (edge only) |
| CloudFront / ACM region | `us-east-1` |

## EKS clusters

| Cluster | Region | Namespace | Workloads |
|---------|--------|-----------|-----------|
| `engress-east` | us-east-2 | `engress` | `engress-core`, `engress-edge` |
| `engress-west` | us-west-1 | `engress` | `engress-edge` only |

**SSM:** `engress-deploy-eks-cluster-name`, `engress-deploy-eks-west-cluster-name`

**Addons:** AWS Load Balancer Controller, metrics-server (`install-cluster-addons.sh`)

**Helm charts:** `charts/engress-core`, `charts/engress-edge` (mirrored in `deploy/helm/`)

## ECR repositories

| Repository | Region | Image |
|------------|--------|-------|
| `engress-core` | us-east-2 | `327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core` |
| `engress-edge` | us-east-2 | `327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge` |
| `engress-edge` (replicated) | us-west-1 | `327796148992.dkr.ecr.us-west-1.amazonaws.com/engress-edge` |

Image tags: git short SHA in CI; `latest` also pushed.

## S3 buckets

| Bucket | Purpose |
|--------|---------|
| `flux-spa-327796148992` | Production SPA static assets |
| `flux-downloads-327796148992` | CLI release artifacts (`/downloads/latest/`) |
| `engress-terraform-state-327796148992` | Terraform remote state |

**SSM:** `engress-deploy-cloudfront-distribution-id`, `engress-cloudfront-distribution-id`

## CloudFront

| Item | Value |
|------|-------|
| Aliases | `engress.io`, `get.engress.io`, `downloads.engress.io` |
| SPA origin | S3 `flux-spa-327796148992` |
| API origin | `core-origin.engress.io` |

Distribution ID: run `terraform output cloudfront_distribution_id` or read SSM.

## Global Accelerator

| Item | Source |
|------|--------|
| Accelerator | Terraform `globalaccelerator.tf` |
| Anycast IPs | SSM `engress-deploy-global-accelerator-ips` |
| Listeners | TCP 80, 443, 4433 |
| Endpoint groups | East + west edge NLB/ALB ARNs |

**Operator-managed SSM (post-Helm):**

- `engress-deploy-east-nlb-arn`, `engress-deploy-west-nlb-arn`
- `engress-deploy-east-edge-alb-arn`, `engress-deploy-west-edge-alb-arn`

Collected by `deploy/scripts/cluster/collect-lb-arns.sh`.

## IAM roles

| Role | Purpose |
|------|---------|
| `engress-github-deploy-role` | GitHub Actions OIDC — deploy + ops |
| `engress-core` IRSA | Core pod AWS API access (Oasis dashboard, etc.) |
| `engress-edge` IRSA | Edge pod AWS API access |
| AWS LBC IRSA | Load Balancer Controller (east + west) |

**SSM IRSA ARNs:** `engress-deploy-core-irsa-arn`, `engress-deploy-edge-irsa-arn`, `engress-deploy-lbc-irsa-arn`, plus `*-west-*` variants.

## Terraform

| Item | Value |
|------|-------|
| Code | `core/deploy/terraform/` (canonical), `deploy/terraform/_legacy-monolith/` (mirror) |
| State bucket | `s3://engress-terraform-state-327796148992/` |
| State key | `engress/core/terraform.tfstate` |
| Locking | S3 native (`use_lockfile`) |
| Intent flags | SSM SecureString `engress-terraform-tfvars` |

### Production tfvars (expected)

```hcl
enable_eks                = true
enable_eks_west           = true
enable_global_accelerator = true
enable_frontend           = true
decommission_ec2          = true
deploy_target             = "eks"
```

### Terraform resource modules

| Module / file | Resources |
|---------------|-----------|
| `eks.tf` | `engress-east` cluster, node groups `system` + `workload` |
| `eks-west.tf` | `engress-west` cluster |
| `vpc.tf`, `vpc-west.tf` | VPC 10.0.0.0/16, 10.1.0.0/16 |
| `globalaccelerator.tf` | GA accelerator + listeners + endpoint groups |
| `frontend.tf` | S3 SPA, CloudFront, ACM |
| `ecr.tf` | ECR repos |
| `deploy-config.tf` | SSM deploy parameters |
| `github.tf`, `github_ops.tf` | OIDC provider, deploy role, ops policy |
| `main.tf` | Legacy EC2 edge (gated by `decommission_ec2=false`) |
| `control.tf` | Legacy EC2 control (gated by `enable_control_instance`) |

## Decommissioned resources

| Resource | Notes |
|----------|-------|
| EC2 `engress-edge` | Replaced by EKS 2026-06-30 |
| EC2 `engress-control` | Replaced by EKS 2026-06-30 |
| EIP `18.216.236.251` | Released |
| EIP `3.138.150.231` | Released |
| CodePipeline / CodeBuild | Removed (`enable_aws_ci=false`) |

## Discovery commands

```bash
# Terraform outputs (requires AWS SSO)
cd core/deploy/terraform && terraform output

# EKS status via GHA
./deploy/agents/dispatch-ops.sh kubectl-status

# SSM deploy config audit
./deploy/agents/dispatch-ops.sh audit-ssm-tfvars

# Read-only atlas collector
./scripts/agent/atlas-collect.sh
```

## Related docs

- [07-secrets-config](07-secrets-config.md) — SSM parameter catalog
- [06-cicd-deploy](06-cicd-deploy.md) — deploy pipeline
- Terraform README: `core/deploy/terraform/README.md`
