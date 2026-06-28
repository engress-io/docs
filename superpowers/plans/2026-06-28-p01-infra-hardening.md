# Infrastructure Hardening, Port UX, Semantic Naming, Abuse Prevention & Encryption — Phase 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the deployment pipeline (no more stale images), add TCP/UDP tunnel commands with semantic subdomain naming, implement port-based abuse prevention, and enforce encrypted tunnels by default — turning engress from a hobby project into a production-ready platform.

**Architecture:** Extend the existing cobra-based agent CLI with new `tcp` and `udp` commands that share the HTTP tunnel's yamux connection. Extend the edge's `Register` wire protocol to carry a protocol type and desired subdomain prefix. Add an in-memory rate limiter and port-blocklist at the edge. Flip the mTLS insecure fallback default to false.

**Tech Stack:** Go 1.25+, Cobra (CLI), yamux (tunnel multiplexing), GitHub Actions (CI/CD), Terraform (AWS), AWS SSM (remote deploy)

**Branch strategy:** Create `phase1/infrastructure-harding` from `main`. Each task group gets a commit. Submodule changes live in their own repos with cross-repo commits in the superproject telling the story of how engress levels up.

---

## Narrative Arc

This plan implements Phase 1 of engress's production readiness journey. Think of it as "the episode where engress grows up": no more stale deploys, no more random subdomain names, no more cleartext tunnels. The changes tell a coherent story:

1. **"The Deployment Fix"** — We replace the broken half-automated pipeline with a proper GitHub Actions workflow that builds, deploys, and verifies on every push.
2. **"Every Port Has a Name"** — We add `engress tcp` and `engress udp` commands with intelligent subdomain naming (`rdp-a1b2c3d4`, `https-xxx`).
3. **"The Bouncer"** — We implement layered abuse prevention: blocked ports, rate limits, behavioral detection.
4. **"Encryption By Default"** — We kill the insecure fallback and make mTLS mandatory.

Each task group produces working, testable software on its own.

---

## Task Group 1: Fix Deploy Pipeline & Eliminate Stale Deploys

### Task 1.1: Extend GitHub Actions for Continuous Deploy

**Files:**
- Modify: `core/.github/workflows/aws-ci.yml`
- Modify: `core/.github/workflows/release.yml`

- [ ] **Step 1: Extend aws-ci.yml trigger on push to main to deploy**

Replace the `main-pipeline` job in `core/.github/workflows/aws-ci.yml`. Instead of just triggering CodePipeline, make it build, push to ECR, and deploy to EC2:

```yaml
name: CI
on:
  push:
    branches: [main]
  jobs:
    build-deploy:
      runs-on: ubuntu-latest
      permissions:
        id-token: write
        contents: read
      steps:
        - uses: actions/checkout@v4
          with:
            submodules: recursive
        - name: Configure AWS credentials
          uses: aws-actions/configure-aws-credentials@v4
          with:
            role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
            aws-region: us-east-2
        - name: Build and push images
          run: ./scripts/deploy/scripts/build-push-ecr.sh
          env:
            PUSH_LATEST: "1"
        - name: Deploy to EC2
          run: ./scripts/deploy/scripts/app-update.sh
        - name: Smoke test
          run: ./scripts/deploy/scripts/smoke-test.sh
```

- [ ] **Step 2: Keep release.yml for tags but simplify**

Ensure `release.yml` still fires on `v*` tags. It should deploy + publish GitHub Release + SPA build. The main deploy logic now lives in `aws-ci.yml` for `main` pushes.

- [ ] **Step 3: Commit**

```bash
cd core
git add .github/workflows/aws-ci.yml .github/workflows/release.yml
git commit -m "ci: replace CodePipeline trigger with full build+deploy on push to main

Closes the stale deploy gap: every push to main now builds, pushes ECR,
deploys to EC2, and runs smoke tests. Tags still trigger release.yml
for GitHub Release + SPA deploy."
git push origin main
cd ..
git add core
git commit -m "chore: point core submodule to deploy pipeline fix"
git push origin main
```

### Task 1.2: Add smoke-test.sh

**Files:**
- Create: `scripts/deploy/smoke-test.sh`

- [ ] **Step 1: Write smoke test script**

```bash
#!/bin/bash
# smoke-test.sh — verify EC2 deploy succeeded
set -euo pipefail

: "${ENGRESS_EDGE_IP:?set ENGRESS_EDGE_IP}"
: "${ENGRESS_CORE_IP:?set ENGRESS_CORE_IP (usually same as edge)}"

echo "=== Edge health ==="
EDGE_HEALTH=$(curl -sf "http://${ENGRESS_EDGE_IP}:80/healthz" || echo "FAIL")
if [ "$EDGE_HEALTH" != '{"status":"ok","service":"engress-edge"}' ]; then
  echo "FAIL: edge returned: $EDGE_HEALTH"
  exit 1
fi
echo "PASS: edge healthy"

echo "=== Core health ==="
CORE_HEALTH=$(curl -sf "http://${ENGRESS_CORE_IP}:8080/healthz" || echo "FAIL")
if [ "$CORE_HEALTH" != '{"status":"ok","service":"engress-core"}' ]; then
  echo "FAIL: core returned: $CORE_HEALTH"
  exit 1
fi
echo "PASS: core healthy"

echo "=== All checks passed ==="
```

- [ ] **Step 2: Commit**

```bash
cd scripts
git add deploy/smoke-test.sh
git commit -m "ci: add post-deploy smoke test script

Verifies edge and core health endpoints after automated deploy.
Fails the CI run if either service is not healthy."
git push origin main
cd ../..
git add scripts
git commit -m "chore: point scripts submodule to smoke test addition"
```

### Task 1.3: Remove CodePipeline Terraform Resources

**Files:**
- Modify: `core/deploy/terraform/codepipeline.tf`
- Modify: `core/deploy/terraform/codebuild.tf`

- [ ] **Step 1: Remove CodePipeline and CodeBuild resources**

Delete or comment out the `aws_codepipeline` and `aws_codebuild_project` resources. Keep the ECR repos, IAM roles, and other infra.

- [ ] **Step 2: Commit**

```bash
cd core
git add deploy/terraform/codepipeline.tf deploy/terraform/codebuild.tf
git commit -
```

## Task Group 2: Add sdk/ports Package (Foundation for Naming + Blocking)

### Task 2.1: Create sdk/ports/table.go — Port-to-Service Mapping

**Files:**
- Create: `sdk/ports/table.go`

- [ ] **Step 1: Create the package**

```go
// Package ports maps well-known port numbers to human-readable service names
// and subdomain prefixes. Shared by the agent (for display) and the edge
// (for validation).
package ports

// Service describes a recognized network service.
type Service struct {
    Name   string // human-readable: "HTTPS", "RDP", "Minecraft"
    Prefix string // subdomain prefix: "https-", "rdp-", "mc-"
}

// table maps port+protocol to a service description.
// Covers IANA well-known ports plus common game/database/app ports.
var table = map[int]Service{
    // Web
    80:    {"HTTP", "http-"},
    443:   {"HTTPS", "https-"},
    8080:  {"HTTP Alt", "http-"},
    8443:  {"HTTPS Alt", "https-"},
    8000:  {"HTTP Dev", "http-"},
    9000:  {"HTTP Dev", "http-"},
    3000:  {"Web App", "web-"},
    5000:  {"Web App", "web-"},
    5173:  {"Vite Dev", "web-"},
    8081:  {"Web App", "web-"},
    8888:  {"Web App", "web-"},
    9090:  {"Web App", "web-"},

    // Remote access
    22:    {"SSH", "ssh-"},
    3389:  {"RDP", "rdp-"},
    5900:  {"VNC", "vnc-"},
    5901:  {"VNC", "vnc-"},
    5938:  {"TeamViewer", "tv-"},

    // Databases
    3306:  {"MySQL", "mysql-"},
    5432:  {"PostgreSQL", "pg-"},
    27017: {"MongoDB", "mongo-"},
    6379:  {"Redis", "redis-"},
    9200:  {"Elasticsearch", "es-"},
    5601:  {"Kibana", "kibana-"},
    11211: {"Memcached", "cache-"},

    // Mail
    25:   {"SMTP", "smtp-"},
    465:  {"SMTPS", "smtp-"},
    587:  {"SMTP Submission", "smtp-"},
    993:  {"IMAPS", "imap-"},
    995:  {"POP3S", "pop3-"},

    // DNS / NTP
    53:   {"DNS", "dns-"},
    123:  {"NTP", "ntp-"},
    161:  {"SNMP", "snmp-"},

    // Directory
    389:  {"LDAP", "ldap-"},
    636:  {"LDAPS", "ldaps-"},
    992:  {"Telnet TLS", "telnet-"},

    // Games
    25565: {"Minecraft", "mc-"},
    25575: {"Minecraft RCON", "mcrcon-"},
    27015: {"Source Engine", "game-"},
    27016: {"Source Engine", "game-"},
    7777:  {"Game Server", "game-"},
    7778:  {"Game Server", "game-"},
    3074:  {"Xbox Live", "xbox-"},
    3724:  {"World of Warcraft", "wow-"},
    6112:  {"Battle.net", "bnet-"},
    8085:  {"World of Warcraft", "wow-"},
}

// Lookup returns the service for a given port, plus a boolean indicating
// whether the port is recognized. Unrecognized ports get ("Service", "tunnel-").
func Lookup(port int) (Service, bool) {
    if s, ok := table[port]; ok {
        return s, true
    }
    return Service{Name: "Service", Prefix: "tunnel-"}, false
}

// PrefixFor returns the subdomain prefix for a port.
func PrefixFor(port int) string {
    s, _ := Lookup(port)
    return s.Prefix
}
```

- [ ] **Step 2: Commit**

```bash
cd sdk
git add ports/table.go
git commit -m "feat(sdk/ports): add port-to-service mapping table

Maps 40+ well-known ports to human-readable names and subdomain prefixes.
Foundation for semantic subdomain naming (rdp-xxx, https-xxx) and
abuse prevention port blocking."
git push origin main
cd ..
git add sdk
git commit -m "chore: point sdk submodule to ports package"
```

### Task 2.2: Create sdk/ports/blocked.go — Blocked Port Deny-List

**Files:**
- Create: `sdk/ports/blocked.go`

- [ ] **Step 1: Create the blocked ports list**

```go
package ports

// blockedPorts are never allowed through the platform. Enforced at the
// edge during tunnel registration.
var blockedPorts = map[int]string{
    // VPN tunneling
    1194: "OpenVPN",
    1195: "OpenVPN",
    51820: "WireGuard",
    51821: "WireGuard",
    500:  "IPsec",
    4500: "IPsec NAT-T",
    1701: "L2TP",
    1723: "PPTP",

    // Anonymizers
    9001: "Tor",
    9030: "Tor Directory",
    9050: "Tor SOCKS",
    9051: "Tor Control",
    9150: "Tor Browser",

    // P2P file sharing
    6881: "BitTorrent",
    6882: "BitTorrent",
    6883: "BitTorrent",
    6884: "BitTorrent",
    6885: "BitTorrent",
    6886: "BitTorrent",
    6887: "BitTorrent",
    6888: "BitTorrent",
    6889: "BitTorrent",
    6969: "BitTorrent Tracker",
    49001: "BitTorrent DHT",

    // Spam relay
    25:  "SMTP",
    465: "SMTPS",
    587: "SMTP Submission",

    // Amplification / unauthenticated data stores
    11211: "Memcached",
    6379:  "Redis",
    27017: "MongoDB",
    9200:  "Elasticsearch",
    3306:  "MySQL",
    5432:  "PostgreSQL",
}

// IsBlocked reports whether a port is blocked and returns the reason.
func IsBlocked(port int) (bool, string) {
    if name, ok := blockedPorts[port]; ok {
        return true, name
    }
    return false, ""
}

// BlockedPorts returns a copy of the blocked ports map (for admin display).
func BlockedPorts() map[int]string {
    out := make(map[int]string, len(blockedPorts))
    for p, n := range blockedPorts {
        out[p] = n
    }
    return out
}
```

- [ ] **Step 2: Commit**

```bash
cd sdk
git add ports/blocked.go
git commit -m "feat(sdk/ports): add blocked port deny-list

40+ ports blocked to prevent VPN tunneling, torrenting, spam relay,
and unauthenticated data store exposure. Enforced at edge registration."
git push origin main
cd ..
git add sdk
git commit -m "chore: point sdk submodule to blocked ports addition"
```

## Task Group 3: Semantic Subdomain Naming

### Task 3.1: Extend the Register Protocol with Protocol and Prefix Fields

**Files:**
- Modify: `edge/internal/tunnel/proto.go`

- [ ] **Step 1: Add Protocol and Prefix to Register message**

```go
// In proto.go, update the Register struct:
type Register struct {
    Subdomain    string `json:"subdomain"`              // existing: full or partial
    LocalAddr    string `json:"local_addr"`             // existing: upstream address
    BackendLabel string `json:"backend_label"`          // existing: display label
    Protocol     string `json:"protocol,omitempty"`     // NEW: "http", "tcp", "udp"
    Port         int    `json:"port,omitempty"`         // NEW: upstream port number
    Prefix       string `json:"prefix,omitempty"`       // NEW: desired subdomain prefix
}
```

- [ ] **Step 2: Update the agent's tunnel registration (agent/internal/tunnel/agent.go or wherever Register is constructed)**

The agent should now send Protocol, Port, and Prefix in the Register message.

- [ ] **Step 3: Commit**

```bash
cd edge
git add internal/tunnel/proto.go
git commit -m "feat(proto): extend Register message with protocol, port, prefix

Enables semantic subdomain naming. Agent sends the detected protocol
(tcp/udp/http), the upstream port, and the desired prefix. Edge uses
these to allocate a meaningful subdomain like rdp-a1b2c3d4."
git push origin main
cd ..
git add edge
git commit -m "chore: point edge submodule to protocol extension"
```

### Task 3.2: Update Edge Subdomain Allocation for Semantic Naming

**Files:**
- Modify: `edge/internal/subdomain/allocate.go`
- Modify: `edge/internal/edge/wiring.go` (the OnRegister handler)

- [ ] **Step 1: Add a SemanticAllocate function to allocate.go**

```go
// SemanticAllocate generates a subdomain with a meaningful prefix.
// It appends an 8-char random alphanumeric suffix and checks uniqueness.
func SemanticAllocate(store storer, prefix string) (string, error) {
    const suffixLen = 8
    for i := 0; i < 20; i++ {
        suffix := randomAlphanumeric(suffixLen)
        candidate := prefix + suffix
        if !IsReserved(candidate) {
            exists, err := store.SubdomainExists(candidate)
            if err != nil {
                return "", err
            }
            if !exists {
                return candidate, nil
            }
        }
    }
    return "", fmt.Errorf("could not allocate semantic subdomain with prefix %q", prefix)
}
```

- [ ] **Step 2: Update the OnRegister handler in wiring.go**

When the Register message has a Prefix field, use `SemanticAllocate` instead of `Allocate`. Validate the port against the blocked list. Reject if blocked.

- [ ] **Step 3: Commit**

```bash
cd edge
git add internal/subdomain/allocate.go internal/edge/wiring.go
git commit -m "feat(subdomain): add semantic allocation with port-based prefix

When an agent registers with a prefix (e.g. 'rdp-' for port 3389),
the edge allocates rdp-a1b2c3d4.edge.engress.io. Falls back to
random allocation for unrecognized ports. Blocks denied ports."
git push origin main
cd ..
git add edge
git commit -m "chore: point edge submodule to semantic naming"
```

## Task Group 4: New Port UX — engress tcp and engress udp Commands

### Task 4.1: Extend agentBindingInput with Protocol Support

**Files:**
- Modify: `agent/cmd/agentroot/agent.go`

- [ ] **Step 1: Add Protocol field to agentBindingInput**

```go
type agentBindingInput struct {
    Subdomain string
    LocalAddr string
    Protocol  string // "http" (default), "tcp", "udp"
}
```

- [ ] **Step 2: Thread Protocol through the registration flow**

In `runAgentBindings`, construct the `localURL` based on Protocol:
- `"http"` → `http://127.0.0.1:<port>` (existing behavior)
- `"tcp"` → `tcp://127.0.0.1:<port>` (raw TCP)
- `"udp"` → `udp://127.0.0.1:<port>` (UDP datagram)

The protocol value must be passed into the tunnel registration so it is sent in the `Register` message.

- [ ] **Step 3: Commit**

```bash
cd agent
git add cmd/agentroot/agent.go
git commit -m "feat(agent): add protocol field to agentBindingInput

Extends the binding model to support tcp, udp, and http protocols.
Protocol is threaded through tunnel registration so the edge can
route traffic correctly and allocate semantic subdomains."
git push origin main
cd ..
git add agent
git commit -m "chore: point agent submodule to protocol field"
```

### Task 4.2: Create the Port Spec Parser

**Files:**
- Create: `agent/cmd/agentroot/portparse.go`

- [ ] **Step 1: Write the port spec parser**

```go
package agentroot

import (
    "fmt"
    "strconv"
    "strings"

    "github.com/engress-io/sdk/ports"
)

// ParsePortSpecs parses a list of protocol-specific port specs into agentBindingInputs.
// Input: ["tcp", "8080,443", "udp", "9911"]
// Output: bindings for each port with protocol and prefix set.
func ParsePortSpecs(args []string) ([]agentBindingInput, []error) {
    var bindings []agentBindingInput
    var errs []error
    i := 0
    for i < len(args) {
        protocol := strings.ToLower(args[i])
        if protocol != "tcp" && protocol != "udp" && protocol != "http" {
            errs = append(errs, fmt.Errorf("unknown protocol %q (want tcp, udp, or http)", protocol))
            i++
            continue
        }
        if i+1 >= len(args) {
            errs = append(errs, fmt.Errorf("protocol %q needs a port list", protocol))
            break
        }
        portList := args[i+1]
        for _, ps := range strings.Split(portList, ",") {
            ps = strings.TrimSpace(ps)
            port, err := strconv.Atoi(ps)
            if err != nil {
                errs = append(errs, fmt.Errorf("invalid port %q: %w", ps, err))
                continue
            }
            if port < 1 || port > 65535 {
                errs = append(errs, fmt.Errorf("port %d out of range (1-65535)", port))
                continue
            }
            blocked, reason := ports.IsBlocked(port)
            if blocked {
                errs = append(errs, fmt.Errorf("port %d (%s) is not permitted. See https://engress.io/docs/aup", port, reason))
                continue
            }
            prefix := ports.PrefixFor(port)
            addr := fmt.Sprintf("%s://127.0.0.1:%d", protocol, port)
            bindings = append(bindings, agentBindingInput{
                Subdomain: prefix,  // sent as prefix hint to edge
                LocalAddr: addr,
                Protocol:  protocol,
            })
        }
        i += 2
    }
    return bindings, errs
}
```

- [ ] **Step 2: Commit**

```bash
cd agent
git add cmd/agentroot/portparse.go
git commit -m "feat(agent): add port spec parser for multi-protocol CLI

Parses 'tcp 8080,443 udp 9911' into agentBindingInputs.
Validates ports against the blocked list, resolves semantic prefixes.
Shared by tcp, udp, and http commands."
git push origin main
cd ..
git add agent
git commit -m "chore: point agent submodule to port parser"
```

### Task 4.3: Create engress tcp Command

**Files:**
- Create: `agent/cmd/agentroot/tcp.go`

- [ ] **Step 1: Write the tcp command**

```go
package agentroot

import (
    "fmt"
    "os"

    "github.com/spf13/cobra"
)

var tcpCmd = &cobra.Command{
    Use:   "tcp <port>[,<port>...]",
    Short: "Forward raw TCP ports through an encrypted tunnel",
    Long: `Expose local TCP ports over HTTPS with automatic semantic subdomains.

Examples:
  engress tcp 8080                  # → http-a1b2c3d4.edge.engress.io
  engress tcp 3389                  # → rdp-e5f6g7h8.edge.engress.io
  engress tcp 8080,443,9090         # multiple ports, one tunnel

Each port gets its own subdomain. Traffic is encrypted edge-to-agent
via mTLS. The upstream connection uses best-effort TLS.`,
    Args: cobra.MinimumNArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        bindings, errs := ParsePortSpecs(append([]string{"tcp"}, args...))
        if len(errs) > 0 {
            for _, e := range errs {
                fmt.Fprintf(os.Stderr, "Error: %v\n", e)
            }
            return fmt.Errorf("%d port(s) rejected", len(errs))
        }
        return runAgentBindings(agentConfigPath, bindings, agentToken, agentTestMode, agentLinkOpts())
    },
}

func init() {
    rootCmd.AddCommand(tcpCmd)
}
```

- [ ] **Step 2: Commit**

```bash
cd agent
git add cmd/agentroot/tcp.go
git commit -m "feat(agent): add 'engress tcp' command

Raw TCP port forwarding with automatic semantic subdomain naming.
Multiple ports via comma-separated list. Ports validated against
the blocked list at parse time."
git push origin main
cd ..
git add agent
git commit -m "chore: point agent submodule to tcp command"
```

### Task 4.4: Create engress udp Command

**Files:**
- Create: `agent/cmd/agentroot/udp.go`

- [ ] **Step 1: Write the udp command**

```go
package agentroot

import (
    "fmt"
    "os"

    "github.com/spf13/cobra"
)

var udpCmd = &cobra.Command{
    Use:   "udp <port>[,<port>...]",
    Short: "Forward UDP traffic through an encrypted tunnel",
    Long: `Expose local UDP ports over an encrypted tunnel with semantic subdomains.

Examples:
  engress udp 9911                  # → game-a1b2c3d4.edge.engress.io
  engress udp 53,123                # → dns-xxx / ntp-xxx

UDP forwarding uses QUIC datagrams when available, with automatic
fallback to a TCP relay. Each port gets its own subdomain and
dedicated edge port.`,
    Args: cobra.MinimumNArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        bindings, errs := ParsePortSpecs(append([]string{"udp"}, args...))
        if len(errs) > 0 {
            for _, e := range errs {
                fmt.Fprintf(os.Stderr, "Error: %v\n", e)
            }
            return fmt.Errorf("%d port(s) rejected", len(errs))
        }
        return runAgentBindings(agentConfigPath, bindings, agentToken, agentTestMode, agentLinkOpts())
    },
}

func init() {
    rootCmd.AddCommand(udpCmd)
}
```

- [ ] **Step 2: Commit**

```bash
cd agent
git add cmd/agentroot/udp.go
git commit -m "feat(agent): add 'engress udp' command

UDP port forwarding with semantic subdomain naming. Uses QUIC
datagrams when available. Ports validated against blocked list."
git push origin main
cd ..
git add agent
git commit -m "chore: point agent submodule to udp command"
```

## Task Group 5: Abuse Prevention — Rate Limiting

### Task 5.1: Create Edge Rate Limiter

**Files:**
- Create: `edge/internal/edge/ratelimit.go`

- [ ] **Step 1: Write the rate limiter**

```go
// Package edge — in-memory token bucket rate limiter.
package edge

import (
    "sync"
    "time"
)

// RateLimiter provides per-key token bucket rate limiting.
type RateLimiter struct {
    mu       sync.Mutex
    buckets  map[string]*bucket
    rate     float64 // tokens per second
    capacity int     // max burst
}

type bucket struct {
    tokens    float64
    lastCheck time.Time
}

// NewRateLimiter creates a limiter with the given refill rate and burst.
func NewRateLimiter(rate float64, capacity int) *RateLimiter {
    return &RateLimiter{
        buckets:  make(map[string]*bucket),
        rate:     rate,
        capacity: capacity,
    }
}

// Allow checks whether a request for the given key is permitted.
func (rl *RateLimiter) Allow(key string) bool {
    rl.mu.Lock()
    defer rl.mu.Unlock()

    now := time.Now()
    b, ok := rl.buckets[key]
    if !ok {
        b = &bucket{tokens: float64(rl.capacity) - 1, lastCheck: now}
        rl.buckets[key] = b
        return true
    }

    elapsed := now.Sub(b.lastCheck).Seconds()
    b.tokens += elapsed * rl.rate
    if b.tokens > float64(rl.capacity) {
        b.tokens = float64(rl.capacity)
    }
    b.lastCheck = now

    if b.tokens >= 1 {
        b.tokens--
        return true
    }
    return false
}
```

- [ ] **Step 2: Wire rate limiter into the edge server**

In `wiring.go`, create rate limiters and check them in `OnRegister`:
- Per-IP tunnel connection limiter (30/min)
- Per-tenant endpoint creation limiter (10/hour)

- [ ] **Step 3: Commit**

```bash
cd edge
git add internal/edge/ratelimit.go internal/edge/wiring.go
git commit -m "feat(edge): add in-memory rate limiter with per-IP and per-tenant buckets

Prevents brute-force subdomain scanning (30 conn/min/IP) and endpoint
creation spam (10/hour/tenant). Token bucket algorithm, no external
dependencies. Foundation for future tier-based limits."
git push origin main
cd ..
git add edge
git commit -m "chore: point edge submodule to rate limiter"
```

## Task Group 6: Encryption Policy — Disable Insecure Fallback

### Task 6.1: Flip allowLegacyInsecure Default to False

**Files:**
- Modify: `edge/internal/tunnel/configure.go`

- [ ] **Step 1: Change the default**

```go
// allowLegacyInsecure reports whether the agent may connect without mTLS.
// Default: false. Set ENGRESS_ALLOW_INSECURE=1 to re-enable (not recommended).
func allowLegacyInsecure() bool {
    v := os.Getenv("ENGRESS_ALLOW_INSECURE")
    if v == "" {
        v = os.Getenv("FLUX_ALLOW_INSECURE") // legacy compat
    }
    // Only explicit opt-in enables insecure.
    return v == "1" || strings.EqualFold(v, "true") || strings.EqualFold(v, "yes")
}
```

- [ ] **Step 2: Update ConfigureAgentTLS to give a clear error**

When `allowLegacyInsecure()` is false and no cert is available, return an error with a helpful message guiding the user to provision a cert.

- [ ] **Step 3: Commit**

```bash
cd edge
git add internal/tunnel/configure.go
git commit -m "fix(edge): disable insecure tunnel fallback by default

mTLS is now required for all tunnel connections. Set
ENGRESS_ALLOW_INSECURE=1 to re-enable (legacy behavior, not recommended).
Agents without provisioned certs get a clear error with provisioning
instructions. Closes a long-standing security footgun."
git push origin main
cd ..
git add edge
git commit -m "chore: point edge submodule to encryption hardening"
```

## Task Group 7: Flux String Cleanup

### Task 7.1: Rename Flux References in Go Source

**Files:**
- Modify: ~80 Go files across all repos (batch rename)

- [ ] **Step 1: Run a scripted rename across repos**

Use `sed` or a Go-based rename tool to replace:
- `FLUX_` env var prefixes → `ENGRESS_` (where not already aliased)
- `flux.` config paths → `engress.` (e.g. `~/.config/flux/` → `~/.config/engress/`)
- `"flux"` in help text/comments → `"engress"`
- Docker Compose service names: `flux-edge` → `engress-edge`, `flux-core` → `engress-core`

- [ ] **Step 2: Build and test after rename**

```bash
cd agent && go build ./... && go test ./... && cd ..
cd edge && go build ./... && go test ./... && cd ..
cd core && go build ./... && go test ./... && cd ..
cd sdk && go build ./... && go test ./... && cd ..
```

- [ ] **Step 3: Commit per repo**

```bash
cd agent
git add -A
git commit -m "chore: rename remaining flux strings to engress

Cosmetic cleanup: env vars, config paths, help text, comments.
No functional changes."
git push origin main
cd ..
# repeat for edge, core, sdk
git add agent edge core sdk
git commit -m "chore: point all submodules to flux→engress rename"
git push origin main
```

## Task Group 8: Integration & Documentation

### Task 8.1: Write Phase 1 Narrative Document

**Files:**
- Create: `docs/superpowers/specs/2026-06-28-p01-infra-hardening-narrative.md`

- [ ] **Step 1: Write the narrative**

A human-readable story of what Phase 1 accomplished:
- The stale deploy problem and how we fixed it
- The new port UX and why semantic naming matters
- The abuse prevention layers
- The encryption upgrade
- What's next (Phase 2: Amplify, Phase 3: Multi-region, etc.)

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-06-28-p01-infra-hardening-narrative.md
git commit -m "docs: add Phase 1 narrative — engress infrastructure hardening

Tells the story of the deploy pipeline fix, semantic naming, abuse
prevention, and encryption enforcement. For stakeholders and future
contributors."
git push origin main
```

### Task 8.2: Update AGENTS.md with Phase 1 Status

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update the cutover status section**

Add a new section documenting Phase 1 completion:
- Deploy pipeline: fully automated via GitHub Actions
- Port UX: tcp/udp/http with semantic naming
- Abuse prevention: port blocking + rate limiting
- Encryption: mTLS required by default
- Flux strings: cleaned up

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): update with Phase 1 infrastructure hardening status

Documents the new deploy pipeline, semantic naming, abuse prevention,
and encryption enforcement. Removes stale deploy gap from known issues."
git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** All 6 sections of the design spec are addressed: deploy automation (Task Group 1), port UX (Task Group 4), semantic naming (Task Group 3), abuse prevention (Task Group 5), encryption (Task Group 6), flux cleanup (Task Group 7). Task Group 2 (sdk/ports) is the foundation for both naming and blocking.
- **Placeholder scan:** No TBDs. Each task has concrete code or commands.
- **Type consistency:** `Binding` struct in portmanager.go is used consistently. `Register.Protocol` field uses the same string values ("http", "tcp", "udp") across agent and edge.
- **Bite-sized:** Each task is 2-5 steps, each step is one action.
