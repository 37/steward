// steward (STE Written Artifact Requirements Doc): /steward toggles ASD-STE100
// prose discipline. Pi adapter over core/steward-core.cjs; command pattern from
// ponytail's pi-extension. Depth layer: ../skills/steward/
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const core = require("../core/steward-core.cjs");
const { MODES, SCOPES, normalizeMode, readConfig, writeConfig, instructions } = core;

type Mode = "lite" | "strict" | "off";
type Scope = "all" | "artifacts";

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

  function completions(prefix: string): Array<{ value: string; label: string }> | null {
    const parts = prefix.split(/\s+/);
    const cfg = readConfig();
    let cands: Array<{ value: string; label: string }> = [];
    if (parts.length <= 1) {
      const top: Array<[string, string]> = [
        ["lite", "prose discipline, vocabulary open"],
        ["strict", "full rule set + length caps"],
        ["off", "deactivate for this session"],
        ["status", "mode, scope, dict, register counts"],
        ["scope", "all | artifacts"],
        ["dict", "dictionary tier on | off"],
        ["ban", "ban a term (bare: prefix = unqualified only)"],
        ["unban", "remove a banned term"],
        ["rule", "add a free-text rule"],
        ["unrule", "remove a rule by number"],
        ["rules", "list the register"],
        ["default", "save startup mode"],
      ];
      cands = top.map(([v, l]) => ({ value: v, label: `${v} - ${l}` }));
    } else {
      const sub = parts[0].toLowerCase();
      const second = (words: string[]) => words.map((v) => ({ value: `${sub} ${v}`, label: v }));
      if (sub === "scope") cands = second(SCOPES);
      else if (sub === "dict") cands = second(["on", "off"]);
      else if (sub === "default") cands = second(MODES);
      else if (sub === "unban") cands = second(cfg.banned);
      else if (sub === "unrule")
        cands = cfg.rules.map((r: string, i: number) => ({ value: `unrule ${i + 1}`, label: `#${i + 1}: ${r.slice(0, 50)}` }));
    }
    const filtered = cands.filter((c) => c.value.startsWith(prefix.trimStart().toLowerCase()));
    return filtered.length ? filtered : null;
  }

  pi.registerCommand("steward", {
    description:
      "STE writing mode. Modes: lite|strict|off. Commands: status, scope, dict, ban, unban, rule, unrule, rules, default",
    getArgumentCompletions: (prefix: string) => completions(prefix),
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
        if (SCOPES.includes(s)) {
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
        writeConfig({ banned: cfg.banned.filter((b: string) => b !== rest && b !== `bare:${rest}`) });
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
          writeConfig({ rules: cfg.rules.filter((_: string, i: number) => i !== n - 1) });
          ctx?.ui?.notify?.(`steward: rule #${n} removed`, "info");
        } else ctx?.ui?.notify?.(`Usage: /steward unrule <1..${cfg.rules.length}>`, "warning");
        return;
      }
      if (p === "rules") {
        const cfg = readConfig();
        const banned = cfg.banned.map((b: string) => `ban: ${b}`).join("\n");
        const rules = cfg.rules.map((r: string, i: number) => `#${i + 1}: ${r}`).join("\n");
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
        setMode(m as Mode, ctx);
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
        if (m) mode = m as Mode;
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
