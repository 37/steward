// steward shared core: config io + rule-block builder. No agent APIs.
// CommonJS so pi's TS loader, Claude Code hook scripts, and plain node can all load it.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const MODES = ["lite", "strict", "off"];
const SCOPES = ["all", "artifacts"];
const DEFAULT_BANNED = ["bare:key"];
const SKILL_DIR = path.join(__dirname, "..", "skills", "steward");
const LEGACY_CONFIG = path.join(os.homedir(), ".pi", "agent", "steward.json");

function configPath() {
  if (process.env.STEWARD_CONFIG) return process.env.STEWARD_CONFIG;
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, "steward", "config.json");
}

function normalizeMode(raw) {
  const v = String(raw || "").toLowerCase();
  if (v === "flavored") return "lite"; // legacy name from v1
  return MODES.includes(v) ? v : null;
}

function readConfig() {
  let raw = {};
  try {
    raw = JSON.parse(fs.readFileSync(configPath(), "utf8"));
  } catch {
    // One-time migration from the pre-agnostic pi-only location.
    try {
      raw = JSON.parse(fs.readFileSync(LEGACY_CONFIG, "utf8"));
      writeConfigObject(raw);
    } catch {}
  }
  return {
    defaultMode: normalizeMode(raw.defaultMode) || "lite",
    scope: SCOPES.includes(raw.scope) ? raw.scope : "all",
    dict: raw.dict === true,
    banned: Array.isArray(raw.banned) ? raw.banned.map(String) : [...DEFAULT_BANNED],
    rules: Array.isArray(raw.rules) ? raw.rules.map(String) : [],
  };
}

function writeConfigObject(obj) {
  const p = configPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function writeConfig(patch) {
  const next = { ...readConfig(), ...patch };
  writeConfigObject(next);
  return next;
}

function dictTier() {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, "dictionary.json"), "utf8"));
    const pairs = (d.keep || [])
      .slice(0, 50)
      .map((p) => `${p.from} > ${p.to}`)
      .join("; ");
    return `\nWord substitutions (STE dictionary tier): ${pairs}.\nNotes: verify stays in formal-verification and crypto contexts; should/may stay when RFC-2119 optionality or permission is intended; terminate stays for process signals.`;
  } catch {
    return "";
  }
}

function registerBlock(cfg) {
  const lines = [];
  for (const b of cfg.banned) {
    if (b.startsWith("bare:")) {
      const t = b.slice(5);
      lines.push(
        `- Do not use "${t}" without a qualifier. Qualified forms are correct ("API ${t}", "signing ${t}", "cache ${t}", "session ${t}").`,
      );
    } else {
      lines.push(`- Do not use "${b}".`);
    }
  }
  for (const r of cfg.rules) lines.push(`- ${r}`);
  return lines.length ? `\nUser register:\n${lines.join("\n")}` : "";
}

function instructions(mode, cfg) {
  const scopeLine =
    cfg.scope === "all"
      ? "Scope: all prose you produce. Chat replies and written artifacts (docs, commits, PR text, Linear text, handoffs, error messages)."
      : "Scope: written artifacts only (docs, commits, PR text, Linear text, handoffs, error messages). Chat replies are not governed.";
  const strictExtra =
    mode === "strict"
      ? `
Strict additions:
- Enforce the 20/25-word caps on every sentence, including warnings and notes.
- All procedure steps in imperative form, one action per numbered item.
- Prefer STE dictionary vocabulary; when unsure, check ${SKILL_DIR}/rules-reference.md.`
      : "";
  return `STE MODE ACTIVE (level: ${mode})

Write prose in ASD-STE100 Simplified Technical English.
${scopeLine}
Never applies to: code, identifiers, CLI syntax, quoted text, text the user asks you to preserve.

Core rules:
- One name for one thing. One meaning per word.
- Short common words: use, start, help, make sure, before, after, about, get, show.
- Active voice. Simple tenses only. Verb for an action, not a nominalization ("analyze the log", not "perform an analysis of the log").
- No "-ing" main verbs, no phrasal verbs ("spin up" > "start"), no stacked auxiliaries.
- Max 20 words per instruction sentence, 25 per descriptive sentence. One instruction per sentence.
- Condition first, comma, then command.
- One topic per paragraph, max 6 sentences. Steps go in numbered lists, imperative form.
- No contractions. Keep articles (a, an, the, this, these). Keep "that" after verbs like "make sure" and "show".
- If a pronoun can point at two nouns, repeat the noun.
- No semicolons, em-dashes, or en-dashes. No Latin abbreviations ("e.g." > "for example").
- No marketing adjectives, no empty intensifiers. State claims plainly.
STE governs clarity, not volume. Do not pad; compression rules still apply.${strictExtra}${cfg.dict ? dictTier() : ""}${registerBlock(cfg)}

Depth on demand: ${SKILL_DIR}/ (rules-reference.md = full 53-rule digest, dictionary.json = distilled substitutions, ste-lint.py = mechanical check).
Deactivate: "stop steward" or /steward off.`;
}

module.exports = {
  MODES,
  SCOPES,
  DEFAULT_BANNED,
  SKILL_DIR,
  configPath,
  normalizeMode,
  readConfig,
  writeConfig,
  instructions,
  dictTier,
  registerBlock,
};
