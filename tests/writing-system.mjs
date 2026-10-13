import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tmp = mkdtempSync(join(tmpdir(), "steward-writing-system-"));
process.env.STEWARD_CONFIG = join(tmp, "config.json");

const core = await import("../core/steward-core.cjs");
assert.deepEqual(core.PROFILES, ["plain", "voice"], "the shared core owns the profile vocabulary");
assert.equal(core.readConfig().profile, "plain", "plain is the default profile");

const plain = core.instructions("lite", core.readConfig());
assert.match(plain, /Durable-report substance rules/, "lite carries the durable-report substance layer");
assert.match(plain, /writer pays the verification cost/i, "the substance layer verifies claims before handoff");
assert.doesNotMatch(plain, /VOICE PROFILE ACTIVE/, "plain excludes voice rules");
assert.match(plain, /plain profile excludes marketing copy and prose that needs a personal voice/i, "plain states its scope boundary");
assert.doesNotMatch(plain, /writing-for-agents/, "the unrelated agent-document skill is not loaded");
assert.equal((plain.match(/Durable-report substance rules/g) || []).length, 1, "the substance layer has one runtime source");
assert.match(plain, /Self-contained hand-off/, "lite carries the self-contained hand-off rule (R6)");
const strict = core.instructions("strict", core.readConfig());
assert.match(strict, /Durable-report substance rules/, "strict carries the durable-report substance layer");

core.writeConfig({ profile: "voice" });
const voice = core.instructions("lite", core.readConfig());
assert.match(voice, /VOICE PROFILE ACTIVE/, "voice profile adds its own block");
assert.match(voice, /procedures, error messages, agent instructions, and precise technical references/i, "voice excludes precise surfaces");
for (const term of ["surface", "harness", "primitive"]) assert.match(voice, new RegExp(term), `voice preserves ${term} as a technical noun`);
assert.equal((voice.match(/VOICE PROFILE ACTIVE/g) || []).length, 1, "the voice layer is injected once");
assert.ok(voice.length - plain.length < 1800, "the optional voice profile stays bounded");

let command;
let completions;
let notice = "";
const handlers = {};
const pi = {
  registerCommand: (_name, options) => { command = options.handler; completions = options.getArgumentCompletions; },
  on: (event, handler) => { handlers[event] = handler; },
  appendEntry: () => {},
};
(await import("../extension/steward.ts")).default(pi);
const ctx = { ui: { notify: (message) => { notice = message; } } };
assert.ok(completions("profile ").some((entry) => entry.value === "profile voice"), "profile completion lists voice");
await command("profile plain", ctx);
assert.equal(JSON.parse(readFileSync(process.env.STEWARD_CONFIG, "utf8")).profile, "plain", "profile command persists plain");
await command("profile voice", ctx);
assert.match(notice, /profile: voice/, "profile command reports the active profile");
const injected = await handlers.before_agent_start({ systemPrompt: "" });
assert.match(injected.systemPrompt, /VOICE PROFILE ACTIVE/, "pi injects the selected profile");
await command("status", ctx);
assert.match(notice, /profile voice/, "status reports the profile");

const codexAgents = join(tmp, "AGENTS.md");
const codex = spawnSync("node", ["codex/steward-codex.cjs", "profile", "voice"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, CODEX_AGENTS: codexAgents },
  encoding: "utf8",
});
assert.equal(codex.status, 0, codex.stderr || "Codex profile command failed");
assert.match(readFileSync(codexAgents, "utf8"), /VOICE PROFILE ACTIVE/, "Codex renders the shared voice profile");

const lint = spawnSync("python3", ["skills/steward/writing-lint.py", "--selftest"], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
assert.equal(lint.status, 0, lint.stderr || lint.stdout || "writing linter self-test failed");

console.log("writing system: all checks passed");
