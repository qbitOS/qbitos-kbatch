/**
 * Declaration glyph stream → 15-layout slot shadows + cadence metrics.
 *
 * @see docs/DECLARATION-CADENCE-PROJECTION.md
 * @see js/letter-atom.js geometricGlyphs
 */

import { letterAtom } from "./letter-atom.js";
import { LAYOUT_RING_ORDER } from "./layouts.js";
import { analyzeWordOnLayout } from "./capsule-analyzer.js";

export const DECLARATION_CADENCE_SCHEMA = "kbatch-declaration-cadence-v1";
export const MASTER_URL = "/data/declaration/master-glyphs.json";

let _masterCache = null;

/**
 * @param {typeof fetch} [fetchImpl]
 */
export async function loadMasterGlyphs(fetchImpl) {
  if (_masterCache) return _masterCache;
  const f = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (!f) throw new Error("no fetch for master-glyphs");
  const r = await f(MASTER_URL, { cache: "force-cache" });
  if (!r.ok) throw new Error("master-glyphs HTTP " + r.status);
  _masterCache = await r.json();
  return _masterCache;
}

/**
 * Filter master glyphs by range string.
 * @param {object} master
 * @param {string} [range] "all" | "0-143" | "L01" | "title" | "body"
 */
export function sliceMaster(master, range = "all") {
  const glyphs = master.glyphs || [];
  const r = String(range || "all").trim();
  if (!r || r === "all") return glyphs;
  const m = r.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return glyphs.filter((g) => {
      const gi = Array.isArray(g) ? g[0] : g.gi;
      return gi >= a && gi <= b;
    });
  }
  if (/^L\d+/i.test(r)) {
    const id = r.toUpperCase();
    return glyphs.filter((g) => (Array.isArray(g) ? g[2] : g.lineId) === id);
  }
  const kind = r.toLowerCase();
  if (["title", "subtitle", "body", "grievance", "closing", "signature"].includes(kind)) {
    return glyphs.filter((g) => (Array.isArray(g) ? g[3] : g.kind) === kind);
  }
  return glyphs;
}

export function glyphsToString(glyphs) {
  return (glyphs || [])
    .map((g) => (Array.isArray(g) ? g[1] : g.ch))
    .join("");
}

/**
 * Slot-shadow projection: same physical keys as base Latin typing.
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function projectSlotShadows(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const id of LAYOUT_RING_ORDER) out[id] = "";
  const s = String(text || "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!/[a-zA-Z]/.test(ch)) {
      for (const id of LAYOUT_RING_ORDER) out[id] += ch;
      continue;
    }
    const atom = letterAtom(ch);
    const glyphs = atom?.geometricGlyphs || {};
    for (const id of LAYOUT_RING_ORDER) {
      out[id] += glyphs[id] || "·";
    }
  }
  return out;
}

/**
 * @param {object} [opts]
 * @param {string} [opts.range]
 * @param {string} [opts.baseLayout]
 * @param {number} [opts.N] grid size for layer hint
 * @param {boolean} [opts.metrics]
 * @param {boolean} [opts.rank]
 * @param {object} [opts.master] preloaded master
 * @param {typeof fetch} [opts.fetch]
 */
export async function projectDeclarationCadence(opts = {}) {
  const range = opts.range || "0-143";
  const baseLayout = opts.baseLayout || "qwerty";
  const N = Number(opts.N) || 12;
  const wantMetrics = opts.metrics !== false;
  const wantRank = opts.rank === true;

  const master = opts.master || (await loadMasterGlyphs(opts.fetch));
  const slice = sliceMaster(master, range);
  const sample = glyphsToString(slice);
  const shadows = projectSlotShadows(sample);

  let metrics = null;
  let ranked = null;
  const latinPath = sample.replace(/[^a-zA-Z]/g, "");
  if (wantMetrics && latinPath) {
    try {
      const env = analyzeWordOnLayout(latinPath.slice(0, 4000), baseLayout);
      metrics = env?.metrics
        ? {
            efficiency: env.metrics.efficiency,
            complexity: env.metrics.complexity,
            strain: env.metrics.strain,
            keys: env.metrics.keys ?? latinPath.length,
            homeRowPct: env.metrics.homeRowPct,
            travelMM: env.metrics.travelMM,
            rsiRisk: env.metrics.rsiRisk,
          }
        : null;
      if (wantRank && env?.ranked) {
        ranked = env.ranked.slice(0, 15).map((r) => ({
          id: r.id,
          name: r.name,
          score: r.score ?? r.strain ?? null,
          shadow: r.shadow || r.glyph || null,
        }));
      }
    } catch {
      metrics = null;
    }
  }

  const layerCells = N * N;
  const startGi = slice.length
    ? Array.isArray(slice[0])
      ? slice[0][0]
      : slice[0].gi
    : 0;

  return {
    schema: DECLARATION_CADENCE_SCHEMA,
    docId: "declaration-of-independence",
    ver: master.ver || null,
    range,
    glyphCount: slice.length,
    masterTotal: master.total || (master.glyphs || []).length,
    sample: sample.slice(0, 80),
    sampleFull: sample.length <= 500 ? sample : undefined,
    baseLayout,
    layouts: LAYOUT_RING_ORDER.slice(),
    shadows,
    metrics,
    ranked,
    layerHint: {
      N,
      cells: layerCells,
      startGi,
      approxLayer: Math.floor(Number(startGi) / layerCells) + 1,
      note: "Grid layer index if stream is contiguous from 0",
    },
    urls: {
      master: MASTER_URL,
      play: "/labs/declaration-digital-edition/letter-grid.html",
      pipe: "/labs/declaration-digital-edition/letter-grid-pipe.html",
      docs: "/docs/DECLARATION-CADENCE-PROJECTION.md",
    },
    note:
      "shadows = same physical slots as QWERTY typing; metrics = capsule path on baseLayout",
  };
}

/**
 * MCP-friendly entry (used by pipeline when wired).
 */
export async function declarationCadenceMcp(args = {}) {
  return projectDeclarationCadence({
    range: args.range || args.slice || "0-143",
    baseLayout: args.layout || args.baseLayout || "qwerty",
    N: args.N || args.gridSize || 12,
    metrics: args.metrics !== false,
    rank: args.rank === true || args.includeRank === true,
  });
}
