#!/usr/bin/env node
// steward Codex adapter. Codex has no hook system, so steward lives as a
// managed block in ~/.codex/AGENTS.md. This CLI rewrites the block.
//
//   node codex/steward-codex.cjs lite|strict   set mode and write the block
//   node codex/steward-codex.cjs off           remove the block
//   node codex/steward-codex.cjs refresh       re-render after config edits
//
// Changes apply to the NEXT Codex session (AGENTS.md is read at start).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const core = require(path.join(__dirname, "..", "core", "steward-core.cjs"));

const BEGIN = "<!-- steward:begin (managed block, edit via steward-codex.cjs) -->";
const END = "<!-- steward:end -->";
const agentsPath = process.env.CODEX_AGENTS || path.join(os.homedir(), ".codex", "AGENTS.md");

function render(mode) {
  return `${BEGIN}\n${core.instructions(mode, core.readConfig())}\n${END}`;
}

function apply(mode) {
  let text = "";
  try {
    text = fs.readFileSync(agentsPath, "utf8");
  } catch {}
  const re = new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "m");
  const stripped = text.replace(re, "");
  const next = mode === "off" ? stripped : `${stripped.trimEnd()}\n\n${render(mode)}\n`.replace(/^\n+/, "");
  fs.mkdirSync(path.dirname(agentsPath), { recursive: true });
  fs.writeFileSync(agentsPath, next);
  console.log(mode === "off" ? `steward block removed from ${agentsPath}` : `steward ${mode} written to ${agentsPath} (applies to the next Codex session)`);
}

const arg = (process.argv[2] || "").toLowerCase();
if (arg === "off") {
  core.writeConfig({ defaultMode: "off" });
  apply("off");
} else if (arg === "refresh") {
  const mode = core.readConfig().defaultMode;
  apply(mode === "off" ? "off" : mode);
} else {
  const mode = core.normalizeMode(arg);
  if (!mode || mode === "off") {
    console.error("Usage: steward-codex.cjs lite|strict|off|refresh");
    process.exit(1);
  }
  core.writeConfig({ defaultMode: mode });
  apply(mode);
}
