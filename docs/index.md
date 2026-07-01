---
slug: /
sidebar_position: 1
title: Overview
---

<span className="pill pill-synthesis">DOCS</span>

# Engress

Expose a local AI model over HTTPS without opening inbound ports. Install **engress**, sign in, and get a stable tunnel URL for Cursor, Claude Code, and other OpenAI-compatible clients.

## Quick start

<div className="terminal-block">

```bash
brew install engress-io/tap/engress
engress login
engress http 11434
```

</div>

Prefer a guided install? Use the [downloads page](/downloads) or [engress.io/downloads](https://engress.io/downloads).

## How it works

1. **engress** runs on your machine and dials **out** to Engress (no firewall holes).
2. You pick or create an **endpoint** in the browser — each gets a unique `https://<name>.edge.engress.io` URL.
3. Point your AI tool at that URL. Engress forwards traffic to your local port.

Read the full [architecture guide](/how-it-works) or browse the [FAQ](/faq).

## Guides

<div className="card-grid">

<a className="doc-card" href="./how-it-works">
  <h3>How it works</h3>
  <p>Outbound tunnels, HTTPS endpoints, and how traffic flows from your machine to clients.</p>
</a>

<a className="doc-card" href="./downloads">
  <h3>Downloads</h3>
  <p>Homebrew, winget, install scripts, and direct binaries for macOS, Linux, and Windows.</p>
</a>

<a className="doc-card" href="./agent">
  <h3>engress</h3>
  <p>Install, CLI commands, launch integrations, and verify your tunnel.</p>
</a>

<a className="doc-card" href="./integrations">
  <h3>Integrations</h3>
  <p>Cursor, Claude Code, VS Code, Grok, and more — wire your tool to Engress.</p>
</a>

<a className="doc-card" href="./api">
  <h3>API reference</h3>
  <p>Manage endpoints and tokens programmatically with the Engress REST API.</p>
</a>

</div>

Open the [dashboard](https://engress.io) to create endpoints, watch live traffic, and manage your account.