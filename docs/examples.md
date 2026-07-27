# Measured examples

Realistic writing prompts, each run three times through the same agent (pi,
headless, same model, same environment): steward **off**, **lite**, and
**strict**. The prompt shapes come from real coding-session history (the
tasks people actually give an agent), with specifics generalized. The
outputs below are the actual responses, unedited. Scores come from
`ste-lint.py` (style warnings per 100 words, lower is cleaner).

## Scores

Style warnings per 100 words (word counts sit with each prompt below):

| Prompt | off | lite | strict |
|---|---|---|---|
| Tracker issue filing | 5.66 | **0.00** | 0.00 |
| Deploy error message | 9.45 (2 em-dashes) | 0.90 | **0.00** |
| Pull-request description | 5.16 | 0.00 | **0.00** |
| Long-form upstream-PR notes | 5.85 | 0.23 | 0.28 |

Two honest caveats. First, these are single runs, not averages. Second, the
test environment already carries other anti-slop instructions (a terse chat
mode and user style memory). The "short and simple" summary case at the end shows the
same discipline: when the prompt already demands terse writing, steward
adds nothing. Its delta is largest where the baseline has room to sprawl.

A later rerun of the full matrix (after an internal refactor) confirmed the
variance shape: the treated runs held their scores (three exact 0.00
repeats; lite within 0.05), while the baselines swung by 4 to 6 points in
both directions. Read
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

## Prompt 1: Tracker issue filing (title excerpt)

> Write the issue text worth filing in the tracker for my review and
> signoff. Finding: the export endpoint returns HTTP 200 with an empty body
> when the date filter excludes all rows, and downstream jobs treat the
> empty body as corruption and retry for hours.

The full outputs run 235 to 389 words (off 5.66, lite and strict 0.00
warnings/100w). The titles alone carry the story:

| **off** (24 words, one em-dash) | **strict** |
|---|---|
| Export endpoint returns HTTP 200 with empty body when date filter matches zero rows — downstream jobs misinterpret as corruption and retry indefinitely | Export endpoint returns HTTP 200 with an empty body when the date filter excludes all rows |

The off title tries to tell the whole incident. The strict title names the
defect and lets the severity field and summary do their jobs.

## Prompt 2: Deploy error message

> Write the error message a user sees when a deploy fails because the built
> artifact checksum does not match the checksum in the registry. Include
> what the user can do next.

### off (9.45 warnings/100w, 127 words)

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

### strict (0.00 warnings/100w, 79 words)

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

## Prompt 3: Pull-request description (excerpt)

> Draft a pull request description for my review. Context: [...] a
> migration note for one breaking rename (configPath to config_path).

Full outputs: off 155 words at 5.16 warnings/100w, strict 84 words at 0.00.
The breaking-change section shows the difference:

| **off** (plus a diff block for a one-word rename) | **strict** |
|---|---|
| ⚠️ **Breaking change**<br>The config key `configPath` is renamed to `config_path`.<br>**Migration:** update any config files or overrides referencing `configPath`: [...] | **Breaking change**<br>This change renames the `configPath` option to `config_path`.<br>Migration steps:<br>1. Search your code and config files for `configPath`.<br>2. Replace each use with `config_path`. |

The strict version tells the reader what to do, in steps a reader can
execute. Half the words overall.

---


## When steward adds nothing (honest case)

Prompted with "summarise the changes made as short and simple as possible",
all three conditions scored 0.00. The off output:

> Session storage: JSONL writes now atomic (temp file + rename), fixing race where concurrent writers interleaved partial lines. Load now drops truncated trailing lines for recovery.

If your prompt already demands terse, plain writing, steward has little to
add. Its value concentrates where prose has room to sprawl: descriptions,
docs, filings, notes. On long-form output the effect is largest: the
upstream-PR notes prompt dropped from 650 words (off) to 358 (strict), a 45
percent cut, with warnings falling from 5.85 to 0.28 per 100 words.

---

Method: prompts in `tests/` territory are not used; each run was
`pi -p --no-session "<prompt>"` with `~/.pi/agent/steward.json` set to the
condition's mode before the run. Lint: `python3 skills/steward/ste-lint.py
<file>`. Reproduce with any agent that loads the extension.
