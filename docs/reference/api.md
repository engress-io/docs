# Engress API (`engress-core`)

The control plane serves `/api/v1/*` — tenant auth (Clerk), endpoints, connect tokens, activity, metrics ingest, and webhooks. In production it runs in Docker on EC2 (combined with edge, or on a dedicated control instance when `enable_control_instance=true`).

## Binary

```bash
go build -o engress-core ./cmd/engress-core/
engress-core serve --config api.yaml
```

Example config: [`api.yaml.example`](../api.yaml.example).

## Deployment

| Mode | Where `engress-core` runs | CloudFront `/api/*` origin |
|------|----------------------|----------------------------|
| **Combined** (default) | Edge EC2 `:8080` | `edge-origin.<domain>` → edge EIP |
| **Split** | Control EC2 `:8080` | `control-origin.<domain>` → control EIP |

Deploy/update:

```bash
cd deploy/terraform
./dev.sh build-push      # engress-edge + engress-core images → ECR
./dev.sh api-up          # SSM: start engress-core (edge or control target)
```

Split topology also sets `FLUX_METRICS_API_URL` on the edge so tunnel metrics post to the control instance.

## Health

```bash
curl -s http://127.0.0.1:8080/healthz   # on EC2
curl -s https://flux.example.net/api/v1/endpoints   # via CloudFront (401 without session)
```

Secrets (Neon, Clerk, metrics ingest) resolve from SSM when `FLUX_USE_SSM=1`. See [security.md](security.md).

## Tenant API (Clerk JWT or API key)

### Endpoints

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/endpoints` | `endpoints:read` | List endpoints with live stats |
| POST | `/api/v1/endpoints` | `endpoints:write` | Create endpoint + issue connect token |
| DELETE | `/api/v1/endpoints/{id}` | `endpoints:write` | Delete endpoint |
| GET | `/api/v1/endpoints/{id}/stats` | `endpoints:read` | Live metrics snapshot |
| GET | `/api/v1/endpoints/{id}/stream` | `endpoints:read` | SSE live request log |

List response items include: `requests_today`, `error_count`, `avg_latency_ms`, `connected_at`, `local_addr`, `backend_label`.

### Connect tokens

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/tokens` | `tokens:read` | List tokens (`last_used_at` when set) |
| POST | `/api/v1/tokens` | `tokens:write` | Issue token; plaintext returned once |
| DELETE | `/api/v1/tokens/{id}` | `tokens:write` | Revoke token |

POST body (optional): `{"endpoint_id":"<uuid>"}` — omit for tenant-scoped token.

### Activity

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/activity` | `endpoints:read` | Recent tenant activity events |
| GET | `/api/v1/activity/stream` | `endpoints:read` | SSE activity feed |

Event types include `endpoint.connected`, `endpoint.disconnected`, `token.issued`, `token.revoked`.

Request log SSE events include `streaming: true` for chat/completions paths.
