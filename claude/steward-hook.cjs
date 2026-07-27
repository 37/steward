#!/usr/bin/env node
// steward Claude Code hook. One script, two events:
//   SessionStart      - inject the rule block for the active mode
//   UserPromptSubmit  - parse /steward commands and "stop steward", re-inject on change
// Mode state: flag file in the Claude config dir (session-ish scope, matches ponytail).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const core = require(path.join(__dirname, "..", "core", "steward-core.cjs"));

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const flagPath = path.join(claudeDir, ".steward-active");
const event = process.argv[2] || "SessionStart";

function readFlag() {
  try {
    return core.normalizeMode(fs.readFileSync(flagPath, "utf8").trim());
  } catch {
    return null;
  }
}
function writeFlag(mode) {
  fs.mkdirSync(path.dirname(flagPath), { recursive: true });
  fs.writeFileSync(flagPath, mode);
}
function clearFlag() {
  try {
    fs.unlinkSync(flagPath);
  } catch {}
}

function emit(context) {
  // UserPromptSubmit needs the hookSpecificOutput JSON form; SessionStart accepts raw stdout.
  if (event === "UserPromptSubmit") {
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } }),
    );
  } else {
    process.stdout.write(context);
  }
}

function block(mode) {
  const cfg = core.readConfig();
  return core.instructions(mode, cfg);
}

function onSessionStart() {
  const mode = readFlag() || core.readConfig().defaultMode;
  if (mode === "off") {
    clearFlag();
    return;
  }
  writeFlag(mode);
  emit(block(mode));
}

function onPrompt(promptRaw) {
  const prompt = String(promptRaw || "").trim();
  const lower = prompt.toLowerCase();

  if (/\bstop (ste|steward)\b/.test(lower)) {
    clearFlag();
    emit("STEWARD MODE OFF");
    return;
  }

  const m = lower.match(/^[/@$]steward\b\s*(.*)$/);
  if (!m) return; // ordinary prompt: SessionStart already injected; stay silent

  const [sub, ...restParts] = m[1].split(/\s+/).filter(Boolean);
  const rest = restParts.join(" ");
  const restOriginal = prompt.replace(/^[/@$]steward\b\s*\S*\s*/i, "");

  if (!sub) {
    const mode = readFlag() || core.readConfig().defaultMode;
    if (mode === "off") {
      writeFlag("lite");
      emit("STEWARD MODE CHANGED\n\n" + block("lite"));
    } else {
      emit(`STEWARD MODE ACTIVE (level: ${mode})`);
    }
    return;
  }
  if (sub === "status") {
    const cfg = core.readConfig();
    emit(
      `steward: current ${readFlag() || "off"}, scope ${cfg.scope}, dict ${cfg.dict ? "on" : "off"}, default ${cfg.defaultMode}, banned ${cfg.banned.length}, rules ${cfg.rules.length}`,
    );
    return;
  }
  if (sub === "scope" && core.SCOPES.includes(rest)) {
    core.writeConfig({ scope: rest });
    emit(`steward scope: ${rest}`);
    return;
  }
  if (sub === "dict" && (rest === "on" || rest === "off")) {
    core.writeConfig({ dict: rest === "on" });
    emit(`steward dictionary tier: ${rest}`);
    return;
  }
  if (sub === "ban" && restOriginal) {
    const cfg = core.readConfig();
    if (!cfg.banned.includes(restOriginal)) core.writeConfig({ banned: [...cfg.banned, restOriginal] });
    emit(`steward: banned "${restOriginal}"`);
    return;
  }
  if (sub === "unban" && restOriginal) {
    const cfg = core.readConfig();
    core.writeConfig({ banned: cfg.banned.filter((b) => b !== restOriginal && b !== `bare:${restOriginal}`) });
    emit(`steward: unbanned "${restOriginal}"`);
    return;
  }
  if (sub === "rule" && restOriginal) {
    const cfg = core.readConfig();
    core.writeConfig({ rules: [...cfg.rules, restOriginal] });
    emit(`steward: rule added (#${cfg.rules.length + 1})`);
    return;
  }
  if (sub === "unrule") {
    const n = parseInt(rest, 10);
    const cfg = core.readConfig();
    if (n >= 1 && n <= cfg.rules.length) {
      core.writeConfig({ rules: cfg.rules.filter((_, i) => i !== n - 1) });
      emit(`steward: rule #${n} removed`);
    }
    return;
  }
  if (sub === "rules") {
    const cfg = core.readConfig();
    emit(
      `steward register\n${cfg.banned.map((b) => `ban: ${b}`).join("\n")}\n${cfg.rules.map((r, i) => `#${i + 1}: ${r}`).join("\n")}`.trim(),
    );
    return;
  }
  if (sub === "default") {
    const dm = core.normalizeMode(rest);
    if (dm) {
      core.writeConfig({ defaultMode: dm });
      emit(`steward default mode saved: ${dm}`);
    }
    return;
  }
  const mode = core.normalizeMode(sub);
  if (mode === "off") {
    clearFlag();
    emit("STEWARD MODE OFF");
    return;
  }
  if (mode) {
    writeFlag(mode);
    emit("STEWARD MODE CHANGED\n\n" + block(mode));
    return;
  }
}

// Never hang the session: process whatever arrived after a short fallback.
let input = "";
let done = false;
function finish() {
  if (done) return;
  done = true;
  try {
    if (event === "SessionStart") {
      onSessionStart();
    } else {
      const data = JSON.parse(input.replace(/^\uFEFF/, "") || "{}");
      onPrompt(data.prompt);
    }
  } catch {}
  process.exit(0);
}
process.stdin.on("data", (c) => {
  input += c;
});
process.stdin.on("end", finish);
process.stdin.on("error", finish);
setTimeout(finish, 1000).unref();
