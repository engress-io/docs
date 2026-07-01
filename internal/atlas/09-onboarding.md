---
title: Onboarding
sidebar_position: 10
---

# Onboarding

**Last verified:** 2026-06-30

Role-based checklists for joining the Engress project.

## Application developer (agent / core / edge)

1. **Clone** superproject with submodules:
   ```bash
   git clone --recurse-submodules https://github.com/engress-io/engress.git
   cd engress
   ```
2. **Read** [01-system-overview](01-system-overview.md) and [05-identity-auth](05-identity-auth.md).
3. **Local dev:**
   ```bash
   cd core && go test ./...
   cd ../agent && go test ./...
   cd ../edge && go test ./...
   ```
   Use SQLite locally; Clerk dev keys in `core/web/.env` (see `.env.example`).
4. **Understand deploy scope:** UI → `spa-deploy`; core → `helm-deploy-core`; edge → `helm-deploy-edge`. See [06-cicd-deploy](06-cicd-deploy.md).
5. **PR workflow:** Component-scoped CI on merge to `main` — do not expect full-stack deploy.

## Operator / SRE

1. **Read** atlas sections 01–03, 06–07.
2. **Read** [core-docs/todo.md](../core-docs/todo.md) for production status.
3. **Set up access:**
   - AWS SSO: `export AWS_PROFILE=ghostweasel-flux && aws sso login`
   - Or use GHA: `./deploy/agents/dispatch-ops.sh kubectl-status`
4. **Run collector:**
   ```bash
   ./scripts/agent/atlas-collect.sh
   ```
5. **Practice commands (read-only first):**
   ```bash
   ./scripts/agent/spaceship-dns.sh audit
   ./deploy/agents/dispatch-ops.sh smoke-test
   ./deploy/agents/dispatch-ops.sh kubectl-status
   ```
6. **Incident response:** Read relevant [phase narrative](../../docs/superpowers/narratives/README.md) before Terraform or DNS cutover.

## Infra / Terraform

1. **Read** [03-aws-inventory](03-aws-inventory.md), [06-cicd-deploy](06-cicd-deploy.md), [07-secrets-config](07-secrets-config.md).
2. **Read** [P08 plan](../../docs/superpowers/plans/2026-06-30-p08-deploy-submodule.md).
3. **Terraform rules:**
   - State: `s3://engress-terraform-state-327796148992/engress/core/terraform.tfstate`
   - Intent: SSM `engress-terraform-tfvars` only — no partial `-var enable_*`
   - Apply: `plan-stack` then `apply-stack` with named stack
4. **Never** run `apply-foundation` or full monolith apply without explicit approval.
5. **Recovery:** `core/deploy/terraform/recover-frontend.sh` — read P04 narrative first.

## Support / customer debugging

1. **Read** [05-identity-auth](05-identity-auth.md), [02-network-topology](02-network-topology.md).
2. **Public docs:** https://engress.io/docs — [how-it-works](https://engress.io/docs/how-it-works), [faq](https://engress.io/docs/faq).
3. **Platform admin:** Oasis dashboard at `https://engress.io/oasis` (requires `platform_admins` entry).
4. **Trace path:** endpoint subdomain → tenant in Neon → Clerk org/user → tunnel logs in Oasis.
5. **Common checks:**
   ```bash
   curl -sS https://engress.io/api/healthz
   curl -sS -o /dev/null -w "%{http_code}" https://<subdomain>.edge.engress.io/healthz
   ```

## Documentation contributor

1. **Internal changes:** Update atlas section + `last_verified` date in same PR.
2. **Customer changes:** `docs/docs/` only — no ARNs, SSM names, or internal IPs.
3. **Incidents:** Add/update narrative in `docs/superpowers/narratives/`; one-line link from atlas.

## First-week reading order

| Day | Focus |
|-----|-------|
| 1 | [README](README.md), [01-system-overview](01-system-overview.md), [00-glossary](00-glossary.md) |
| 2 | [02-network-topology](02-network-topology.md), [05-identity-auth](05-identity-auth.md) |
| 3 | [06-cicd-deploy](06-cicd-deploy.md), run `atlas-collect.sh` |
| 4 | [04-data-layer](04-data-layer.md), [07-secrets-config](07-secrets-config.md) |
| 5 | [10-gap-register](10-gap-register.md), one phase narrative (P04 recommended) |
