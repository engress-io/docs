# Narrative: Oasis Dashboard — Phase 5 (June 30, 2026)

## "We don't need Datadog if we have engress"

The original P05 design assumed Datadog: agents in every pod, DogStatsD sidecars, APM traces, and another monthly SaaS line item. By the time EKS was live and multi-region edge was shipping, the question changed: **what does an operator actually need to see at 2am?**

Answer: cluster health, tunnel traffic, AWS spend, GA endpoint status, and which git SHA is running — all in one place we already owned: **Oasis**, the platform-admin panel at `https://engress.io/oasis`.

**Status:** ✅ Shipped 2026-06-30. Datadog deliberately skipped.

---

## Prologue: observability without a observability bill

Post-P04 engress runs on EKS with structured logs and `/healthz` endpoints. That is enough to debug a single pod. It is not enough to answer:

- Are both regional edge clusters healthy?
- What is AWS costing us this month?
- Is Global Accelerator seeing unhealthy endpoints?
- Which component versions are in prod vs latest GitHub tags?

We could bolt on Datadog. Instead we extended Oasis and core's AWS APIs access via IRSA — **no new vendor, no agents, no cross-repo secret sprawl.**

---

## Chapter 1: "One API, one screen"

*Core — `GET /api/v1/oasis/dashboard`, `OasisDashboard.tsx`*

The dashboard API aggregates:

| Tab | Source |
|-----|--------|
| Overview | Core health, tenants, tunnels, bandwidth summary |
| Kubernetes | EKS cluster + node group status (east + west) |
| Traffic | Per-tunnel requests, errors, latency, bytes |
| Costs | AWS Cost Explorer MTD + forecast |
| Releases | Latest GitHub tags (agent, edge, core, sdk) |
| GA health | Global Accelerator endpoint group status |

Platform admins hit `/oasis` in the SPA. No separate Grafana login, no Datadog invite flow.

**Prerequisite:** Terraform IRSA policy `engress-core-oasis-dashboard` in `core/deploy/terraform/eks.tf` — EKS read, Cost Explorer, GA APIs. Cost Explorer must be enabled once in the AWS Billing console (account level).

---

## Chapter 2: "Deploy it like everything else"

*Ops — `p05-prereqs-check.sh`, `helm-deploy-all`*

```bash
./deploy/agents/dispatch-ops.sh p05-prereqs-check
./deploy/agents/dispatch-ops.sh helm-deploy-all
```

Rebuilds `engress-core` + SPA with the dashboard handler and UI. Same GHA path as other workload deploys.

During rollout we hit the usual sharp edges:

- **SDK mount in Docker build** — core image build needed `../sdk` in context; fixed in `build-push-ecr.sh`.
- **Handler registration** — `AbuseIngestHandler` wired wrong in `serve.go`; core pods failed health checks until fixed.

---

## Chapter 3: "What we said no to"

| Skipped | Why |
|---------|-----|
| Datadog agent / DogStatsD | Recurring cost; Oasis covers operator view for v1 |
| In-cluster K8s API from SPA | Would need broader RBAC; v1 uses AWS EKS APIs only |
| Pod-level exec / logs UI | Deferred; `kubectl` + CloudWatch for deep dives |

Renovate + SDK compat workflows from the original P05 scope **did ship** (cross-repo dependency automation) — see org GitHub App setup in the plan.

---

## What shipped

| Area | Path | Status |
|------|------|--------|
| Dashboard API | `core/internal/oasis/` (service + AWS clients) | ✅ |
| SPA panel | `core/web/src/pages/OasisDashboard.tsx` | ✅ |
| IRSA policy | `core/deploy/terraform/eks.tf` | ✅ (apply to enable billing tab) |
| Prereqs script | `scripts/deploy/scripts/p05-prereqs-check.sh` | ✅ |
| Scheduled health | `.github/workflows/health-check.yml` | ✅ |
| Operator runbook | [P05 plan](../plans/2026-06-30-p05-monitoring-observability.md) | ✅ |

---

## Verification

```bash
curl -sS -H "Authorization: Bearer <platform-admin-token>" \
  https://engress.io/api/v1/oasis/dashboard | jq .overview
```

Browser: `https://engress.io/oasis` → Overview + Kubernetes tabs populate after IRSA apply.

---

## What we learned

1. **Operator UI beats generic APM for a small platform** — we know our data model; building the view in Oasis is faster than instrumenting everything for a third party.

2. **IRSA is the integration layer** — same pattern as edge secrets: Terraform grants capability; core reads AWS APIs at runtime.

3. **Cost Explorer is opt-in at the account** — the Costs tab 403s until billing console enables API access.

4. **Ship the narrative with the feature** — P05 plan existed; this doc captures the Datadog pivot and deploy war stories.

---

## Related docs

- Plan: [2026-06-30-p05-monitoring-observability.md](../plans/2026-06-30-p05-monitoring-observability.md)
- Design (original Datadog scope): `specs/2026-06-28-p05-monitoring-observability-design.md`
- P04 prerequisite: [2026-06-30-p04-eks-cutover-and-frontend-recovery.md](./2026-06-30-p04-eks-cutover-and-frontend-recovery.md)
