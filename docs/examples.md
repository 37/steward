# Measured examples

Every number here comes from `tests/bench/`. The runner, the scenarios, the
scorer, and all 102 raw outputs are in the repository, so any row can be
checked or repeated.

Method: 11 scenarios, 3 conditions (off, lite, strict), 3 runs per cell, so 99
generations. Each run uses `pi -p --no-session --no-tools` in a scratch agent
directory with no extensions, so the injected rule block is the only variable.
The score is `ste-lint.py` faults per 100 words. Lower is cleaner.

Every scenario prompt supplies the facts the output must carry. A checklist of
those facts is scored against each output, and the fraction found is the
substance score. A treated run passes the parity gate only when its substance
score is not below the baseline. Without this gate, a shorter output looks like
better writing when it is really less content.

Run date 2026-07-28, model `openai-codex/gpt-5.6-luna`, dictionary tier off.

## Results

| Scenario | off | lite | strict | words off -> strict | substance |
|---|---|---|---|---|---|
| S1 tracker issue | 2.80 | 0.00 | 0.00 | 133 -> 85 (-36%) | 1.00 |
| S2 deploy error message | 3.17 | 1.45 | 1.37 | 63 -> 73 (+16%) | 1.00 |
| S3 pull-request description | 1.92 | 0.00 | 0.00 | 52 -> 55 (+6%) | 1.00 |
| S4 upstream-PR notes | 2.20 | 1.27 | 1.30 | 83 -> 77 (-7%) | 0.83 |
| S5 runbook procedure | 0.00 | 0.00 | 0.00 | 78 -> 66 (-15%) | 1.00 |
| S6 release notes | 0.00 | 0.00 | 0.00 | 41 -> 47 (+15%) | 1.00 |
| S7 stakeholder update | 1.89 | 2.08 | 2.17 | 53 -> 44 (-17%) | 1.00 |
| S8 code-heavy control | 9.09 | 0.00 | 0.00 | 22 -> 15 (-32%) | 1.00 |
| S9 terse-prompt control | 0.00 | 0.00 | 0.00 | 14 -> 15 (+7%) | 1.00 |
| S10 quoting control | 5.41 | 0.00 | 0.00 | 43 -> 34 (-21%) | 1.00 |
| S11 auth-provider comparison | 2.94 | 0.93 | 0.89 | 263 -> 219 (-17%) | 1.00 |

Faults and words are medians of 3 runs. Substance is the lowest score of any
single run in the row, so 1.00 means no run lost a fact. The substance column
for S4 shows 0.83 because one lite run dropped the compatibility note.

All 22 treated cells passed the parity gate. Median faults: off 2.20, lite
0.00, strict 0.00.

## What the table does and does not show

Form improves in 7 scenarios. It is unchanged in 3, and each of those already
scores 0.00 in every condition, so there was nothing to improve. It gets worse
in 1: S7, the stakeholder update, moves from 1.89 to 2.17. Three runs is not
enough to call that a result, but it is the only scenario that moves the wrong
way, so it is worth watching.

Length is not the benefit. Strict produced more words in 4 of the 11 scenarios.
The median change is -15.4%, and the range runs from -36.1% to +15.9%.

## Does steward cut words, or cut content?

Generating twice and comparing the two outputs cannot answer this, because the
two runs write different content. So the benchmark also holds the content
fixed: take a baseline output, give it back with the strict block, and ask for
a rewrite.

| S2 deploy message, content held fixed | source | strict rewrite |
|---|---|---|
| faults per 100 words | 4.62 | 3.03 |
| words | 65 | 66 |
| substance | - | 1.00 |

The form improves by 34%. The length does not change. The word reductions in
the table above therefore come from generating less content, not from writing
the same content more tightly.

The other half of this result matters just as much. When the prompt supplies
the facts, strict keeps all of them: substance was 1.00 in every cell, and that
includes the tamper warning and the "do not deploy" instruction in S2. Content
that disappears between two independent runs was never in the prompt. One run
invented it and the other did not.

## When steward adds nothing

Prompted with "summarise the changes as short and simple as possible" (S9), all
three conditions scored 0.00 in all runs. If your prompt already demands terse
writing, steward has little to add. Its value concentrates where prose has room
to sprawl: descriptions, docs, filings, notes.

## Cost

The injected block measures about 488 tokens in lite and 570 in strict, with
the dictionary tier off. With `dict on` it measures about 786 and 869. Most of
this is absorbed by prompt caching.

## What changed from the earlier version of this page

The earlier page reported 4 prompts, one run per condition, and no substance
measurement. Three of its statements did not survive the rebuilt benchmark:

1. "38% fewer words with the same information." Neither half holds. Substance
   was never measured, and the two outputs in that pair carry different
   content: the strict one has no tamper warning, no cache remedy, and no
   statement that the deploy was aborted. Word change is also not a stable
   -38%. It ranges from -36% to +16% across scenarios, and it is +2% when the
   content is held fixed.
2. "Treated runs repeat almost exactly, baselines vary a lot between runs."
   Baselines do vary widely, from 0.00 to 4.62 in S2. Treated runs also vary,
   from 0.00 to 12.50 in S8. "Repeat almost exactly" is wrong.
3. "Roughly 420 (lite) to 500 (strict) prompt tokens." Both figures were low.
   See the measured numbers above.

The earlier score table is also not comparable to this one. It used a different
model, prompts that supplied no facts, and a linter that counted violations
inside quoted text. Those runs cannot be recalculated, because only excerpts of
them were kept. Every output behind the table above is in `tests/bench/runs/`.

---

Method detail, scenario prompts, fact checklists, and the full claim audit are
in [../tests/bench/RESULTS.md](../tests/bench/RESULTS.md). Reproduce with
`tests/bench/run-bench.sh` then `tests/bench/score.py`.
