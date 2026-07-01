---
title: Internal documentation
sidebar_position: 0
slug: /
---

# Internal documentation

Operator-facing documentation for Engress staff and platform admins. Sign in with your Engress account to view the **Operator Atlas** and other internal guides.

## Access

- **Public docs:** [User documentation](/) — no sign-in required
- **Internal docs:** this section — requires Clerk sign-in and platform admin access

## Security note

Internal pages use client-side Clerk gating for UX. The static HTML is deployed to the same CDN as public docs. Do not put live secrets (DSN values, API keys, tokens) in these pages — parameter **names** only.

For true secret isolation, see [Gap G19](/internal/atlas/10-gap-register#g19) in the gap register.

## Operator Atlas

Start at [Operator Atlas](/internal/atlas/README).
