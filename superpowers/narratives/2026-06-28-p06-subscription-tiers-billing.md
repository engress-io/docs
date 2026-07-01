# Narrative: Subscription Tiers & Billing — Phase 6 (planned)

## "Free tier is generous until it isn't"

P06 is the monetization layer: four tiers (Free / Hobbyist / Pro / Enterprise), enforcement at tunnel count, ports, bandwidth, and feature gates, with **Clerk Billing** for payments and **Oasis** for the admin billing view.

**Status:** 🔲 Not started (design draft only, 2026-06-28).

P05 shipped Oasis as the operator dashboard. P06 extends that surface for **tenant billing** and wires limits into edge/core enforcement paths.

---

## Why P06 waits

| Prerequisite | Status |
|--------------|--------|
| P05 Oasis admin shell | ✅ |
| Clerk auth (existing) | ✅ |
| Stable multi-region edge (P03) | ✅ |
| Deploy safety rails (P08) | 🚧 In progress — reduces risk before billing cutover |

---

## What the design says

See `specs/2026-06-28-p06-subscription-tiers-billing-design.md` for:

- Tier matrix (tunnels, ports, bandwidth, features)
- Clerk Billing integration points
- Oasis billing tab mockups
- Graceful upgrade prompts when limits hit

When implementation starts, **update this narrative** with chapters for schema changes, webhook flows, and first paying customer — same pattern as P04/P08.

---

## Related docs

- Spec: `specs/2026-06-28-p06-subscription-tiers-billing-design.md`
- Oasis foundation: [2026-06-30-p05-monitoring-oasis-dashboard.md](./2026-06-30-p05-monitoring-oasis-dashboard.md)
- Index: [narratives README](./README.md)
