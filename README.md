# steward

<p>
  <img src="https://img.shields.io/github/v/tag/37/steward?style=flat-square&color=1a2b4a&label=release" alt="Release">
  <img src="https://img.shields.io/badge/works%20with-pi%20%C2%B7%20Claude%20Code%20%C2%B7%20Codex-1a2b4a?style=flat-square" alt="Works with 3 agents">
  <img src="https://img.shields.io/badge/license-MIT-1a2b4a?style=flat-square" alt="MIT license">
</p>

steward gives AI coding assistants a writing system for clear technical prose.
It controls report substance, sentence form, and an optional human voice
profile. Its form rules come from [ASD-STE100 Simplified Technical
English](https://asd-ste100.org), a standard built in 1986 so that aircraft
mechanics anywhere in the world could not misread a maintenance manual.

## A better writing system for technical tasks

Durable reports put the decision first, verify material claims, rank options,
and state unknowns. The reader's decision sets the reading budget.

The form layer then applies these rules:

- One name for one thing. One meaning per word. Do not call the same thing
  "config", "settings", and "preferences": pick one name and keep it.
- Registers hundreds of controlled words with one allowed meaning and a
  pattern of use. "To fall" means "to move down by the force of gravity",
  not "to decrease". "May" grants permission; "can" states ability.
- Verbs are used for actions: "review the logs", not "perform a review of the logs".
- Instructions: maximum 20 words each, one instruction per sentence.
- One topic per paragraph, maximum 6 sentences.
- Condition first, then command: "If the test fails, review the log."
- No semicolons, em-dashes, contractions, Latin abbreviations, marketing
  adjectives, or empty intensifiers.
- If a pronoun can point at two nouns, repeat the noun. "If you engage the
  pins incorrectly with the seats, they can become damaged." Which gets
  damaged? Write "the pins can become damaged".

Full digest: [skills/steward/rules-reference.md](skills/steward/rules-reference.md).
Check any draft: `python3 skills/steward/ste-lint.py your-draft.md`.

## Make it yours

- **Ban a term**: `/steward ban synergy`. The `bare:` prefix bans a word
  only when it stands alone; the default register ships with `bare:key`,
  so "rotate the key" gets flagged and "rotate the signing key" passes.
- **Add a rule in plain words**: `/steward rule No exclamation marks in
  headings.` Or just tell the assistant "no em-dashes ever".
- **Dictionary**: `/steward dict on` adds 50 word substitutions
  (`utilize` > `use`) filtered so software terms survive: the standard
  would replace "run the tests" with "operate the tests"; steward knows
  better.
- **Voice profile**: `/steward profile voice` adds optional anti-slop checks
  for selected human-facing prose. `/steward profile plain` returns to precise
  technical prose.

## Install

**pi**

```bash
pi install git:github.com/37/steward
```

**Claude Code** (two prompts in any session, then restart):

```
/plugin marketplace add 37/steward
/plugin install steward@steward
```

The doubled name is normal: it reads plugin@marketplace, and the bundled
skill appears as `steward:steward`.

**Codex**

```bash
codex plugin marketplace add 37/steward
codex plugin add steward@steward
```

Uninstall through the same plugin manager, or `pi remove
git:github.com/37/steward`.

## Use

```
/steward strict     step-by-step material: runbooks, release notes, errors
/steward lite       everyday prose: docs, PRs, issues (the default)
/steward off        back to the assistant's normal voice
/steward profile voice|plain
```

Or type "stop steward" in chat. Also available: `/steward status`,
`scope all|artifacts`, `dict on|off`, and `default <mode>`.

Check form with `ste-lint.py`. Check durable reports with
`writing-lint.py --report --max-words <budget>`. Add `--voice` for the optional
voice checks. The report linter classifies visible writing contracts. It cannot
verify whether a claim is true without source evidence.

## Examples

The same deploy error, rewritten by steward. The content is held fixed, so form
is the only thing that changes. Two separate drafts cannot show this, because
two drafts carry different content, and the shorter draft then looks better for
the wrong reason.

| **before** (65 words, 4.62 faults/100w) | **after `/steward strict`** (66 words, 3.03) |
|---|---|
| Nothing was deployed, and no changes were made to the servers.<br><br>Remedies:<br>1. Rebuild the artifact.<br>2. Clear the local artifact cache and pull it again.<br>3. Republish the registry entry if it is stale.<br><br>If the mismatch persists after a clean rebuild, treat the artifact as potentially tampered with. Do not deploy it; contact the registry administrator. | Nothing was deployed. No changes were made to the servers.<br><br>Remedies:<br>1. Rebuild the artifact.<br>2. Clear the local artifact cache.<br>3. Pull the artifact again.<br>4. Republish the registry entry if the entry is stale.<br><br>If the mismatch persists after a clean rebuild, treat the artifact as potentially tampered with. Do not deploy it. Contact the registry administrator. |

One instruction per step, so remedy 2 becomes two steps. No semicolons, so the
last line becomes two sentences. Every fact survives, including the tamper
warning. The word count does not fall.

That last point is the honest one. The measured benchmark covers the STE form
layer. It does not measure the new report substance or voice layers. Across 11
measured scenarios the word count moved between -36% and +16%, and it rose in
4 of them. Where output does get shorter, the model wrote less, and did not
write tighter.

All scores, all 11 scenarios, and the raw outputs:
[docs/examples.md](docs/examples.md).

Use steward if your assistant writes things people read: docs, READMEs, PR
descriptions, issues, release notes, error messages. The cost is about 490
(lite) to 570 (strict) prompt tokens per request, mostly absorbed by caching.
The measured limit still applies: the benchmark proves form changes and supplied
fact retention. It does not prove claim truth, decision quality, or voice
quality. The new deterministic report linter checks whether a draft labels
claims and exposes unknowns. Source-backed review must still verify truth.

## Credits

- [ASD-STE100](https://asd-ste100.org): the standard, free from ASD. This
  package distills it and does not reproduce the specification.
- [woosal1337/blog ep01](https://github.com/woosal1337/blog/tree/master/videos/ep01-the-cure-for-ai-slop):
  the original distillation, linter, and cross-model benchmark.
- [ponytail](https://github.com/DietrichGebert/ponytail): the extension
  pattern for mode toggles.
- pstack `unslop`, copyright 2026 Lauren Tan, MIT License: selected optional
  voice checks. Steward does not adopt its always-on or forced-opinion rules.

MIT license.
