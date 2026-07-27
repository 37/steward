# steward

<p>
  <img src="https://img.shields.io/github/v/tag/37/steward?style=flat-square&color=1a2b4a&label=release" alt="Release">
  <img src="https://img.shields.io/badge/works%20with-pi%20%C2%B7%20Claude%20Code%20%C2%B7%20Codex-1a2b4a?style=flat-square" alt="Works with 3 agents">
  <img src="https://img.shields.io/badge/license-MIT-1a2b4a?style=flat-square" alt="MIT license">
</p>

steward makes your AI coding assistant write clear, short prose instead of
bloated "AI slop". The rules come from [ASD-STE100 Simplified Technical
English](https://asd-ste100.org), a standard built in 1986 so that aircraft
mechanics anywhere in the world could not misread a maintenance manual.
Each word gets one meaning. Each sentence gets one job.

## The rules, in short

- One name for one thing. One meaning per word.
- Active voice. A verb for an action: "analyze the log", not "perform an
  analysis of the log".
- Instructions: maximum 20 words each, one instruction per sentence.
- One topic per paragraph, maximum 6 sentences.
- Condition first, then command: "If the test fails, read the log."
- No semicolons, em-dashes, contractions, Latin abbreviations, marketing
  adjectives, or empty intensifiers.
- If a pronoun can point at two nouns, repeat the noun.

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
```

Or type "stop steward" in chat. Also available: `/steward status`,
`scope all|artifacts`, `dict on|off`, and `default <mode>`.

## Examples

The same request ("write the error message for a failed deploy"), same AI.
The "what you can do" steps, side by side:

| **steward off** (127 words total) | **steward strict** (79 words total) |
|---|---|
| 1. Rebuild and republish the artifact, then retry the deploy.<br>2. Verify you are deploying the intended version/tag — a stale local cache can serve an old artifact. Clear the cache and pull again.<br>3. If the registry entry is outdated, update it with the new checksum and retry.<br>4. If none of the above applies, the artifact may have been tampered with. Do not deploy it — contact your registry administrator. | 1. Run the build again to make a clean artifact.<br>2. Compare the new checksum with the registry checksum.<br>3. If the registry entry is old, publish the artifact again.<br>4. If the problem continues, contact the registry administrator. |

More examples with scores: [docs/examples.md](docs/examples.md).

Use steward if your assistant writes things people read: docs, READMEs, PR
descriptions, issues, release notes, error messages. The cost is a few
hundred prompt tokens per request, mostly absorbed by caching. The honest
limit: steward fixes the form of writing, not the substance.

## Credits

- [ASD-STE100](https://asd-ste100.org): the standard, free from ASD. This
  package distills it and does not reproduce the specification.
- [woosal1337/blog ep01](https://github.com/woosal1337/blog/tree/master/videos/ep01-the-cure-for-ai-slop):
  the original distillation, linter, and cross-model benchmark.
- [ponytail](https://github.com/DietrichGebert/ponytail): the extension
  pattern for mode toggles.

MIT license.
