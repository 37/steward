# Measured examples

Three realistic writing prompts, each run three times through the same agent
(pi, headless, same model, same environment): steward **off**, **lite**, and
**strict**. The outputs below are the actual responses, unedited. Scores come
from `ste-lint.py` (violations per 100 words, lower is cleaner).

## Scores

| Prompt | off | lite | strict |
|---|---|---|---|
| README introduction | 6.61 (4 em-dashes) | 1.31 | **0.00** |
| Deploy error message | 9.45 (2 em-dashes) | 0.90 | **0.00** |
| PR description | 0.00 | 0.00 | 0.00 |
| Words (README) | 227 | 153 | 170 |
| Words (error) | 127 | 111 | 79 |

Two honest caveats. First, these are single runs, not averages. Second, the
test environment already carries other anti-slop instructions (a terse chat
mode and user style memory). The PR-description baseline scored 0.00 because
of that discipline: steward's measurable delta is largest where the baseline
style has room to sprawl, and the structural differences in the PR example
below still show what steward changes.

A later rerun of the full matrix (after an internal refactor) confirmed the
variance shape: the treated runs held their scores (three exact 0.00
repeats; lite within 0.05), while the baselines swung by 4 to 6 points in
both directions. The 0.00 PR baseline above was partly a lucky draw; the
rerun baseline produced three em-dashes and 4.00 on the same prompt. Read
the steward columns as a stable floor and the off column as one sample from
a wide distribution. The rerun also exposed a linter false positive:
vertical-list steps counted as one long paragraph. STE rule 4.3 prescribes
vertical lists, so the linter now excludes list items from the
paragraph-length check.

## Token cost (measured from the injected block)

| Configuration | Injected tokens (approx.) |
|---|---|
| off | 0 |
| lite | 424 |
| strict | 497 |
| lite + dictionary tier | 701 |
| strict + dictionary tier | 774 |
| each register entry | +5 to +15 |

The block sits at the end of the system prompt and is stable within a
session, so prompt caching absorbs most of the cost after the first request.
Shorter outputs return part of the cost: the error message dropped from 127
words (off) to 79 (strict).

---

## Prompt 1: README introduction

> Write the README introduction for "relay", a CLI tool that records
> production HTTP traffic and replays it against a staging environment for
> regression testing. Three paragraphs maximum.

### off (6.61 violations/100w, 227 words)

> Relay records live HTTP traffic from your production environment and
> replays it against staging, turning real user behavior into a regression
> test suite. Instead of hand-writing test cases that guess at how your API
> is used, relay captures actual requests — headers, bodies, query
> parameters, and timing — and stores them as portable, replayable sessions.
> When you're ready to validate a change, point relay at your staging
> environment and it re-issues the recorded traffic, comparing responses
> against what production originally returned.
>
> Recording is designed to be safe and low-friction: relay runs as a sidecar
> proxy or taps into existing access logs, samples traffic at a configurable
> rate, and scrubs sensitive fields (auth tokens, PII, cookies) before
> anything is written to disk. Replay is equally controlled — you can
> throttle request rates, filter by endpoint or status code, rewrite hosts
> and headers on the fly, and mark endpoints with side effects as excluded
> or mocked so replays never mutate real data.
>
> The diff engine is where regressions surface. Relay compares status codes,
> headers, and response bodies between the recorded production responses and
> the staging replays, with tolerance rules for fields that legitimately
> change (timestamps, request IDs, generated UUIDs). The output is a summary
> of exact matches, acceptable drift, and true divergences — exportable as
> JSON or JUnit XML for CI integration, so a behavioral regression fails
> your pipeline before it ships.

Four em-dashes, 40-word sentences, "designed to be", "on the fly",
"low-friction".

### lite (1.31 violations/100w, 153 words)

> relay is a command-line tool that records HTTP traffic in production and
> replays it against a staging environment. Use it to test a new build
> against real traffic before you deploy. Synthetic tests cover the cases
> that you predict. Recorded traffic covers the cases that your users
> create.
>
> relay has two core commands. `relay record` captures requests and
> responses from live traffic and writes them to a portable archive.
> `relay replay` sends the recorded requests to a staging target, compares
> each response with the recorded response, and writes a diff report. Match
> rules let you ignore expected differences, such as timestamps and request
> IDs, so the report stays free of noise.
>
> Run relay in CI, and each deploy gets a regression check against real
> production behavior. If the report is clean, ship. If it is not, the
> report shows the exact request, the recorded response, and the changed
> response, so you can find the cause fast.

### strict (0.00 violations/100w, 170 words)

> Relay is a command line tool for regression tests with production traffic.
> It records HTTP requests from your production environment. It then replays
> the same requests against a staging environment. You compare the responses
> to find regressions before a release.
>
> Use `relay record` to capture traffic from a proxy, a load balancer log,
> or a HAR file. Relay stores each request and its response in a capture
> file. When you are ready to test, run `relay replay` against your staging
> environment. Relay sends the recorded requests and compares each staging
> response with the recorded production response. The report shows
> differences in status codes, headers, and bodies.
>
> Tests that you write by hand cover the cases that you predict. Production
> traffic contains the cases that you do not predict: strange encodings,
> legacy clients, unusual parameter combinations. Relay converts that
> traffic into a repeatable regression suite. Filters remove sensitive data,
> such as tokens and personal information, before relay stores the capture
> file. Use relay in CI to test each release candidate against recent
> production traffic.

---

## Prompt 2: Deploy error message

> Write the error message a user sees when a deploy fails because the built
> artifact checksum does not match the checksum in the registry. Include
> what the user can do next.

### off (9.45 violations/100w, 127 words)

> Deploy failed: artifact checksum mismatch.
>
> The checksum of the built artifact does not match the checksum recorded in
> the registry.
>
>     expected (registry): sha256:<registry-checksum>
>     actual   (artifact): sha256:<artifact-checksum>
>
> This usually means the artifact was modified after it was published, the
> build is not reproducible, or the registry entry is stale.
>
> What you can do:
>   1. Rebuild and republish the artifact, then retry the deploy.
>   2. Verify you are deploying the intended version/tag — a stale local
>      cache can serve an old artifact. Clear the cache and pull again.
>   3. If the registry entry is outdated, update it with the new checksum
>      and retry.
>   4. If none of the above applies, the artifact may have been tampered
>      with. Do not deploy it — contact your registry administrator.
>
> The deploy was aborted; nothing was changed.

Em-dashes inside numbered steps, two instructions per step, a semicolon in
the closing line.

### strict (0.00 violations/100w, 79 words)

> Deploy failed: artifact checksum mismatch.
>
> The checksum of the built artifact does not match the checksum in the
> registry.
>
>     Expected (registry): <registry-checksum>
>     Found (built):       <artifact-checksum>
>
> Possible causes: the artifact changed after the build, or the registry has
> an old entry.
>
> What you can do:
>   1. Run the build again to make a clean artifact.
>   2. Compare the new checksum with the registry checksum.
>   3. If the registry entry is old, publish the artifact again.
>   4. If the problem continues, contact the registry administrator.

One instruction per step. Condition first, then command. 38% fewer words
with the same information structure.

---

## Prompt 3: PR description (disciplined baseline)

> Write a pull request description. The change: retry logic was duplicated
> at every API call site; this PR moves it into one shared fetch wrapper
> with exponential backoff and jitter, simplifies 14 call sites, and adds
> tests for timeout, 429, and connection-reset paths.

All three runs scored 0.00 because the baseline environment already writes
tersely. The structural change still shows. The baseline buries the risk
note in "Notes for reviewers" prose. The strict version ends with one
reviewer instruction:

### off (excerpt)

> ### Notes for reviewers
> Call-site diffs are mechanical (inline loop → wrapper call). The
> interesting review surface is the wrapper itself and its tests.

### strict (excerpt)

> ## Reviewer note
>
> All 14 call sites now share one retry policy. Flag any call site that must
> keep special retry behavior.

The strict version tells the reviewer what to do. The baseline tells the
reviewer what is interesting.

---

Method: prompts in `tests/` territory are not used; each run was
`pi -p --no-session "<prompt>"` with `~/.pi/agent/steward.json` set to the
condition's mode before the run. Lint: `python3 skills/steward/ste-lint.py
<file>`. Reproduce with any agent that loads the extension.
