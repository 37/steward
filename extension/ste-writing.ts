// ste-writing extension: /ste command toggles ASD-STE100 prose discipline.
// Command pattern from ponytail's pi-extension. Depth layer: ../skills/ste-writing/
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Mode = "flavored" | "strict" | "off";
type Scope = "all" | "artifacts";

const MODES: Mode[] = ["flavored", "strict", "off"];
const SCOPES: Scope[] = ["all", "artifacts"];
const CONFIG_PATH = join(homedir(), ".pi", "agent", "ste.json");
// Works in both layouts: <repo>/extension/../skills/ste-writing (package install)
// and ~/.pi/agent/extensions/../skills/ste-writing (manual copy).
const SKILL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "ste-writing");

function readConfig(): { defaultMode: Mode; scope: Scope } {
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return {
      defaultMode: MODES.includes(raw.defaultMode) ? raw.defaultMode : "flavored",
      scope: SCOPES.includes(raw.scope) ? raw.scope : "all",
    };
  } catch {
    return { defaultMode: "flavored", scope: "all" };
  }
}

function writeConfig(cfg: { defaultMode: Mode; scope: Scope }) {
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n");
}

function instructions(mode: Mode, scope: Scope): string {
  const scopeLine =
    scope === "all"
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
STE governs clarity, not volume. Do not pad; compression rules (caveman) still apply.${strictExtra}

Depth on demand: ${SKILL_DIR}/ (rules-reference.md = full 53-rule digest, ste-lint.py = mechanical check).
Deactivate: "stop ste" or /ste off.`;
}

export default function steExtension(pi: any) {
  const cfg = readConfig();
  let mode: Mode = cfg.defaultMode;
  let scope: Scope = cfg.scope;
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
      c.ui.setStatus("ste", "");
      return;
    }
    const scopeTag = scope === "artifacts" ? " (artifacts)" : "";
    c.ui.setStatus(
      "ste",
      theme.fg("muted", "✈ ste: ") + theme.fg("text", mode.toUpperCase() + scopeTag),
    );
  }

  function setMode(next: Mode, ctx?: any) {
    mode = next;
    pi.appendEntry("ste-mode", { mode, scope });
    syncStatus(ctx);
    ctx?.ui?.notify?.(`STE mode: ${mode}${mode === "off" ? "" : `, scope: ${scope}`}`, "info");
  }

  function setScope(next: Scope, ctx?: any) {
    scope = next;
    pi.appendEntry("ste-mode", { mode, scope });
    writeConfig({ defaultMode: readConfig().defaultMode, scope: next });
    syncStatus(ctx);
    ctx?.ui?.notify?.(`STE scope: ${scope} (saved as default)`, "info");
  }

  pi.registerCommand("ste", {
    description: "STE writing mode. Modes: flavored|strict|off. Commands: status, scope all|artifacts, default <mode>",
    handler: async (args: string, ctx: any) => {
      const [primary, secondary] = String(args || "").trim().toLowerCase().split(/\s+/);

      if (!primary) {
        if (mode === "off") {
          const d = readConfig().defaultMode;
          setMode(d === "off" ? "flavored" : d, ctx);
        } else {
          ctx?.ui?.notify?.(`STE: ${mode}, scope: ${scope}`, "info");
        }
        return;
      }
      if (primary === "status") {
        ctx?.ui?.notify?.(`STE: current ${mode}, scope ${scope}, default ${readConfig().defaultMode}`, "info");
        return;
      }
      if (primary === "scope") {
        if (SCOPES.includes(secondary as Scope)) setScope(secondary as Scope, ctx);
        else ctx?.ui?.notify?.("Usage: /ste scope all|artifacts", "warning");
        return;
      }
      if (primary === "default") {
        if (MODES.includes(secondary as Mode)) {
          writeConfig({ defaultMode: secondary as Mode, scope });
          ctx?.ui?.notify?.(`STE default mode saved: ${secondary}`, "info");
        } else ctx?.ui?.notify?.("Usage: /ste default flavored|strict|off", "warning");
        return;
      }
      if (MODES.includes(primary as Mode)) {
        setMode(primary as Mode, ctx);
        return;
      }
      ctx?.ui?.notify?.("Unknown /ste argument. Modes: flavored|strict|off. Commands: status, scope, default.", "warning");
    },
  });

  pi.on("input", async (event: any) => {
    if (event?.source === "extension") return;
    if (mode !== "off" && /\bstop ste\b/i.test(String(event?.text || ""))) setMode("off");
  });

  pi.on("session_start", async (_event: any, ctx: any) => {
    const entries = ctx?.sessionManager?.getBranch?.() || ctx?.sessionManager?.getEntries?.() || [];
    const fresh = readConfig();
    mode = fresh.defaultMode;
    scope = fresh.scope;
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const e = entries[i];
      if (e?.type === "custom" && e?.customType === "ste-mode") {
        if (MODES.includes(e?.data?.mode)) mode = e.data.mode;
        if (SCOPES.includes(e?.data?.scope)) scope = e.data.scope;
        break;
      }
    }
    syncStatus(ctx);
  });

  pi.on("before_agent_start", async (event: any) => {
    if (mode === "off") return;
    const base = event?.systemPrompt ? `${event.systemPrompt}\n\n` : "";
    return { systemPrompt: `${base}${instructions(mode, scope)}` };
  });
}
