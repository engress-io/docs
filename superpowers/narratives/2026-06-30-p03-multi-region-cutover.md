# P03 Multi-Region Cutover — Runbook & Smoke Matrix

**Plan:** `docs/superpowers/plans/2026-06-28-p03-multi-region-load-balancing.md`

**Design spec:** `specs/2026-06-28-p03-multi-region-load-balancing-design.md`

---

## Target topology (post-P03)

| Layer | Target |
|-------|--------|
| `*.edge.engress.io` | Global Accelerator anycast A → regional NLB/ALB |
| `engress.io` /api/* | CloudFront → `core-origin.engress.io` → **east** core ALB |
| us-east-2 | `engress-east` — core + edge |
| us-west-1 | `engress-west` — **edge only** (v1) |
| DB | Neon primary (east); optional west read replica for future west core |

---

## Smoke test matrix

| Test | Command / method | Pass criteria |
|------|------------------|---------------|
| GA reachability | `nc -zv <ga-ip> 4433` from east + west | TCP connects |
| Agent tunnel | `engress tcp 8080` via `*.edge.engress.io` | Tunnel URL issued, traffic flows |
| HTTPS tunnel | Browser to `https://<subdomain>.edge.engress.io` | 200 via ACME cert |
| Latency routing | Client from us-west-1 prefers west endpoint group | GA routes to west (flow logs / traceroute) |
| East failure | Disable east GA endpoint group or scale edge to 0 | West serves within ~30s |
| Agent reconnect | Kill east during active tunnel | Agent re-registers west; recovery <60s |
| Core API | `curl https://engress.io/api/healthz` | Unaffected (east core) |
| West edge → east core | Cert mint from west edge pod | p99 acceptable; certs cached locally |

---

## Failover drill (operator)

1. Note active tunnel subdomain and agent PID
2. `./scripts/agent/dispatch-ops.sh kubectl-status` — both regions healthy
3. Disable us-east-2 endpoint groups in GA console (or scale `engress-edge` to 0 in east)
4. Within ~30s: `nc -zv <ga-ip> 4433` still succeeds
5. Restart agent — reconnects and re-registers (may land on west)
6. Re-enable east endpoint group; verify client affinity restores east for new sessions

**Known limitation (P03 v1):** Cross-edge gRPC forwarding deferred — wrong-region browser + tunnel mismatch requires agent reconnect (~30–60s).

---

## 48h monitoring checklist

- [ ] GA unhealthy endpoint count = 0 both regions
- [ ] NLB/ALB target health all healthy
- [ ] No spike in agent reconnect errors
- [ ] `https://engress.io/api/healthz` stable
- [ ] Neon replica lag <1s (if west core enabled later)

---

## Rollback

1. Spaceship PUT `*.edge` back to east NLB hostname (from `dns-audit` output)
2. GA can remain provisioned (unused)
3. West cluster can stay up for re-cutover

```bash
./scripts/agent/dispatch-ops.sh dns-audit
# Manual Spaceship update using east NLB from audit table
```

---

## Operator sequence (summary)

```bash
./scripts/deploy/scripts/p03-prereqs-check.sh
./scripts/agent/dispatch-ops.sh apply-eks-west
./scripts/agent/dispatch-ops.sh install-addons-west
./scripts/agent/dispatch-ops.sh helm-deploy-west
./scripts/deploy/scripts/collect-lb-arns.sh
./scripts/agent/dispatch-ops.sh apply-ga
./scripts/agent/dispatch-ops.sh dns-audit
PHASE_B_DRY_RUN=0 ./scripts/deploy/scripts/phase-b-dns-ga.sh
```
