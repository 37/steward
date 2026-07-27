# Measured examples

Real writing prompts, each run through the same agent with steward **off**,
**lite**, and **strict**. Outputs are unedited. The score is `ste-lint.py`
faults per 100 words; lower is cleaner. Single runs, not averages: treated
runs repeat almost exactly, baselines vary a lot between runs.

| Prompt | off | lite | strict |
|---|---|---|---|
| Tracker issue filing | 5.66 | **0.00** | 0.00 |
| Deploy error message | 9.45 | 0.90 | **0.00** |
| Pull-request description | 5.16 | 0.00 | **0.00** |
| Long-form upstream-PR notes | 5.85 | 0.23 | 0.28 |

The injected rules cost roughly 420 (lite) to 500 (strict) prompt tokens
per request, mostly absorbed by caching. Shorter output returns part of
that: the upstream-PR notes dropped from 650 words to 358.

## Issue filing: the titles alone

> Write the issue text worth filing in the tracker. Finding: the export
> endpoint returns HTTP 200 with an empty body when the date filter
> excludes all rows, and downstream jobs treat the empty body as corruption
> and retry for hours.

| **off** (24 words, one em-dash) | **strict** |
|---|---|
| Export endpoint returns HTTP 200 with empty body when date filter matches zero rows — downstream jobs misinterpret as corruption and retry indefinitely | Export endpoint returns HTTP 200 with an empty body when the date filter excludes all rows |

The off title tries to tell the whole incident. The strict title names the
defect and lets the severity field and summary do their jobs.

## Deploy error message, in full

> Write the error message a user sees when a deploy fails because the built
> artifact checksum does not match the checksum in the registry. Include
> what the user can do next.

**off** (9.45 faults/100w, 127 words):

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

**strict** (0.00 faults/100w, 79 words):

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
with the same information.

## When steward adds nothing

Prompted with "summarise the changes made as short and simple as possible",
all three conditions scored 0.00. If your prompt already demands terse
writing, steward has little to add. Its value concentrates where prose has
room to sprawl: descriptions, docs, filings, notes.

---

Method: each run was `pi -p --no-session "<prompt>"` with the steward
config set to the condition's mode. The same gradient held in live Claude
Code and Codex sessions ([portability.md](portability.md)). Prompt shapes
come from real coding-session history, specifics generalized.
