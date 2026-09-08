# 192-item PSLE Science question audit — 8 Sep 2026

## Scope

Audited the complete learning path:

- 180 Science flashcard-linked Application items
- 12 Process Skills items
- one-to-one flashcard ↔ Application linkage retained
- existing Jerry/Javis Known history and cloud progress not reset or rewritten

## Sources used

1. The 180 book-backed Science cores in `resources/book180/` remain the content authority for each linked flashcard.
2. The 10 uploaded 2026 P6 prelim/mock papers were used as structural calibration for natural question wording and reasoning demand. The earlier 160-question audit found the recurring teaching patterns Change→Effect, Mechanism/Process, Evidence/Data, Comparison, Structure/Feature→Function and Experimental/Process-skill.
3. `resources/process-skills.js` remains the source for the 12 experiment/process-skill cards.

The six frameworks are teaching structures, not official MOE/SEAB categories.

## Audit checks applied to every item

- The Application question tests the same Science idea as its linked flashcard.
- The question can stand alone and sounds like a Primary 6 / PSLE-style question rather than a teacher instruction.
- The command word and demanded reasoning are clear.
- The framework label matches what the actual question asks the pupil to do.
- The model answer answers the exact question and does not merely repeat the flashcard when context needs adapting.
- Wording avoids unjustified absolutes, ambiguous timing and causal overclaims.
- Evidence questions use actual evidence/observations; comparison questions compare the named cases; process questions show a pathway; feature questions connect feature→function; experimental questions keep fair-test/reliability/accuracy distinctions separate.
- Scientifically equivalent wording remains acceptable.

## Corrections made

A focused override layer was added for items that needed safer or more natural wording. Corrected Science IDs:

`1, 11, 31, 33, 35, 42, 46, 49, 58, 61, 63, 75, 77, 78, 79, 82, 83, 84, 85, 95, 99, 100, 101, 109, 113, 114, 119, 128, 133, 138, 139, 151, 158, 160, 161, 162, 164, 166, 169, 180`

The remaining Science items were checked against their book-backed core and existing authored Application wording and did not require a content rewrite in this audit.

### Important examples

**ID 11 — Flowers**

Old wording used “before they mature”, which is ambiguous because pollination/fertilisation may already have occurred. New wording:

> All the flowers on a flowering plant are removed before pollination and fertilisation can occur. Explain how this can affect the formation of fruits and seeds.

Model:

> If the flowers are removed before pollination and fertilisation can occur, fruits and seeds cannot form from those flowers.

This avoids the overclaim that the plant “cannot reproduce any more”; the same plant may later produce new flowers.

**ID 58 — Damaged food-carrying tubes**

The previous Application variants accidentally duplicated the ordinary food-transport item. They now specifically test the damaged-tube concept and accumulation above the damage.

**Meta-instruction wording**

Prompts such as “Link the change…”, “State the chain…” and “Write the explanation as feature → …” were removed/replaced in audited items. The framework coach may teach the reasoning chain, but the question itself should read like an examination question.

**Direct-only concepts**

Where a flashcard core was mainly a definition or direct fact, an appropriate reasoning context was added so the linked Framework Review can still train one of F1–F6 without changing the flashcard itself.

## 12 Process Skills

All 12 Process Skills were checked. Their core distinctions remain appropriate:

- fair test
- changed/measured/controlled variables
- relationship from data
- hypothesis
- reliability
- accuracy
- control set-up
- apparatus range/precision
- measuring cylinder vs beaker
- reading liquid volume
- water displacement
- command words / observation / comparison

Reliability continues to use repeat trials and average where appropriate; accuracy remains separate from reliability.

## Framework matching

`framework-question-quality.js` now prioritises the actual demand of the audited question rather than forcing an awkward synthetic question into a pre-assigned framework. If an authored question naturally fits a different framework, the question and framework label move together. The sidebar counts are therefore calculated from the actual audited mappings.

Normal stage changes now patch only the visible question instead of repeatedly re-auditing all 180 items, reducing mobile load and avoiding the earlier Application/sidebar hangs.

## Progress safety

No progress key, `appCorrectDates`, recall history, Process Skill history, Jerry/Javis profile or D1 cloud snapshot is cleared or reset by this audit. The changes affect question/model wording and framework presentation only.
