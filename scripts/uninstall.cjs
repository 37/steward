#!/usr/bin/env node
// steward uninstaller for manual (clone + install.sh) setups.
// Plugin-marketplace installs: remove through the agent's plugin manager instead.
// pi installs: run `pi remove git:github.com/37/steward`.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const settingsPath = path.join(claudeDir, "settings.json");

// 1. Remove steward hooks from Claude settings.
try {
  const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  let removed = 0;
  for (const [event, matchers] of Object.entries(settings.hooks || {})) {
    const kept = matchers.filter((m) => !JSON.stringify(m).includes("steward-hook.cjs"));
    removed += matchers.length - kept.length;
    if (kept.length) settings.hooks[event] = kept;
    else delete settings.hooks[event];
  }
  if (removed) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    console.log(`removed ${removed} steward hook entr${removed === 1 ? "y" : "ies"} from ${settingsPath}`);
  } else {
    console.log("no steward hooks in Claude settings");
  }
} catch {
  console.log("no Claude settings found");
}

// 2. Remove the skill link and the mode flag.
for (const p of [path.join(claudeDir, "skills", "steward"), path.join(claudeDir, ".steward-active")]) {
  try {
    fs.unlinkSync(p);
    console.log(`removed ${p}`);
  } catch {}
}

// 3. Remove the Codex managed block.
const agentsPath = process.env.CODEX_AGENTS || path.join(os.homedir(), ".codex", "AGENTS.md");
try {
  const text = fs.readFileSync(agentsPath, "utf8");
  const stripped = text.replace(/<!-- steward:begin[\s\S]*?<!-- steward:end -->\n?/m, "");
  if (stripped !== text) {
    if (stripped.trim()) fs.writeFileSync(agentsPath, stripped);
    else fs.unlinkSync(agentsPath);
    console.log(`removed steward block from ${agentsPath}`);
  }
} catch {}

console.log("Config kept at ~/.config/steward/config.json (delete it to reset all settings).");
console.log("pi installs: run `pi remove git:github.com/37/steward`.");
