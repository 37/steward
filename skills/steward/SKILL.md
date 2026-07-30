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

Applies to: text the reader keeps. Docs, READMEs, PR descriptions, commit
message bodies, Linear issues/comments/status updates, rpiv artifacts
(research/design/plan/review/handoff), release notes, error messages, code
comments.

Does not apply to: code, identifiers, CLI syntax, quoted text, chat replies
(caveman mode governs those), marketing copy, or anything that needs a voice.

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

Write only the requested text. No preamble, no summary, no closing remarks.

## Modes

- **strict**: procedures, runbooks, error messages, safety text, anything a
  reader executes under stress: every rule, both length caps, imperative
  steps.
- **lite** (default): READMEs, PR descriptions, Linear issues, rpiv
  artifacts, handoffs: sentence/paragraph caps, active voice, one-name-one-
  thing, banned-word discipline. Vocabulary stays open; do not force the
  875-word dictionary onto general prose.

User register: `~/.pi/agent/steward.json` carries `banned` (terms; `bare:`
prefix = flag only unqualified use) and `rules` (free-text edicts). When a
user asks for a writing rule ("no em-dashes"), add it with `/steward rule`
or `/steward ban` instead of editing this skill.

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

## Self-lint (run before returning text)

1. Sentence over 20 words (instruction) or 25 (descriptive)? Split it.
2. Semicolon, em-dash, or en-dash? Replace with period, comma, or colon.
3. Contraction? Expand it.
4. Passive voice with a known actor? Make it active.
5. "-ing" main verb, nominalization, or phrasal verb? Plain verb.
6. Same thing named two ways? Pick one name.
7. Pronoun that can point at two nouns? Repeat the noun.
8. Marketing adjective or empty intensifier? Delete it.

Mechanical check: `python3 ste-lint.py draft.md` (in this skill directory).
Score is violations per 100 words; lower is cleaner. Use the before/after
delta as the signal, not the absolute number.

## Limits

The linter and these rules fix the FORM of slop. They cannot make a hollow
paragraph true. Full STE conformance also needs human judgment (correct
technical noun choice, "makes good sense" tests); do not claim certified STE.

Provenance: distilled from ASD-STE100 Issue 9 (asd-ste100.org, free spec) and
the woosal1337/blog ep01 experiment (skill + linter + cross-model benchmark).
Do not paste the spec into output; it is copyrighted.
