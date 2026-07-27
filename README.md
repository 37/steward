# steward

**STE W**ritten **A**rtifact **R**equirements **D**oc: a
[pi](https://github.com/badlogic/pi-mono) package that makes the agent write
prose in [ASD-STE100 Simplified Technical English](https://asd-ste100.org).

STE is a controlled language standard from the aerospace industry (1986,
current: Issue 9, 2025). It gives each word one meaning and each sentence one
job. Applied to an AI agent, it removes the padding, ambiguity, and filler
that read as "AI slop". A cross-model benchmark measured 50-74% fewer slop
violations with this rule set active.

## Install

```bash
pi install git:github.com/37/steward
```

Restart pi or run `/reload`.

## Use

The package has two layers:

1. **Extension**: the `/steward` command injects a compact STE rule block into the
   system prompt each turn. This governs all prose the agent produces.
2. **Skill**: the full 53-rule digest, a surface-to-mode map, and a heuristic
   linter. The agent loads it on demand for deep rewrites and rule lookups.

### Commands

| Command | Effect |
|---|---|
| `/steward` | Turn on (to the saved default), or show the current state |
| `/steward lite` | General prose discipline (default mode) |
| `/steward strict` | Full rule set: length caps on every sentence, imperative steps |
| `/steward off` | Turn off for this session |
| `/steward scope all\|artifacts` | Govern all prose, or written artifacts only |
| `/steward dict on\|off` | Inject the distilled dictionary tier (top 50 substitution pairs) |
| `/steward ban <term>` | Ban a term. Prefix `bare:` to flag only unqualified use |
| `/steward unban <term>` | Remove a banned term |
| `/steward rule <text>` | Add a free-text writing rule |
| `/steward unrule <n>` / `/steward rules` | Remove rule by number / list the register |
| `/steward default <mode>` | Save the startup mode |
| `/steward status` | Show mode, scope, dict, and register counts |

You can also type "stop steward" in chat to turn the mode off.

### Modes

- **lite**: sentence and paragraph caps, active voice, one name for one
  thing, banned filler words. Vocabulary stays open. Use this for READMEs,
  PR descriptions, issues, and docs.
- **strict**: every rule, both length caps (20 words per instruction, 25 per
  descriptive sentence), imperative steps. Use this for runbooks, release
  notes, error messages, and safety text.

### User register

Your own rules live in `~/.pi/agent/steward.json` and ride along in the
injected block. Two shapes:

- **Banned terms** (`/steward ban <term>`): flat bans, checked by the linter.
  The `bare:` prefix flags a term only when it has no qualifier. The default
  register ships with `bare:key`: bare "key" is overloaded across API keys,
  signing keys, cache keys, session keys, and JWT material, and the STE spec
  itself never uses it unqualified. "Rotate the key" gets flagged; "rotate
  the signing key" passes.
- **Free-text rules** (`/steward rule <text>`): edicts a term list cannot
  express, injected verbatim. Tell the agent "no em-dashes anywhere" and it
  adds the rule for you.

### Dictionary tier

`/steward dict on` appends 50 substitution pairs (`utilize > use`,
`verify > make sure`, `should > must`...) distilled from the 1274
non-approved dictionary entries in the spec. The distillation was ranked
against 240k words of real agent session prose, then hand-filtered: STE
pairs that conflict with software terminology (`run > operate`,
`build > assemble`, `call > tell`, `execute > do`) are excluded and
documented as overrides in
[skills/steward/dictionary.json](skills/steward/dictionary.json).

### Scope

- **all** (default): chat replies and written artifacts.
- **artifacts**: only text written into files, commits, PRs, and issues.

The scope choice persists in `~/.pi/agent/steward.json`. The session mode
persists in the session file and survives a restart of that session.

## What the rules do

- One name for one thing. One meaning per word.
- Active voice. Simple tenses. A verb for an action, not a nominalization
  ("analyze the log", not "perform an analysis of the log").
- Maximum 20 words per instruction, 25 per descriptive sentence.
- One topic per paragraph, maximum 6 sentences.
- Condition first, then command: "If the test fails, read the log."
- No semicolons, no em-dashes, no contractions, no Latin abbreviations, no
  marketing adjectives, no empty intensifiers.
- If a pronoun can point at two nouns, repeat the noun.

The full digest with rule numbers is in
[skills/steward/rules-reference.md](skills/steward/rules-reference.md).

## Token cost

The injected block costs approximately 310 tokens (lite) or 450 tokens
(strict) per request, plus about 300 tokens with the dictionary tier on and
a few tokens per register entry. The block sits at the end of the system prompt and is
stable within a session, so prompt caching absorbs most of the cost after the
first request. STE output is also shorter than baseline output, which returns
some of the cost as output-token savings.

## Linter

```bash
python3 skills/steward/ste-lint.py your-draft.md
```

The score is violations per 100 words. Lower is cleaner. Lint a draft, apply
the rules, lint again: the delta is the signal. The linter checks the
mechanical subset of STE. It is not a certified STE checker.

## Limits

These rules fix the form of bad prose, not the substance. They cannot make a
hollow paragraph true. Code, identifiers, CLI syntax, and quoted text are
never rewritten.

## Credits

- [ASD-STE100](https://asd-ste100.org): the standard, free from ASD. This
  package distills the rules and does not reproduce the specification or its
  dictionary.
- [woosal1337/blog ep01](https://github.com/woosal1337/blog/tree/master/videos/ep01-the-cure-for-ai-slop):
  the original skill distillation, the linter, and the cross-model benchmark.
- [ponytail](https://github.com/DietrichGebert/ponytail): the extension
  pattern for mode toggles.

## License

MIT
