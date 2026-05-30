// World Mood Score — renders the dashboard from JSON data files.
// No build step, no dependencies. Loads data/manifest.json, then the latest day(s).

const DIMENSIONS = [
  ["conflict", "Conflict / Peace"],
  ["economy", "Economy"],
  ["climate", "Climate"],
  ["humanInterest", "Human interest"],
  ["techProgress", "Tech / Progress"],
];

const REGIONS = [
  ["northAmerica", "N. America"],
  ["southAmerica", "S. America"],
  ["europe", "Europe"],
  ["africa", "Africa"],
  ["middleEast", "Middle East"],
  ["asia", "Asia"],
  ["oceania", "Oceania"],
];

// Map a 0-100 score to a colour from red (bad) through amber to green (good).
function scoreColor(v) {
  const hue = Math.max(0, Math.min(120, (v / 100) * 120)); // 0=red, 120=green
  return `hsl(${hue} 70% 55%)`;
}

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

async function getJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function main() {
  const app = document.getElementById("app");
  let manifest, day, history = [];
  try {
    manifest = await getJSON("data/manifest.json");
    const days = manifest.days || [];
    day = await getJSON(`data/${days[0]}.json`);

    // Pull up to 30 recent days for the sparkline (most recent first in manifest).
    const recent = days.slice(0, 30).reverse();
    const loaded = await Promise.allSettled(recent.map((d) => getJSON(`data/${d}.json`)));
    history = loaded
      .filter((r) => r.status === "fulfilled")
      .map((r) => ({ date: r.value.date, score: r.value.score }));
  } catch (err) {
    app.innerHTML = `<p style="padding:40px;color:var(--muted)">Couldn't load today's data. ${err.message}</p>`;
    return;
  }

  renderHero(day, history);
  renderDimensions(day);
  renderRegions(day);
  renderSummary(day);
  renderDrivers(day);
  renderSources(day);
  app.setAttribute("aria-busy", "false");
}

function renderHero(day, history) {
  document.getElementById("date").textContent = fmtDate(day.date);
  document.getElementById("emoji").textContent = day.emoji || "";
  document.getElementById("label").textContent = day.label || "";
  document.getElementById("score").textContent = day.score;

  const C = 2 * Math.PI * 52; // circumference of r=52
  const fill = document.getElementById("gaugeFill");
  fill.style.strokeDasharray = C;
  requestAnimationFrame(() => {
    fill.style.strokeDashoffset = C * (1 - day.score / 100);
    fill.style.stroke = scoreColor(day.score);
  });

  // Day-over-day delta from the previous entry in history.
  const delta = document.getElementById("delta");
  if (history.length >= 2) {
    const prev = history[history.length - 2].score;
    const diff = day.score - prev;
    if (diff === 0) {
      delta.textContent = "Unchanged from yesterday";
    } else {
      delta.textContent = `${diff > 0 ? "▲ +" : "▼ "}${diff} from yesterday`;
      delta.classList.add(diff > 0 ? "up" : "down");
    }
  } else {
    delta.textContent = "First day on record";
  }

  renderSparkline(history);
}

function renderSparkline(history) {
  const svg = document.getElementById("sparkline");
  const caption = document.getElementById("sparkCaption");
  const W = 300, H = 56, pad = 6;
  if (history.length < 2) {
    svg.style.display = "none";
    caption.textContent = "The trend line appears once there's more than one day of history.";
    return;
  }
  const scores = history.map((h) => h.score);
  const min = Math.min(...scores), max = Math.max(...scores);
  const span = Math.max(1, max - min);
  const x = (i) => pad + (i * (W - 2 * pad)) / (history.length - 1);
  const y = (s) => H - pad - ((s - min) / span) * (H - 2 * pad);

  const pts = history.map((h, i) => [x(i), y(h.score)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${x(history.length - 1).toFixed(1)} ${H - pad} L${x(0).toFixed(1)} ${H - pad} Z`;
  const last = pts[pts.length - 1];

  svg.innerHTML = `
    <defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="transparent"/>
    </linearGradient></defs>
    <path class="area" d="${area}"/>
    <path class="line" d="${line}"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3"/>`;
  caption.textContent = `${history.length}-day trend · range ${min}–${max}`;
}

function renderDimensions(day) {
  const root = document.getElementById("dimensions");
  root.innerHTML = DIMENSIONS.map(([key, name]) => {
    const v = day.dimensions?.[key] ?? 0;
    return `<div class="dim">
      <span class="dim-name">${name}</span>
      <span class="dim-bar"><i style="background:${scoreColor(v)}" data-w="${v}"></i></span>
      <span class="dim-val">${v}</span>
    </div>`;
  }).join("");
  requestAnimationFrame(() => {
    root.querySelectorAll(".dim-bar > i").forEach((el) => { el.style.width = el.dataset.w + "%"; });
  });
}

function renderRegions(day) {
  const root = document.getElementById("regions");
  root.innerHTML = REGIONS.map(([key, name]) => {
    const v = day.regions?.[key] ?? 0;
    return `<div class="region" style="--region:${scoreColor(v)}">
      <div class="region-name">${name}</div>
      <div class="region-val">${v}</div>
    </div>`;
  }).join("");
}

function renderSummary(day) {
  const root = document.getElementById("summary");
  const paras = (day.summary || "").split(/\n\n+/).filter(Boolean);
  root.innerHTML = paras.map((p) => `<p>${escapeHTML(p)}</p>`).join("");
}

const DIM_LABEL = Object.fromEntries(DIMENSIONS);

function renderDrivers(day) {
  const root = document.getElementById("drivers");
  root.innerHTML = (day.drivers || []).map((d) => {
    const dir = d.direction === "down" ? "down" : "up";
    const arrow = dir === "down" ? "▼" : "▲";
    const tag = d.dimension ? `<span class="tag">${DIM_LABEL[d.dimension] || d.dimension}</span>` : "";
    return `<li class="driver ${dir}">
      <span class="arrow">${arrow}</span>
      <div>
        <a href="${escapeAttr(d.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(d.headline)}</a>${tag}
        <div class="meta">${escapeHTML(d.source || "")}</div>
      </div>
    </li>`;
  }).join("");
}

function renderSources(day) {
  const root = document.getElementById("sources");
  const list = day.sources_consulted || [];
  if (!list.length) { root.style.display = "none"; return; }
  root.innerHTML = `<b>Sources consulted today:</b> ${list.map(escapeHTML).join(" · ")}`;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
function escapeAttr(s) { return escapeHTML(s); }

main();
