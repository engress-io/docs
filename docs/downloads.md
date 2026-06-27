---
sidebar_position: 3
title: Downloads
---

<span className="pill">INSTALL</span>

# Download engress

Pick the install method for your OS. All paths install the same `engress` CLI from [engress.io/downloads](https://engress.io/downloads).

You can also use the interactive picker at [engress.io/downloads](https://engress.io/downloads).

## macOS

**Homebrew (recommended)**

```bash
brew install engress-io/tap/engress
```

**Install script**

```bash
curl -fsSL https://engress.io/downloads/install.sh | bash
```

**Direct download (Apple Silicon)**

```bash
curl -fsSL -o engress \
  https://engress.io/downloads/latest/engress-darwin-arm64
chmod +x engress && sudo mv engress /usr/local/bin/
```

**Direct download (Intel)**

```bash
curl -fsSL -o engress \
  https://engress.io/downloads/latest/engress-darwin-amd64
chmod +x engress && sudo mv engress /usr/local/bin/
```

## Linux

**Install script (recommended)**

```bash
curl -fsSL https://engress.io/downloads/install.sh | bash
```

**Direct download (amd64)**

```bash
curl -fsSL -o engress \
  https://engress.io/downloads/latest/engress-linux-amd64
chmod +x engress && sudo mv engress /usr/local/bin/
```

**Direct download (arm64)**

```bash
curl -fsSL -o engress \
  https://engress.io/downloads/latest/engress-linux-arm64
chmod +x engress && sudo mv engress /usr/local/bin/
```

## Windows

**winget (recommended)**

```powershell
winget install Engress.Engress
```

**Install script (PowerShell)**

```powershell
irm https://engress.io/downloads/install.ps1 | iex
```

**Direct download**

Download `engress-windows-amd64.exe` from [downloads/latest](https://engress.io/downloads/latest/engress-windows-amd64.exe) and add it to your `PATH`.

## After install

```bash
engress login
engress http 11434   # Ollama example
```