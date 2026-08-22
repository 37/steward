#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
core=core/steward-core.cjs
backup=$(mktemp)
cp "$core" "$backup"
trap 'cp "$backup" "$core"; rm -f "$backup"' EXIT

probe() {
  local label=$1 old=$2 new=$3
  cp "$backup" "$core"
  python3 - "$core" "$old" "$new" <<'PY'
from pathlib import Path
import sys
path, old, new = sys.argv[1:]
text = Path(path).read_text()
assert text.count(old) == 1, (old, text.count(old))
Path(path).write_text(text.replace(old, new))
PY
  if node tests/writing-system.mjs >/dev/null 2>&1; then
    echo "$label: STILL GREEN"
    return 1
  fi
  echo "$label: red"
}

probe 'remove report routing' '${substanceBlock()}${voiceBlock(cfg)}' '${voiceBlock(cfg)}'
probe 'invert voice routing' 'if (cfg.profile !== "voice") return "";' 'if (cfg.profile === "voice") return "";'
cp "$backup" "$core"
npm test >/dev/null
echo 'writing-system mutation probes: PASS; source restored'
