---
sidebar_position: 7
title: FAQ
---

<span className="pill">FAQ</span>

# Frequently asked questions

## Do I need to open ports on my firewall?

No. **engress** connects outbound to Engress. You do not need to forward ports or change firewall rules for inbound traffic.

## What URL do I give my AI tool?

Your endpoint URL looks like `https://<name>.edge.engress.io`. Find it in the dashboard after `engress login` or run `engress endpoints list`.

For OpenAI-compatible tools, the base URL is typically:

```
https://<name>.edge.engress.io/v1
```

## Why does `engress login` open a browser?

Sign-in uses your Engress account (Clerk) in the browser. After you approve the link, credentials are saved locally on your machine — not in the web app.

## My tunnel returns 502 or connection refused

Common causes:

1. **Local server not running** — Start your model on the port you passed to `engress http <port>`.
2. **Wrong port** — Confirm the port matches your local server (e.g. Ollama default `11434`).
3. **Stale session** — Run `engress login` again and restart the tunnel.

Verify locally:

```bash
curl http://127.0.0.1:<port>/v1/models
```

## Can I use raw TCP instead of HTTP?

Yes:

```bash
engress tcp <port>
engress udp <port>
```

Some ports are blocked for abuse prevention (VPN, torrent, unauthenticated databases).

## Is my traffic encrypted?

Yes. Public clients use HTTPS to your `*.edge.engress.io` hostname. The agent tunnel uses mutual TLS (mTLS) on port 4433.

## How do I revoke access?

Delete the endpoint or revoke its connect token from the dashboard. Credentials stored on your machine can be removed by logging out or deleting `~/.config/engress/credentials.json`.

## Where are API keys documented?

See the [API reference](/api) for machine-to-machine access with scoped API keys.

## I found a security issue

Contact Ghost Weasel Labs through your account channel or support email. See [Security](/security#reporting-issues).
