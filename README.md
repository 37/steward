<p align="center">
  <img src="assets/logo.png" width="140" alt="steward">
</p>

<h1 align="center">steward</h1>

<p align="center">
  <img src="https://img.shields.io/github/v/tag/37/steward?style=flat-square&color=1a2b4a&label=release" alt="Release">
  <img src="https://img.shields.io/badge/works%20with-pi%20%C2%B7%20Claude%20Code%20%C2%B7%20Codex-1a2b4a?style=flat-square" alt="Works with 3 agents">
  <img src="https://img.shields.io/badge/license-MIT-1a2b4a?style=flat-square" alt="MIT license">
</p>

<p align="center">
  <strong>6-9 → 0-1 style warnings per 100 words · 12-45% fewer words · same information</strong><br>
  <sub>Measured on real writing tasks, three agents, identical prompts. <a href="docs/examples.md">Full outputs and scores</a>.</sub>
</p>

steward makes your AI coding assistant write clear, short prose instead of
bloated "AI slop". Turn it on, and every README, error message, pull-request
description, and issue comment comes out plain, direct, and unambiguous.

The rules are not new. They come from [ASD-STE100 Simplified Technical
English](https://asd-ste100.org), a writing standard built in 1986 so that
aircraft mechanics anywhere in the world could not misread a maintenance
manual. Each word gets one meaning. Each sentence gets one job. steward
applies that standard to AI output and stands guard over your prose.

## What it does, in one example

The same request ("write the error message for a failed deploy"), same AI.
The "what you can do" steps, side by side:

| **steward off** (127 words total) | **steward strict** (79 words total) |
|---|---|
| 1. Rebuild and republish the artifact, then retry the deploy.<br>2. Verify you are deploying the intended version/tag — a stale local cache can serve an old artifact. Clear the cache and pull again.<br>3. If the registry entry is outdated, update it with the new checksum and retry.<br>4. If none of the above applies, the artifact may have been tampered with. Do not deploy it — contact your registry administrator. | 1. Run the build again to make a clean artifact.<br>2. Compare the new checksum with the registry checksum.<br>3. If the registry entry is old, publish the artifact again.<br>4. If the problem continues, contact the registry administrator. |

One instruction per step on the right. Em-dashes, hedges, and doubled
instructions on the left.

Full outputs and scores are in [docs/examples.md](docs/examples.md): a
pull-request description, an error message, and a tracker issue, all from
real-workflow prompt shapes. The same gradient held inside Claude Code and
Codex ([docs/portability.md](docs/portability.md)).

## Is it worth using?

Use steward if you use an AI assistant to write things people read: docs,
READMEs, PR descriptions, issues, release notes, error messages, runbooks.

The cost is small. The rule sheet adds about 300 to 500 tokens to each
request, most of it absorbed by prompt caching, and the shorter output
returns part of that. The honest limit: steward fixes the form of writing,
not the substance. It cannot make an empty paragraph true.

## Install

steward runs inside your AI coding assistant. Pick yours.

### pi

```bash
pi install git:github.com/37/steward
```

Restart pi or run `/reload`. Done: steward starts in lite mode.

### Claude Code

Two prompts in any session:

```
/plugin marketplace add 37/steward
/plugin install steward@steward
```

Review and trust the two lifecycle hooks when asked, start a new session,
and type `/steward status` to check. Manual alternative (no plugin system):

```bash
git clone https://github.com/37/steward ~/.claude/steward
bash ~/.claude/steward/claude/install.sh
```

Details and validation results: [docs/portability.md](docs/portability.md).

### Codex

```bash
codex plugin marketplace add 37/steward
codex plugin add steward@steward
```

Manual alternative: clone the repo and run
`node steward/codex/steward-codex.cjs lite` (or `strict`). This writes the
rules into `~/.codex/AGENTS.md` and leaves your other content untouched.
Changes apply to the next session. Run the same command with `off` to
remove, `refresh` to update.

All three agents share one config file
(`~/.config/steward/config.json`), so your settings follow you across
agents.

### Uninstall

Plugin installs: remove through the agent's plugin manager. pi:
`pi remove git:github.com/37/steward`. Manual installs:

```bash
node steward/scripts/uninstall.cjs
```

This removes the Claude hooks, the skill link, the mode flag, and the Codex
block. Your config file stays; delete `~/.config/steward/config.json` to
reset everything.

## Daily use

Three commands cover most days:

```
/steward strict     step-by-step material: runbooks, release notes, errors
/steward lite       everyday prose: docs, PRs, issues (the default)
/steward off        back to the assistant's normal voice
```

You can also type "stop steward" in chat. The full command set:

| Command | Effect |
|---|---|
| `/steward` | Turn on (to the saved default), or show the current state |
| `/steward scope all\|artifacts` | Govern all prose, or only text written into files, commits, and PRs |
| `/steward dict on\|off` | Also enforce 50 word substitutions (`utilize` > `use`) |
| `/steward ban <term>` | Ban a term. Prefix `bare:` to allow qualified use |
| `/steward unban <term>` | Remove a banned term |
| `/steward rule <text>` | Add your own writing rule in plain words |
| `/steward unrule <n>` / `/steward rules` | Remove a rule by number / list everything |
| `/steward default <mode>` | Choose the startup mode |
| `/steward status` | Show mode, scope, dictionary, and rule counts |

## Make it yours

Your own rules ride along with the built-in ones and live in
`~/.config/steward/config.json`:

- **Ban a term**: `/steward ban synergy`. The `bare:` prefix bans a word
  only when it stands alone. The default register ships with `bare:key`,
  because bare "key" is ambiguous in software (API key? signing key? cache
  key?). "Rotate the key" gets flagged; "rotate the signing key" passes.
- **Add a rule in plain words**: `/steward rule No exclamation marks in
  headings.` The text goes to the AI verbatim. You can also just tell the
  assistant "no em-dashes ever" and it will add the rule for you.
- **Turn on the dictionary**: `/steward dict on` adds 50 substitution pairs
  distilled from the standard's 1274 discouraged words, filtered against
  240k words of real coding-session prose so that software terms survive:
  the standard would replace "run the tests" with "operate the tests";
  steward knows better. The exclusions are documented in
  [skills/steward/dictionary.json](skills/steward/dictionary.json).

## The rules, in short

- One name for one thing. One meaning per word.
- Active voice. A verb for an action: "analyze the log", not "perform an
  analysis of the log".
- Instructions: maximum 20 words each, one instruction per sentence.
  Descriptions: maximum 25 words per sentence.
- One topic per paragraph, maximum 6 sentences.
- Condition first, then command: "If the test fails, read the log."
- No semicolons, em-dashes, contractions, Latin abbreviations, marketing
  adjectives, or empty intensifiers.
- If a pronoun can point at two nouns, repeat the noun. If "this" points at
  a whole sentence, restate the noun ("this spread", "this check").

The full 53-rule digest:
[skills/steward/rules-reference.md](skills/steward/rules-reference.md).

## How it works

A small extension adds the active mode's rule sheet to the AI's instructions
on every request. A bundled skill carries the depth: the full rule digest,
the dictionary, and a checker script you can run on any draft:

```bash
python3 skills/steward/ste-lint.py your-draft.md
```

The score is style faults per 100 words; lower is cleaner. Check a draft,
apply the rules, check again: the drop is the signal. It covers the
mechanical part of the standard and is not a certified STE checker.

## Credits

- [ASD-STE100](https://asd-ste100.org): the standard, free from ASD. This
  package distills the rules and does not reproduce the specification or
  its dictionary.
- [woosal1337/blog ep01](https://github.com/woosal1337/blog/tree/master/videos/ep01-the-cure-for-ai-slop):
  the original skill distillation, the linter, and the cross-model
  benchmark that measured 50 to 74 percent fewer style faults.
- [ponytail](https://github.com/DietrichGebert/ponytail): the extension
  pattern for mode toggles.

## License

MIT
