# Engress — security

## Trust boundaries

| Layer | Exposure | Auth |
|-------|----------|------|
| **Edge** (`engress-edge`) | Public `:443` tunnels, `:4433` yamux | Connect tokens (hashed at rest) |
| **API** (`engress-core`) | `:8080` on EC2; public via CloudFront `/api/*` only | Clerk sessions + org RBAC |
| **Agent** | Outbound dial only | Stored credentials / connect token |
| **SPA** | CloudFront → S3 | Clerk frontend SDK |

Edge accepts `/api/*` proxy traffic only from the CloudFront origin hostname (`FLUX_CONTROL_ORIGIN_HOST`).

## Secrets (SSM Parameter Store)

Platform params on EC2 IAM role:

- `neon-db-connection-string`
- `clerk-secret-key`, `next-clerk-publishable-key`, `clerk-webhook-secret`
- `flux-metrics-ingest-secret`
- `flux-github-read-token` (private repo clone)

Set `FLUX_USE_SSM=1` in deploy scripts; resolution in [`internal/config/secrets.go`](../internal/config/secrets.go).

## TLS

- Tunnels: on-demand Let's Encrypt (production required for external clients)
- SPA/API: ACM cert on CloudFront (`us-east-1`)
- Edge origin: separate A record to EIP (not CloudFront)

## Beta hardening (2026-06-23)

- Clerk webhooks: Svix signature verification when `clerk-webhook-secret` is set
- Agent cert private keys: returned once in API response; not persisted in `agent_certs`
- Postgres RLS on tenant tables (`0005_rls_postgres.sql`); tenant API paths set `app.tenant_id` via `set_config` in transactions; empty `app.tenant_id` allows edge/admin reads
- Neon DSN should include `sslmode=require`

## Network hardening

- SSH restricted to `operator_cidr` in Terraform
- Unknown tunnel hosts → 404 (no default vhost leak)
- See [ops/route53-and-security.md](ops/route53-and-security.md) for DNS and ACME details
