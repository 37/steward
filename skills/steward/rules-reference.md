# ASD-STE100 Issue 9: rule digest

All 53 rules plus 8 general recommendations, condensed from the official spec
(January 2025). Rule numbers match the standard.

For the dictionary (Part 2: 875 approved words, 1274 non-approved words with
approved alternatives), this package ships a distilled software-focused
subset in [dictionary.json](dictionary.json): 50 substitution pairs plus the
documented overrides where the standard conflicts with software terminology
(run, build, call, execute, and more). For a word that is not in the subset,
use the free spec at asd-ste100.org.

## Section 1: Words

- **1.1** Use only: words approved in the dictionary, technical nouns, technical verbs.
- **1.2** Use approved words only as their specified part of speech ("test" is approved as noun only: "do a test", not "test the system").
- **1.3** Use approved words only with their approved meaning. One word, one meaning ("fall" = move down by gravity, never "decrease").
- **1.4** Use only approved forms of verbs and adjectives.
- **1.5** Technical nouns: words allowed when they fit a category (parts, tools, materials, units, numbers, colors, damage terms, math/science terms, law, life forms, etc.).
- **1.6** Unapproved words allowed only as (part of) a technical noun.
- **1.7** Do not use technical nouns as verbs ("apply oil to the seal", not "oil the seal").
- **1.8** Use technical nouns approved in your company/industry/domain.
- **1.9** When choosing a technical noun, pick the short, easy one.
- **1.10** No regional, slang, or jargon technical nouns.
- **1.11** One item, one technical noun. Never alternate names for the same thing.
- **1.12** Technical verbs: allowed when they fit a category (manufacturing processes, computer processes/applications, etc.).
- **1.13** Do not use technical verbs as nouns.
- **1.14** American English spelling (Merriam-Webster) unless official directives say otherwise.

## Section 2: Multi-word nouns

- **2.1** Multi-word nouns: max 3 words. Break longer clusters with prepositions ("calibration of the runway light connection resistance" → restructure; head noun last is the ambiguity source).
- **2.2** A technical noun longer than 3 words: write in full once, then give a shorter form, or hyphenate word units.

## Section 3: Verbs

- **3.1** Use only the verb forms given in the dictionary.
- **3.2** Only these forms/tenses: infinitive, imperative, simple present, simple past, simple future, past participle as adjective.
- **3.3** Past participle only as an adjective.
- **3.4** No auxiliary-verb constructions (no "has been completed", "is being tested", "would have required").
- **3.5** "-ing" form only inside a technical noun ("operating rod"), never as a main verb.
- **3.6** Active voice. Passive permitted only in descriptive writing when the agent is unknown.
- **3.7** Use a verb for an action, not a noun ("drain the oil", not "do an oil drain"; "analyze", not "perform an analysis").

## Section 4: Sentences

- **4.1** Short, clear sentences. Procedures: imperative, direct.
- **4.2** Do not omit words or use contractions to shorten sentences.
- **4.3** Use vertical lists for complex text. A colon introduces the list and counts as sentence end.
- **4.4** Use connecting words/phrases between related sentences ("thus", "then", "as a result").
- **4.5** Use articles (the, a, an) or demonstrative adjectives (this, these) before nouns. Telegraphic style is banned ("Turn the switch to ON", not "Turn switch ON").

## Section 5: Procedural writing

- **5.1** Max 20 words per sentence. Applies to warnings and cautions too.
- **5.2** One instruction per sentence, unless actions occur simultaneously.
- **5.3** Instructions in imperative (command) form.
- **5.4** Condition first, comma, then command ("If the pressure is low, open the valve.").
- **5.5** Notes give information only, never instructions.

## Section 6: Descriptive writing

- **6.1** Give information gradually. One subject per sentence.
- **6.2** Key words/phrases give the text a logical structure.
- **6.3** Max 25 words per sentence.
- **6.4** Use paragraphs to group related information.
- **6.5** One topic per paragraph.
- **6.6** Max 6 sentences per paragraph.

## Section 7: Safety instructions

Warning = risk of injury or death. Caution = risk of damage to objects.

- **7.1** Lead with the risk word ("WARNING:", "CAUTION:") to signal risk level.
- **7.2** Start the instruction with a clear command or condition.
- **7.3** Give the explanation: the risk or the possible result.

Pattern: `CAUTION: Do not X. If you X, damage to Y can occur.`

## Section 8: Punctuation and word count

- **8.1** All standard punctuation except the semicolon.
- **8.2** Hyphens connect directly-related words.
- **8.3** Parentheses: references, item numbers, abbreviations, singular/plural forms, explanations, alternatives.
- **8.4** In a vertical list, a colon ends a sentence for word count.
- **8.5** Parenthetical text counts as one word.
- **8.6** Count as one word: numbers, numbers+units, abbreviations, alphanumeric identifiers, quoted text, titles/headings/labels, proper nouns.
- **8.7** Hyphenated words count as one word.

## Section 9: Writing practices

- **9.1** When word-for-word replacement of an unapproved word changes meaning or part of speech, restructure the sentence instead.
- **9.2** Use each approved word correctly (per its dictionary example).
- **9.3** No phrasal verbs ("spin up" → "start", "carry out" → "do", "set up" → "install"/"prepare").
- **9.4** Consistent style: same terminology, same construction for the same idea, everywhere.

## General recommendations (GR)

- **GR-1** Keep the conjunction "that": "Make sure that the valve is open." It marks the clause boundary and removes ambiguity.
- **GR-2** "with" has 3 meanings (association, help, instrument) and breeds ambiguity: "Install the panel with the green fasteners" has 3 readings. Restructure; keep the primary action verb ("Seal the opening with tool TS9867", not "Use tool TS9867 to seal...").
- **GR-3** If a pronoun (it, they, these) can refer to more than one noun, replace it with the noun.
- **GR-4** "this" must have exactly one referent; otherwise restate the context ("If the cover is locked, damage to the probe can occur.").
- **GR-5** False friends: non-native writers must check the English meaning, not the lookalike in their language.
- **GR-6** No Latin abbreviations: e.g. → "for example", i.e. → "that is", etc. → "and so on" or drop.
- **GR-7** Gender-neutral language. "he"/"she" are not approved pronouns.
- **GR-8** Possessive ('s) is permitted but use only when certain; restructure if unsure.

## Why it works (for general writing)

The standard was built in 1986 for aircraft maintenance: non-native readers,
high-stakes procedures, zero tolerance for ambiguity. The mechanisms transfer
to any technical or general prose:

1. **One word, one meaning** removes the reader's disambiguation work.
2. **Length caps** (20/25 words, 6 sentences) force one idea per unit.
3. **Active voice + imperative** names the actor and the action.
4. **Condition-before-command** matches execution order to reading order.
5. **Verb-over-nominalization** cuts the empty scaffolding ("perform an
   analysis of" → "analyze") that makes slop feel padded.
6. **Anti-ambiguity GRs** (that/with/this/pronouns) kill the specific
   constructions where misreading actually happens.
