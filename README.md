# Engress docs site

Public Docusaurus documentation published at **https://engress.io/docs/**.

## Structure

| Path | Audience | Auth |
|------|----------|------|
| `docs/` | Customers | None |
| `internal/` | Operators / platform admins | Clerk + Oasis API check |

Internal content is synced from `engress-io/internal-docs/atlas` via `scripts/sync-atlas.sh`.

## Development

```bash
npm ci
export VITE_CLERK_PUBLISHABLE_KEY=pk_live_...   # required for internal gate in dev
npm start
```

Public docs: http://localhost:3000/docs/  
Internal docs: http://localhost:3000/docs/internal/

## Build

```bash
npm run build   # runs sync-atlas, then docusaurus build
```

## Deploy

Tag `docs-v*` triggers `.github/workflows/release.yml` → S3 `flux-spa-327796148992/docs/` + CloudFront invalidation.

Requires `CLERK_PUBLISHABLE_KEY` in repo secrets for internal docs gate.

## Security (internal docs)

Client-side Clerk gating hides internal pages from casual visitors but **does not encrypt HTML at rest on CDN**. Parameter names only — never commit secret values. See atlas gap G19.
