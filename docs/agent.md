---
sidebar_position: 2
title: engress
---

<span className="pill">AGENT</span>

# engress

The CLI runs on your laptop (or CI), connects outbound to Engress, and forwards traffic to a local port — no inbound firewall rules required.

## Install

**Downloads:** [engress.io/downloads](https://engress.io/downloads)

### macOS (Homebrew)

```bash
brew install engress-io/tap/engress
```

### Windows (winget)

```powershell
winget install Engress.Engress
```

### Linux / macOS (install script)

```bash
curl -fsSL https://engress.io/downloads/install.sh | bash
```

### Direct binary

Pick the right binary from [downloads/latest](https://engress.io/downloads/latest/) or let the install script detect your OS and architecture.

## Quick start

```bash
engress login              # sign in and link this machine
engress http 11434         # tunnel localhost:11434 (Ollama example)
engress http 1234          # LM Studio, vLLM, etc.
engress endpoints list     # endpoints from your last link
```

## Launch an integration

Print setup steps for a supported AI tool:

```bash
engress launch cursor --port 11434
engress launch claude-code --subdomain studio
```

See [Integrations](/integrations) for the full list.

## Commands

| Command | Description |
|---------|-------------|
| `engress http <port>` | Tunnel a local port (default workflow) |
| `engress tcp <port>` | Raw TCP tunnel |
| `engress udp <port>` | Raw UDP tunnel |
| `engress login` / `--login` | Browser sign-in and endpoint link |
| `engress endpoints list` | List endpoints from your last link |
| `engress launch <tool>` | Setup steps for Cursor, Claude Code, etc. |
| `engress http --test` | Mock OpenAI-style backend for smoke tests |

## Configuration

Optional: create `agent.yaml` in your working directory to override subdomain, token, or local address. Run `engress defaults agent` to see built-in edge defaults.

Set `ENGRESS_AGENT_PLAIN=1` for log-only output (CI, pipes) instead of the interactive TUI.

## Verify your tunnel

```bash
curl https://<your-subdomain>.edge.engress.io/v1/models
```

Replace `<your-subdomain>` with the name shown in the dashboard or `engress endpoints list`.
