# ste-lint: heuristic anti-slop linter, the machine-checkable subset of ASD-STE100.
# Origin: woosal1337/blog ep01. Local additions: em/en dash counted as a violation,
# empty intensifiers banned, user register (steward.json) enforced, distilled
# dictionary suggestions reported (informational, excluded from total).
import re, sys, json, glob, os

CONFIG_PATH = os.environ.get("STEWARD_CONFIG", os.path.expanduser("~/.pi/agent/steward.json"))
DICT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dictionary.json")
QUALIFIER_STOP = {"the","a","an","this","that","these","those","its","your","our","their","my",
    "each","every","any","no","some","one","and","or","of","with","for","to","in","on","at","by",
    "is","are","was","were","be","as","has","have","had","a","per"}

def load_register():
    try:
        with open(CONFIG_PATH) as fh: cfg = json.load(fh)
        return [str(b) for b in cfg.get("banned", [])]
    except Exception:
        return []

def load_dict_pairs():
    try:
        with open(DICT_PATH) as fh: d = json.load(fh)
        return [(p["from"], p["to"]) for p in d.get("keep", [])]
    except Exception:
        return []

def count_bare(text, term):
    # Flag `term` when it has no qualifying word directly before it
    # ("the key" flagged, "API key" passes, "user secret key" passes).
    n = 0
    for m in re.finditer(rf"\b{re.escape(term)}s?\b", text, re.I):
        before = text[:m.start()].rstrip()
        prev = re.findall(r"[A-Za-z0-9'\-]+$", before)
        if not prev or prev[0].lower() in QUALIFIER_STOP:
            n += 1
    return n

MARKETING = ["seamless","seamlessly","robust","powerful","cutting-edge","effortless","effortlessly",
    "world-class","next-generation","revolutionary","blazing","lightning-fast","elegant","delightful",
    "turnkey","best-in-class","state-of-the-art","game-changing","first-class","battle-tested",
    "enterprise-grade","supercharge","unlock","unleash","empower","empowers"]
BANNED = ["begin","begins","commence","commences","initiate","initiates","originate",
    "utilize","utilizes","utilizing","leverage","leverages","leveraging","facilitate","facilitates",
    "ensure","ensures","ensuring","prior to","subsequent to","obtain","obtains","acquire","acquires",
    "demonstrate","demonstrates","additionally","furthermore","moreover","comprehensive","comprehensively",
    "utilization","aforementioned","henceforth","therein","whilst","amongst","numerous","myriad","plethora",
    "in order to","a variety of","in the event that","due to the fact that","it is important to note"]
PHRASAL = ["spin up","spin down","reach out","dive into","dives into","diving into","kick off","kicks off",
    "roll out","rolls out","tear down","ramp up","circle back","drill down","spun up","reaching out"]
MODAL_HEDGE = ["it is important to note","it should be noted","it is worth noting","please note that",
    "as mentioned","as noted above"]
INTENSIFIER = ["genuine","genuinely","truly","really","very","extremely","incredibly","absolutely",
    "actually","basically","simply","just a","quite"]
BE = r"(?:am|is|are|was|were|be|been|being)"
PP_IRREG = r"(?:done|made|sent|read|built|kept|held|set|put|run|written|shown|given|taken|found|got|gotten|seen|known|thrown|drawn)"

def strip_exempt(t):
    # The rules never apply to code, identifiers, CLI syntax, or quoted text.
    # Blank the exempt spans before scoring, so a verbatim quote does not score
    # as slop: quoting an error string that contains an em-dash or a contraction
    # is correct behavior, and counting it punished the correct answer.
    # Line structure is kept so the paragraph check still sees the same shape.
    t = re.sub(r"```.*?```", " ", t, flags=re.S)
    t = re.sub(r"`[^`]*`", " ", t)
    t = re.sub(r"^(\s*)>.*$", r"\1 ", t, flags=re.M)      # markdown blockquote
    t = re.sub(r'"[^"\n]*"', " ", t)                     # straight double quotes
    t = re.sub(r"\u201c[^\u201d\n]*\u201d", " ", t)      # curly double quotes
    return t

def is_table_row(line):
    return line.lstrip().startswith("|")

def sentences(text):
    out = []
    for line in text.split("\n"):
        s = line.strip()
        if not s: continue
        # A markdown table row is structured data, not a sentence. Scoring it as
        # one counts cell text as an over-long sentence and cell separators as
        # prose punctuation. Word-level checks still see the cell content.
        if is_table_row(s): continue
        s = re.sub(r"^\s*#{1,6}\s*", "", s)
        s = re.sub(r"^\s*(?:[-*+]|\d+[.)])\s+", "", s)
        if not s: continue
        parts = re.split(r"(?<=[.!?:])\s+(?=[A-Z0-9\"'\-])", s)
        for p in parts:
            p = p.strip()
            if p: out.append(p)
    return out

def wc(s):
    return len([w for w in re.findall(r"[A-Za-z0-9][A-Za-z0-9'\-/]*", s)])

def count_ci(text, phrases):
    n = 0; hits = []
    low = text.lower()
    for ph in phrases:
        for m in re.finditer(r"(?<![a-z])" + re.escape(ph) + r"(?![a-z])", low):
            n += 1; hits.append(ph)
    return n, hits

def lint(text):
    # One exempt-stripped body for every check. Before this, em-dash and
    # paragraph checks read the unstripped text, so exempt spans still scored.
    raw = strip_exempt(text)
    text = raw
    sents = sentences(text)
    words = sum(wc(s) for s in sents) or 1
    v = {}
    longs = [(wc(s), s) for s in sents if wc(s) > 20]
    v["long_sentence(>20w)"] = len(longs)
    # Semicolons inside table cells separate cell items, not clauses.
    v["semicolon"] = "\n".join(l for l in text.split("\n") if not is_table_row(l)).count(";")
    v["contraction"] = len(re.findall(r"\b\w+['’](?:t|re|ve|ll|d|s|m)\b", text))
    v["passive_voice"] = len(re.findall(rf"\b{BE}\s+(?:\w+ed|{PP_IRREG})\b", text, re.I))
    v["ing_main_verb"] = len(re.findall(rf"\b{BE}\s+\w+ing\b", text, re.I))
    v["nominalization"] = len(re.findall(r"\b(?:perform(?:s|ed)?|conduct(?:s|ed)?|provide(?:s|d)?|carry out|carries out|make use of|makes use of)\b", text, re.I)) + len(re.findall(r"\b\w{4,}(?:tion|ment|ance|ence)\s+of\b", text, re.I))
    v["phrasal_verb"], _ = count_ci(text, PHRASAL)
    v["banned_word"], bh = count_ci(text, BANNED)
    v["marketing_adjective"], mh = count_ci(text, MARKETING)
    v["modal_hedge"], _ = count_ci(text, MODAL_HEDGE)
    v["empty_intensifier"], _ = count_ci(text, INTENSIFIER)
    reg_hits = 0
    for b in load_register():
        if b.startswith("bare:"):
            reg_hits += count_bare(text, b[5:])
        else:
            c, _ = count_ci(text, [b])
            reg_hits += c
    v["user_register"] = reg_hits
    paras = [p for p in re.split(r"\n\s*\n", raw) if p.strip()]
    # STE rule 4.3 prescribes vertical lists; list items are steps, not paragraph
    # sentences. Drop them before the paragraph-length check.
    def para_sentences(p):
        prose = "\n".join(l for l in p.split("\n") if not re.match(r"^\s*(?:[-*+]|\d+[.)])\s", l))
        return sentences(strip_exempt(prose))
    v["long_paragraph(>6s)"] = sum(1 for p in paras if len(para_sentences(p)) > 6)
    em = raw.count("—") + raw.count("–")
    v["em_dash"] = em
    total = sum(v.values())
    dict_sugg = {}
    for frm, to in load_dict_pairs():
        c, _ = count_ci(text, [frm])
        if c: dict_sugg[f"{frm} > {to}"] = c
    per100 = {k: round(x*100.0/words, 2) for k, x in v.items()}
    return {
        "words": words, "sentences": len(sents),
        "violations": v, "total": total,
        "dict_suggestions(not_in_total)": dict_sugg,
        "total_per100w": round(total*100.0/words, 2),
        "em_dash(slop-marker)": em,
        "longest_sentence_words": (max(longs)[0] if longs else max((wc(s) for s in sents), default=0)),
        "sample_marketing": list(dict.fromkeys(mh))[:6],
        "sample_banned": list(dict.fromkeys(bh))[:6],
    }

def selftest():
    # Exempt spans must not score; identical text outside a quote must score.
    v = lambda t: {k: n for k, n in lint(t)["violations"].items() if n}
    assert v("The deploy failed \u2014 we can't reach it.").get("em_dash") == 1, "plain em-dash must count"
    assert "em_dash" not in v("> The deploy failed \u2014 we can't reach it.\n\nThe fix is ready."), "blockquote must be exempt"
    assert "em_dash" not in v('He said "deploy failed \u2014 retry" today.'), "quoted span must be exempt"
    assert "contraction" not in v("> we can't reach the registry\n"), "quoted contraction must be exempt"
    assert v("we can't reach the registry").get("contraction") == 1, "plain contraction must count"
    assert "em_dash" not in v("```\nx = 1  # a \u2014 dash\n```\n"), "code fence must be exempt"
    row = "| Auth0 | managed SaaS; enterprise SSO | good for teams that want it |\n"
    assert "semicolon" not in v(row), "table cell separator must not count"
    assert "long_sentence(>20w)" not in v(row * 3), "table row must not be a sentence"
    assert v("We chose it; it was ready.").get("semicolon") == 1, "prose semicolon must count"
    assert v("| a | utilize the cache |\n\nText here.").get("banned_word") == 1, "cell words still count"
    print("ste-lint selftest: passed")

if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest(); sys.exit(0)
    files = sys.argv[1:] or []
    if not files:
        print(json.dumps(lint(sys.stdin.read()), indent=2)); sys.exit(0)
    exp = []
    for f in files: exp += sorted(glob.glob(f)) if any(c in f for c in "*?[") else [f]
    for f in exp:
        with open(f) as fh: r = lint(fh.read())
        print(f"{os.path.basename(f):32} words={r['words']:4d} total={r['total']:3d} per100w={r['total_per100w']:6.2f} em_dash={r['em_dash(slop-marker)']:2d}")
