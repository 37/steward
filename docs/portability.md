# Running steward outside pi

Task 1 research: what the pi extension uses, what other agents offer, and the
architecture that keeps one behavior everywhere. Ground truth: the pi
extension API docs and the ponytail package, which ships working adapters for
pi, Claude Code, Codex, Copilot, and Qoder.

## What the pi extension uses

| pi API | Purpose | Portable? |
|---|---|---|
| `before_agent_start` → systemPrompt append | Inject the rule block every turn | Equivalent exists in Claude Code (hooks); static in Codex |
| `pi.registerCommand` + argument completions | `/steward` command surface | Claude Code: prompt-text parsing in a hook. Codex: CLI. No completions |
| `pi.appendEntry` | Per-session mode persistence | Claude Code: flag file. Codex: none (config only) |
| `ctx.ui.setStatus` | Status-bar indicator | Claude Code: statusline script. Codex: none |
| `pi.on("input")` | "stop steward" phrase | Claude Code: UserPromptSubmit hook. Codex: none |
| Config file + skill directory | Rules, register, dictionary | Fully portable (plain files) |

## Agent capability map

**Claude Code** has hooks configured in `settings.json`. `SessionStart`
stdout becomes hidden context. `UserPromptSubmit` receives the prompt as
JSON on stdin and can return `hookSpecificOutput.additionalContext`. This
gives per-turn injection, command parsing (`/steward ...` typed as a
prompt), the stop phrase, and mode switching. A `statusLine` command can
read a flag file and show the mode. Skills use the same SKILL.md format as
pi. Verdict: full feature parity except TUI completions and session-file
persistence (a flag file per config dir approximates it).

**Codex** reads `AGENTS.md` at session start and has custom prompts, but no
stable hook system. Verdict: static injection only. A managed block in
`~/.codex/AGENTS.md` carries the rule block; a small CLI rewrites the block
to change mode. Mode changes apply to the next session. No stop phrase, no
status display, no per-session scope.

**Important limitations** (all agents outside pi):

1. No live argument completion for the command surface.
2. Session-scoped mode becomes flag-file or config-scoped: a mode change in
   one Claude Code session leaks to concurrent sessions in the same config
   dir. The flag also outlives the session and wins over `defaultMode` at
   the next SessionStart. Use `/steward off` (or delete
   `.steward-active`) to return to the configured default.
3. Codex mode changes need a new session to take effect.
4. The hook path adds a subprocess spawn per prompt (about 50 ms for node).

## Architecture: shared core, thin adapters

The same split ponytail uses, and the reason it works: everything that
defines steward's behavior is pure computation over plain files.

```
core/steward-core.cjs   config io, mode normalization, rule-block builder,
                        register renderer, dictionary tier (CommonJS: both
                        pi's TS loader and plain node can require it)
extension/steward.ts    pi adapter (command, completions, status, session)
claude/                 hooks JSON + two hook scripts + statusline + installer
codex/                  managed AGENTS.md block + CLI toggle + installer
skills/steward/         shared skill, dictionary, linter (all agents)
```

Config moves to an agent-neutral path: `~/.config/steward/config.json`
(`STEWARD_CONFIG` env overrides; the legacy `~/.pi/agent/steward.json` is
read once and migrated). One config means one behavior: `/steward strict`
in pi also governs the next Claude Code session.

The pi adapter keeps every pi feature (completions, status bar, session
entries, live toggle). Other adapters degrade only in the surfaces the host
lacks, never in the rules themselves: the injected block is byte-identical
because every adapter calls the same `instructions()` function.

## Validation (real Claude Code sessions)

Run on Claude Code v2.1.207, isolated `CLAUDE_CONFIG_DIR`, same README
prompt as [examples.md](examples.md), scored with `ste-lint.py`:

| Condition | Violations/100w | Em-dashes | Words |
|---|---|---|---|
| baseline (hooks installed, mode off) | 6.28 | 3 | 223 |
| lite | 0.80 | 0 | 125 |
| strict | 0.00 | 0 | 101 |

The gradient matches the pi measurements (6.61 / 1.31 / 0.00). In-session
`/steward status`, mode switches via prompt, the stop phrase, the register,
and the flag-file lifecycle all worked in the live sessions.
