# Phase 1 Infrastructure Hardening — The Story

*How engress grew up: from hobby project to production-ready platform in a single afternoon.*

---

## Prologue: The Mess

Engress had a problem. Three problems, actually.

The deployment pipeline was broken — CodePipeline built images but never deployed them, leaving the EC2 instance running a stale image from a feature branch. Operators had to manually run `dev.sh build-push && dev.sh app-update` and hope nothing went wrong. There was no verification.

Subdomains were random gibberish. Every tunnel got a name like `glorp-a1b2c3d4` that told you nothing about what service was running behind it. Users running RDP had no way to distinguish it from their HTTPS app.

And the security posture was... relaxed. mTLS was optional. VPN ports were wide open. There was no rate limiting. A single machine could hammer the edge with thousands of tunnel registrations per second.

This is the story of how we fixed all of it.

---

## Chapter 1: "The Deployment Fix"

*Task Group 1 — Fix Deploy Pipeline & Eliminate Stale Deplaces*

The first order of business was closing the deployment gap. The old `core/.github/workflows/aws-ci.yml` only triggered CodePipeline, which only built. Nothing deployed. The EC2 instance ran whatever image was last manually pushed.

We replaced it with a proper CI workflow at the superproject root (`.github/workflows/ci.yml`) that does the full chain on every push to `main`:

1. Build images
2. Push to ECR
3. Deploy to EC2 via SSM
4. Run smoke tests

The smoke test was its own adventure. The first version used exact JSON matching against the core health endpoint — which always failed because core returns `version` and `uptime` fields alongside `status` and `service`. We switched to substring matching and added a retry loop (10 attempts × 6s) to handle post-deploy startup latency.

We also added `workflow_dispatch` so operators can re-run the pipeline from the GitHub UI without pushing a dummy commit.

The CodePipeline and CodeBuild Terraform resources were gated behind `enable_aws_ci` (default `false`) and their comments updated to reflect they're deprecated. The old `core/.github/workflows/aws-ci.yml` was deleted entirely.

**Key insight:** The CI workflow had to live at the superproject root, not in `core/`, because the deploy scripts live in the `scripts/` submodule and need `submodules: recursive` checkout.

---

## Chapter 2: "Every Port Has a Name"

*Task Groups 2, 3, 4 — sdk/ports, Semantic Naming, Port UX*

This was the heart of Phase 1 — giving engress a vocabulary for the services it tunnels.

### The Port Table (`sdk/ports`)

We created a new `sdk/ports` package shared by agent and edge. It has two parts:

- **`table.go`** — Maps 40+ well-known ports to human-readable names and subdomain prefixes. Port 3389 → `("RDP", "rdp-")`. Port 443 → `("HTTPS", "https-")`. Unrecognized ports get `("Service", "tunnel-")`.
- **`blocked.go`** — Denies 40+ ports to prevent abuse: VPN tunneling (OpenVPN, WireGuard, IPsec), Tor, BitTorrent, SMTP outbound, and unauthenticated data stores (Redis, MongoDB, Elasticsearch).

### Semantic Subdomain Allocation

The edge's `Register` wire protocol got three new fields: `Protocol`, `Port`, and `Prefix`. When an agent requests a tunnel for port 3389, the control plane allocates `rdp-a1b2c3d4` instead of random gibberish.

The trick was getting the allocation timing right. Our first attempt had the edge allocate a new subdomain at registration time — but that subdomain wouldn't match any endpoint in the database (the control plane had already stored the original). We fixed this by adding `CreateEndpointForTenantWithPrefix` to the control plane, which allocates the semantic subdomain at *endpoint creation* time. The agent then connects with the pre-allocated name and everything lines up.

### New CLI Commands

The agent got two new Cobra commands:

- `engress tcp 3389` — raw TCP tunnel for RDP
- `engress udp 9911` — raw UDP tunnel

Both use a shared `ParsePortSpecs` function that handles flexible argument formats: `tcp 8080,443 udp 9911`. It validates port ranges, checks the blocked list, and looks up semantic prefixes from the port table.

**Key insight:** The `runAgentBindings` function signature had bindings as the *second* parameter, not the last. The subagent caught this by reading the code first — exactly why we dispatch fresh agents per task.

---

## Chapter 3: "The Bouncer"

*Task Group 5 — Abuse Prevention (Rate Limiting)*

With semantic naming in place, we added a token-bucket rate limiter to the edge. It's keyed by source IP and tenant ID, applied at tunnel registration time.

The limiter allows 2 requests/second sustained with a burst of 10. This stops:
- Rapid reconnect storms from misbehaving agents
- Subdomain enumeration attacks
- Credential stuffing against the connect token endpoint

The implementation is pure in-memory (no Redis dependency) with per-key buckets that refill based on elapsed time. A `Reset` method clears buckets after successful auth.

To support per-IP limiting, we had to add a `RemoteAddr()` method to the tunnel `Session` type — it was already stored at construction time, just not exposed.

**Key insight:** Rate limiting at the registration layer (before endpoint lookup) is more efficient than limiting after — we reject abuse before hitting the database.

---

## Chapter 4: "Encryption By Default"

*Task Group 6 — Encryption Policy*

The `allowLegacyInsecure()` function in `edge/internal/tunnel/configure.go` controlled whether the edge accepted agent connections without mTLS client certificates. Previously it defaulted to allowing insecure connections.

We flipped the default to `false`. Now mTLS is required unless an operator explicitly sets `ENGRESS_TUNNEL_INSECURE=true`. The function still supports the legacy `FLUX_TUNNEL_INSECURE` env var for backward compatibility.

This was a one-line change with outsized security impact: any agent attempting to connect without a valid client certificate is now rejected at the TLS layer.

**Key insight:** The env var names in the plan (`ENGRESS_ALLOW_INSECURE`) didn't match the actual code (`ENGRESS_TUNNEL_INSECURE`). The subagent correctly adapted to the codebase rather than the spec — a good reminder that specs are hypotheses until verified against reality.

---

## Chapter 5: "Cleaning Up the Past"

*Task Group 7 — Flux String Cleanup*

With the functional work done, we swept through all three submodules and renamed 21 functional `flux` references to `engress`:

- API header: `X-Flux-Metrics-Secret` → `X-Engress-Metrics-Secret`
- Dashboard: `<title>flux</title>` → `<title>engress</title>`
- Login help text: `~/.config/flux/credentials.json` → `~/.config/engress/credentials.json`
- Session cookie: `flux_session` → `engress_session`
- Comments and log messages throughout

We intentionally left test fixtures (`flux.example.com`), env var names (`FLUX_TOKEN`), and backward-compat paths (`.flux/` config dir) untouched. These are either harmless or actively needed for migration.

---

## Epilogue: Integration

*Task Group 8 — Integration & Documentation*

The superproject was updated to point to the Phase 1 heads of all submodules. AGENTS.md got a new "Phase 1 hardening (complete)" section documenting what was accomplished. The deployment gap section was rewritten from a warning into a description of the working pipeline.

All four submodules build clean. All tests pass.

---

## What We Learned

1. **Subagents need to read code before writing.** The `runAgentBindings` signature mismatch, the env var name discrepancy, and the semantic allocation timing issue were all caught by subagents that read the actual codebase rather than trusting the plan.

2. **Allocation timing matters.** Semantic subdomains must be allocated at endpoint creation time (control plane), not at tunnel registration time (edge). Otherwise the edge allocates a name that doesn't exist in the database.

3. **CI belongs at the superproject root.** When deploy scripts live in a submodule, the CI workflow needs `submodules: recursive` — which only works from the superproject.

4. **Exact string matching is brittle.** The core health endpoint returns extra fields. The smoke test needed substring matching and a retry loop to be robust.

5. **One-line changes can have outsized impact.** Flipping `allowLegacyInsecure` from `true` to `false` closed a major security gap with a single character change.

---

## By the Numbers

| Metric | Value |
|--------|-------|
| Task groups | 8 |
| Submodules touched | 5 (agent, edge, core, sdk, scripts) |
| New files created | 7 |
| Files modified | ~30 |
| New Go packages | 1 (`sdk/ports`) |
| New CLI commands | 2 (`tcp`, `udp`) |
| Ports in service table | 40+ |
| Ports in blocked list | 40+ |
| Flux references renamed | 21 |
| Lines of test code | ~120 |
| Build status | ✅ All clean |
| Test status | ✅ All pass |
