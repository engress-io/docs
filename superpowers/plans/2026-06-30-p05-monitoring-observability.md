# P05 Oasis Dashboard — Operator Runbook (no Datadog)

**Status:** Implementation complete (2026-06-30)

---

## What Oasis shows

Single pane of glass at `https://engress.io/oasis` (platform admin):

| Tab | Data source |
|-----|-------------|
| Overview | Core health, tenant count, tunnel summary, bandwidth, AWS MTD cost, GA health |
| Kubernetes | EKS cluster + node group status (east + west) via AWS API |
| Traffic | Live per-tunnel requests, errors, latency, bytes in/out |
| Costs | AWS Cost Explorer MTD, forecast, top services |
| Releases | GitHub latest tags (agent, edge, core, sdk) |

API: `GET /api/v1/oasis/dashboard`

---

## Prerequisites

```bash
./scripts/deploy/scripts/p05-prereqs-check.sh
```

**Terraform (one-time):** Apply `engress-core-oasis-dashboard` IRSA policy in `core/deploy/terraform/eks.tf` so core pods can call EKS, Cost Explorer, and Global Accelerator APIs.

Cost Explorer must be **enabled** in AWS Billing console (account level).

---

## Deploy

```bash
./scripts/agent/dispatch-ops.sh helm-deploy-all
```

Rebuilds engress-core + SPA with dashboard API and UI.

---

## What we deliberately skipped

- **Datadog** — removed; no agent, no DogStatsD, no APM, no recurring SaaS cost
- **Pod-level K8s UI** — would require in-cluster API access; v1 uses EKS + node group status only

---

## Renovate + SDK compat (unchanged)

- Install Renovate GitHub App on `engress-io` org
- Set `DOWNSTREAM_DISPATCH_TOKEN` on `engress-io/sdk`
- Tag SDK releases to trigger downstream compat CI
