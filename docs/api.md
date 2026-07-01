---
sidebar_position: 5
title: API reference
---

<span className="pill">API</span>

# API reference

The Engress REST API lets you manage endpoints, connect tokens, and activity from scripts or CI. All routes live under `/api/v1/*` on the same host as the dashboard.

**Base URL:** `https://engress.io`

## Authentication

Send a Clerk session token or an API key in the `Authorization` header:

```bash
curl -s https://engress.io/api/v1/endpoints \
  -H "Authorization: Bearer <api-key-or-session-token>"
```

| Method | Header | Used by |
|--------|--------|---------|
| API key | `Authorization: Bearer engress_sk_...` | Scripts, CI |
| Clerk session | `Authorization: Bearer <jwt>` | Browser dashboard |

API keys are scoped — each route below lists the required scope. Create keys from the dashboard.

## Endpoints

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/endpoints` | `endpoints:read` | List endpoints with live stats |
| POST | `/api/v1/endpoints` | `endpoints:write` | Create endpoint and issue connect token |
| PATCH | `/api/v1/endpoints/{id}` | `endpoints:write` | Update endpoint metadata |
| DELETE | `/api/v1/endpoints/{id}` | `endpoints:write` | Delete endpoint |
| GET | `/api/v1/endpoints/{id}/stats` | `endpoints:read` | Live metrics snapshot |
| GET | `/api/v1/endpoints/{id}/stream` | `endpoints:read` | SSE live request log |
| GET | `/api/v1/tokens` | `tokens:read` | List connect tokens |
| POST | `/api/v1/tokens` | `tokens:write` | Issue connect token |
| DELETE | `/api/v1/tokens/{id}` | `tokens:write` | Revoke token |
| GET | `/api/v1/activity` | `endpoints:read` | Tenant activity feed |
| GET | `/api/v1/activity/stream` | `endpoints:read` | SSE activity stream |
| GET | `/api/v1/tenants/me` | — | Current tenant profile |

## Agent and link flows

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/link/sessions` | — | Start CLI browser link session |
| GET | `/api/v1/link/sessions/{id}` | — | Poll link session status |
| POST | `/api/v1/link/sessions/{id}/complete` | Clerk JWT | Complete link, issue connect token |
| POST | `/api/v1/agent/cert` | Connect token | Mint mTLS client certificate |

Used by `engress login` — see [How it works](/how-it-works).

## Beta (preview)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/beta/redeem` | Clerk JWT | Redeem beta invite code |
| POST | `/api/v1/beta/sync-billing` | Clerk JWT | Sync Clerk billing entitlements |

## Health check

```bash
curl -s https://engress.io/api/healthz
```

Returns `200` when the control plane is healthy. No authentication required.

Unauthenticated tenant routes return `401` without a valid session or API key.
