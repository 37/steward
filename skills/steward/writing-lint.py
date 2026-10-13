#!/usr/bin/env python3
"""Deterministic checks for Steward report substance and the optional voice profile.

This linter checks visible writing contracts. It cannot verify whether a claim is
true without the source evidence used to write the claim.
"""
import argparse
import glob
import json
import re
import sys
from pathlib import Path

DECISION = re.compile(r"\b(decision|recommend|approve|choose|action|ask|request|must decide)\b", re.I)
CLAIM_CLASS = re.compile(r"\b(proven|inferred|untested)\b", re.I)
UNKNOWNS = re.compile(r"\b(unknowns?|still open|open questions?|untested|not checked|not verified)\b", re.I)
RECOMMENDATION = re.compile(r"\b(recommend|rank(?:ed|ing)?|priority|preferred|best option|first choice)\b", re.I)
VAGUE_ATTRIBUTION = re.compile(r"\b(experts believe|industry reports suggest|some critics argue|many people say)\b", re.I)
CHATBOT = re.compile(r"\b(i hope this helps|of course|certainly|great question|you(?:'|’)re absolutely right)\b", re.I)
GENERIC_CONCLUSION = re.compile(r"\b(the future looks bright|only time will tell|this is just the beginning)\b", re.I)
# Reference codes that only the writer's memory may define: "step 2", "Step 3",
# "Q11", "D48", "F3a", "R6", "A-O1", "item C", "option b".
REFERENCE = re.compile(
    r"\b(?:(?P<word>(?i:steps?|items?|options?|phases?|questions?|fix(?:es)?))\s+(?P<wid>\d+|[A-Za-z])\b"
    r"|(?P<code>[A-Z]{1,2}\d{1,2}[a-z]?|[A-Z]{1,3}-[A-Z]?\d+[a-z]?)\b)")
# Public names that look like codes but need no definition: standards,
# algorithms, curves, products ("UTF-8", "SHA-1", "P-256", "EIP-155", "S3").
STANDARD_PREFIXES = {
    "AES", "BIP", "CVE", "CWE", "EIP", "ERC", "ES", "HS", "ISO", "MD", "P", "PS",
    "RFC", "RS", "SHA", "TLS", "UTF", "X", "IEC", "PEP", "W",
}
STANDARD_CODES = {
    "S3", "EC2", "H1", "H2", "H3", "H4", "H5", "H6", "L1", "L2", "L3", "P0", "P1",
    "P2", "P3", "P4", "E2", "K8", "G1", "G2",
}
PUFFERY = re.compile(r"\b(pivotal moment|testament to|evolving landscape|setting the stage|indelible mark|groundbreaking|game-changing)\b", re.I)


def strip_exempt(text):
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"`[^`]*`", " ", text)
    text = re.sub(r'^\s*>.*$', " ", text, flags=re.M)
    text = re.sub(r'"[^"\n]*"', " ", text)
    text = re.sub(r"“[^”\n]*”", " ", text)
    return text


def words(text):
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'/-]*", strip_exempt(text)))


def first_paragraph(text):
    for block in re.split(r"\n\s*\n", strip_exempt(text)):
        lines = [line.strip() for line in block.splitlines() if line.strip() and not line.lstrip().startswith("#")]
        if lines:
            return " ".join(lines)
    return ""


def unranked_option_lists(text):
    count = 0
    for block in re.split(r"\n\s*\n", strip_exempt(text)):
        lines = [line for line in block.splitlines() if re.match(r"^\s*[-*+]\s+", line)]
        if len(lines) >= 3 and not RECOMMENDATION.search(block):
            count += 1
    return count


def _is_standard(code):
    if code in STANDARD_CODES:
        return True
    prefix = re.match(r"[A-Z]+", code).group(0)
    return "-" in code and prefix in STANDARD_PREFIXES


def undefined_references(text):
    """Codes the message names but never defines. A numbered or lettered list
    item, or the first cell of a table row, defines "step N", "item N" and
    "option N". A code defines itself when a line starts with it (a table row,
    a list item, a heading) followed by a separator, when "CODE:" appears, or
    when it is the text of a markdown link ("[ALT-12](url)")."""
    labels = set()
    for line in text.splitlines():
        m = re.match(r"^\s*(?:[-*+]\s+)?(?:\*\*)?\(?([0-9]+|[A-Za-z])[.)]", line) \
            or re.match(r"^\s*\|\s*(?:\*\*)?\(?(?:(?i:steps?|items?|options?|phases?|questions?|fix(?:es)?)\s+)?([0-9]+|[A-Za-z])\)?(?:\*\*)?\s*\|", line)
        if m:
            labels.add(m.group(1).lower())
    missing = set()
    for m in REFERENCE.finditer(text):
        if m.group("word"):
            if m.group("wid").lower() not in labels:
                word = m.group("word").lower()
                word = "fix" if word.startswith("fix") else word.rstrip("s")
                missing.add(f"{word} {m.group('wid')}")
            continue
        if _is_standard(m.group("code")):
            continue
        if re.search(rf"\[[^\]]*\b{re.escape(m.group('code'))}\b[^\]]*\]\(", text):
            continue
        code = re.escape(m.group("code"))
        defined = re.search(rf"^\s*(?:[|#>*+-]\s*)*(?:\*\*)?{code}(?:\*\*)?\s*[|:.)\u2014-]", text, re.M) \
            or re.search(rf"\b{code}(?:\*\*)?:", text)
        if not defined:
            missing.add(m.group("code"))
    return sorted(missing)


def lint(text, report=False, voice=False, max_words=None, handoff=False):
    body = strip_exempt(text)
    violations = {}
    undefined = undefined_references(body) if handoff else []
    if handoff:
        violations["undefined_reference"] = len(undefined)
    if report:
        violations["missing_frontloaded_decision"] = 0 if DECISION.search(first_paragraph(body)) else 1
        violations["unranked_option_list"] = unranked_option_lists(body)
        violations["missing_claim_classification"] = 0 if CLAIM_CLASS.search(body) else 1
        violations["missing_unknowns"] = 0 if UNKNOWNS.search(body) else 1
        violations["reading_budget_exceeded"] = int(max_words is not None and words(body) > max_words)
    if voice:
        violations["vague_attribution"] = len(VAGUE_ATTRIBUTION.findall(body))
        violations["chatbot_phrase"] = len(CHATBOT.findall(body))
        violations["generic_conclusion"] = len(GENERIC_CONCLUSION.findall(body))
        violations["puffery"] = len(PUFFERY.findall(body))
    return {
        "words": words(body),
        "profiles": [name for name, active in (("report", report), ("voice", voice), ("handoff", handoff)) if active],
        "violations": violations,
        "undefined_references": undefined,
        "total": sum(violations.values()),
        "truth_verified": False,
        "truth_note": "Verify material claims against source evidence. This linter checks classification, not truth.",
    }


def selftest():
    bad = """# Update
Here is the background before you decide anything.

## Options
- Keep the current release.
- Delay the release.
- Remove the export.

Experts believe this is a pivotal moment. The future looks bright. I hope this helps.
"""
    result = lint(bad, report=True, voice=True, max_words=20)
    for name in [
        "missing_frontloaded_decision",
        "unranked_option_list",
        "missing_claim_classification",
        "missing_unknowns",
        "reading_budget_exceeded",
        "vague_attribution",
        "chatbot_phrase",
        "generic_conclusion",
        "puffery",
    ]:
        assert result["violations"][name] > 0, name

    good = """# Decision
Approve option 1.

## Evidence
**Proven:** The smoke test passed.

## Recommendation
1. Keep the current release. This option has verified evidence.
2. Delay the release only if the integration test fails.

## What is still open
**Untested:** The production integration was not checked.

## Ask
Approve option 1.
"""
    result = lint(good, report=True, voice=True, max_words=100)
    assert result["total"] == 0, result
    precise = lint("The API surface uses a harness and one primitive.", voice=True)
    assert precise["total"] == 0, precise
    quoted = lint('The report quotes "Experts believe this is a pivotal moment."', voice=True)
    assert quoted["total"] == 0, quoted
    plain = lint("Next: step 2.")
    assert plain["total"] == 0 and "undefined_reference" not in plain["violations"], plain
    handoff = lint("""Next steps
 - Next: step 2. The importer retries the upload.
 - After that: steps 3 to 7, then step 8, which is the Q3 plan you approved.
 Q11 is still open. I recommend yes.
""", handoff=True)
    assert handoff["undefined_references"] == ["Q11", "Q3", "step 2", "step 3", "step 8"], handoff
    wider = lint("""Steps 1 and 2 are done. Step 3 is next. F2 and F3a come after it.
Fix 4 waits for R6. Question 9 is open.
""", handoff=True)
    assert wider["undefined_references"] == ["F2", "F3a", "R6", "fix 4", "question 9", "step 1", "step 3"], wider
    public = lint("""It signs with P-256 and ES256, hashes with SHA-1 and SHA-256, reads
UTF-8, follows EIP-155 and ISO-8601, and stores files in S3.
See [ALT-1197](https://example.com/ALT-1197) for the gateway issue.
""", handoff=True)
    assert public["undefined_references"] == [], public
    table = lint("""| Option | Retries on |
|---|---|
| a | Timeouts only |
| b | Timeouts and 429 |

Should I use option a or option b?
""", handoff=True)
    assert table["undefined_references"] == [], table
    defined = lint("""| Code | Meaning |
|---|---|
| Q11 | Add a dry-run flag to the importer. |

Next, in this order:
1. The importer retries uploads.
2. The export command retries.
3. The parser reads fewer files.

Items 2 and 3 get unit tests. Q11: I recommend option a.

- (a) Add the flag.
- (b) Do not add it.
""", handoff=True)
    assert defined["violations"]["undefined_reference"] == 0, defined
    print("writing-lint selftest: passed")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="*")
    parser.add_argument("--report", action="store_true")
    parser.add_argument("--voice", action="store_true")
    parser.add_argument("--handoff", action="store_true",
                        help="count step, question, option and item codes the message does not define")
    parser.add_argument("--max-words", type=int)
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        selftest()
        return
    paths = []
    for value in args.files:
        expanded = sorted(glob.glob(value)) if any(char in value for char in "*?[") else [value]
        paths.extend(expanded)
    if not paths:
        print(json.dumps(lint(sys.stdin.read(), args.report, args.voice, args.max_words, args.handoff), indent=2))
        return
    failed = False
    for value in paths:
        result = lint(Path(value).read_text(), args.report, args.voice, args.max_words, args.handoff)
        print(f"{Path(value).name:32} words={result['words']:4d} total={result['total']:3d} profiles={','.join(result['profiles']) or 'none'}")
        failed = failed or result["total"] > 0
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
