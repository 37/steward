# Benchmark results and claim validation

Run date: 2026-07-28. Model: `openai-codex/gpt-5.6-luna`. steward at commit
`cca3ccb`, dictionary tier off (shipped default).

Scores were recalculated after the quoted-text fix in `ste-lint.py`. Only S10
moved, because it is the only scenario whose prompt requires a verbatim quote.

Protocol P1: 11 scenarios x {off, lite, strict} x 3 runs = 99 generations.
Protocol P2: 3 rewrite runs (S2 source text, strict block, content held fixed).
Harness: `run-bench.sh`, scored by `score.py`. Raw outputs in `runs/`.

Isolation: each run uses a scratch `PI_CODING_AGENT_DIR` with no extensions and
`--no-tools`. Without `--no-tools` the agent writes a file and replies with a
one-line report, so the prose under test never reaches the transcript. The first
matrix was discarded for this reason. One run also filed a live GitHub issue
before the flag was added.

## Results

| Scenario | off | lite | strict | words off -> strict | parity |
|---|---|---|---|---|---|
| S1 tracker issue | 2.80 | 0.00 | 0.00 | 133 -> 85 (-36%) | OK |
| S2 deploy error | 3.17 | 1.45 | 1.37 | 63 -> 73 (+16%) | OK |
| S3 PR description | 1.92 | 0.00 | 0.00 | 52 -> 55 (+6%) | OK |
| S4 upstream-PR notes | 2.20 | 1.27 | 1.30 | 83 -> 77 (-7%) | OK |
| S5 runbook | 0.00 | 0.00 | 0.00 | 78 -> 66 (-15%) | OK |
| S6 release notes | 0.00 | 0.00 | 0.00 | 41 -> 47 (+15%) | OK |
| S7 stakeholder update | 1.89 | 2.08 | 2.17 | 53 -> 44 (-17%) | OK |
| S8 code control | 9.09 | 0.00 | 0.00 | 22 -> 15 (-32%) | OK |
| S9 terse control | 0.00 | 0.00 | 0.00 | 14 -> 15 (+7%) | OK |
| S10 quoting control | 5.41 | 0.00 | 0.00 | 43 -> 34 (-21%) | OK |
| S11 auth comparison | 2.94 | 0.93 | 0.89 | 263 -> 219 (-17%) | OK |
| S2R rewrite (P2) | 4.62 (source) | - | 3.03 | 65 -> 66 (+2%) | OK |

Scores are median faults/100w over 3 runs. Parity = median substance coverage of
the treated condition is not below the baseline. Coverage was 1.00 in every cell.

Form, off against strict: better in 7 scenarios, equal in 3 (all of which score
0.00 in every condition, so there is nothing to improve), worse in 1 (S7).
Words: median -15.4%, range -36.1% to +15.9%.

## Claim validation

| # | Claim | Source | Verdict |
|---|---|---|---|
| 1 | README example: off 127 words vs strict 79 words, shown as the same instructions | README | **Fails.** Independent generations. The strict output drops the tamper warning, the do-not-deploy directive, the cache remedy, and the abort assurance. |
| 2 | "38% fewer words with the same information" | examples.md | **Fails, both halves.** Parity was never measured. Word change across 11 scenarios ran from -36.1% to +15.9%, median -15.4%, and strict produced more words in 4 scenarios. Under fixed content (P2) words did not fall: 65 -> 66. |
| 3 | Score table: off 5.66 / 9.45 / 5.16 / 5.85 -> strict about 0 | examples.md | **Direction holds, magnitude unreproduced.** Baselines here are about half as bad (2.80 / 3.17 / 1.92 / 2.20). Different model and fact-supplied prompts, so the numbers are not comparable. |
| 4 | "Treated runs repeat almost exactly, baselines vary a lot" | examples.md | **Partly holds.** Baselines vary widely (S2 0.00-4.62, S8 9.09-14.29). Treated runs also vary (S4 strict 0.00-3.61, S8 strict 0.00-12.50). "Repeat almost exactly" is false. |
| 5 | "Roughly 420 (lite) to 500 (strict) prompt tokens" | examples.md | **Understates.** Measured about 488 (lite) and 570 (strict) with the dictionary off, and 786 / 869 with the dictionary on. |
| 6 | "Upstream-PR notes dropped from 650 words to 358" | examples.md | **Unreproduced.** The equivalent scenario (S4) moved 83 -> 77 words. The original prompt is not recorded, so the run cannot be repeated. |
| 7 | "steward fixes the form of writing, not the substance" | README | **Holds, and is now the best-evidenced claim.** Substance coverage was 1.00 in all 33 P1 cells and in the P2 rewrite. |
| 8 | "When steward adds nothing": terse prompt scores 0.00 in all conditions | examples.md | **Holds.** S9 scored 0.00 in all three conditions, all runs. |
| 9 | pi gradient "6.61 / 1.31 / 0.00" from "the same README prompt" | portability.md | **Unsourced.** No scenario file contains that prompt and no run produced those numbers. |
| 10 | "/steward dict on adds 50 word substitutions" | README | **Holds** after the expansion to 300 pairs. The prompt tier still slices the first 50. |

## The central result

Claims 1, 2, and 7 turn on one question: does steward cut words, or cut content?

P2 answers it. Hold the content fixed, hand steward the baseline text, and ask
for a rewrite:

- faults/100w: 4.62 -> 3.03 (down 34%)
- words: 65 -> 66 (up 1.5%)
- substance coverage: 1.00

The form improves. The length does not change. So the word reduction reported in
the generation protocol comes from generating less content, not from writing the
same content more tightly.

The other half of the picture is equally important, and it corrects the earlier
reading of the README example. When the facts are supplied in the prompt, strict
retains all of them: coverage 1.00 in every cell, including the tamper warning
and the do-not-deploy directive in S2. The content lost in the README example was
never in the prompt. The baseline invented it and the strict run did not. That is
sampling variance between two independent generations, not compression damage.

## Findings the old benchmark could not see

1. **Strict does not always shorten.** It produced more words in 4 of 11
   scenarios (S2 +16%, S6 +15%, S9 +7%, S3 +6%).
2. **One scenario gets worse.** S7, the stakeholder update, scored off 1.89,
   lite 2.08, strict 2.17. This is the only scenario where steward increased the
   fault rate. Three runs, so treat it as a signal to watch, not a result.
3. **ste-lint penalised correct quoting (found here, now fixed).** In S10 every
   flagged item (2 contractions, 1 em-dash) sat inside the error string the
   prompt required to be quoted verbatim. The rules exempt quoted text, but the
   linter scored it, so the correct answer was punished. `strip_exempt` now
   blanks blockquotes and double-quoted spans along with code, and the em-dash
   and paragraph checks read the stripped body instead of the original text.
   `ste-lint.py --selftest` guards the behavior.

   The bug was hiding a clean result. S10 read 10.20 / 7.89 / 6.52 before the
   fix, which looked like steward barely helping on quote-bearing text. It reads
   5.41 / 0.00 / 0.00 after: the residual faults in the treated runs were all
   inside the quote. Word counts also fall, because exempt words are no longer
   counted as scored words.

   This affects history: every score in the earlier `docs/examples.md` was
   produced by the old linter, so any output containing a quote was scored too
   high. Those runs cannot be recalculated, because the raw outputs were never
   stored.

5. **ste-lint scored markdown tables as prose (found here, now fixed).** Each
   table row counted as one over-long sentence, each cell separator counted as
   a prose semicolon, and a table counted as an over-long paragraph. S11 is the
   only scenario whose outputs contain tables, and it read 5.18 / 2.65 / 2.39
   before the fix against 2.94 / 0.93 / 0.89 after. `sentences()` now skips
   table rows and the semicolon check ignores them, while word-level checks
   still read cell text. The same selftest guards it.
4. **The scorer can manufacture findings.** The first checklist used `.` without
   DOTALL, so a fact spanning two steps failed to match once strict split the
   steps onto separate lines. This scored strict as losing substance for
   formatting exactly as intended. Fixed in `score.py` (`FLAGS = re.I | re.S`).

## Method limits

- Single model. The gradient is not verified across models here.
- N=3. Enough to show that variance exists, not enough for confidence intervals.
- ste-lint scores the rules steward injects, so the form gap partly measures
  compliance rather than quality.
- S11 has no supplied facts by design, so its checklist is structural (provider
  coverage and recommendation count). The accuracy of its provider claims is not
  verified.
