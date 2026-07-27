#!/usr/bin/env bash
# Claude hook smoke test: injection, command forms (plain, namespaced, @-prefix),
# register write, stop phrase. Isolated config + flag dirs.
set -euo pipefail
cd "$(dirname "$0")/.."

T=$(mktemp -d)
export STEWARD_CONFIG=$T/config.json CLAUDE_CONFIG_DIR=$T/claude
echo '{"defaultMode":"lite","scope":"all","dict":false,"banned":["bare:key"],"rules":[]}' > "$STEWARD_CONFIG"

run_prompt() { printf '{"prompt":"%s"}' "$1" | node claude/steward-hook.cjs UserPromptSubmit; }

node claude/steward-hook.cjs SessionStart </dev/null | grep -q "STE MODE ACTIVE (level: lite)"
echo "PASS SessionStart injects"

run_prompt "/steward strict" | grep -q "Strict additions"
[ "$(cat "$CLAUDE_CONFIG_DIR/.steward-active")" = "strict" ]
echo "PASS /steward strict"

run_prompt "/steward:steward lite" | grep -q "STEWARD MODE CHANGED"
[ "$(cat "$CLAUDE_CONFIG_DIR/.steward-active")" = "lite" ]
echo "PASS namespaced /steward:steward"

run_prompt "@steward status" | grep -q "steward: current lite"
echo "PASS @-prefix status"

run_prompt "/steward ban synergy" >/dev/null
grep -q synergy "$STEWARD_CONFIG"
echo "PASS ban via prompt"

run_prompt "please stop steward" >/dev/null
[ ! -f "$CLAUDE_CONFIG_DIR/.steward-active" ]
echo "PASS stop phrase"

echo "claude-hook: all checks passed"
