---
title: Glossary
sidebar_position: 1
---

# Glossary

**Last verified:** 2026-06-30

## Product and binaries

| Term | Meaning |
|------|---------|
| **Engress** | Product name; replaces legacy **Flux** / Flux Capacitor |
| **engress** | CLI agent binary (`agent` repo) — runs on user machines |
| **engress-core** | Control plane API + metrics (`core` repo) |
| **engress-edge** | Data plane — TLS, routing, tunnels (`edge` repo) |
| **Oasis** | Platform admin dashboard at `/oasis` — infra jobs, tenants, monitoring |

## Domains and hostnames

| Pattern | Example | Purpose |
|---------|---------|---------|
| Apex | `engress.io` | SPA + `/api/*` via CloudFront |
| Tenant tunnel | `https-abc123.edge.engress.io` | Per-endpoint public URL |
| Core origin | `core-origin.engress.io` | CloudFront API origin → EKS core ALB |
| Edge origin (east) | `edge-origin.engress.io` | East edge ALB (legacy origin hostname) |
| Edge origin (west) | `edge-origin-west.engress.io` | West edge ALB |
| Wildcard edge | `*.edge.engress.io` | Tenant tunnels → Global Accelerator |

Subdomain prefixes follow port semantics (`rdp-`, `https-`, `tcp-`, etc.) — see `sdk/ports`.

## Legacy naming (still in code)

| Legacy | Current | Notes |
|--------|---------|-------|
| `flux_sk_*` | `engress_sk_*` | API key prefix — both accepted |
| `FLUX_USE_SSM` | `ENGRESS_USE_SSM` | SSM secret resolution |
| `FLUX_SESSION_KEY` | `engress-session-key` (SSM) | Session encryption |
| `flux-spa-*` S3 bucket | unchanged | Historical bucket name |

## Regions

| Region | Role |
|--------|------|
| `us-east-2` | Primary — EKS `engress-east`, core + edge, Terraform state |
| `us-west-1` | Edge only — EKS `engress-west` |
| `us-east-1` | ACM certs for CloudFront (required by AWS) |

## Decommissioned (historical only)

| Resource | Value | Retired |
|----------|-------|---------|
| EC2 edge instance | tag `engress-edge` | 2026-06-30 |
| EC2 control instance | tag `engress-control` | 2026-06-30 |
| Edge EIP | `18.216.236.251` | Released |
| Control EIP | `3.138.150.231` | Released |

Do not reference these in runbooks except for migration context.
