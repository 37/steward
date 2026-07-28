# Writing-system notes: from form rules to substance rules

Source: "Breaking signals, breaking systems" (guille.site/posts/breaking-signals/, 2026-03-19).
Status: design notes for the steward "writing system" extension. Not shipped.

## The argument in the post

1. Writing was proof of work. To produce text cost at least as much as to read
   it. Received text signaled a minimum of thought.
2. Style correlated with thought. Clean, legible prose signaled that the idea
   was important and considered.
3. LLMs broke the correlation. Stylistically decent no longer means useful.
   The cost to verify text now exceeds the cost to produce it. The post calls
   this a denial-of-service on the reader.
4. Worst case: "browse this long list and tell me if any of it makes sense."
   The writer offloads the verification cost to the reader.
5. Hand-written text carries implicit signals: where the writer spent effort,
   which parts are clear, which parts are open. When these signals disappear,
   the exchange needs more back-and-forth, not less.

## Drafting rules for a less-technical third-party stakeholder

Derived from the post. These are substance rules. Steward today only has form
rules (STE).

- **R1 — Writer pays the verification cost.** Do not send text the reader must
  audit. Verify each claim before you send it.
- **R2 — Reading budget.** The decision the reader must make sets the length.
  Available material does not set the length.
- **R3 — No unranked lists.** Each option carries the writer's judgment: a
  recommendation, a rank, or a cut. Never "here are 12 options, you pick."
- **R4 — Make effort signals explicit.** State confidence, open questions, and
  what you did not check. These replace the implicit signals of hand-written
  text.
- **R5 — Front-load the ask.** Conclusion and requested action come first. Try
  to end the exchange in one message: answer the reader's likely questions in
  the draft.
- **R6 — Legible to the recipient.** Define terms for the audience. No insider
  jargon. (STE covers part of this: one name for one thing.)
- **R7 — Polish is not a signal.** Do not add style to hide thin substance.
  The metric is useful content per token, not tone.

## Extension points for steward

Steward README states the current limit: "steward fixes the form of writing,
not the substance." The post supplies the missing half. Form rules cap the
reading cost. Substance rules cap the verification cost.

### 1. Output-specific profiles

One profile per artifact type: stakeholder update, PR description, incident
note, release notes, email, error message. Each profile sets:

- required lead (the decision or ask, first sentence)
- length budget tied to the reader's role
- list policy: ranked and recommended only (R3)
- a "confidence and unknowns" section (R4)

### 2. User Q&A clarifying flow

Before the agent drafts third-party output, steward instructs it to ask the
user:

1. Who reads this, and what do they already know?
2. What decision or action must follow from it?
3. Which claims are confirmed, and which are speculation?
4. Any hard length or tone constraints?

This restores the "think before you write" step that LLM output skips. The
Q&A is the proof-of-work substitute.

### 3. Lint additions (beyond ste-lint.py)

- unranked-list detector: list with 3+ items and no recommendation
- missing-ask detector: no explicit action or decision in the first paragraph
- unknowns detector: draft for a third party with no stated confidence or
  open questions
- budget check: length against the profile's reading budget

### 4. Anti-slop rule

Never forward raw model output to a third party. The flow prompts the user:
"Which of these claims did you verify?" Unverified claims move to the
open-questions section or get cut.
