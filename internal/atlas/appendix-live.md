---
title: Live verification appendix
sidebar_position: 13
---

# Live verification appendix

**Collected:** 2026-07-01T02:57:03Z (UTC)  
**Collector:** `./scripts/agent/atlas-collect.sh`  
**Operator:** `dave@ghostweasel.net` (AWS SSO)

## Production health

| Check | Result |
|-------|--------|
| `GET https://engress.io/api/healthz` | HTTP 200 |
| Service | `engress-core` |
| Version | `e8ba319` |
| Uptime | `1h44m31s` |
| Status | `ok` |

## AWS account

| Item | Value |
|------|-------|
| Account | `327796148992` |
| Caller | `dave@ghostweasel.net` |
| Role | `AWSReservedSSO_AdministratorAccess_0db069c62d06fa16` |
| Region | `us-east-2` |

## Deploy target (SSM)

| Parameter | Value |
|-----------|-------|
| `engress-deploy-target` | `eks` |
| `engress-deploy-eks-cluster-name` | `engress-east` |
| `engress-deploy-global-accelerator-ips` | `166.117.111.75`, `166.117.142.224` |

## CloudFront

| Item | Value |
|------|-------|
| Distribution ID | `E1H1FGG5MSUPN5` |
| Domain | `d1y7wdtfae903c.cloudfront.net` |
| Aliases | `engress.io`, `get.engress.io`, `downloads.engress.io` |

## DNS (Spaceship, live)

| Type | Host | Target | TTL |
|------|------|--------|-----|
| CNAME | `@` | `d1y7wdtfae903c.cloudfront.net` | 300 |
| CNAME | `get` | `d1y7wdtfae903c.cloudfront.net` | 300 |
| CNAME | `downloads` | `d1y7wdtfae903c.cloudfront.net` | 300 |
| CNAME | `core-origin` | `k8s-engress-engressc-0e6d362187-1276529689.us-east-2.elb.amazonaws.com` | 1800 |
| CNAME | `edge-origin` | `k8s-engress-engresse-05043a6385-1111899267.us-east-2.elb.amazonaws.com` | 1800 |
| A | `*.edge` | `166.117.111.75` | 300 |
| A | `*.edge` | `166.117.142.224` | 300 |
| CNAME | `clerk` | `frontend-api.clerk.services` | 1800 |
| CNAME | `accounts` | `accounts.clerk.services` | 1800 |

## EKS `engress-east` (kubectl)

### Nodes (4 ready)

| Node | Internal IP | Version |
|------|-------------|---------|
| `ip-10-0-1-101` | 10.0.1.101 | v1.31.14-eks |
| `ip-10-0-1-61` | 10.0.1.61 | v1.31.14-eks |
| `ip-10-0-2-216` | 10.0.2.216 | v1.31.14-eks |
| `ip-10-0-2-31` | 10.0.2.31 | v1.31.14-eks |

### Workloads (`engress` namespace)

| Deployment | Replicas | Image tag |
|------------|----------|-----------|
| `engress-core` | 2/2 | `e8ba319` |
| `engress-edge` | 2/2 | `e8ba319` |
| `aws-load-balancer-controller` | 2/2 | v3.4.0 |

### Load balancers

| Service | External hostname |
|---------|-------------------|
| `engress-edge-nlb` | `k8s-engress-engresse-07cd533391-9e85f5e66eeb6988.elb.us-east-2.amazonaws.com` |
| `engress-core` ALB (via DNS) | `k8s-engress-engressc-0e6d362187-1276529689.us-east-2.elb.amazonaws.com` |
| `engress-edge` ALB (via DNS) | `k8s-engress-engresse-05043a6385-1111899267.us-east-2.elb.amazonaws.com` |

## Clerk

| Item | Value |
|------|-------|
| Publishable host | `clerk.engress.io` |
| API domain | `clerk.engress.io` |
| Expected org | `org_3FN4VwPcUUsNUKi0yf6cdFLhG7J` |
| Verify | Keys match Engress Clerk application |

## SSM parameters (names only)

### Deploy config (`engress-deploy-*`)

- `engress-deploy-aws-region-west`
- `engress-deploy-core-host`
- `engress-deploy-core-ip`
- `engress-deploy-core-irsa-arn`
- `engress-deploy-core-west-irsa-arn`
- `engress-deploy-east-edge-alb-arn`
- `engress-deploy-east-nlb-arn`
- `engress-deploy-edge-host`
- `engress-deploy-edge-ip`
- `engress-deploy-edge-irsa-arn`
- `engress-deploy-edge-west-irsa-arn`
- `engress-deploy-eks-cluster-name`
- `engress-deploy-eks-west-cluster-name`
- `engress-deploy-github-role-arn`
- `engress-deploy-global-accelerator-ips`
- `engress-deploy-lbc-irsa-arn`
- `engress-deploy-lbc-west-irsa-arn`
- `engress-deploy-target`
- `engress-deploy-west-edge-alb-arn`
- `engress-deploy-west-nlb-arn`

### Application secrets

- `neon-db-connection-string`
- `engress-neon-db-connection-string`
- `clerk-secret-key`
- `clerk-webhook-secret`
- `engress-clerk-publishable-key`
- `next-clerk-publishable-key` (legacy name)
- `engress-session-key`
- `engress-metrics-ingest-secret`
- `engress-tunnel-ca-cert-pem`
- `engress-tunnel-ca-key-pem`
- `engress-github-dispatch-token`
- `engress-github-read-token`
- `engress-source-checkout-token`

## Terraform outputs

Terraform state not initialized locally in this run — use `cd core/deploy/terraform && terraform output` after `terraform init`.

## Refresh

```bash
./scripts/agent/atlas-collect.sh | tee /tmp/atlas-collect.md
```
