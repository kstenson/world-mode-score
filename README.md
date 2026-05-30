# 🌍 World Mood Score

A daily dashboard for the **mood of the world**, regenerated every day by an AI that reads
a broad, diverse set of news sources and scores the day against a fixed rubric.

- **Headline score** (0–100) with a human label and a weather emoji.
- **Five dimensions** — conflict/peace, economy, climate, human interest, tech/progress.
- **Seven regions** — the Americas, Europe, Africa, the Middle East, Asia, Oceania.
- **A short briefing** and **every story cited** — the mood is a judgment, and you can
  click through to the reporting behind it.

The site is fully static (plain HTML/CSS/JS). Each day is one immutable JSON file in
`data/`; the page renders from the accumulated archive, so history and the trend line come
for free.

## How it works

A **Claude Code on the web scheduled session** runs once a day, researches the news, writes
`data/<date>.json`, updates `data/manifest.json`, and pushes — which redeploys the page on
GitHub Pages. The rules live in [`CLAUDE.md`](CLAUDE.md); the rubric in
[`SCORING.md`](SCORING.md); deployment and scheduling in [`SETUP.md`](SETUP.md).

## Local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Method & honesty

This is an **editorial, AI-generated** snapshot, not a measurement. The rubric keeps scores
comparable day to day, the source set is intentionally broad to limit skew, and every
driver links a real story so the judgment is auditable. Past days are never re-scored.
