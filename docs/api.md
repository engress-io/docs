---
sidebar_position: 5
title: API reference
---

<span className="pill">API</span>

# API reference

The Engress REST API lets you manage endpoints, connect tokens, and activity from scripts or CI. All routes live under `/api/v1/*` on the same host as the dashboard.

**Base URL:** `https://engress.io`

## Authentication

Send a Clerk session cookie (browser) or an API key in the `Authorization` header:

```bash
curl -s https://engress.io/api/v1/endpoints \
  -H "Authorization: Bearer <api-key>"
```

API keys are scoped — each route below lists the required scope.

## Endpoints

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/endpoints` | `endpoints:read` | List endpoints with live stats |
| POST | `/api/v1/endpoints` | `endpoints:write` | Create endpoint and issue connect token |
| DELETE | `/api/v1/endpoints/{id}` | `endpoints:write` | Delete endpoint |
| GET | `/api/v1/endpoints/{id}/stats` | `endpoints:read` | Live metrics snapshot |
| GET | `/api/v1/endpoints/{id}/stream` | `endpoints:read` | SSE live request log |
| GET | `/api/v1/tokens` | `tokens:read` | List connect tokens |
| POST | `/api/v1/tokens` | `tokens:write` | Issue connect token |
| DELETE | `/api/v1/tokens/{id}` | `tokens:write` | Revoke token |
| GET | `/api/v1/activity` | `activity:read` | Tenant activity feed |
| GET | `/api/v1/tenants/me` | — | Current tenant profile |

## Health check

```bash
curl -s https://engress.io/api/healthz
```

Unauthenticated tenant routes return `401` without a valid session or API key.