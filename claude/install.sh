#!/usr/bin/env bash
# steward Claude Code installer: merges hooks into ~/.claude/settings.json
# (or $CLAUDE_CONFIG_DIR/settings.json) and links the skill.
set -euo pipefail

STEWARD_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS="$CLAUDE_DIR/settings.json"

mkdir -p "$CLAUDE_DIR"
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"

node - "$STEWARD_DIR" "$SETTINGS" <<'EOF'
const fs = require("node:fs");
const [dir, settingsPath] = process.argv.slice(2);
const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
const tpl = JSON.parse(
  fs.readFileSync(dir + "/claude/hooks.json", "utf8")
    .replaceAll("STEWARD_DIR", dir),
);
settings.hooks = settings.hooks || {};
for (const [event, matchers] of Object.entries(tpl.hooks)) {
  const existing = settings.hooks[event] || [];
  // Idempotent: drop previous steward entries, then append the fresh ones.
  const kept = existing.filter(
    (m) => !JSON.stringify(m).includes("steward-hook.cjs"),
  );
  settings.hooks[event] = [...kept, ...matchers];
}
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
console.log("steward hooks merged into " + settingsPath);
EOF

# Skill: link into the personal skills dir so the model can load the depth layer.
mkdir -p "$CLAUDE_DIR/skills"
ln -sfn "$STEWARD_DIR/skills/steward" "$CLAUDE_DIR/skills/steward"
echo "steward skill linked into $CLAUDE_DIR/skills/steward"
echo "Done. Start a new Claude Code session; type '/steward status' as a prompt to check."
