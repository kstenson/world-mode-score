You are generating today's entry for the World Mood Score dashboard.

Follow the instructions in `CLAUDE.md` and score strictly against `SCORING.md`.

Steps:
1. Work out today's UTC date as `YYYY-MM-DD`.
2. Research the day's world news with web search across a broad, diverse set of sources
   (wire services, major internationals, regional/non-Western outlets, and at least one
   positive-news source) and across all seven regions and five dimensions.
3. Score the headline, the five dimensions, and the seven regions per `SCORING.md`.
4. Write `data/<today>.json` matching the schema of the most recent file in `data/`, with
   8–12 real, cited drivers (working URLs only — never fabricate).
5. Add today's date to the front of `days` in `data/manifest.json` and set `updated`.
6. Commit (`Daily mood: <date> (score NN)`) and push to the working branch.

Do not edit past data files. Do not touch index.html / app.js / style.css.
