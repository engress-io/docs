# P05 Monitoring & Observability — Operator Runbook

**Status:** Implementation complete (2026-06-30)

**Design spec:** [`specs/2026-06-28-p05-monitoring-observability-design.md`](../../specs/2026-06-28-p05-monitoring-observability-design.md)

---

## Phase 0 — Prerequisites

```bash
./scripts/deploy/scripts/p05-prereqs-check.sh
# or
./scripts/agent/dispatch-ops.sh p05-prereqs-check
```

Required:
- EKS clusters live (`engress-east`, `engress-west`)
- SSM `engress-metrics-ingest-secret`
- SSM `engress-datadog-api-key` (before Datadog install)

Optional:
- `engress-slack-alerts-webhook` for Datadog monitor notifications
- Renovate GitHub App on `engress-io` org
- `DOWNSTREAM_DISPATCH_TOKEN` on `engress-io/sdk` repo

---

## Phase 1 — Datadog agent

```bash
./scripts/agent/dispatch-ops.sh install-datadog-all
```

Verify: Datadog → Infrastructure → Kubernetes pods in `datadog` namespace on both clusters.

---

## Phase 2 — App deploy (DogStatsD + APM)

Helm charts set `DD_AGENT_HOST` from pod host IP. Redeploy:

```bash
./scripts/agent/dispatch-ops.sh helm-deploy-all
```

Custom metrics: `engress.tunnels.*`, `engress.requests.*`, `engress.abuse.flags`

---

## Phase 3 — Monitors & synthetics

Terraform (optional, requires Datadog API + App keys):

```bash
cd core/deploy/terraform
terraform apply -var enable_datadog_monitors=true \
  -var datadog_api_key=... -var datadog_app_key=...
```

Scheduled smoke: `.github/workflows/health-check.yml` (every 5 min)

---

## Phase 4 — Oasis admin views

Platform admins: `https://engress.io/oasis`

APIs:
- `GET /api/v1/oasis/system`
- `GET /api/v1/oasis/tunnels`
- `GET /api/v1/oasis/abuse`
- `GET /api/v1/oasis/versions`
- `GET /api/v1/oasis/metrics/stream` (SSE)

Aliases under `/api/v1/admin/*` also work.

---

## Phase 5 — Renovate + SDK compat

1. Install Renovate GitHub App
2. Merge `renovate.json` in agent, edge, core, sdk repos
3. Set `DOWNSTREAM_DISPATCH_TOKEN` on sdk repo
4. Tag SDK release: `git tag vX.Y.Z && git push origin vX.Y.Z`

Downstream repos receive `sdk-released` dispatch and run compat CI.

---

## Ops quick reference

| Action | Command |
|--------|---------|
| P05 prereqs | `dispatch-ops.sh p05-prereqs-check` |
| Datadog east | `dispatch-ops.sh install-datadog` |
| Datadog west | `dispatch-ops.sh install-datadog-west` |
| Datadog both | `dispatch-ops.sh install-datadog-all` |
| Redeploy apps | `dispatch-ops.sh helm-deploy-all` |
