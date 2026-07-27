// Smoke test: registration, prompt injection, mode/scope switching, off-switch.
// Runs the real extension against a fake pi API. Node >= 23 (native TS type stripping).
import assert from "node:assert";

const m = await import("../extension/ste-writing.ts");
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

// flavored injection, appended after the base prompt
{
  const { handlers, run } = boot();
  await run("flavored", null);
  const r = await handlers["before_agent_start"]({ systemPrompt: "BASE" });
  assert.ok(r.systemPrompt.startsWith("BASE"), "base prompt kept");
  assert.ok(r.systemPrompt.includes("STE MODE ACTIVE (level: flavored)"), "flavored block injected");
}

// strict adds the strict block; artifacts scope changes the scope line
{
  const { handlers, run } = boot();
  await run("strict", null);
  await run("scope artifacts", null);
  const r = await handlers["before_agent_start"]({ systemPrompt: "BASE" });
  assert.ok(r.systemPrompt.includes("Strict additions"), "strict block present");
  assert.ok(r.systemPrompt.includes("artifacts only"), "artifacts scope line present");
  await run("scope all", null); // restore saved scope default
}

// natural-language off-switch stops injection
{
  const { handlers, run } = boot();
  await run("flavored", null);
  await handlers["input"]({ text: "ok stop ste now", source: "user" });
  const r = await handlers["before_agent_start"]({ systemPrompt: "BASE" });
  assert.equal(r, undefined, "off mode injects nothing");
}

console.log("smoke: all checks passed");
