# Engress agent (`engress`)

The agent is the developer-facing binary. It runs on your laptop (or CI) in front of a local model and opens an **outbound** tunnel to the edge — no inbound firewall rules required.

## Install

**Downloads (recommended):** https://engress.io/downloads

### macOS (Homebrew)

```bash
brew install engress-io/tap/engress
```

### Windows (winget)

```powershell
winget install Engress.Engress
```

### Linux / macOS / fallback (install script)

```bash
curl -fsSL https://engress.io/downloads/latest/install.sh | bash
```

### Direct binary download

```bash
curl -fsSL -o engress \
  "https://engress.io/downloads/latest/engress-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed 's/x86_64/amd64/')"
chmod +x engress
```

**Manifest:** https://engress.io/downloads/latest/manifest.json

From source:

```bash
./scripts/build-local.sh
go install ./cmd/engress/...
```

Cross-compile (e.g. Linux ARM from Mac):

```bash
GOOS=linux GOARCH=arm64 ./scripts/build-local.sh
```

## Quick start

```bash
engress http <port>        # browser login + tunnel localhost:<port>
engress login              # link machine only (pick/create endpoint in browser)
engress --login            # same as login
engress endpoints list     # show endpoints from your last link
engress http --test        # mock OpenAI-style backend
```

Examples: `engress http 11434` (Ollama), `engress http 1234` (LM Studio).

Optional config: copy [`agent.yaml.example`](../agent.yaml.example) → `agent.yaml` (token/subdomain overrides).

## Launch an integration

```bash
engress launch cursor --port 11434
engress launch claude-code --subdomain studio
```

Docs: https://engress.io/docs/integrations

## Commands

| Command | Role |
|---------|------|
| `engress http <port>` | Default — tunnel a local port (you choose the port) |
| `engress login` / `--login` | Browser link flow — pick existing endpoint or create new |
| `engress endpoints list` | Endpoints saved from your last link |
| `engress launch <integration>` | Print setup steps for Cursor, Claude Code, etc. |
| `engress agent` | Tunnel using `local_addr` from config |
| `engress defaults agent` | Print baked-in edge defaults |

Production edge hostname is embedded in the binary ([`internal/config/agent_defaults.yaml`](../internal/config/agent_defaults.yaml)). Override with env or config when needed.

## TUI vs plain output

On a TTY, the agent opens a **workstation** flow (link → pick endpoint → port) then the live request dashboard. Set `FLUX_AGENT_PLAIN=1` for log-only mode (CI, pipes).

**Setup screens:** sign in / continue · endpoint picker · local port (when not passed on CLI)

**Live dashboard keys:** `↑↓` scroll · `f` filter · `e` endpoints panel · `l` re-link · `g` tail · `q` quit

**Full design spec (for visual refresh / design tools):** [design/agent-tui.md](design/agent-tui.md)

## Verify

```bash
curl https://<subdomain>.edge.<your-domain>/v1/models
```

Use production ACME on the edge before testing Cursor or other strict HTTPS clients — see [ops/dev-guide.md](ops/dev-guide.md).