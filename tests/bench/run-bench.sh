#!/usr/bin/env bash
# steward benchmark runner.
# Protocol P1: scenario x {off,lite,strict} x N runs, pi -p --no-session.
# Isolation: scratch PI_CODING_AGENT_DIR (no extensions), so steward's injected
# block is the only variable between conditions. Auth + model store are copied in.
# Usage: ./run-bench.sh [N_RUNS] [MODEL] [only-scenario-id]
set -euo pipefail

BENCH_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$BENCH_DIR/../.." && pwd)"
N_RUNS="${1:-3}"
MODEL="${2:-anthropic/claude-sonnet-5}"
ONLY="${3:-}"
RUNS_DIR="$BENCH_DIR/runs"
REAL_AGENT_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"

SCRATCH="$(mktemp -d /tmp/steward-bench-agent.XXXXXX)"
trap 'rm -rf "$SCRATCH"' EXIT
cp "$REAL_AGENT_DIR/auth.json" "$SCRATCH/" 2>/dev/null || true
cp "$REAL_AGENT_DIR/models-store.json" "$SCRATCH/" 2>/dev/null || true
printf '{"defaultProvider": "anthropic", "packages": []}\n' > "$SCRATCH/settings.json"

# Steward blocks come from the shared core, not from the extension.
block() { # $1 = mode
  STEWARD_CONFIG="$SCRATCH/steward.json" node -e "
    const c = require('$REPO_DIR/core/steward-core.cjs');
    process.stdout.write(c.instructions('$1', c.readConfig()));"
}
printf '{"defaultMode": "lite", "dict": false}\n' > "$SCRATCH/steward.json"
LITE_BLOCK="$(block lite)"
STRICT_BLOCK="$(block strict)"

run_one() { # $1=scenario_id $2=prompt $3=condition $4=run_n
  local out="$RUNS_DIR/$1/$3-$4.md"
  [ -s "$out" ] && { echo "skip $1/$3-$4 (exists)"; return 0; }
  mkdir -p "$RUNS_DIR/$1"
  # --no-tools: this is a writing benchmark. With tools enabled the agent writes
  # a file (or files a real issue) and replies with a one-line report, which
  # scores as a tiny, empty output instead of the prose under test.
  local args=(-p --no-session --no-tools --model "$MODEL")
  case "$3" in
    lite)   args+=(--append-system-prompt "$LITE_BLOCK");;
    strict) args+=(--append-system-prompt "$STRICT_BLOCK");;
  esac
  echo "run  $1/$3-$4"
  # stdin from /dev/null: pi would otherwise consume the driving loop's stdin.
  PI_CODING_AGENT_DIR="$SCRATCH" pi "${args[@]}" "$2" < /dev/null > "$out" 2>"$out.err" \
    || { echo "FAIL $1/$3-$4 (see $out.err)"; rm -f "$out"; return 1; }
  rm -f "$out.err"
}

# P1 matrix
while IFS=$'\t' read -r sid prompt; do
  [ -n "$ONLY" ] && [ "$sid" != "$ONLY" ] && continue
  for cond in off lite strict; do
    for n in $(seq 1 "$N_RUNS"); do
      run_one "$sid" "$prompt" "$cond" "$n" || true
    done
  done
done < <(python3 -c "
import json, sys
d = json.load(open('$BENCH_DIR/scenarios.json'))
for s in d['scenarios']:
    print(s['id'] + '\t' + s['prompt'].replace('\n', ' '))
")

# P2 rewrite: S2 off run-1 rewritten under strict.
P2_SRC="$RUNS_DIR/S2/off-1.md"
if [ -s "$P2_SRC" ] && [ -z "$ONLY" ]; then
  mkdir -p "$RUNS_DIR/S2R"
  for n in $(seq 1 "$N_RUNS"); do
    out="$RUNS_DIR/S2R/strict-$n.md"
    [ -s "$out" ] && continue
    echo "run  S2R/strict-$n"
    PI_CODING_AGENT_DIR="$SCRATCH" pi -p --no-session --no-tools --model "$MODEL" \
      --append-system-prompt "$STRICT_BLOCK" \
      "Rewrite the following text so it follows the writing rules in your system prompt. Keep every fact, instruction, and warning. Do not add or remove content.

$(cat "$P2_SRC")" < /dev/null > "$out" 2>/dev/null || rm -f "$out"
  done
fi

echo "done. outputs in $RUNS_DIR"
