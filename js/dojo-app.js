/**
 * DOJO / Colossus data plane UI
 * Letter atoms · Pattern matrix · Live pipe · multi-layout geometry
 */

import {
  analyzeLevel,
  pipe,
  colossusSnapshot,
  colossusSnapshotFull,
  installGlobalAPI,
} from "./pipeline.js";
import {
  letterAtom,
  alphabetAtoms,
  layoutAtoms,
  patternMatrix,
  patternMatrixSlots,
  atomAtSlot,
  wordLetterBreakdown,
  FINGER_SHORT,
} from "./letter-atom.js";
import {
  LAYOUT_RING_ORDER,
  KEYBOARD_LAYOUTS,
  BASE_LAYOUT_ID,
} from "./layouts.js";
import { MCP_TOOLS, SCHEMA_VERSION, ANALYSIS_LEVELS } from "./schema.js";
import { downloadText } from "./export.js";
import {
  buildLanguageAlphabetMatrix,
  languageAlphabetMatrixHtml,
  languageAlphabetMatrixExport,
} from "./language-alphabet-matrix.js";
import {
  computeWorldPath,
  worldPathHtml,
  worldPathSnapshot,
} from "./world-path.js";
import {
  encodeGlyphInSteno,
  decodeGlyphFromSteno,
  broadcastGlyphSteno,
  glyphFromText,
  glyphGridHtml,
  DEFAULT_GLYPH_N,
} from "./glyph-steno.js";
import {
  buildStairGlyphStream,
  stairGlyphStreamHtml,
  interpretGlyphImage,
  ensureStreamStack,
  STREAM_RAILS,
  renderHexLumCanvas,
  dacClassify,
} from "./stair-glyph-stream.js";
import { analyzeStenoSpace, analyzeBlankSpace } from "./steno-strip.js";
import { classifyGutterLine, binaryStreamToGutter } from "./quantum-gutter.js";
import { getGluelamStatus } from "./gluelam-consumer.js";

const $ = (sel) => document.querySelector(sel);

/** @type {object|null} */
let lastLanguageSolve = null;
/** @type {object|null} */
let lastStairStream = null;

/** @type {string} */
let activeLetter = "a";
/** @type {string|null} */
let activeSlot = null;
/** @type {string} */
let matrixBase = BASE_LAYOUT_ID;
/** @type {string} */
let atomLayout = BASE_LAYOUT_ID;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

function initTheme() {
  const btn = $("#theme-toggle");
  if (!btn) return;
  const apply = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("kbatch-dict-theme", theme);
    } catch {
      /* */
    }
  };
  btn.addEventListener("click", () => {
    const cur =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    apply(cur === "light" ? "dark" : "light");
  });
}

function fillLayouts() {
  const opts = LAYOUT_RING_ORDER.map((id) => {
    const L = KEYBOARD_LAYOUTS[id];
    return `<option value="${id}">${escapeHtml(L.name)} · ${escapeHtml(L.script)}</option>`;
  }).join("");
  const pipe = $("#pipe-layout");
  if (pipe) pipe.innerHTML = opts;
  const atomSel = $("#atom-layout");
  if (atomSel) {
    atomSel.innerHTML = opts;
    atomSel.value = atomLayout;
  }
  const matSel = $("#matrix-base");
  if (matSel) {
    matSel.innerHTML = opts;
    matSel.value = matrixBase;
  }
}

async function loadCorpusStats() {
  try {
    const res = await fetch("../data/word-index.json", { cache: "default" });
    if (!res.ok) throw new Error(String(res.status));
    const idx = await res.json();
    const el = $("#stat-spellings");
    if (el) el.textContent = Number(idx.total || 0).toLocaleString();
    const langEl = $("#stat-langs");
    try {
      const lr = await fetch("../data/words/lang-index.json", { cache: "default" });
      if (lr.ok) {
        const cat = await lr.json();
        if (langEl) {
          langEl.textContent = `${cat.packsReady || 0}/${cat.total || 88}`;
        }
      }
    } catch {
      if (langEl) langEl.textContent = "24+";
    }
  } catch {
    const el = $("#stat-spellings");
    if (el) el.textContent = "—";
  }
}

function renderStats() {
  const matrix = patternMatrix({ baseLayout: matrixBase });
  const slots = Object.keys(matrix).filter((k) => k.startsWith("r")).length;
  const set = (id, v) => {
    const el = $(id);
    if (el) el.textContent = v;
  };
  set("#stat-schema", SCHEMA_VERSION);
  set("#stat-letters", String(layoutAtoms(atomLayout).length));
  set("#stat-layouts", String(LAYOUT_RING_ORDER.length));
  set("#stat-slots", String(slots));
  set("#stat-levels", String(ANALYSIS_LEVELS.length));
  set("#stat-mcp", String(MCP_TOOLS.length));
}

function renderLetterGrid() {
  const grid = $("#letter-atom-grid");
  if (!grid) return;
  const atoms = layoutAtoms(atomLayout);
  // Prefer latin a–z first, then remaining layout glyphs
  const latin = alphabetAtoms();
  const extra = atoms.filter(
    (a) => !latin.some((l) => l.letter === a.letter || l.display === a.display)
  );
  const list = [...latin, ...extra];

  grid.innerHTML = list
    .map((a) => {
      const ch = a.display || a.upper || a.letter;
      const on =
        activeLetter === a.letter || activeLetter === a.display ? "is-active" : "";
      const home = a.home ? "is-home" : "";
      const miss = a.presentCount === 0 ? "is-miss" : "";
      return `<button type="button" class="letter-atom-btn ${on} ${home} ${miss}" data-letter="${escapeHtml(a.display || a.letter)}" title="${escapeHtml(a.unicode)} · ${a.presentCount}/${a.layoutCount} layouts · slot ${a.patternSlot || "—"}">${escapeHtml(ch)}</button>`;
    })
    .join("");

  // default selection
  const want = activeLetter || "a";
  const first =
    grid.querySelector(`[data-letter="${want}"]`) ||
    grid.querySelector("[data-letter='a']") ||
    grid.querySelector(".letter-atom-btn");
  if (first) {
    first.classList.add("is-active");
    showLetterDetail(first.dataset.letter);
  }
}

function showLetterDetail(letter) {
  activeLetter = letter;
  const a = letterAtom(letter);
  const el = $("#letter-atom-detail");
  if (!el) return;
  if (!a) {
    el.innerHTML = `<p class="dojo-muted">No atom for “${escapeHtml(letter)}”</p>`;
    return;
  }

  // highlight matrix slot
  if (a.patternSlot) {
    activeSlot = a.patternSlot;
    highlightMatrixSlot(a.patternSlot);
  }

  const rows = LAYOUT_RING_ORDER.map((id) => {
    const p = a.placements[id];
    const present = p?.present;
    const geo = a.geometricGlyphs?.[id] || "·";
    return `<tr class="${present ? "is-present" : "is-absent"}" data-layout="${escapeHtml(id)}">
      <td class="lay-name">${escapeHtml(p?.name || id)}</td>
      <td class="lay-script">${escapeHtml(p?.script || "—")}</td>
      <td>${present ? `${p.r},${p.c}` : "—"}</td>
      <td class="lay-key">${present ? escapeHtml(p.key) : "·"}</td>
      <td class="lay-geo" title="Same physical path as base">${escapeHtml(geo)}</td>
      <td>${present ? escapeHtml(p.fingerShort || p.finger) : "—"}</td>
      <td class="mono">${present ? escapeHtml(p.patternSlot) : "—"}</td>
      <td>${present && p.home ? "●" : ""}</td>
    </tr>`;
  }).join("");

  const neigh = ["N", "S", "W", "E"]
    .map((d) => {
      const n = a.neighbors?.[d];
      if (!n) return `<span class="neigh-chip is-empty">${d}</span>`;
      return `<button type="button" class="neigh-chip" data-letter="${escapeHtml(n.qwerty)}" title="${escapeHtml(n.patternSlot)}">${d}·${escapeHtml(n.qwerty)}</button>`;
    })
    .join("");

  const strip = a.analysis?.strip?.label || "—";
  const metrics = a.analysis?.metrics;

  el.innerHTML = `
    <div class="atom-hero">
      <div class="atom-glyph" title="${escapeHtml(a.unicode)}">${escapeHtml(a.display || a.upper)}</div>
      <div class="atom-hero-meta">
        <h3>${escapeHtml(a.display || a.upper)} <span class="atom-u">${escapeHtml(a.unicode)}</span></h3>
        <p class="atom-slot-line">
          Pattern slot <b class="mono">${escapeHtml(a.patternSlot || "—")}</b>
          · finger <b>${escapeHtml(a.finger || "—")}</b>
          · ${a.home ? "home row" : "off-home"}
          · present on <b>${a.presentCount}/${a.layoutCount}</b> layouts
        </p>
        <div class="atom-meta">
          <span>Braille <b>${escapeHtml(a.encodings.braille || "—")}</b></span>
          <span>Morse <b>${escapeHtml(a.encodings.morse || "—")}</b></span>
          <span>NATO <b>${escapeHtml(a.encodings.nato || "—")}</b></span>
          <span>ASL <b>${escapeHtml(a.encodings.asl || "—")}</b></span>
          <span>BSL <b>${escapeHtml(a.encodings.bsl || "—")}</b></span>
          <span>Strip <b class="mono">${escapeHtml(strip)}</b></span>
        </div>
        ${
          metrics
            ? `<p class="atom-metrics">E ${metrics.efficiency ?? "—"} · C ${metrics.complexity ?? "—"} · S ${metrics.strain ?? "—"} · RSI ${metrics.rsiRisk ?? "—"}</p>`
            : ""
        }
        <div class="atom-neighbors" aria-label="QWERTY neighbors">${neigh}</div>
        <p class="atom-refs">
          <a href="${escapeHtml(a.refs.oed)}" target="_blank" rel="noopener">OED</a> ·
          <a href="${escapeHtml(a.refs.wiktionary)}" target="_blank" rel="noopener">Wiktionary</a> ·
          <a href="${escapeHtml(a.refs.wiki)}" target="_blank" rel="noopener">Wikipedia</a>
        </p>
      </div>
    </div>
    <table class="placement-table">
      <thead>
        <tr>
          <th>Layout</th><th>Script</th><th>r,c</th><th>Key</th>
          <th>Path glyph</th><th>Finger</th><th>Slot</th><th>Home</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function highlightMatrixSlot(slot) {
  const table = $("#matrix-table");
  if (!table) return;
  table.querySelectorAll("td.is-active-slot, tr.is-active-row").forEach((n) => {
    n.classList.remove("is-active-slot", "is-active-row");
  });
  const cell = table.querySelector(`td[data-slot="${slot}"]`);
  if (cell) {
    cell.classList.add("is-active-slot");
    cell.closest("tr")?.classList.add("is-active-row");
    cell.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

function renderMatrix() {
  const matrix = patternMatrix({ baseLayout: matrixBase });
  const table = $("#matrix-table");
  if (!table) return;
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  // ALL geometric layouts in ring order — full DOJO pattern matrix
  const layoutIds = LAYOUT_RING_ORDER.slice();
  const baseName = KEYBOARD_LAYOUTS[matrixBase]?.name || matrixBase;

  thead.innerHTML = `<tr>
    <th class="slot sticky-col">slot</th>
    <th class="meta-h">row</th>
    <th class="meta-h">finger</th>
    ${layoutIds
      .map((id) => {
        const L = KEYBOARD_LAYOUTS[id];
        const on = id === matrixBase ? "is-base-col" : "";
        // Full short name (not truncated mid-word) so all 15 stay readable
        const short =
          L.shortName ||
          L.name.replace(/\s*\(.*?\)\s*/g, " ").trim().split(/\s+/)[0] ||
          id;
        return `<th class="${on}" title="${escapeHtml(L.name)} · ${escapeHtml(
          L.script
        )} · ${escapeHtml(L.region || "")} · id ${escapeHtml(id)}"><span class="th-id">${escapeHtml(
          id
        )}</span><span class="th-name">${escapeHtml(short)}</span></th>`;
      })
      .join("")}
  </tr>`;

  // ALL physical slots for base layout (full letter board)
  const slots = patternMatrixSlots({ baseLayout: matrixBase });
  tbody.innerHTML = slots
    .map((slot) => {
      const row = matrix[slot];
      const meta = row._meta || {};
      const home = meta.home ? "is-home-row" : "";
      const active = slot === activeSlot ? "is-active-row" : "";
      const finger = meta.fingerShort || FINGER_SHORT[meta.c] || "—";
      return `<tr class="${home} ${active}" data-slot-row="${escapeHtml(slot)}">
        <td class="slot mono sticky-col" data-slot="${escapeHtml(
          slot
        )}" title="Physical pattern slot">${escapeHtml(slot)}</td>
        <td class="meta-c">${escapeHtml(meta.rowName || "—")}</td>
        <td class="meta-c finger-${escapeHtml(String(finger).toLowerCase())}">${escapeHtml(
        finger
      )}</td>
        ${layoutIds
          .map((id) => {
            const g = row[id] ?? "·";
            const base = id === matrixBase ? "is-base-col" : "";
            const sel = slot === activeSlot ? "is-active-slot" : "";
            return `<td class="glyph-cell ${base} ${sel}" data-slot="${escapeHtml(
              slot
            )}" data-layout="${escapeHtml(id)}" data-glyph="${escapeHtml(
              g
            )}" title="${escapeHtml(KEYBOARD_LAYOUTS[id].name)} · ${escapeHtml(
              slot
            )} · ${escapeHtml(g)}">${escapeHtml(g)}</td>`;
          })
          .join("")}
      </tr>`;
    })
    .join("");

  const cap = $("#matrix-caption");
  if (cap) {
    cap.textContent = `ALL · base ${baseName} · ${slots.length} slots × ${layoutIds.length} layouts · every geometric board · click cell → letter atom`;
  }
  const countEl = $("#matrix-full-count");
  if (countEl) {
    countEl.textContent = `${slots.length}×${layoutIds.length}`;
  }
}

function onMatrixClick(ev) {
  const td = ev.target.closest("td[data-slot]");
  if (!td) return;
  const slot = td.getAttribute("data-slot");
  const layout = td.getAttribute("data-layout") || matrixBase;
  const glyph = td.getAttribute("data-glyph");
  activeSlot = slot;
  highlightMatrixSlot(slot);

  // Prefer glyph from clicked layout; fallback atom at slot on base
  let ch = glyph && glyph !== "·" ? glyph : null;
  if (!ch) {
    const a = atomAtSlot(slot, matrixBase);
    ch = a?.display || a?.letter;
  }
  if (ch) {
    activeLetter = ch;
    // update grid highlight
    const grid = $("#letter-atom-grid");
    grid?.querySelectorAll(".letter-atom-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.letter === ch);
    });
    showLetterDetail(ch);
  }
  const line = $("#dojo-status");
  if (line) {
    line.textContent = `Matrix · ${slot} · ${KEYBOARD_LAYOUTS[layout]?.name || layout} · “${ch || "·"}”`;
  }
}

function renderWordView(word) {
  const layout = $("#pipe-layout")?.value || matrixBase || "qwerty";
  const env = analyzeLevel(word, { level: "word", layout });
  const el = $("#dojo-word-view");
  if (!el) return;
  const breakdown = wordLetterBreakdown(word);
  const path = breakdown.path || [];
  const glyphs = breakdown.pathGlyphs || {};

  const pathHtml = path
    .map(
      (s) =>
        `<button type="button" class="slot-chip" data-slot="${escapeHtml(s)}">${escapeHtml(s)}</button>`
    )
    .join("");

  const atomTrail = (breakdown.atoms || [])
    .map((a) => {
      if (a.type === "space") return `<span class="atom-trail-sp">␣</span>`;
      const ch = a.ch;
      const slot = a.atom?.patternSlot || "·";
      return `<button type="button" class="atom-trail-ch" data-letter="${escapeHtml(ch)}" title="${escapeHtml(slot)}">${escapeHtml(ch)}<small>${escapeHtml(slot)}</small></button>`;
    })
    .join("");

  const glyphRows = LAYOUT_RING_ORDER.map((id) => {
    const name = KEYBOARD_LAYOUTS[id].name;
    return `<div class="glyph-row"><em>${escapeHtml(name)}</em><b dir="${escapeHtml(KEYBOARD_LAYOUTS[id].dir || "ltr")}">${escapeHtml(glyphs[id] || "—")}</b></div>`;
  }).join("");

  el.innerHTML = `
    <div class="dojo-strip">${escapeHtml(env.strip?.label || "—")}</div>
    <div class="dojo-caption-out">${escapeHtml(env.streams?.caption_out || "")}</div>
    <p class="dojo-muted" style="margin:0 0 6px">Letter atoms in word (click → atom detail)</p>
    <div class="atom-trail">${atomTrail || "—"}</div>
    <p class="dojo-muted" style="margin:8px 0 6px">Pattern path (${path.length} slots)</p>
    <div class="path-slots">${pathHtml || "—"}</div>
    <p class="dojo-muted" style="margin:8px 0 6px">Same physical path → glyph string on each layout</p>
    <div class="glyph-rows">${glyphRows}</div>
    <pre class="dojo-json" style="margin-top:12px;max-height:240px">${escapeHtml(
      pretty({
        word: env.text,
        encodings: env.encodings,
        metrics: env.metrics,
        path,
        jax: env.jax,
        children: (env.children || []).map((c) => c.text),
        refs: env.refs,
      })
    )}</pre>
  `;
}

function renderMcp() {
  const list = $("#mcp-list");
  if (!list) return;
  list.innerHTML = MCP_TOOLS.map(
    (t) => `
    <div class="mcp-card">
      <h3>${escapeHtml(t.name)}</h3>
      <p>${escapeHtml(t.description)}</p>
    </div>
  `
  ).join("");
}

/** @type {string} */
let langAlphaTier = "all";
/** @type {string|null} */
let langAlphaScript = null;
/** Full master grid on DOJO (all langs × all alphabet columns) */
let langAlphaGridMode = true;

function renderLangAlphabetMatrix() {
  const body = $("#lang-alpha-matrix-body");
  const st = $("#lam-status");
  if (!body) return;
  // Always build the full 88-language atlas; tier filter applied in HTML
  const matrix = buildLanguageAlphabetMatrix({
    tier: undefined,
  });
  const html = languageAlphabetMatrixHtml(matrix, {
    filterTier: langAlphaTier,
    full: true,
    maxChars: "all",
    gridMode: langAlphaGridMode,
  });
  body.innerHTML = html;
  if (langAlphaScript) {
    body.querySelectorAll("tbody tr").forEach((tr) => {
      const show = tr.getAttribute("data-script") === langAlphaScript;
      tr.hidden = !show;
    });
  }
  const visible = body.querySelectorAll("tbody tr:not([hidden])").length;
  if (st) {
    st.textContent = `ALL · ${matrix.totalLanguages} languages (${visible} shown) · ${
      Object.keys(matrix.byScript).length
    } scripts · max α ${matrix.maxAlphabetLength} · tier ${langAlphaTier}${
      langAlphaScript ? ` · ${langAlphaScript}` : ""
    } · ${langAlphaGridMode ? "grid" : "list"}`;
  }
  // mode toggle (injected toolbar)
  body.querySelectorAll("[data-lam-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.getAttribute("data-lam-mode");
      langAlphaGridMode = m !== "list";
      renderLangAlphabetMatrix();
    });
  });
  // re-bind filter chips inside generated HTML
  body.querySelectorAll("[data-tier-filter]").forEach((btn) => {
    btn.classList.toggle("is-on", btn.getAttribute("data-tier-filter") === langAlphaTier);
    btn.addEventListener("click", () => {
      langAlphaTier = btn.getAttribute("data-tier-filter") || "all";
      langAlphaScript = null;
      renderLangAlphabetMatrix();
    });
  });
  body.querySelectorAll("[data-script-filter]").forEach((btn) => {
    btn.classList.toggle(
      "is-on",
      btn.getAttribute("data-script-filter") === langAlphaScript
    );
    btn.addEventListener("click", () => {
      const s = btn.getAttribute("data-script-filter");
      langAlphaScript = langAlphaScript === s ? null : s;
      renderLangAlphabetMatrix();
    });
  });
  body.querySelectorAll("[data-lang]").forEach((btn) => {
    if (btn.tagName !== "BUTTON") return;
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-lang");
      const stLine = $("#dojo-status");
      if (stLine) stLine.textContent = `Language alphabet · ${id} · full matrix`;
      // Prefer first letter of that alphabet as atom focus if Latin-ish
      const row = matrix.rows.find((r) => r.id === id);
      if (row?.alphabet?.[0]) {
        const ch = row.alphabet[0];
        if (ch.length === 1) {
          try {
            showLetterDetail(ch);
          } catch {
            /* */
          }
        }
      }
    });
  });
}

function runPipe() {
  const text = $("#pipe-input")?.value || "";
  const channel = $("#pipe-channel")?.value || "caption_in";
  const layout = $("#pipe-layout")?.value || "qwerty";
  const levelRaw = $("#pipe-level")?.value || "auto";
  const level = levelRaw === "auto" ? undefined : levelRaw;

  const env =
    channel === "dict_lookup" || channel === "caption_in" || channel === "jax_tensor"
      ? pipe(channel, text, { layout, level })
      : analyzeLevel(text, {
          level: level || undefined,
          layout,
          caption_in: channel === "caption_in" ? text : null,
          source: `dojo:${channel}`,
        });

  const strip = $("#pipe-strip");
  const cap = $("#pipe-caption-out");
  const json = $("#pipe-json");
  if (strip) strip.textContent = env.strip?.label || "—";
  if (cap) cap.textContent = `caption_out · ${env.streams?.caption_out || "—"}`;
  if (json) {
    json.textContent = pretty({
      id: env.id,
      level: env.level,
      layout: env.layout,
      strip: env.strip,
      metrics: env.metrics,
      streams: env.streams,
      encodings: env.encodings,
      patterns: env.patterns
        ? {
            path: env.patterns.path,
            pathGlyphs: env.patterns.pathGlyphs
              ? Object.fromEntries(
                  Object.entries(env.patterns.pathGlyphs).slice(0, 8)
                )
              : undefined,
            layoutCoverage: env.patterns.layoutCoverage,
          }
        : null,
      jax: env.jax,
      llm: env.llm,
      mcp: env.mcp,
      children: (env.children || []).map((c) => ({
        id: c.id,
        level: c.level,
        text: c.text,
        strip: c.strip?.label,
      })),
      refs: env.refs,
      meta: env.meta,
    });
  }
  const st = $("#dojo-status");
  if (st) st.textContent = `Pipe · ${env.level} · ${layout} · ${env.strip?.label || ""}`;
}

/** @type {ReturnType<typeof computeWorldPath>|null} */
let lastWorldPath = null;

function runWorldPath() {
  const from = ($("#wpath-from")?.value || "en").trim() || "en";
  const mode = $("#wpath-mode")?.value || "full";
  const includeHonor = Boolean($("#wpath-honor")?.checked);
  const path = computeWorldPath({
    from,
    mode,
    includeHonor,
    includePlaceholder: mode === "full" || mode === "ladder",
    readyOnly: mode === "ready",
  });
  lastWorldPath = path;
  const body = $("#wpath-body");
  if (body) body.innerHTML = worldPathHtml(path, { limit: 32 });
  const st = $("#wpath-status");
  if (st) {
    st.textContent = `${path.stepCount} steps · cost ${path.totalTransferCost} · from ${path.origin?.id}`;
  }
  const line = $("#dojo-status");
  if (line) {
    line.textContent = `World path · ${mode} · ${path.stepCount} langs · portals ${path.portals?.length || 0}`;
  }
  return path;
}

async function loadWorldAxes() {
  const st = $("#axes-status");
  const body = $("#axes-body");
  if (st) st.textContent = "Loading axes + Rubik language solve…";
  try {
    const full = await colossusSnapshotFull(
      ["liberty", "water", "path", "language"],
      $("#pipe-layout")?.value || "qwerty",
      {
        from: ($("#wpath-from")?.value || "en").trim() || "en",
        concepts: ["liberty", "water", "path", "language", "sun", "earth"],
        includePaths: true,
      }
    );
    const axes = full.axes?.axes?.axes || full.axes?.axes || [];
    const list = Array.isArray(axes) ? axes : [];
    const solve = full.languageSolve || full.rubikLanguageSolve || full.axes?.languageSolve;
    const pureC = solve?.pureC || {};
    const demos = solve?.demos || [];
    const readySteps =
      pureC.readySteps ?? full.worldPath?.ready?.stepCount ?? "—";
    const readyCost =
      pureC.readyFromEn ?? full.worldPath?.ready?.totalTransferCost ?? "—";

    const stairFillBits = solve?.stairFill
      ? Object.entries(solve.stairFill)
          .map(([lang, v]) => {
            const pct = v?.pct ?? v;
            return `<span class="chip" title="${escapeHtml(lang)} fill">${escapeHtml(lang)} ${escapeHtml(String(pct))}%</span>`;
          })
          .join("")
      : "";

    const demoCards = demos
      .slice(0, 8)
      .map((d) => {
        const slug = d.concept?.slug || d.q || "?";
        const fill = `${d.filled ?? "—"}/${d.of ?? 13}`;
        const line = d.stairLine || "";
        return `<div class="axis-mini axis-solve-demo">
          <div class="axis-mini-head"><b>${escapeHtml(slug)}</b>
            <span class="mono">${escapeHtml(fill)}</span></div>
          <div class="dojo-muted">${escapeHtml(d.concept?.gloss_en || "")}</div>
          <div class="chips stair-line mono" style="font-size:0.72rem;flex-wrap:wrap;gap:4px;margin-top:4px">${escapeHtml(line)}</div>
        </div>`;
      })
      .join("");

    if (body) {
      body.innerHTML = `
        <p class="dojo-muted">Rung <b>${escapeHtml(full.axes?.rung || full.rung || "R3-scaffold")}</b> ·
          collaborators <b>${full.collaborators?.count ?? "—"}</b> ·
          senses pilot <b>${full.senses?.count ?? "—"}</b> ·
          music <b>${escapeHtml(full.musicRights?.status || "—")}</b></p>

        <div class="dojo-solve-banner" style="margin:10px 0;padding:10px 12px;border:1px solid var(--border, #30363d);border-radius:8px">
          <h3 style="margin:0 0 6px;font-size:0.95rem">Rubik language solve · AI start</h3>
          <p class="dojo-muted" style="margin:0 0 8px">
            <strong>Speed path</strong> pure C ready · <b>${escapeHtml(String(readySteps))}</b> steps · Σc <b>${escapeHtml(String(readyCost))}</b>
            · tour Σc <b>${escapeHtml(String(pureC.tourDirectHopSumC ?? 83.5))}</b>
            · order <code style="font-size:0.75rem">${escapeHtml(pureC.tourVisitOrder || "en→…→chr")}</code>
          </p>
          <p class="dojo-muted" style="margin:0 0 8px">
            <strong>Meaning stair</strong> demos avg filled <b>${escapeHtml(String(solve?.metrics?.avgFilled ?? "—"))}/13</b>
            · full13 <b>${escapeHtml(String(solve?.metrics?.full13 ?? "—"))}</b>
            · mesh instant · honor seeds on stair
          </p>
          <div class="chips" style="margin-bottom:8px">${stairFillBits}</div>
          <p class="dojo-muted" style="margin:0;font-size:0.78rem">
            AI: <code>await kbatchDict.rubikLanguageSolve()</code> ·
            <code>colossusFull()</code> ·
            <code>mcp("kbatch_concept_solve",{q:"liberty",mode:"stair"})</code>
          </p>
        </div>

        <div class="axes-cards">
          ${list
            .map((a) => {
              const pct = Math.round((a.scoreToday || 0) * 100);
              return `<div class="axis-mini">
                <div class="axis-mini-head"><b>${escapeHtml(a.name || a.key)}</b>
                  <span class="mono">${pct}% → ${Math.round((a.scoreTarget || 0) * 100)}%</span></div>
                <div class="bar"><i style="width:${pct}%"></i></div>
                <div class="dojo-muted">dialed <code>${escapeHtml(a.dialedTo || "—")}</code> · ${escapeHtml(a.status || "")}</div>
                <div class="chips">${(a.liveStrengths || [])
                  .slice(0, 3)
                  .map((s) => `<span class="chip">${escapeHtml(s)}</span>`)
                  .join("")}</div>
              </div>`;
            })
            .join("")}
        </div>

        <h3 style="margin:14px 0 8px;font-size:0.9rem">Stair demos · instant all-language</h3>
        <div class="axes-cards">${demoCards || `<p class="dojo-muted">No stair demos — mesh may still be loading</p>`}</div>
        <div id="stair-stream-mount" class="stair-stream-mount" aria-live="polite">
          <p class="dojo-muted">Building exemplary stream rail (DAC · Gutter · IronLine · GlueLam · steno · glyph)…</p>
        </div>

        <pre class="dojo-json" style="max-height:200px;margin-top:10px">${escapeHtml(
          pretty({
            aiStart: true,
            pipe: full.pipe,
            languageSolve: solve
              ? {
                  metrics: solve.metrics,
                  pureC: {
                    tourDirectHopSumC: pureC.tourDirectHopSumC,
                    readyFromEn: pureC.readyFromEn,
                    readySteps: pureC.readySteps,
                  },
                  agent: solve.agent,
                  demos: demos.map((d) => ({
                    slug: d.concept?.slug || d.q,
                    filled: d.filled,
                    of: d.of,
                    stairLine: d.stairLine,
                  })),
                }
              : null,
            streamNote: "use ensureStreamStack()/stairGlyphStream liveIds — not a vanity rail list",
            pathways: full.axes?.pathways
              ? Object.fromEntries(
                  Object.entries(full.axes.pathways).map(([k, v]) => [
                    k,
                    { dialedTo: v?.dialedTo, phases: (v?.phases || []).map((p) => `${p.id}:${p.status}`) },
                  ])
                )
              : null,
            outreach: full.axes?.outreach,
            glyphSteno: full.glyphSteno,
          })
        )}</pre>
      `;
    }
    lastLanguageSolve = solve || null;

    // Exemplary stream rail under stair demos (async, non-blocking UI first paint)
    mountStairStreamRail(solve).catch((e) => {
      const mount = $("#stair-stream-mount");
      if (mount) {
        mount.innerHTML = `<p class="dojo-muted">Stream rail error: ${escapeHtml(String(e?.message || e))}</p>`;
      }
    });

    if (st) {
      st.textContent = `Loaded · ${list.length} axes · ready ${readySteps} · stair avg ${solve?.metrics?.avgFilled ?? "—"}/13 · stream rail…`;
    }
    return full;
  } catch (e) {
    if (st) st.textContent = `Error · ${e?.message || e}`;
    if (body) body.innerHTML = `<p class="dojo-muted">${escapeHtml(String(e?.message || e))}</p>`;
    return null;
  }
}

/**
 * Exemplary: stair demos → DAC/Gutter/IronLine/Gluelam/steno/glyph stream.
 * @param {object|null} solve
 */
async function mountStairStreamRail(solve) {
  const mount = $("#stair-stream-mount");
  if (!mount) return null;
  if (!solve) {
    mount.innerHTML = `<p class="dojo-muted">No languageSolve — stream rail idle</p>`;
    return null;
  }
  const n = Number($("#glyph-n")?.value) || DEFAULT_GLYPH_N;
  const stream = await buildStairGlyphStream(solve, {
    n,
    broadcast: false,
    limit: 13,
  });
  lastStairStream = stream;
  mount.innerHTML = stairGlyphStreamHtml(stream, escapeHtml);

  // Seed glyph panel carrier from composite stair line
  const carrierEl = $("#glyph-carrier");
  if (carrierEl && stream.composite?.carrier) {
    carrierEl.value = stream.composite.carrier.slice(0, 500);
  }
  const prev = $("#glyph-steno-preview");
  if (prev && stream.composite?.glyph?.gridHtml) {
    prev.innerHTML = stream.composite.glyph.gridHtml;
  }
  const hexCanvas = $("#glyph-hexlum-canvas");
  if (hexCanvas && stream.composite?.pcap && !stream.composite.pcap.error) {
    // hexlum may need full envelope — rebuild light preview from carrier
    try {
      const { buildHexLum, createForgeMark } = await import("./pcap-image-bridge.js");
      const mark = await createForgeMark({
        slot: 1,
        source: "dojo-stair-stream",
        content: stream.composite.carrier,
      });
      const hex = await buildHexLum(stream.composite.carrier, n, mark);
      renderHexLumCanvas(hexCanvas, { hexlum: hex });
    } catch {
      /* optional */
    }
  }
  refreshGlyphRailStatus(stream);
  const st = $("#axes-status");
  if (st) {
    st.textContent = `${st.textContent.replace(/ · stream rail…$/, "")} · stream rails live`;
  }
  const line = $("#dojo-status");
  if (line) {
    line.textContent = `Stair stream · ${stream.concept?.slug || "—"} · glyph ones ${stream.composite?.glyph?.ones ?? "—"} · ${STREAM_RAILS.length} rails`;
  }
  window.__DOJO_STAIR_STREAM__ = stream;
  return stream;
}

function refreshGlyphRailStatus(streamOrProbe) {
  const el = $("#glyph-rail-status");
  if (!el) return;
  const rails = streamOrProbe?.stack?.rails || streamOrProbe?.rails || null;
  if (rails && typeof rails === "object") {
    el.innerHTML = Object.entries(rails)
      .map(([id, r]) => {
        const live = !!r.live;
        const tip = live
          ? `${r.name || id} · ${JSON.stringify(r.evidence || {}).slice(0, 100)}`
          : `${r.name || id} · DEAD · ${r.error || "not loaded"}`;
        return `<span class="chip rail-chip ${live ? "is-live" : "is-dead"}" title="${escapeHtml(tip)}">${escapeHtml(id)}${live ? "" : " ✗"}</span>`;
      })
      .join("");
    return;
  }
  // fallback: probe now
  import("./stair-glyph-stream.js").then(({ probeLiveRails }) => {
    refreshGlyphRailStatus(probeLiveRails());
  });
}

function runGlyphEncode(broadcast = false) {
  const carrier =
    $("#glyph-carrier")?.value?.trim() ||
    $("#pipe-input")?.value?.trim() ||
    lastStairStream?.composite?.carrier ||
    "kbatch";
  const n = Number($("#glyph-n")?.value) || DEFAULT_GLYPH_N;
  const bits = glyphFromText(carrier, n);
  const prev = $("#glyph-steno-preview");
  if (prev) prev.innerHTML = glyphGridHtml(bits, n);

  const dac = dacClassify(carrier, { source: "dojo-glyph" });
  const gutter = classifyGutterLine(carrier, { mode: "auto" });
  const steno = analyzeStenoSpace(
    encodeGlyphInSteno(carrier, bits, { n }).encoded,
    { payload: `glyph${n}x${n}` }
  );
  const blank = analyzeBlankSpace(carrier);
  const quantum = binaryStreamToGutter(carrier, { glyphBits: bits });

  let result;
  if (broadcast) {
    result = broadcastGlyphSteno(carrier, bits, { n, room: "dojo-glyph" });
  } else {
    const pack = encodeGlyphInSteno(carrier, bits, { n });
    result = { pack };
  }
  const pack = result.pack;
  const json = $("#glyph-json");
  if (json) {
    const probe = getGluelamStatus()?.live || null;
    json.textContent = pretty({
      exemplary: true,
      note: "live engines only — probe.liveCount; red chips = not loaded",
      n,
      ones: pack?.ones ?? result.envelope?.ones,
      bits: pack?.bits,
      payloadBytes: pack?.payloadBytes,
      encodedPreview: String(pack?.encoded || "").slice(0, 120) + "…",
      dac: {
        live: !!dac.live,
        engine: dac.engine,
        source: dac.source,
        sym: dac.sym,
        category: dac.category,
        coverage: dac.coverage,
      },
      gutter: { sym: gutter.sym, category: gutter.category, source: gutter.source },
      stenoStrip: steno.strip,
      whitespace: {
        blankChars: blank.blankChars,
        freeCoins: blank.coins?.free,
        capacityBits: blank.capacity?.blankBits,
      },
      steno: {
        coins: steno.blank?.coins,
        allotment: steno.allotment,
        gluelamSteno: steno.gluelam,
      },
      quantum: {
        bitCount: quantum.bitCount,
        quantumLikeness: quantum.quantumLikeness,
      },
      ironLine: broadcast ? "published gy-stream + iron-line" : "encode-only",
      broadcast: broadcast ? result.envelope?.type : false,
      probe,
    });
  }
  if ($("#pipe-input") && pack?.encoded) {
    // optional: don't overwrite user pipe unless empty
  }
  const st = $("#glyph-status");
  if (st) {
    st.textContent = broadcast
      ? `Broadcast · ${n}×${n} · ones ${pack?.ones} · DAC ${dac.sym} · IronLine`
      : `Encoded · ${n}×${n} · ${pack?.payloadBytes}B · steno ${steno.blank?.coins?.free ?? "—"} coins · DAC ${dac.sym}`;
  }
  const line = $("#dojo-status");
  if (line) {
    line.textContent = `Glyph steno · ${n}×${n} · ${broadcast ? "mesh+iron" : "encode"} · gutter ${gutter.sym}`;
  }
  refreshGlyphRailStatus(lastStairStream);
  window.__DOJO_GLYPH__ = result;
  return result;
}

function runGlyphDecode() {
  const text =
    window.__DOJO_GLYPH__?.pack?.encoded ||
    $("#pipe-input")?.value ||
    $("#glyph-carrier")?.value ||
    "";
  const decoded = decodeGlyphFromSteno(text);
  const prev = $("#glyph-steno-preview");
  if (prev && decoded.ok && decoded.bits) {
    prev.innerHTML = glyphGridHtml(decoded.bits, decoded.n);
  }
  const json = $("#glyph-json");
  if (json) {
    json.textContent = pretty({
      ...decoded,
      interpret: "glyph←steno whitespace trailer GYG1",
      rails: STREAM_RAILS,
    });
  }
  const st = $("#glyph-status");
  if (st) {
    st.textContent = decoded.ok
      ? `Decoded · ${decoded.n}×${decoded.n} · ones ${decoded.ones}`
      : `Decode fail · ${decoded.error || "—"}`;
  }
  return decoded;
}

async function runGlyphImageInterpret(file) {
  const st = $("#glyph-status");
  if (st) st.textContent = "Image stream · sampling → glyph → steno · interpret…";
  const n = Number($("#glyph-n")?.value) || DEFAULT_GLYPH_N;
  const carrier =
    $("#glyph-carrier")?.value?.trim() ||
    lastStairStream?.composite?.carrier ||
    (file && file.name) ||
    "kbatch image stream";
  try {
    const result = await interpretGlyphImage(file, {
      n,
      carrier,
      broadcast: true,
    });
    const prev = $("#glyph-steno-preview");
    if (prev && result.gridHtml) prev.innerHTML = result.gridHtml;
    const hexCanvas = $("#glyph-hexlum-canvas");
    if (hexCanvas && result.hexlum) {
      renderHexLumCanvas(hexCanvas, { hexlum: result.hexlum });
    }
    const json = $("#glyph-json");
    if (json) {
      json.textContent = pretty({
        exemplary: true,
        ...result,
        bits: undefined, // keep JSON light
        bitCount: result.bits?.length,
      });
    }
    if ($("#glyph-carrier") && result.pack?.carrier) {
      // keep human carrier; show note in status
    }
    window.__DOJO_GLYPH__ = { pack: result.pack, interpret: result };
    if (st) {
      st.textContent = result.ok
        ? `Image interpret · ${result.n}×${result.n} · ones ${result.ones} · DAC ${result.dac?.sym} · IronLine+pcap`
        : `Image interpret soft · ${result.sampleError || "sampled"} · ones ${result.ones}`;
    }
    refreshGlyphRailStatus(result);
    return result;
  } catch (e) {
    if (st) st.textContent = `Image fail · ${e?.message || e}`;
    return null;
  }
}

async function runStairStreamBroadcast() {
  const solve = lastLanguageSolve;
  if (!solve) {
    await loadWorldAxes();
  }
  const src = lastLanguageSolve;
  if (!src) return null;
  const n = Number($("#glyph-n")?.value) || DEFAULT_GLYPH_N;
  const stream = await buildStairGlyphStream(src, { n, broadcast: true, limit: 13 });
  lastStairStream = stream;
  const mount = $("#stair-stream-mount");
  if (mount) mount.innerHTML = stairGlyphStreamHtml(stream, escapeHtml);
  runGlyphEncode(true);
  const st = $("#glyph-status");
  if (st) st.textContent = `Stair stream broadcast · ${stream.concept?.slug} · IronLine+mesh`;
  return stream;
}

function bind() {
  $("#btn-pipe-run")?.addEventListener("click", runPipe);
  $("#btn-dojo-word")?.addEventListener("click", () => {
    renderWordView($("#dojo-word")?.value.trim() || "quantum");
  });
  $("#dojo-word")?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      renderWordView($("#dojo-word")?.value.trim() || "quantum");
    }
  });

  $("#letter-atom-grid")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-letter]");
    if (!btn) return;
    $("#letter-atom-grid")
      ?.querySelectorAll(".letter-atom-btn")
      .forEach((b) => b.classList.toggle("is-active", b === btn));
    showLetterDetail(btn.dataset.letter);
    const st = $("#dojo-status");
    if (st) st.textContent = `Letter atom · ${btn.dataset.letter}`;
  });

  $("#letter-atom-detail")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-letter]");
    if (!btn) return;
    showLetterDetail(btn.dataset.letter);
  });

  $("#matrix-table")?.addEventListener("click", onMatrixClick);

  $("#dojo-word-view")?.addEventListener("click", (ev) => {
    const letterBtn = ev.target.closest("[data-letter]");
    if (letterBtn) {
      showLetterDetail(letterBtn.dataset.letter);
      return;
    }
    const slotBtn = ev.target.closest("[data-slot]");
    if (slotBtn) {
      activeSlot = slotBtn.dataset.slot;
      highlightMatrixSlot(activeSlot);
      const a = atomAtSlot(activeSlot, matrixBase);
      if (a) showLetterDetail(a.display || a.letter);
    }
  });

  $("#atom-layout")?.addEventListener("change", (ev) => {
    atomLayout = ev.target.value || BASE_LAYOUT_ID;
    renderLetterGrid();
    renderStats();
  });

  $("#matrix-base")?.addEventListener("change", (ev) => {
    matrixBase = ev.target.value || BASE_LAYOUT_ID;
    renderMatrix();
    renderStats();
  });

  $("#btn-export-snapshot")?.addEventListener("click", () => {
    const snap = colossusSnapshot(
      ["the", "quantum", "kbatch", "dictionary", "flow", "braille", "contrail"],
      $("#pipe-layout")?.value || "qwerty"
    );
    downloadText(
      "kbatch-colossus-snapshot.json",
      pretty({
        ...snap,
        matrix: patternMatrix({ baseLayout: matrixBase }),
        letter: letterAtom(activeLetter),
      }),
      "application/json"
    );
  });

  $("#btn-copy-mcp")?.addEventListener("click", async () => {
    const text = pretty(MCP_TOOLS);
    try {
      await navigator.clipboard.writeText(text);
      const b = $("#btn-copy-mcp");
      if (b) {
        b.textContent = "Copied";
        setTimeout(() => {
          b.textContent = "Copy MCP tools";
        }, 1200);
      }
    } catch {
      downloadText("kbatch-mcp-tools.json", text, "application/json");
    }
  });

  $("#btn-export-matrix")?.addEventListener("click", () => {
    downloadText(
      "kbatch-pattern-matrix.json",
      pretty(patternMatrix({ baseLayout: matrixBase })),
      "application/json"
    );
  });

  $("#btn-export-atom")?.addEventListener("click", () => {
    downloadText(
      `kbatch-letter-atom-${activeLetter || "a"}.json`,
      pretty(letterAtom(activeLetter || "a")),
      "application/json"
    );
  });

  $("#btn-export-lang-alpha")?.addEventListener("click", () => {
    downloadText(
      "kbatch-language-alphabet-matrix.json",
      pretty(languageAlphabetMatrixExport()),
      "application/json"
    );
  });
  $("#btn-export-matrix-inline")?.addEventListener("click", () => {
    downloadText(
      "kbatch-pattern-matrix.json",
      pretty(patternMatrix({ baseLayout: matrixBase })),
      "application/json"
    );
  });
  $("#btn-lam-grid")?.addEventListener("click", () => {
    langAlphaGridMode = true;
    $("#btn-lam-grid")?.classList.add("btn-primary");
    $("#btn-lam-list")?.classList.remove("btn-primary");
    renderLangAlphabetMatrix();
  });
  $("#btn-lam-list")?.addEventListener("click", () => {
    langAlphaGridMode = false;
    $("#btn-lam-list")?.classList.add("btn-primary");
    $("#btn-lam-grid")?.classList.remove("btn-primary");
    renderLangAlphabetMatrix();
  });

  $("#btn-wpath-run")?.addEventListener("click", () => runWorldPath());
  $("#btn-wpath-export")?.addEventListener("click", () => {
    const path = lastWorldPath || runWorldPath();
    downloadText(
      `kbatch-world-path-${path.origin?.id || "en"}-${path.mode}.json`,
      pretty(path),
      "application/json"
    );
  });
  $("#wpath-mode")?.addEventListener("change", () => runWorldPath());

  $("#btn-load-axes")?.addEventListener("click", () => loadWorldAxes());
  $("#btn-export-colossus-full")?.addEventListener("click", async () => {
    const full = await colossusSnapshotFull(
      ["the", "quantum", "kbatch", "path", "learn"],
      $("#pipe-layout")?.value || "qwerty"
    );
    downloadText("kbatch-colossus-full-r3.json", pretty(full), "application/json");
  });

  $("#btn-glyph-encode")?.addEventListener("click", () => runGlyphEncode(false));
  $("#btn-glyph-broadcast")?.addEventListener("click", () => runGlyphEncode(true));
  $("#btn-glyph-decode")?.addEventListener("click", () => runGlyphDecode());
  $("#btn-glyph-image")?.addEventListener("click", () => {
    $("#glyph-image-input")?.click();
  });
  $("#glyph-image-input")?.addEventListener("change", (ev) => {
    const f = ev.target?.files?.[0];
    if (f) runGlyphImageInterpret(f);
  });
  $("#btn-stair-stream-broadcast")?.addEventListener("click", () => {
    runStairStreamBroadcast().catch((e) => {
      const st = $("#glyph-status");
      if (st) st.textContent = `Stair stream fail · ${e?.message || e}`;
    });
  });
  $("#btn-push-ugrad-stair")?.addEventListener("click", async () => {
    const st = $("#axes-status") || $("#glyph-status");
    try {
      const { pushKbatchStairToUgrad } = await import("./stair-glyph-stream.js");
      const r = await pushKbatchStairToUgrad();
      if (st) {
        st.textContent = r.ok
          ? `Pushed KBatch stair → ugrad buses (${r.demos} demos) · open :8765`
          : `Push fail · ${r.error}`;
      }
      // also open ugrad live if possible
      try {
        window.open("http://127.0.0.1:8765/ugrad.html?live=1", "ugrad-live");
      } catch {
        /* */
      }
    } catch (e) {
      if (st) st.textContent = `Push fail · ${e?.message || e}`;
    }
  });
  // live carrier → glyph preview (debounce-ish via input)
  $("#glyph-carrier")?.addEventListener("input", () => {
    const carrier = $("#glyph-carrier")?.value?.trim();
    if (!carrier) return;
    const n = Number($("#glyph-n")?.value) || DEFAULT_GLYPH_N;
    const prev = $("#glyph-steno-preview");
    if (prev) prev.innerHTML = glyphGridHtml(glyphFromText(carrier, n), n);
  });
  $("#glyph-n")?.addEventListener("change", () => runGlyphEncode(false));

  /** Chart geometry seeds — title-path only; contrast dense / balanced / glide */
  const CHART_SEEDS = {
    balanced: {
      label: "balanced · Too Sweet (Hozier) · ~149 BPM",
      text: ["Too Sweet", "Hozier", "Too Sweet", "Hozier", "Sweet Too", "Too Sweet Hozier"].join("\n"),
    },
    dense: {
      label: "dense · Anxiety (Doechii) · ~164 BPM",
      text: ["Anxiety", "Doechii", "Anxiety", "Doechii", "Anxiety Doechii", "Anxiety"].join("\n"),
    },
    glide: {
      label: "glide · Die with a Smile (Lady Gaga) · ~135 BPM",
      text: [
        "Die with a Smile",
        "Lady Gaga",
        "Die with a Smile",
        "Lady Gaga",
        "Smile Die with a",
        "Die with a Smile Lady Gaga",
      ].join("\n"),
    },
  };

  const pipeIn = $("#pipe-input");
  if (pipeIn && !pipeIn.value) {
    pipeIn.value = CHART_SEEDS.balanced.text;
  }
  const levelSel = $("#pipe-level");
  if (levelSel && !levelSel.dataset.userSet) {
    levelSel.value = "caption";
  }

  const seedRow = $("#chart-seed-row");
  if (seedRow) {
    seedRow.innerHTML = Object.entries(CHART_SEEDS)
      .map(
        ([id, s]) =>
          `<button type="button" class="btn" data-chart-seed="${id}" title="${s.label}">${id}</button>`
      )
      .join("");
    seedRow.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-chart-seed]");
      if (!btn) return;
      const seed = CHART_SEEDS[btn.getAttribute("data-chart-seed")];
      if (!seed || !pipeIn) return;
      pipeIn.value = seed.text;
      if (levelSel) levelSel.value = "caption";
      seedRow.querySelectorAll("[data-chart-seed]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      runPipe();
    });
    seedRow.querySelector('[data-chart-seed="balanced"]')?.classList.add("is-active");
  }
}

/** Open history atlas stats + universal History rail bindings */
async function bindHistoryScaffold() {
  const histSt = $("#dojo-history-status");
  const statsEl = $("#dojo-hist-stats");
  const setHist = (t) => {
    if (histSt) histSt.textContent = t;
  };

  // Density / index stats (slim — not full 10MB atlas)
  try {
    const paths = [
      "../data/ancestory/index.json",
      "/data/ancestory/index.json",
      "../data/ancestory/history-density.json",
      "/data/ancestory/history-density.json",
    ];
    let idx = null;
    let dens = null;
    for (const p of paths) {
      try {
        const r = await fetch(p, { cache: "force-cache" });
        if (!r.ok) continue;
        const j = await r.json();
        if (j.historyAtlas || j.counts?.publicNodes != null) idx = j;
        if (j.density || j.schema?.includes("density")) dens = j;
        if (p.includes("index") && j.historyAtlas) break;
      } catch {
        /* */
      }
    }
    // load density if only index found
    if (!dens) {
      try {
        const r = await fetch("../data/ancestory/history-density.json", {
          cache: "force-cache",
        });
        if (r.ok) dens = await r.json();
      } catch {
        try {
          const r = await fetch("/data/ancestory/history-density.json", {
            cache: "force-cache",
          });
          if (r.ok) dens = await r.json();
        } catch {
          /* */
        }
      }
    }

    const ha = idx?.historyAtlas || dens?.counts || null;
    const nodes = ha?.nodes ?? dens?.counts?.nodes ?? null;
    const dated = ha?.dated ?? dens?.counts?.dated ?? null;
    const earliest = ha?.earliest ?? dens?.counts?.earliest ?? null;
    const latest = ha?.latest ?? dens?.counts?.latest ?? null;
    const bins = dens?.density?.length ?? dens?.counts?.bins ?? null;

    const statH = $("#stat-history");
    if (statH && nodes != null) statH.textContent = Number(nodes).toLocaleString();

    if (statsEl) {
      const layers = ha?.byLayer
        ? Object.entries(ha.byLayer)
            .map(([k, v]) => `${k.replace(/^open-/, "")} ${v}`)
            .join(" · ")
        : "";
      statsEl.innerHTML = nodes
        ? `<strong>${Number(nodes).toLocaleString()}</strong> open history nodes` +
          (dated != null ? ` · <strong>${Number(dated).toLocaleString()}</strong> dated` : "") +
          (earliest != null ? ` · ${earliest} → ${latest}` : "") +
          (bins != null ? ` · ${bins} density bins on rail` : "") +
          (layers ? `<br/><span class="dojo-muted">${escapeHtml(layers)}</span>` : "") +
          ` · <a href="../labs/ancestory">open AnCEstory</a>`
        : `History atlas not found locally — rail still works with writing landmarks.`;
    }
    setHist(
      nodes
        ? `History atlas ${Number(nodes).toLocaleString()} nodes · density on rail`
        : "History rail · landmarks only"
    );
  } catch (e) {
    if (statsEl) statsEl.textContent = "History stats unavailable";
    setHist("History rail ready");
  }

  // Wire universal harness → DOJO status
  const onHist = (ev) => {
    const d = ev?.detail || ev || {};
    const y = d.year;
    const era = d.era?.label || "";
    if (y == null) return;
    const yLabel =
      window.__kbatchHistory?.formatYear?.(y) ||
      (y < 0 ? `${Math.abs(Math.round(y))} BCE` : String(Math.round(y)));
    setHist(`Focus ${yLabel}${era ? ` · ${era}` : ""} · DOJO geometry in time`);
    // Soft: when user lands on QWERTY era, bias atom layout
    if (y >= 1850 && y <= 1950) {
      const sel = $("#atom-layout");
      if (sel && sel.value !== "qwerty") {
        /* keep user choice — only status nudge */
      }
    }
  };
  window.addEventListener("kbatch-history", onHist);

  const waitHarness = () => {
    if (window.__kbatchHistory?.ready) {
      window.__kbatchHistory.refreshScaffold?.();
      window.__kbatchHistory.addMarkers?.([
        {
          id: "dojo-matrix",
          label: "Pattern matrix (15 layouts)",
          yearStart: 1873,
          yearEnd: new Date().getFullYear(),
          kind: "page",
          color: "#58a6ff",
          meta: "Physical slot identity across geometric layouts",
          href: "/dojo/",
        },
      ]);
      const y = window.__kbatchHistory.getYear?.();
      if (y != null) onHist({ year: y, era: window.__kbatchHistory.eraForYear?.(y) });
      return;
    }
    setTimeout(waitHarness, 120);
  };
  waitHarness();
}

async function init() {
  installGlobalAPI();
  // Expose master 88-language alphabet matrix + stream rails on window API
  if (typeof window !== "undefined" && window.kbatchDict) {
    window.kbatchDict.languageAlphabetMatrix = () =>
      languageAlphabetMatrixExport();
    window.kbatchDict.buildLanguageAlphabetMatrix = buildLanguageAlphabetMatrix;
    window.kbatchDict.worldPathSync = computeWorldPath;
    window.kbatchDict.worldPathSnapshotSync = worldPathSnapshot;
    window.kbatchDict.stairGlyphStream = (solve, opts) =>
      buildStairGlyphStream(solve || lastLanguageSolve, opts);
    window.kbatchDict.interpretGlyphImage = (img, opts) =>
      interpretGlyphImage(img, opts);
    window.kbatchDict.ensureStreamStack = ensureStreamStack;
    window.kbatchDict.streamRails = STREAM_RAILS;
  }
  initTheme();
  fillLayouts();
  renderStats();
  renderLetterGrid();
  renderMatrix();
  renderMcp();
  renderLangAlphabetMatrix();
  bind();
  renderWordView("quantum");
  runPipe();
  runWorldPath();
  // Probe real uvspeed engines (script tags in dojo/index.html load vendor first)
  ensureStreamStack()
    .then((s) => {
      refreshGlyphRailStatus(s);
      console.info(
        "[dojo stream]",
        "live",
        s.liveIds,
        "dead",
        s.deadIds,
        "qp",
        !!window.QuantumPrefixes && !window.QuantumPrefixes.stub,
        "dac",
        !!window.QbitDAC && !window.QbitDAC.stub
      );
      runGlyphEncode(false);
    })
    .catch((e) => {
      console.warn("[dojo stream] probe failed", e);
      runGlyphEncode(false);
    });
  // axes + stair demos + stream rail (non-blocking)
  loadWorldAxes().catch(() => {});
  await loadCorpusStats();
  bindHistoryScaffold().catch(() => {});
  const st = $("#dojo-status");
  if (st) {
    const m = buildLanguageAlphabetMatrix();
    const wp = lastWorldPath;
    st.textContent = `DOJO ready · history · ${LAYOUT_RING_ORDER.length} layouts · ${m.totalLanguages} langs · world-path ${wp?.stepCount || "—"} · stair+glyph stream rails`;
  }
}

init().catch((e) => {
  console.error("dojo init:", e);
  const st = $("#dojo-status");
  if (st) st.textContent = `DOJO init error: ${e?.message || e}`;
});
