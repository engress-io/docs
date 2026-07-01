#!/usr/bin/env bash
# Sync internal-docs/atlas markdown into Docusaurus internal plugin path.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/../internal-docs/atlas"
DEST="$ROOT/internal/atlas"

if [[ ! -d "$SRC" ]]; then
  echo "sync-atlas: skip — $SRC not found (using committed docs/internal/)"
  exit 0
fi
SRC="$(cd "$SRC" && pwd)"

mkdir -p "$DEST"

position=0
for f in "$SRC"/[0-9]*.md "$SRC"/README.md "$SRC"/appendix-live.md "$SRC"/appendix-collect-log.md; do
  [[ -f "$f" ]] || continue
  base="$(basename "$f")"
  title="$(head -1 "$f" | sed 's/^# //')"
  [[ -n "$title" ]] || title="$base"
  position=$((position + 1))
  {
    echo "---"
    echo "title: $title"
    echo "sidebar_position: $position"
    echo "---"
    echo ""
    if [[ "$base" == "README.md" ]]; then
      tail -n +1 "$f" | sed '1s/^# Engress Atlas/# Operator Atlas/'
    elif [[ "$base" == "appendix-collect-log.md" ]]; then
      echo "Raw collector output (MDX-safe fenced block):"
      echo ""
      echo '```text'
      cat "$f"
      echo '```'
    else
      cat "$f"
    fi
  } > "$DEST/$base"
done

# Landing page for /internal
cat > "$ROOT/internal/index.md" <<'EOF'
---
title: Internal documentation
sidebar_position: 0
slug: /
---

# Internal documentation

Operator-facing documentation for Engress staff and platform admins. Sign in with your Engress account to view the **Operator Atlas** and other internal guides.

## Access

- **Public docs:** [User documentation](/) — no sign-in required
- **Internal docs:** this section — requires Clerk sign-in and platform admin access

## Security note

Internal pages use client-side Clerk gating for UX. The static HTML is deployed to the same CDN as public docs. Do not put live secrets (DSN values, API keys, tokens) in these pages — parameter **names** only.

For true secret isolation, see [Gap G19](/internal/atlas/10-gap-register#g19) in the gap register.

## Operator Atlas

Start at [Operator Atlas](/internal/atlas/README).
EOF

echo "sync-atlas: wrote $(find "$DEST" -name '*.md' | wc -l | tr -d ' ') files to $DEST"
