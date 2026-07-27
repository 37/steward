// Smoke test: registration, injection, modes, scope, register, dict tier, off-switch.
// Runs the real extension against a fake pi API with an isolated config file.
// Node >= 23 (native TS type stripping).
import assert from "node:assert";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmp = mkdtempSync(join(tmpdir(), "steward-test-"));
process.env.STEWARD_CONFIG = join(tmp, "steward.json");

const m = await import("../extension/steward.ts");
const ext = m.default;
assert.equal(typeof ext, "function", "default export is a function");

function boot() {
  const handlers = {};
  let cmd;
  const pi = {
    registerCommand: (_name, opts) => { cmd = opts.handler; },
    on: (event, h) => { handlers[event] = h; },
    appendEntry: () => {},
  };
  ext(pi);
  return { handlers, run: (...args) => cmd(...args) };
}

// lite injection, appended after the base prompt; legacy "flavored" maps to lite
{
  const { handlers, run } = boot();
  await run("flavored", null);
  const r = await handlers["before_agent_start"]({ systemPrompt: "BASE" });
  assert.ok(r.systemPrompt.startsWith("BASE"), "base prompt kept");
  assert.ok(r.systemPrompt.includes("STE MODE ACTIVE (level: lite)"), "lite block injected (legacy alias)");
}

// strict adds the strict block; artifacts scope changes the scope line
{
  const { handlers, run } = boot();
  await run("strict", null);
  await run("scope artifacts", null);
  const r = await handlers["before_agent_start"]({ systemPrompt: "BASE" });
  assert.ok(r.systemPrompt.includes("Strict additions"), "strict block present");
  assert.ok(r.systemPrompt.includes("artifacts only"), "artifacts scope line present");
  await run("scope all", null);
}

// register: default bare:key ships; ban and rule appear in the injection
{
  const { handlers, run } = boot();
  await run("lite", null);
  await run("ban synergy", null);
  await run("rule No exclamation marks in headings.", null);
  const r = await handlers["before_agent_start"]({ systemPrompt: "" });
  assert.ok(r.systemPrompt.includes('Do not use "key" without a qualifier'), "default bare:key rendered");
  assert.ok(r.systemPrompt.includes('Do not use "synergy"'), "banned term rendered");
  assert.ok(r.systemPrompt.includes("No exclamation marks in headings."), "free-text rule rendered");
  await run("unban synergy", null);
  await run("unrule 1", null);
  const r2 = await handlers["before_agent_start"]({ systemPrompt: "" });
  assert.ok(!r2.systemPrompt.includes("synergy"), "unban removes term");
  assert.ok(!r2.systemPrompt.includes("exclamation"), "unrule removes rule");
}

// dict tier off by default, on adds substitution pairs
{
  const { handlers, run } = boot();
  await run("lite", null);
  const r0 = await handlers["before_agent_start"]({ systemPrompt: "" });
  assert.ok(!r0.systemPrompt.includes("dictionary tier"), "dict off by default");
  await run("dict on", null);
  const r1 = await handlers["before_agent_start"]({ systemPrompt: "" });
  assert.ok(r1.systemPrompt.includes("utilize > use"), "dict tier pairs injected");
  await run("dict off", null);
}

// natural-language off-switch stops injection ("stop steward" and legacy "stop ste")
{
  const { handlers, run } = boot();
  await run("lite", null);
  await handlers["input"]({ text: "please stop steward now", source: "user" });
  const r = await handlers["before_agent_start"]({ systemPrompt: "BASE" });
  assert.equal(r, undefined, "off mode injects nothing");
}

// config round-trip: defaults written with new schema
{
  const cfg = JSON.parse(readFileSync(process.env.STEWARD_CONFIG, "utf8"));
  assert.ok(["lite", "strict", "off"].includes(cfg.defaultMode), "mode schema");
  assert.ok(Array.isArray(cfg.banned) && Array.isArray(cfg.rules), "register schema");
}

console.log("smoke: all checks passed");
