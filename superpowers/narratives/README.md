# Engress phase narratives

Story-first write-ups of what we built, what broke, and how we fixed it. Each phase has a **design spec** (`specs/`), an **implementation plan** (`docs/superpowers/plans/`), and at least one **narrative** here.

| Phase | Topic | Status | Narrative | Plan | Spec |
|-------|--------|--------|-----------|------|------|
| **P01** | Infra hardening, port UX, CI | ✅ Complete | [P01 infra hardening](./2026-06-28-p01-infra-hardening.md) | [plan](../plans/2026-06-28-p01-infra-hardening.md) | `specs/2026-06-28-p01-infra-hardening-port-ux-design.md` |
| **P02** | Core split (edge + control EC2) | ✅ Complete | [P02 core split](./2026-06-28-p02-core-split.md) | — | `specs/2026-06-28-p02-amplify-migration-design.md` |
| **P03** | Multi-region edge + GA | ✅ Complete | [P03 story](./2026-06-30-p03-multi-region-load-balancing.md) · [cutover runbook](./2026-06-30-p03-multi-region-cutover.md) | [plan](../plans/2026-06-28-p03-multi-region-load-balancing.md) | `specs/2026-06-28-p03-multi-region-load-balancing-design.md` |
| **P04** | Kubernetes / EKS | ✅ Complete | [P04 prep](./2026-06-28-p04-kubernetes-preparation.md) · [cutover + recovery](./2026-06-30-p04-eks-cutover-and-frontend-recovery.md) | [plan](../plans/2026-06-28-p04-kubernetes-preparation.md) | `specs/2026-06-28-p04-kubernetes-preparation-design.md` |
| **P05** | Monitoring & Oasis dashboard | ✅ Complete | [P05 Oasis](./2026-06-30-p05-monitoring-oasis-dashboard.md) | [plan](../plans/2026-06-30-p05-monitoring-observability.md) | `specs/2026-06-28-p05-monitoring-observability-design.md` |
| **P06** | Subscription tiers & billing | 🔲 Planned | [P06 billing (planned)](./2026-06-28-p06-subscription-tiers-billing.md) | — | `specs/2026-06-28-p06-subscription-tiers-billing-design.md` |
| **P07a** | Staging environment | 🚧 Code shipped — operator setup pending | [P07a staging](./2026-06-30-p07a-staging-environment.md) | — | `specs/2026-06-28-p07a-staging-environment-design.md` |
| **P07b** | Infrastructure validation | 🚧 Partial (`validate.sh` v1) | — | — | `specs/2026-06-28-p07b-infrastructure-validation-design.md` |
| **P08** | Deploy submodule & infra safety | 🚧 In progress | [P08 deploy](./2026-06-30-p08-deploy-submodule-and-infra-safety.md) | [plan](../plans/2026-06-30-p08-deploy-submodule.md) | `specs/2026-06-30-p08-deploy-submodule-design.md` |

## How to use these

- **New operators:** read the narrative for the phase you're touching before running Terraform or DNS cutover.
- **Cloud agents:** update the narrative when you ship or break something — same PR as the code.
- **External readers:** start with P01 → P04 → P03 (yes, out of order on purpose — P03 is the multi-region capstone after EKS).
