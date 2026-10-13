---
name: steward
description: 'Write or rewrite prose in ASD-STE100 Simplified Technical English (Issue 9). Applies to documentation, READMEs, PR descriptions, commit message bodies, Linear issues/comments/status updates, rpiv artifacts, handoffs, release notes, and error messages: never code, identifiers, or command syntax. Use when asked to write or edit any of these surfaces, to make writing clear or plain, to remove AI slop, or when the user invokes "steward", "ste", "STE", or "simplified technical english". Two modes: strict (procedures, runbooks, safety text, error messages) and lite (general prose).'
---

# steward

Write prose in ASD-STE100 Simplified Technical English. STE is a controlled
natural language: 53 writing rules plus a controlled dictionary. It removes
ambiguity by giving each word one meaning and each sentence one job. Measured
effect: 50-74% fewer slop violations across models (see the source experiment
in this directory's provenance note below).

Full rule digest with rule numbers: [rules-reference.md](rules-reference.md).
Load it when a judgment call needs the exact rule or an example.

Ambient layer: the `/steward` extension (`extension/steward.ts` in this
package) injects the core rules per session (modes: flavored, strict, off;
scope: all or artifacts). This skill is the depth layer under it.

## Scope

When scope is `all`, Steward applies to chat and to text the reader keeps.
When scope is `artifacts`, Steward applies only to saved prose: docs, READMEs,
PR descriptions, commit bodies, issues, status updates, rpiv artifacts, release
notes, error messages, and code comments.

Steward never applies to code, identifiers, CLI syntax, quoted text, or text the
user asks the agent to preserve. The plain profile excludes marketing copy and
prose that needs a personal voice.

## Core rules (the working set)

WORDS
- One name for one thing. Never call the same item by two names (1.11); never
  use one word with two meanings (1.3).
- Use the short common word: start (not initiate), use (not utilize/leverage),
  help (not facilitate), make sure (not ensure), before (not prior to), after
  (not subsequent to), about (not regarding), get (not obtain), show (not
  demonstrate), also (not additionally/furthermore/moreover).
- Noun clusters: max 3 words (2.1). Break longer ones with prepositions.
- No marketing adjectives (seamless, robust, powerful, effortless...) and no
  empty intensifiers (genuine, truly, really, "real" as qualifier). State
  claims plainly.
- American spelling (1.14).

VERBS
- Active voice (3.6). "The parser reads the file", not "the file is read".
  Passive allowed in descriptive text only when the agent is unknown.
- Only simple tenses: infinitive, imperative, present, past, future, past
  participle as adjective (3.2). No stacked auxiliaries (3.4).
- Verb for an action, not a nominalization (3.7): "analyze the log", not
  "perform an analysis of the log".
- No "-ing" main verbs (3.5). No phrasal verbs (9.3): "spin up" → "start".

SENTENCES
- Instructions: max 20 words, one instruction per sentence (5.1, 5.2),
  imperative form (5.3). Condition first, then command, split by comma (5.4).
- Descriptive: max 25 words (6.3). Give information gradually (6.1).
- No omitted words or contractions (4.2). Keep articles: a, an, the, this,
  these (4.5). Keep the conjunction "that" after verbs like "make sure",
  "show" (GR-1).
- Kill ambiguous pronouns: if "it/they/this" can point at two nouns, repeat
  the noun (GR-3, GR-4).

STRUCTURE
- One topic per paragraph (6.5), max 6 sentences (6.6).
- Steps: numbered vertical list, one action per item, imperative.
- Notes give information only, never instructions (5.5).
- Warnings/cautions: risk word first, then command, then consequence (7.1-7.3).

PUNCTUATION
- No semicolons (8.1). Write two sentences.
- No em-dashes or en-dashes (user rule, stricter than STE). Use commas,
  colons, or separate sentences.
- No Latin abbreviations: e.g. → "for example", i.e. → "that is", etc. →
  drop it or "and so on" (GR-6).

READER
- Self-contained hand-off (R6). A message that reports status, lists next
  steps, or asks for a decision must make sense to a reader who has not seen
  earlier turns. A compaction summary is not the reader's memory. Spell out
  each step number, question number, option letter, or item code ("step 2",
  "Q11", "D48", "A-O1") in words, or define it in a table in the same message.

Write only the requested text. No preamble, no summary, no closing remarks.

## Durable-report substance

PR descriptions, issues, handoffs, findings, recaps, and stakeholder updates
must reduce the reader's verification work. This layer does not apply to
ordinary chat or agent instructions.

Start with the decision or requested action. Verify each material claim, or
mark the claim as inferred or untested. Let the reader's decision set the
length. Rank options, recommend one, and state unknowns and checks not done.
Move an unverified claim to the open section or cut it.

`writing-lint.py --report` checks the visible contract. The linter checks the
ask, option ranking, claim labels, unknowns, and a supplied reading budget. The
linter cannot verify truth without the source evidence.

## Modes and profiles

Modes control form:

- **strict**: procedures, runbooks, error messages, safety text, anything a
  reader executes under stress: every rule, both length caps, imperative
  steps.
- **lite** (default): READMEs, PR descriptions, Linear issues, rpiv
  artifacts, handoffs: sentence/paragraph caps, active voice, one-name-one-
  thing, banned-word discipline. Vocabulary stays open; do not force the
  875-word dictionary onto general prose.

Profiles control expression:

- **plain** (default): precise technical prose.
- **voice**: selected human-facing prose that needs a personal voice. It removes
  puffery, filler, vague attribution, chatbot praise, and generic conclusions.
  It preserves facts and exact technical nouns. It excludes procedures, error
  messages, agent instructions, and precise technical references.

Use `/steward profile plain|voice`. The voice profile never adds facts,
opinions, or emotion that the author did not supply.

User register: `~/.config/steward/config.json` carries `banned` terms and
free-text `rules`. The `STEWARD_CONFIG` environment variable can select a
different file. The `bare:` prefix flags only unqualified use. When a user asks
for a writing rule, add it with `/steward rule` or `/steward ban` instead of
editing this skill.

Dictionary: [dictionary.json](dictionary.json) holds the distilled STE
substitution pairs (keep) and the SE-conflict overrides (words STE restricts
but software uses precisely: run, build, call, execute, return...). Use it
for lookups; `/steward dict on` injects the top pairs ambiently.

Surface → mode map for this user's workflows:

| Surface | Mode | Notes |
|---|---|---|
| Error messages, runbooks, ops procedures | strict | Reader acts under stress |
| Release notes, changelog entries | strict | One change per line, past tense |
| PR descriptions, commit bodies | lite | What/why first, steps as lists |
| Linear issues, comments, status updates | lite | Condition→action for repro steps (strict) |
| rpiv artifacts, handoffs | lite | Headings carry structure; keep 6.1 gradual-information |
| READMEs, docs | lite | First paragraph: what it is, what it does, in ≤3 sentences |
| Work summaries, findings reports, recaps | active mode + reporting rules | Less-technical reader; see Reporting section |

## Self-lint (run before returning text)

1. Sentence over 20 words (instruction) or 25 (descriptive)? Split it.
2. Semicolon, em-dash, or en-dash? Replace with period, comma, or colon.
3. Contraction? Expand it.
4. Passive voice with a known actor? Make it active.
5. "-ing" main verb, nominalization, or phrasal verb? Plain verb.
6. Same thing named two ways? Pick one name.
7. Pronoun that can point at two nouns? Repeat the noun.
8. Marketing adjective or empty intensifier? Delete it.
9. A step number, question number, option letter, or item code with no
   meaning in this message? Spell it out, or add a table.

Mechanical form check: `python3 ste-lint.py draft.md`.

Durable report check:
`python3 writing-lint.py --report --max-words 400 draft.md`.

Optional voice check: `python3 writing-lint.py --voice draft.md`.

Hand-off check: `python3 writing-lint.py --handoff draft.md` counts
`undefined_reference`: codes such as `step 2`, `Q11`, `D48`, or `A-O1` that
this message does not define.

Use the before and after delta as the signal, not the absolute number.

## Limits

The linter and these rules fix the FORM of slop. They cannot make a hollow
paragraph true. Full STE conformance also needs human judgment (correct
technical noun choice, "makes good sense" tests); do not claim certified STE.

Provenance: distilled from ASD-STE100 Issue 9 (asd-ste100.org, free spec) and
the woosal1337/blog ep01 experiment (skill + linter + cross-model benchmark).
The optional voice profile adapts selected ideas from pstack `unslop`, copyright
2026 Lauren Tan, under the MIT License. Steward excludes its always-on rule,
forced opinions, deliberate mess, and blanket technical-noun bans.
Do not paste the ASD specification into output; it is copyrighted.
