---
sidebar_position: 4
title: Integrations
slug: /integrations
---

<span className="pill">INTEGRATIONS</span>

# AI tool integrations

Engress tunnels your local model to a stable HTTPS URL. Point your AI client at that URL — Engress is passthrough (OpenAI-compatible where applicable).

Use `engress launch <integration>` to print setup steps for your linked endpoint:

```bash
engress launch cursor --port 11434
```

<div className="card-grid">

<a className="doc-card" href="./claude-code">
  <h3>Claude Code</h3>
  <p>Point Anthropic's CLI at your Engress tunnel for local or BYOK backends.</p>
</a>

<a className="doc-card" href="./grok">
  <h3>Grok</h3>
  <p>Route xAI Grok clients through a Engress HTTPS endpoint.</p>
</a>

<a className="doc-card" href="./opencode">
  <h3>OpenCode</h3>
  <p>Connect OpenCode to a local model behind Engress.</p>
</a>

<a className="doc-card" href="./cursor">
  <h3>Cursor</h3>
  <p>Use Cursor BYOK with your tunneled OpenAI-compatible API.</p>
</a>

<a className="doc-card" href="./vscode">
  <h3>VS Code</h3>
  <p>Continue, Cline, and other VS Code extensions via Engress.</p>
</a>

<a className="doc-card" href="./openclaw">
  <h3>OpenClaw</h3>
  <p>Wire OpenClaw agents to a Engress tunnel.</p>
</a>

<a className="doc-card" href="./hermes">
  <h3>Hermes</h3>
  <p>Hermes agent runtime integration.</p>
</a>

</div>

Detailed guides for each integration are coming soon. Until then, `engress launch` prints the tunnel + configure steps for your machine.