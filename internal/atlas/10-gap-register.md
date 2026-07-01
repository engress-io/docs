---
title: Gap register
sidebar_position: 11
---

# Gap register

**Last verified:** 2026-06-30  
**Living document** — add rows as discovery finds new gaps.

| ID | Category | Gap | Severity | Owner | Suggested fix |
|----|----------|-----|----------|-------|---------------|
| G01 | Docs | No single canonical diagram before atlas | Medium | — | **Resolved** by atlas 01 |
| G02 | Docs | EC2-era ops docs stale | High | ops | Refresh with atlas banners (Phase 2) |
| G03 | Docs | AGENTS.md listed legacy EIP | Low | — | **Resolved** — pointer to atlas |
| G04 | Infra | `github_ops.tf` not applied — GHA Terraform needs laptop SSO | Medium | infra | One local `terraform apply` |
| G05 | Infra | P08 per-stack Terraform state split incomplete | Medium | infra | `deploy/scripts/terraform/migrate-state.sh` |
| G06 | Infra | Amplify SPA migration blocked (org deploy keys) | Low | infra | Superseded by S3+CloudFront; mark obsolete |
| G07 | API | No OpenAPI/Swagger spec | Medium | core | Generate from routes or hand-write |
| G08 | Auth | Legacy Flux naming (`flux_sk_`, `FLUX_*`) | Low | core | Document in glossary; cleanup backlog |
| G09 | Edge | QUIC implemented but TCP default in prod | Low | edge | Document in atlas 01; enable when ready |
| G10 | Product | P06 billing tiers not implemented | Planned | product | Spec: `specs/2026-06-28-p06-subscription-tiers-billing-design.md` |
| G11 | Product | P07 staging/validation not implemented | Planned | infra | Specs in `specs/2026-06-28-p07*.md` |
| G12 | DR | Frontend recovery script exists; full DR untested | Medium | ops | Define RTO/RPO; run tabletop |
| G13 | Monitoring | Oasis only — no Datadog/PagerDuty | Info | — | By design (P05) |
| G14 | Agent | `future/agent-edge-discovery.md` stale for GA | Low | agent | Update for multi-region or archive |
| G15 | Data | Edge EKS uses per-pod SQLite (`emptyDir`) not Neon | Medium | edge | Document; evaluate shared store if needed |
| G16 | Docs | SSM `engress-deploy-edge-ip` still written (legacy EC2 IP) | Low | infra | Clean up Terraform locals post-decommission |
| G17 | Docs | Public API doc missing routes (agent cert, link, beta, oasis) | Medium | docs | Sync `docs/docs/api.md` with server.go |
| G18 | Infra | Orphaned ACM certs in us-east-1 from recovery | Low | ops | See todo.md cleanup checklist |
| G19 | Docs | Internal Docusaurus uses client-side Clerk gate; HTML is on public CDN | Medium | docs | Phase 2: private origin or API-served internal docs |

## Docusaurus internal docs (G19 detail)

Internal operator docs publish at `https://engress.io/docs/internal/` with Clerk sign-in and a platform admin API check. **Static HTML is still on the public CDN** — client-side gating is UX, not cryptographic access control. Never embed live secrets in internal markdown.

**Phase 2 options:** separate private S3 origin, Lambda@Edge JWT validation, or serve markdown from `engress-core` after auth middleware.

## Severity guide

| Level | Meaning |
|-------|---------|
| **High** | Wrong runbook could cause outage or security issue |
| **Medium** | Operational friction or incomplete observability |
| **Low** | Cleanup, naming, or nice-to-have |
| **Planned** | Scoped work with existing spec |
| **Info** | Intentional limitation |

## Review cadence

- Monthly: re-run `atlas-collect.sh`, review open High/Medium items
- After any P-phase cutover: add narrative link + update affected atlas sections
- Close gaps with PR link in the **Suggested fix** column

## Related docs

- [AGENTS.md](../../AGENTS.md) known blockers
- [core-docs/todo.md](../core-docs/todo.md) optional cleanup
- Phase narratives: [docs/superpowers/narratives/](../../docs/superpowers/narratives/README.md)
