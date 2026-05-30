// World Mood Score — renders the dashboard from JSON data files.
// No build step, no dependencies. Loads data/manifest.json, then the day files.

const DIMENSIONS = [
  ["conflict", "Conflict / Peace"],
  ["economy", "Economy"],
  ["climate", "Climate"],
  ["humanInterest", "Human interest"],
  ["techProgress", "Tech / Progress"],
];

const REGIONS = [
  ["northAmerica", "North America"],
  ["southAmerica", "South America"],
  ["europe", "Europe"],
  ["africa", "Africa"],
  ["middleEast", "Middle East"],
  ["asia", "Asia"],
  ["oceania", "Oceania"],
];

const DIM_LABEL = Object.fromEntries(DIMENSIONS);
const REGION_LABEL = Object.fromEntries(REGIONS);

const SVGNS = "http://www.w3.org/2000/svg";

// Module state shared with the region modal.
let DAYS = [];        // full day objects, oldest -> newest
let TODAY = null;     // most recent day

// Map a 0-100 score to a colour from red (bad) through amber to green (good).
function scoreColor(v) {
  const hue = Math.max(0, Math.min(120, (v / 100) * 120)); // 0=red, 120=green
  return `hsl(${hue} 68% 45%)`;
}

function fmtDate(iso, opts) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", Object.assign({ timeZone: "UTC" }, opts));
}
const fmtLong = (iso) => fmtDate(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtShort = (iso) => fmtDate(iso, { day: "numeric", month: "short" });

async function getJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function main() {
  const app = document.getElementById("app");
  try {
    const manifest = await getJSON("data/manifest.json");
    const dates = (manifest.days || []).slice(0, 60).reverse(); // oldest -> newest
    const loaded = await Promise.allSettled(dates.map((d) => getJSON(`data/${d}.json`)));
    DAYS = loaded.filter((r) => r.status === "fulfilled").map((r) => r.value);
    if (!DAYS.length) throw new Error("no day data");
    TODAY = DAYS[DAYS.length - 1];
  } catch (err) {
    app.innerHTML = `<p style="padding:40px;color:var(--muted)">Couldn't load today's data. ${err.message}</p>`;
    return;
  }

  renderHero(TODAY, DAYS);
  renderHistoryChart(DAYS);
  renderDimensions(TODAY);
  renderRegions(TODAY);
  renderSummary(TODAY);
  renderDrivers(TODAY);
  renderSources(TODAY);
  initModal();
  app.setAttribute("aria-busy", "false");
}

function renderHero(day, days) {
  document.getElementById("date").textContent = fmtLong(day.date);
  document.getElementById("emoji").textContent = day.emoji || "";
  document.getElementById("label").textContent = day.label || "";
  document.getElementById("score").textContent = day.score;

  const C = 2 * Math.PI * 52; // r=52
  const fill = document.getElementById("gaugeFill");
  fill.style.strokeDasharray = C;
  requestAnimationFrame(() => {
    fill.style.strokeDashoffset = C * (1 - day.score / 100);
    fill.style.stroke = scoreColor(day.score);
  });

  const delta = document.getElementById("delta");
  if (days.length >= 2) {
    const diff = day.score - days[days.length - 2].score;
    if (diff === 0) {
      delta.textContent = "Unchanged from yesterday";
    } else {
      delta.textContent = `${diff > 0 ? "▲ +" : "▼ −"}${Math.abs(diff)} from yesterday`;
      delta.classList.add(diff > 0 ? "up" : "down");
    }
  } else {
    delta.textContent = "First day on record";
  }
}

/* ---------- Reusable line chart ---------- */
// series: [{ date, score }] oldest->newest. Renders into an <svg> with axes,
// gridlines, an area fill, and an interactive hover cursor + tooltip.
function drawLineChart(svg, tip, series, opts = {}) {
  const VB = svg.viewBox.baseVal;
  const W = VB.width, H = VB.height;
  const m = { top: 18, right: 16, bottom: 30, left: 34 };
  const innerW = W - m.left - m.right;
  const innerH = H - m.top - m.bottom;

  svg.innerHTML = "";
  if (series.length < 2) {
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", W / 2); t.setAttribute("y", H / 2);
    t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "axis-label");
    t.textContent = "A trend line appears once there are at least two days of history.";
    svg.appendChild(t);
    return;
  }

  // Fixed 0-100 domain keeps days comparable; pad x by half-step for single-ish sets.
  const yMin = 0, yMax = 100;
  const n = series.length;
  const x = (i) => m.left + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v) => m.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const add = (tag, attrs, cls) => {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (cls) el.setAttribute("class", cls);
    svg.appendChild(el);
    return el;
  };

  // Gradient def
  const grad = `<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${opts.color || "var(--accent)"}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${opts.color || "var(--accent)"}" stop-opacity="0"/>
    </linearGradient></defs>`;
  svg.insertAdjacentHTML("afterbegin", grad);

  // Horizontal gridlines + y labels at 0/25/50/75/100
  [0, 25, 50, 75, 100].forEach((gv) => {
    add("line", { x1: m.left, x2: m.left + innerW, y1: y(gv), y2: y(gv) }, "grid");
    const t = add("text", { x: m.left - 8, y: y(gv) + 4, "text-anchor": "end" }, "axis-label");
    t.textContent = gv;
  });

  // X labels: first, middle, last (avoid clutter)
  const xIdx = n <= 3 ? series.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];
  [...new Set(xIdx)].forEach((i) => {
    const t = add("text", { x: x(i), y: H - 10, "text-anchor": "middle" }, "axis-label");
    t.textContent = fmtShort(series[i].date);
  });

  const pts = series.map((s, i) => [x(i), y(s.score)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[n - 1][0].toFixed(1)} ${(m.top + innerH).toFixed(1)} L${pts[0][0].toFixed(1)} ${(m.top + innerH).toFixed(1)} Z`;

  const areaEl = add("path", { d: area }, "area");
  const lineEl = add("path", { d: line }, "line");
  if (opts.color) lineEl.style.stroke = opts.color;

  // Draw-on animation for the line.
  const len = lineEl.getTotalLength ? lineEl.getTotalLength() : 0;
  if (len) {
    lineEl.style.strokeDasharray = len;
    lineEl.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      lineEl.style.transition = "stroke-dashoffset 1s ease";
      lineEl.style.strokeDashoffset = "0";
    });
  }

  // End dot
  add("circle", { cx: pts[n - 1][0], cy: pts[n - 1][1], r: 4 }, "dot");

  // Interactive cursor + tooltip
  const cursor = add("line", { x1: 0, x2: 0, y1: m.top, y2: m.top + innerH, opacity: 0 }, "cursor");
  const marker = add("circle", { r: 4, opacity: 0 }, "marker");

  const move = (evt) => {
    const r = svg.getBoundingClientRect();
    const cx = (evt.touches ? evt.touches[0].clientX : evt.clientX) - r.left;
    const px = (cx / r.width) * W; // back to viewBox units
    let i = Math.round(((px - m.left) / innerW) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    const p = pts[i];
    cursor.setAttribute("x1", p[0]); cursor.setAttribute("x2", p[0]);
    cursor.setAttribute("opacity", 1);
    marker.setAttribute("cx", p[0]); marker.setAttribute("cy", p[1]); marker.setAttribute("opacity", 1);
    if (opts.color) marker.style.fill = opts.color;
    tip.hidden = false;
    tip.style.left = (p[0] / W) * 100 + "%";
    tip.style.top = (p[1] / H) * 100 + "%";
    tip.innerHTML = `<b>${series[i].score}</b><span class="tip-date">${fmtShort(series[i].date)}</span>`;
  };
  const leave = () => { cursor.setAttribute("opacity", 0); marker.setAttribute("opacity", 0); tip.hidden = true; };

  const hot = add("rect", { x: m.left, y: m.top, width: innerW, height: innerH }, "hot");
  hot.addEventListener("mousemove", move);
  hot.addEventListener("mouseleave", leave);
  hot.addEventListener("touchstart", move, { passive: true });
  hot.addEventListener("touchmove", move, { passive: true });
  hot.addEventListener("touchend", leave);
}

function renderHistoryChart(days) {
  const series = days.map((d) => ({ date: d.date, score: d.score }));
  drawLineChart(
    document.getElementById("historyChart"),
    document.getElementById("historyTip"),
    series
  );
  const cap = document.getElementById("historyCaption");
  if (series.length >= 2) {
    const scores = series.map((s) => s.score);
    cap.textContent = `${series.length} days · low ${Math.min(...scores)} · high ${Math.max(...scores)}`;
  } else {
    cap.textContent = "Building history — one day so far";
  }
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
    return `<button class="region" style="--region:${scoreColor(v)}" data-region="${key}" aria-label="${name}: ${v}. View regional trend.">
      <div class="region-name">${name}</div>
      <div class="region-val">${v}</div>
      <div class="region-cta">View trend →</div>
    </button>`;
  }).join("");
  root.querySelectorAll(".region").forEach((btn) => {
    btn.addEventListener("click", () => openRegion(btn.dataset.region));
  });
}

function renderSummary(day) {
  const root = document.getElementById("summary");
  const paras = (day.summary || "").split(/\n\n+/).filter(Boolean);
  root.innerHTML = paras.map((p) => `<p>${escapeHTML(p)}</p>`).join("");
}

function driverHTML(d) {
  const dir = d.direction === "down" ? "down" : "up";
  const arrow = dir === "down" ? "▼" : "▲";
  const tags = [
    d.dimension ? `<span class="tag">${DIM_LABEL[d.dimension] || d.dimension}</span>` : "",
    d.region ? `<span class="tag">${REGION_LABEL[d.region] || d.region}</span>` : "",
  ].join("");
  return `<li class="driver ${dir}">
    <span class="arrow">${arrow}</span>
    <div>
      <a href="${escapeAttr(d.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(d.headline)}</a>${tags}
      <div class="meta">${escapeHTML(d.source || "")}</div>
    </div>
  </li>`;
}

function renderDrivers(day) {
  document.getElementById("drivers").innerHTML = (day.drivers || []).map(driverHTML).join("");
}

function renderSources(day) {
  const root = document.getElementById("sources");
  const list = day.sources_consulted || [];
  if (!list.length) { root.style.display = "none"; return; }
  root.innerHTML = `<b>Sources consulted today:</b> ${list.map(escapeHTML).join(" · ")}`;
}

/* ---------- Regional drill-down modal ---------- */
let lastFocused = null;

function initModal() {
  const backdrop = document.getElementById("regionModal");
  document.getElementById("modalClose").addEventListener("click", closeRegion);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeRegion(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.hidden) closeRegion();
  });
}

function openRegion(key) {
  const name = REGION_LABEL[key] || key;
  const todayVal = TODAY.regions?.[key] ?? 0;
  const color = scoreColor(todayVal);

  document.getElementById("modalTitle").textContent = name;
  const scoreEl = document.getElementById("modalScore");
  scoreEl.textContent = todayVal;
  scoreEl.style.color = color;

  // Region trend series (only days that carry this region).
  const series = DAYS
    .filter((d) => d.regions && d.regions[key] != null)
    .map((d) => ({ date: d.date, score: d.regions[key] }));

  document.getElementById("modalLegend").innerHTML =
    `<span><i style="background:${color}"></i> ${name} mood</span>` +
    `<span><i style="background:var(--line-strong)"></i> 0–100 scale</span>`;

  // Stories tagged to this region across loaded days, newest first.
  const stories = [];
  for (let i = DAYS.length - 1; i >= 0 && stories.length < 8; i--) {
    (DAYS[i].drivers || []).forEach((d) => { if (d.region === key) stories.push(d); });
  }
  const list = document.getElementById("regionDrivers");
  list.innerHTML = stories.length
    ? stories.map(driverHTML).join("")
    : `<li class="driver"><span class="arrow">·</span><div><div class="meta">No region-tagged stories yet. As future days tag their drivers by region, they'll collect here.</div></div></li>`;

  const backdrop = document.getElementById("regionModal");
  lastFocused = document.activeElement;
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("modalClose").focus();

  // Draw after layout so the SVG has its rendered width.
  requestAnimationFrame(() => {
    drawLineChart(
      document.getElementById("regionChart"),
      document.getElementById("regionTip"),
      series,
      { color }
    );
  });
}

function closeRegion() {
  const backdrop = document.getElementById("regionModal");
  backdrop.hidden = true;
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
function escapeAttr(s) { return escapeHTML(s); }

main();
