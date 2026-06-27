# Engress — architecture overview

## Binaries

| Binary | Entry | Role |
|--------|-------|------|
| `engress-edge` | `cmd/engress-edge` | Public TLS, routing, tunnel accept |
| `engress-core` | `cmd/engress-core` | Control plane REST + metrics ingest |
| `engress` | `cmd/engress` | Local connector in front of a model |

Legacy monolith `flux` is retired; use the split binaries above.

## Production topology

```
                    ┌── CloudFront (SPA + /api/*) ──┐
                    │                               │
  Browser ──────────┤  S3 (static)                  │
                    │  Origin: edge-origin OR       │
                    │          control-origin :8080 │
                    └───────────────┬───────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │ Edge EC2 (EIP)           │     Control EC2 (opt.)   │
         │ engress-edge :443/:4433     │     engress-core :8080       │
         │ [+ engress-core combined]    │     oasis runner         │
         └────────────▲─────────────┘                          │
                      │ yamux tunnel                           │
              engress (laptop) ──────────────────────────────┘
                      │
                 local model :8080
```

**Combined (default):** one edge box runs edge + API. CloudFront `/api/*` hits `edge-origin.<domain>` on the same EIP.

**Split (`enable_control_instance`):** edge is tunnel-only; API + oasis on a second instance; CloudFront `/api/*` hits `control-origin.<domain>`.

## Data

- Neon Postgres (tenants, endpoints, tokens, metrics)
- Clerk (identity, orgs, dashboard auth)

## Further reading

- [../agent.md](../agent.md), [../api.md](../api.md), [../oasis.md](../oasis.md)
- [../ops/frontend-topology.md](../ops/frontend-topology.md)
- Legacy design specs: [plans/archive/specs/](plans/archive/specs/)
