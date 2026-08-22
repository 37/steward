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


def lint(text, report=False, voice=False, max_words=None):
    body = strip_exempt(text)
    violations = {}
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
        "profiles": [name for name, active in (("report", report), ("voice", voice)) if active],
        "violations": violations,
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
    print("writing-lint selftest: passed")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="*")
    parser.add_argument("--report", action="store_true")
    parser.add_argument("--voice", action="store_true")
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
        print(json.dumps(lint(sys.stdin.read(), args.report, args.voice, args.max_words), indent=2))
        return
    failed = False
    for value in paths:
        result = lint(Path(value).read_text(), args.report, args.voice, args.max_words)
        print(f"{Path(value).name:32} words={result['words']:4d} total={result['total']:3d} profiles={','.join(result['profiles']) or 'none'}")
        failed = failed or result["total"] > 0
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
