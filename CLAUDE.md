# World Mood Score — daily generation instructions

This repo publishes a daily "mood of the world" dashboard to GitHub Pages. The page is
static; the only thing that changes each day is one JSON data file. **Your job, when run on
the daily schedule, is to research the day's world news and produce that file.**

## What to do each run

1. **Determine today's date** (UTC) → `YYYY-MM-DD`.
2. **Research** the day's world news with web search. Cover, at minimum:
   - global top headlines, conflict/diplomacy, economy/markets, climate/disasters,
     health, science/tech, and at least one positive-news source;
   - a spread of regions: North & South America, Europe, Africa, Middle East, Asia, Oceania.
   Use a **broad and diverse** source set (see `SCORING.md`).
3. **Score** the day strictly against `SCORING.md` — the headline score, the five
   dimensions, and the seven regions. Consistency with the rubric matters more than
   matching yesterday.
4. **Write** `data/YYYY-MM-DD.json` following the schema of the most recent existing file in
   `data/`. Include 8–12 `drivers`, each with a real, working source URL. Never fabricate.
5. **Update** `data/manifest.json`: add today's date to the **front** of the `days` array
   and set `updated` to today.
6. **Commit and push** to the working branch with a message like
   `Daily mood: YYYY-MM-DD (score NN)`.

## Rules

- One file per day. **Never edit or re-score past days** — the archive is immutable.
- Every `drivers` entry must cite a real story. No invented headlines or URLs.
- Keep the tone of the `summary` measured and journalistic — neither doom nor forced cheer.
- Do not change `index.html`, `app.js`, or `style.css` during a daily run unless explicitly
  asked; daily runs are data-only.

## How this is scheduled

A **Claude Code on the web scheduled session** (daily trigger, ~06:00 UTC) runs this repo
with the prompt in `.claude/daily-prompt.md`. The schedule itself is configured in the web
UI — see `SETUP.md`. Pushing the new data file triggers GitHub Pages to redeploy the site.

## Layout

- `index.html`, `app.js`, `style.css` — the static dashboard (renders from JSON).
- `data/<date>.json` — one immutable day per file.
- `data/manifest.json` — index of available days + last-updated.
- `SCORING.md` — the fixed rubric. Read it every run.
- `SETUP.md` — how to deploy (GitHub Pages) and schedule the daily session.
