# Scoring Rubric — World Mood Score

This rubric exists so that scores are **comparable across days** rather than drifting
with mood. Apply it the same way every day. When in doubt, anchor to the descriptions
below rather than to how today "feels" relative to yesterday.

## The scale (applies to every score: headline, dimensions, regions)

All scores are integers **0–100**, where:

| Range  | Meaning                                                                 |
|--------|-------------------------------------------------------------------------|
| 0–19   | Catastrophic — major war escalation, mass-casualty event, systemic crisis |
| 20–39  | Bad — active conflict/disaster dominates, fear and loss outweigh hope    |
| 40–59  | Mixed / uneasy — real danger *and* real progress; no clear direction     |
| 60–79  | Good — net positive day; setbacks present but progress leads             |
| 80–100 | Exceptional — historic peace, breakthrough, or relief; widespread relief |

**50 is the neutral anchor.** A day with nothing notable in either direction is 50.

## The five dimensions

Score each independently on the 0–100 scale above.

1. **conflict** — war, terrorism, political violence, diplomacy. *Higher = more peace.*
2. **economy** — markets, growth, jobs, inflation, trade, cost of living. *Higher = healthier.*
3. **climate** — extreme weather, disasters, climate policy, environmental health. *Higher = better.*
4. **humanInterest** — public health, human rights, community, acts of compassion, culture. *Higher = better.*
5. **techProgress** — science, technology, space, medicine breakthroughs. *Higher = more progress.*

## The seven regions

Score the mood **of events happening in / affecting** each region, same 0–100 scale:
`northAmerica`, `southAmerica`, `europe`, `africa`, `middleEast`, `asia`, `oceania`.

## The headline score

The headline `score` is a **weighted blend**, not a simple average. Default weights:

- conflict ×0.30
- economy ×0.20
- climate ×0.20
- humanInterest ×0.15
- techProgress ×0.15

Compute the weighted dimension average, then **sanity-check against the regions**: if a
major region is in crisis, the headline should not read "Good." Round to the nearest
integer. Adjust by no more than ±3 from the formula for editorial judgment, and note why
in the summary if you do.

## Label & emoji

- `label`: a 1–3 word human phrase matching the band (e.g. "Catastrophic", "Heavy going",
  "Uneasy calm", "Cautiously hopeful", "Quietly good", "A bright day").
- `emoji`: a single weather glyph matching the band: 🌑 / 🌧️ / 🌥️ / ⛅ / ☀️.

## Sourcing rules (non-negotiable)

- Consult a **broad, diverse** set of outlets each day: wire services (Reuters, AP, AFP),
  major internationals (BBC, Al Jazeera, CNN, NPR), regional and non-Western outlets, plus
  at least one dedicated positive-news source so the mood is not pure doomscroll.
- **Every entry in `drivers` must cite a real story** with a working `url` and `source`.
  Do not invent headlines or links. If you cannot find a source, drop the driver.
- Aim for **8–12 drivers**, a mix of `up` and `down`, spread across dimensions.
- Each driver should carry a `dimension` and, where the story is clearly tied to one
  place, a `region` (one of the seven region keys). The `region` tag powers the regional
  drill-down on the dashboard — global stories with no clear home may omit it.
- List every outlet you actually consulted in `sources_consulted`.

## Output contract

Write exactly one file `data/YYYY-MM-DD.json` matching the schema in any existing day file,
then add that date to the front of the `days` array in `data/manifest.json` and update
`manifest.json`'s `updated` field. Never edit past days.
