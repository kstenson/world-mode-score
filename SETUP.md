# Setup — hosting & daily schedule

This project is a static site (`index.html` + `app.js` + `style.css`) that renders from
JSON files in `data/`. The only thing that changes day to day is a new `data/<date>.json`.

## 1. Host it on GitHub Pages

1. Push this repo to GitHub.
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**.
4. Choose the branch (e.g. `main`) and folder **`/ (root)`**, then **Save**.
5. After a minute the site is live at `https://<user>.github.io/<repo>/`.

Because everything is static and data is plain JSON fetched at runtime, **every push that
adds a data file redeploys the site automatically** — no build step.

> Note: the daily session commits to a working branch. Either point Pages at that branch,
> or merge the working branch into your Pages branch (a second tiny scheduled step, or a
> branch-protection auto-merge, can do this).

## 2. Schedule the daily generation

The content engine is a **Claude Code on the web scheduled session**:

1. Go to Claude Code on the web and open this repository.
2. Create a **Schedule / recurring session** (daily, e.g. **06:00 UTC**).
3. Set the session prompt to the contents of `.claude/daily-prompt.md`
   (or simply: *"Run today's World Mood Score generation per CLAUDE.md."*).
4. Make sure the environment's **network policy allows web search/fetch** so the session
   can research the news, and that it can **push** to the working branch.

Each run researches the day, writes `data/<date>.json`, updates `data/manifest.json`,
and pushes — which redeploys the page.

See <https://code.claude.com/docs/en/claude-code-on-the-web> for scheduling details.

## 3. Local preview

It's just static files, so serve the folder with anything:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Use a server rather than opening `index.html` directly, so `fetch()` of the JSON works.)
