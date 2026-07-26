/**
 * Open sense layer — KBatch pilot + D5 Wiktionary-linked glosses
 * Dual-pane word cards: geometry | open gloss (cited) | world concept forms
 */

import { conceptSolve, conceptSolveHtml, loadConceptMesh } from "./concept-solve.js";

const BASES = [
  "./data/",
  "https://data.ugrad.ai/kbatch/",
  "https://kbatch.ugrad.ai/data/",
];

/** @type {object|null} */
let indexDoc = null;
/** @type {Map<string, object>} */
let bySpell = new Map();
let loadPromise = null;

export async function loadOpenSenses() {
  if (indexDoc) return indexDoc;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    for (const base of BASES) {
      try {
        const res = await fetch(`${base}senses/index.json`, { cache: "default" });
        if (!res.ok) continue;
        indexDoc = await res.json();
        bySpell = new Map(
          (indexDoc.senses || []).map((s) => [
            String(s.spelling || "").toLowerCase(),
            s,
          ])
        );
        return indexDoc;
      } catch {
        /* next */
      }
    }
    indexDoc = { senses: [], count: 0, status: "unavailable" };
    return indexDoc;
  })();
  return loadPromise;
}

/**
 * @param {string} word
 */
export function openSenseFor(word) {
  const k = String(word || "")
    .toLowerCase()
    .trim();
  if (!k) return null;
  return bySpell.get(k) || null;
}

/**
 * Dual-pane HTML: geometry metrics | open gloss (D3)
 * @param {object} e word entry with metrics
 * @param {{ escapeHtml: (s: string) => string }} util
 */
export function dualPaneSenseHtml(e, util) {
  const esc = util.escapeHtml;
  const w = String(e.word || "");
  const open = openSenseFor(w);
  const m = e.metrics || e.analysis?.metrics || {};
  const strip = e.strip?.label || e.analysis?.strip?.label || "—";
  const pathN = e.path?.length || e.patterns?.path?.length || "—";
  const geo = `
    <div class="dual-pane dual-geo">
      <h4 class="dual-h">Geometry</h4>
      <p class="dual-line"><span class="sense-k">Strip</span> <code>${esc(strip)}</code></p>
      <p class="dual-line"><span class="sense-k">Path slots</span> ${esc(String(pathN))}</p>
      <p class="dual-line"><span class="sense-k">Efficiency</span> ${esc(String(m.efficiency ?? "—"))}</p>
      <p class="dual-line"><span class="sense-k">Strain</span> ${esc(String(m.strain ?? "—"))}</p>
      <p class="dual-line"><span class="sense-k">RSI risk</span> ${esc(String(m.rsiRisk ?? m.rsi ?? "—"))}</p>
      <p class="dual-line"><span class="sense-k">Travel</span> ${esc(String(m.travelMM ?? m.mm ?? "—"))} mm</p>
    </div>`;

  let gloss;
  if (open?.gloss) {
    const lic = open.license || "CC0";
    const attr = open.attribution || open.source || "KBatch open sense";
    const wiki =
      open.sourceUrl ||
      `https://en.wiktionary.org/wiki/${encodeURIComponent(open.wiktionaryTitle || w)}`;
    // Multi-lang climb: orthography siblings + client-built edition deep-links
    const world = open.worldOrthography || {};
    const worldKeys = Object.keys(world);
    const EDITION_LANGS = ["en", "es", "de", "fr", "ru", "zh", "ar", "ja"];
    const worldHtml = worldKeys.length
      ? `<p class="dual-line sense-world"><span class="sense-k">World orthography</span> ${worldKeys
          .map((L) => {
            const row = world[L];
            const href =
              row?.wiktionary ||
              `https://${L}.wiktionary.org/wiki/${encodeURIComponent(row?.spelling || w)}`;
            return `<a class="sense-lang-chip" href="${esc(href)}" target="_blank" rel="noopener" title="${esc(L)} edition">${esc(L)}:${esc(row?.spelling || w)}</a>`;
          })
          .join(" ")}</p>`
      : `<p class="dual-line sense-world"><span class="sense-k">Lang editions</span> ${EDITION_LANGS.map(
          (L) =>
            `<a class="sense-lang-chip" href="https://${L}.wiktionary.org/wiki/${encodeURIComponent(w)}" target="_blank" rel="noopener">${esc(L)}</a>`
        ).join(" ")}</p>`;
    gloss = `
      <div class="dual-pane dual-gloss">
        <h4 class="dual-h">Open gloss</h4>
        <p class="dual-meaning"><span class="sense-pos">${esc(open.pos || "")}</span> ${esc(open.gloss)}</p>
        <p class="dual-attr"><span class="sense-badge">${esc(lic)}</span> ${esc(attr)}</p>
        ${worldHtml}
        <p class="sense-refs">
          <a href="${esc(wiki)}" target="_blank" rel="noopener">Wiktionary ↗</a>
          · D5 attribution · multi-lang scaffold
        </p>
      </div>`;
  } else {
    gloss = `
      <div class="dual-pane dual-gloss is-empty">
        <h4 class="dual-h">Open gloss</h4>
        <p class="dual-meaning muted">No pilot gloss yet · geometry is live</p>
        <p class="sense-refs">
          <a href="https://en.wiktionary.org/wiki/${encodeURIComponent(w)}" target="_blank" rel="noopener">Wiktionary ↗</a>
        </p>
      </div>`;
  }

  return `<div class="dual-pane-row" data-dual-pane="1">${geo}${gloss}</div>`;
}

/**
 * Dual-pane + instant multilingual concept forms (path + pure C rank).
 * @param {object} e
 * @param {{ escapeHtml: (s: string) => string }} util
 * @param {{ from?: string, mode?: string, includeHonor?: boolean, limit?: number }} [opts]
 */
export async function dualPaneFullHtml(e, util, opts = {}) {
  const esc = util.escapeHtml;
  const base = dualPaneSenseHtml(e, util);
  const w = String(e.word || e.spelling || "");
  try {
    await loadConceptMesh();
    const solve = await conceptSolve({
      q: w,
      from: opts.from || e.lang || "en",
      mode: opts.mode || "ready",
      includeHonor: opts.includeHonor === true,
      includePaths: true,
      limit: opts.limit || 24,
    });
    if (!solve?.ok) return base;
    const world = conceptSolveHtml(solve, esc);
    return base.replace(/<\/div>\s*$/, `${world}</div>`);
  } catch {
    return base;
  }
}
