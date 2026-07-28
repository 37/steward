#!/usr/bin/env python3
# steward benchmark scorer: form (ste-lint faults/100w), length, substance
# coverage (fact checklists), parity gate, and per-scenario controls.
# Usage: python3 score.py [--json]
import json, os, re, statistics, subprocess, sys

BENCH = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(BENCH))
LINT = os.path.join(REPO, "skills", "steward", "ste-lint.py")
RUNS = os.path.join(BENCH, "runs")
CONDS = ["off", "lite", "strict"]

def lint(text):
    r = subprocess.run([sys.executable, LINT], input=text, capture_output=True, text=True)
    return json.loads(r.stdout)

def strip_code(text):
    return re.sub(r"```.*?```", "", text, flags=re.S)

# re.S matters: strict puts one instruction per line, so a fact spanning two
# steps has a newline in it. Without DOTALL the checklist penalises exactly the
# formatting steward produces, which would fabricate a substance-loss finding.
FLAGS = re.I | re.S

def coverage(text, checklist):
    hits = {k: bool(re.search(p, text, FLAGS)) for k, p in checklist.items()}
    return hits, (sum(hits.values()) / len(hits) if hits else 1.0)

def controls(s, text):
    notes = []
    if "negative_checklist" in s:
        for k, p in s["negative_checklist"].items():
            if re.search(p, text, FLAGS):
                notes.append(f"negative-hit:{k}")
    if "order_check" in s:
        pos = []
        for k in s["order_check"]:
            m = re.search(s["checklist"][k], text, FLAGS)
            pos.append(m.start() if m else None)
        known = [p for p in pos if p is not None]
        if known != sorted(known):
            notes.append("order-violated")
    if "quote_control" in s:
        if s["quote_control"]["verbatim"] not in text:
            notes.append("quote-altered")
    if "code_control" in s:
        blocks = re.findall(r"```(?:python)?\n(.*?)```", text, flags=re.S)
        if not blocks:
            notes.append("no-code-block")
        else:
            code = "\n".join(blocks)
            if not re.search(s["code_control"]["must_contain"], code, re.I):
                notes.append("code-missing-required")
            r = subprocess.run([sys.executable, "-c", f"compile({code!r}, 'x', 'exec')"],
                              capture_output=True)
            if r.returncode != 0:
                notes.append("code-does-not-compile")
    if "structural" in s:
        st = s["structural"]
        recs = len(re.findall(st["recommendation_pattern"], text, re.I))
        if recs < st["min_use_cases"]:
            notes.append(f"recommendations:{recs}<{st['min_use_cases']}")
    return notes

def main():
    scenarios = json.load(open(os.path.join(BENCH, "scenarios.json")))["scenarios"]
    by_id = {s["id"]: s for s in scenarios}
    results = {}
    for sid in sorted(os.listdir(RUNS)) if os.path.isdir(RUNS) else []:
        s = by_id.get(sid, by_id.get("S2") if sid == "S2R" else None)
        if s is None:
            continue
        results[sid] = {}
        for cond in CONDS:
            cells = []
            for n in (1, 2, 3):
                f = os.path.join(RUNS, sid, f"{cond}-{n}.md")
                if not os.path.exists(f):
                    continue
                text = open(f).read()
                prose = strip_code(text) if "code_control" in s else text
                li = lint(prose)
                hits, cov = coverage(text, s.get("checklist", {}))
                cells.append({
                    "run": n, "faults_per_100w": li["total_per100w"],
                    "words": li["words"], "coverage": round(cov, 3),
                    "missed": [k for k, v in hits.items() if not v],
                    "control_notes": controls(s, text),
                })
            if cells:
                results[sid][cond] = {
                    "runs": cells,
                    "median_faults": statistics.median(c["faults_per_100w"] for c in cells),
                    "median_words": statistics.median(c["words"] for c in cells),
                    "median_coverage": statistics.median(c["coverage"] for c in cells),
                    "min_coverage": min(c["coverage"] for c in cells),
                }
        # Parity gate: a treated condition is apples-to-apples with baseline only
        # if its substance coverage is not below baseline coverage.
        # S2R is the rewrite arm: its baseline is S2's off condition, not its own.
        base = results[sid].get("off") or (results.get("S2", {}).get("off") if sid == "S2R" else None)
        if base:
            for cond in ("lite", "strict"):
                t = results[sid].get(cond)
                if t:
                    t["parity_ok"] = t["median_coverage"] >= base["median_coverage"]
    if "--json" in sys.argv:
        print(json.dumps(results, indent=1))
        return
    print(f"{'scenario':10} {'cond':7} {'faults/100w':>11} {'words':>6} {'coverage':>9} {'parity':>7}  notes")
    for sid, conds in results.items():
        for cond in CONDS:
            c = conds.get(cond)
            if not c:
                continue
            parity = "" if cond == "off" else ("OK" if c.get("parity_ok") else "FAIL")
            notes = sorted({n for r in c["runs"] for n in r["control_notes"]})
            missed = sorted({m for r in c["runs"] for m in r["missed"]})
            note_s = (" miss:" + ",".join(missed) if missed else "") + \
                     (" " + ";".join(notes) if notes else "")
            print(f"{sid:10} {cond:7} {c['median_faults']:>11.2f} {c['median_words']:>6.0f} "
                  f"{c['median_coverage']:>9.2f} {parity:>7} {note_s}")

if __name__ == "__main__":
    main()
