---
title: Live verification appendix
sidebar_position: 13
---

# Live verification appendix

**Collected:** 2026-07-01T02:49:39Z (UTC)  
**Collector:** `./scripts/agent/atlas-collect.sh`

Values below were gathered from public endpoints and DNS. AWS SSO, Spaceship, and Clerk console checks were unavailable in the collector environment (expired SSO / missing credentials). Re-run via `./deploy/agents/dispatch-ops.sh dns-audit` for full DNS/LB audit.

## Production health

| Check | Result |
|-------|--------|
| `GET https://engress.io/api/healthz` | HTTP 200 |
| Service | `engress-core` |
| Version | `e8ba319` |
| Status | `ok` |

## DNS (dig, 2026-07-01)

| Hostname | Resolves to |
|----------|-------------|
| `engress.io` | `3.175.34.11`, `3.175.34.70`, `3.175.34.20` (CloudFront) |
| `core-origin.engress.io` | `k8s-engress-engressc-0e6d362187-1276529689.us-east-2.elb.amazonaws.com` → `16.59.89.201`, `3.19.254.115` |
| `edge-origin.engress.io` | `k8s-engress-engresse-05043a6385-1111899267.us-east-2.elb.amazonaws.com` → `3.20.94.55`, `3.12.17.225` |
| `*.edge.engress.io` (sample) | `166.117.111.75`, `166.117.142.224` (Global Accelerator anycast) |

## Collector gaps (re-run when credentialed)

| Source | Status |
|--------|--------|
| `aws sts get-caller-identity` | SSO token expired |
| Spaceship DNS table | Credentials missing |
| Terraform outputs | Requires AWS access |
| SSM parameter inventory | Requires AWS access |
| Clerk verify | Credentials missing |
| kubectl | Not installed locally |

## Recommended follow-up

```bash
aws sso login --profile ghostweasel-flux
./scripts/agent/atlas-collect.sh > /tmp/atlas-appendix.md
./deploy/agents/dispatch-ops.sh dns-audit
./deploy/agents/dispatch-ops.sh kubectl-status
```
