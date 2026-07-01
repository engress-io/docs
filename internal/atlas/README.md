---
title: Engress Atlas
sidebar_position: 12
---

# Operator Atlas

**Last verified:** 2026-07-01  
**Status:** Canonical operator topology and connection map

The Atlas is the single entry point for understanding how Engress is wired: AWS, DNS, data, auth, CI/CD, and third-party services. It complements (does not replace) phase narratives in [`docs/superpowers/narratives/`](../../docs/superpowers/narratives/README.md).

## How to read this

| Section | What you learn |
|---------|----------------|
| [00-glossary](00-glossary.md) | Naming, binaries, subdomain patterns |
| [01-system-overview](01-system-overview.md) | Master architecture diagram |
| [02-network-topology](02-network-topology.md) | DNS, load balancers, ports, hostnames |
| [03-aws-inventory](03-aws-inventory.md) | Account, EKS, ECR, S3, CloudFront, GA, IAM |
| [04-data-layer](04-data-layer.md) | Neon schema, migrations, edge DB mode |
| [05-identity-auth](05-identity-auth.md) | Clerk, API keys, mTLS, link flow |
| [06-cicd-deploy](06-cicd-deploy.md) | GitHub Actions, Helm, dispatch matrix |
| [07-secrets-config](07-secrets-config.md) | SSM parameters, env vars, tfvars |
| [08-third-party](08-third-party.md) | Clerk, Neon, Spaceship, GitHub |
| [09-onboarding](09-onboarding.md) | Role-based onboarding checklists |
| [10-gap-register](10-gap-register.md) | Known gaps, risks, and backlog |

## Quick links

- **Operator runbook:** [core-docs/todo.md](../core-docs/todo.md)
- **Cloud agent rules:** [AGENTS.md](../../AGENTS.md) (superproject root)
- **Deploy matrix:** [deploy/docs/deployment-matrix.md](../../deploy/docs/deployment-matrix.md)
- **Customer docs:** https://engress.io/docs

## Refreshing the atlas

Re-run the read-only collector monthly or after any infra cutover:

```bash
./scripts/agent/atlas-collect.sh
```

Published copy: **https://engress.io/docs/internal/atlas/** (platform admin sign-in required).

Paste the dated appendix into [appendix-live.md](appendix-live.md) and update `last_verified` headers. Infra/DNS/Clerk PRs must update the atlas in the same change.

## Diagram sources

Standalone mermaid sources live in [diagrams/](diagrams/).
