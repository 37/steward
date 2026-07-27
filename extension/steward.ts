// steward (STE Written Artifact Requirements Doc): /steward toggles ASD-STE100
// prose discipline. Command pattern from ponytail's pi-extension.
// Depth layer: ../skills/steward/
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Mode = "lite" | "strict" | "off";
type Scope = "all" | "artifacts";
type Config = {
  defaultMode: Mode;
  scope: Scope;
  dict: boolean;
  banned: string[];
  rules: string[];
};

const MODES: Mode[] = ["lite", "strict", "off"];
const SCOPES: Scope[] = ["all", "artifacts"];
const CONFIG_PATH = process.env.STEWARD_CONFIG || join(homedir(), ".pi", "agent", "steward.json");
// Works in both layouts: <repo>/extension/../skills/steward (package install)
// and ~/.pi/agent/extensions/../skills/steward (manual copy).
const SKILL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "steward");
const DEFAULT_BANNED = ["bare:key"];

function normalizeMode(raw: unknown): Mode | null {
  const v = String(raw || "").toLowerCase();
  if (v === "flavored") return "lite"; // legacy name from v1
  return MODES.includes(v as Mode) ? (v as Mode) : null;
}

function readConfig(): Config {
  let raw: any = {};
  try {
    raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch {}
  return {
    defaultMode: normalizeMode(raw.defaultMode) ?? "lite",
    scope: SCOPES.includes(raw.scope) ? raw.scope : "all",
    dict: raw.dict === true,
    banned: Array.isArray(raw.banned) ? raw.banned.map(String) : [...DEFAULT_BANNED],
    rules: Array.isArray(raw.rules) ? raw.rules.map(String) : [],
  };
}

function writeConfig(patch: Partial<Config>) {
  const next = { ...readConfig(), ...patch };
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n");
  return next;
}

function dictTier(): string {
  try {
    const d = JSON.parse(readFileSync(join(SKILL_DIR, "dictionary.json"), "utf8"));
    const pairs = (d.keep || [])
      .slice(0, 50)
      .map((p: any) => `${p.from} > ${p.to}`)
      .join("; ");
    return `\nWord substitutions (STE dictionary tier): ${pairs}.\nNotes: verify stays in formal-verification and crypto contexts; should/may stay when RFC-2119 optionality or permission is intended; terminate stays for process signals.`;
  } catch {
    return "";
  }
}

function registerBlock(cfg: Config): string {
  const lines: string[] = [];
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

function instructions(mode: Mode, cfg: Config): string {
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
STE governs clarity, not volume. Do not pad; compression rules (caveman) still apply.${strictExtra}${cfg.dict ? dictTier() : ""}${registerBlock(cfg)}

Depth on demand: ${SKILL_DIR}/ (rules-reference.md = full 53-rule digest, dictionary.json = distilled substitutions, ste-lint.py = mechanical check).
Deactivate: "stop steward" or /steward off.`;
}

export default function stewardExtension(pi: any) {
  const boot = readConfig();
  let mode: Mode = boot.defaultMode;
  let scope: Scope = boot.scope;
  let lastCtx: any = null;

  function syncStatus(ctx?: any) {
    if (ctx) lastCtx = ctx;
    const c = ctx || lastCtx;
    if (!c?.ui?.setStatus) return;
    let theme: any;
    try {
      theme = c.ui.theme;
      if (!theme?.fg) return;
    } catch {
      return;
    }
    if (mode === "off") {
      c.ui.setStatus("steward", "");
      return;
    }
    const cfg = readConfig();
    const tags = [cfg.scope === "artifacts" ? "artifacts" : "", cfg.dict ? "dict" : ""]
      .filter(Boolean)
      .join(",");
    c.ui.setStatus(
      "steward",
      theme.fg("muted", "✈ steward: ") + theme.fg("text", mode.toUpperCase() + (tags ? ` (${tags})` : "")),
    );
  }

  function setMode(next: Mode, ctx?: any) {
    mode = next;
    pi.appendEntry("steward-mode", { mode, scope });
    syncStatus(ctx);
    ctx?.ui?.notify?.(`steward mode: ${mode}${mode === "off" ? "" : `, scope: ${scope}`}`, "info");
  }

  pi.registerCommand("steward", {
    description:
      "STE writing mode. Modes: lite|strict|off. Commands: status, scope all|artifacts, dict on|off, ban <term>, unban <term>, rule <text>, unrule <n>, rules, default <mode>",
    handler: async (args: string, ctx: any) => {
      const input = String(args || "").trim();
      const [primary, ...restParts] = input.split(/\s+/);
      const rest = restParts.join(" ");
      const p = (primary || "").toLowerCase();

      if (!p) {
        if (mode === "off") {
          const d = readConfig().defaultMode;
          setMode(d === "off" ? "lite" : d, ctx);
        } else {
          ctx?.ui?.notify?.(`steward: ${mode}, scope: ${scope}`, "info");
        }
        return;
      }
      if (p === "status") {
        const cfg = readConfig();
        ctx?.ui?.notify?.(
          `steward: current ${mode}, scope ${cfg.scope}, dict ${cfg.dict ? "on" : "off"}, default ${cfg.defaultMode}, banned ${cfg.banned.length}, rules ${cfg.rules.length}`,
          "info",
        );
        return;
      }
      if (p === "scope") {
        const s = rest.toLowerCase();
        if (SCOPES.includes(s as Scope)) {
          scope = s as Scope;
          writeConfig({ scope });
          pi.appendEntry("steward-mode", { mode, scope });
          syncStatus(ctx);
          ctx?.ui?.notify?.(`steward scope: ${scope} (saved as default)`, "info");
        } else ctx?.ui?.notify?.("Usage: /steward scope all|artifacts", "warning");
        return;
      }
      if (p === "dict") {
        const v = rest.toLowerCase();
        if (v === "on" || v === "off") {
          writeConfig({ dict: v === "on" });
          syncStatus(ctx);
          ctx?.ui?.notify?.(`steward dictionary tier: ${v}`, "info");
        } else ctx?.ui?.notify?.("Usage: /steward dict on|off", "warning");
        return;
      }
      if (p === "ban") {
        if (!rest) return ctx?.ui?.notify?.("Usage: /steward ban <term>  (prefix bare: for unqualified-only)", "warning");
        const cfg = readConfig();
        if (!cfg.banned.includes(rest)) writeConfig({ banned: [...cfg.banned, rest] });
        ctx?.ui?.notify?.(`steward: banned "${rest}"`, "info");
        return;
      }
      if (p === "unban") {
        const cfg = readConfig();
        writeConfig({ banned: cfg.banned.filter((b) => b !== rest && b !== `bare:${rest}`) });
        ctx?.ui?.notify?.(`steward: unbanned "${rest}"`, "info");
        return;
      }
      if (p === "rule") {
        if (!rest) return ctx?.ui?.notify?.("Usage: /steward rule <free-text rule>", "warning");
        const cfg = readConfig();
        writeConfig({ rules: [...cfg.rules, rest] });
        ctx?.ui?.notify?.(`steward: rule added (#${cfg.rules.length + 1})`, "info");
        return;
      }
      if (p === "unrule") {
        const n = parseInt(rest, 10);
        const cfg = readConfig();
        if (n >= 1 && n <= cfg.rules.length) {
          writeConfig({ rules: cfg.rules.filter((_, i) => i !== n - 1) });
          ctx?.ui?.notify?.(`steward: rule #${n} removed`, "info");
        } else ctx?.ui?.notify?.(`Usage: /steward unrule <1..${cfg.rules.length}>`, "warning");
        return;
      }
      if (p === "rules") {
        const cfg = readConfig();
        const banned = cfg.banned.map((b) => `ban: ${b}`).join("\n");
        const rules = cfg.rules.map((r, i) => `#${i + 1}: ${r}`).join("\n");
        ctx?.ui?.notify?.(`steward register\n${banned}\n${rules}`.trim(), "info");
        return;
      }
      if (p === "default") {
        const m = normalizeMode(rest);
        if (m) {
          writeConfig({ defaultMode: m });
          ctx?.ui?.notify?.(`steward default mode saved: ${m}`, "info");
        } else ctx?.ui?.notify?.("Usage: /steward default lite|strict|off", "warning");
        return;
      }
      const m = normalizeMode(p);
      if (m) {
        setMode(m, ctx);
        return;
      }
      ctx?.ui?.notify?.(
        "Unknown /steward argument. Modes: lite|strict|off. Commands: status, scope, dict, ban, unban, rule, unrule, rules, default.",
        "warning",
      );
    },
  });

  pi.on("input", async (event: any) => {
    if (event?.source === "extension") return;
    if (mode !== "off" && /\bstop (ste|steward)\b/i.test(String(event?.text || ""))) setMode("off");
  });

  pi.on("session_start", async (_event: any, ctx: any) => {
    const entries = ctx?.sessionManager?.getBranch?.() || ctx?.sessionManager?.getEntries?.() || [];
    const fresh = readConfig();
    mode = fresh.defaultMode;
    scope = fresh.scope;
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const e = entries[i];
      // Accept legacy "ste-mode" entries from sessions before the rename.
      if (e?.type === "custom" && (e?.customType === "steward-mode" || e?.customType === "ste-mode")) {
        const m = normalizeMode(e?.data?.mode);
        if (m) mode = m;
        if (SCOPES.includes(e?.data?.scope)) scope = e.data.scope;
        break;
      }
    }
    syncStatus(ctx);
  });

  pi.on("before_agent_start", async (event: any) => {
    if (mode === "off") return;
    const cfg = readConfig();
    cfg.scope = scope; // session scope wins over config
    const base = event?.systemPrompt ? `${event.systemPrompt}\n\n` : "";
    return { systemPrompt: `${base}${instructions(mode, cfg)}` };
  });
}
