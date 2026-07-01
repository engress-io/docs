---
sidebar_position: 6
title: Security
---

<span className="pill">SECURITY</span>

# Security

Engress is designed so your model stays on your machine while clients reach it over HTTPS.

## Outbound-only agent

**engress** never listens for inbound connections. It opens an outbound tunnel to Engress, which works through corporate firewalls and NAT without port forwarding.

## HTTPS tunnels

Each endpoint gets its own hostname under `*.edge.engress.io` with a valid TLS certificate (Let's Encrypt). Use production tunnels when connecting strict clients like Cursor.

## Agent tunnel encryption

The CLI connects to Engress on port **4433** using **mutual TLS (mTLS)**. After browser sign-in, the CLI receives a connect token and a client certificate scoped to your endpoint.

## Credentials

- Sign in uses your Engress account (Clerk) in the browser during `engress login`.
- Connect tokens are issued per endpoint and can be revoked from the dashboard.
- API keys (`engress_sk_...`) support scoped machine access — see the [API reference](/api).
- Agent credentials are stored locally on your machine — not in the Engress web app.

## Dashboard access

The web app at [engress.io](https://engress.io) requires authentication. API requests need a valid session or API key with the right scopes.

## Data handling

- Tenant and endpoint metadata are stored in Engress's control plane database.
- Your model weights and inference traffic pass through the tunnel but are not persisted by Engress.
- Per-tenant isolation is enforced at the API and database layers.

## Abuse prevention

Engress blocks forwarding to high-risk ports (VPN, torrent, unauthenticated databases) and applies rate limiting on the edge.

## Reporting issues

If you find a security concern, contact Ghost Weasel Labs through your account channel or support email.

See also [How it works](/how-it-works) and the [FAQ](/faq).
