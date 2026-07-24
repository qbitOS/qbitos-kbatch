#!/usr/bin/env node
/**
 * Calibration probe set for cross-language feature bank (§3.3 style).
 *
 * Probes:
 *   - Declaration head / layers (letter-only stream samples)
 *   - Chart title-path strings (flowClass exemplars + #1s)
 *   - SO orthographic probes (SSO/OSO patterns, short phrases)
 *
 *   node scripts/build-calibration-probes.mjs
 *
 * Output: data/calibration/probe-set.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "data/calibration");

const order = await import(pathToFileURL(join(root, "js/order-analysis.js")).href);
const { soSequence, soNgrams, compressSO, letterSO } = order;

function soProfile(text) {
  const so = soSequence(text);
  return {
    so,
    compressed: compressSO(so),
    n2: soNgrams(so, 2),
    n3: soNgrams(so, 3),
    len: so.length,
    openFrac: so ? [...so].filter((c) => c === "O").length / so.length : 0,
  };
}

function jaccardNgram(a, b, n = 2) {
  const A = new Set(Object.keys(soNgrams(soSequence(a), n)));
  const B = new Set(Object.keys(soNgrams(soSequence(b), n)));
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const uni = A.size + B.size - inter;
  return uni ? 1 - inter / uni : 0;
}

/** @type {object[]} */
const probes = [];

function addProbe(p) {
  const text = String(p.text || "");
  probes.push({
    id: p.id,
    kind: p.kind,
    text,
    source: p.source || null,
    meta: p.meta || {},
    so: soProfile(text),
  });
}

// ── Declaration ──────────────────────────────────────────
const masterPath = join(root, "data/declaration/master-glyphs.json");
if (existsSync(masterPath)) {
  const master = JSON.parse(readFileSync(masterPath, "utf8"));
  const glyphs = master.glyphs || [];
  const full = glyphs.map((g) => (Array.isArray(g) ? g[1] : g.ch)).join("");

  const slices = [
    { id: "decl-head-40", end: 40, note: "title start INCONGRE…" },
    { id: "decl-layer1-12x12", end: 144, note: "first grid layer @12×12" },
    { id: "decl-L01", filter: (g) => (Array.isArray(g) ? g[2] : g.lineId) === "L01" },
    { id: "decl-body-200", start: 71, end: 271, note: "early body (When in…)" },
    { id: "decl-tail-80", start: Math.max(0, full.length - 80), end: full.length, note: "stream tail" },
  ];

  for (const s of slices) {
    let text;
    if (s.filter) {
      text = glyphs
        .filter(s.filter)
        .map((g) => (Array.isArray(g) ? g[1] : g.ch))
        .join("");
    } else {
      const a = s.start || 0;
      const b = s.end != null ? s.end : full.length;
      text = full.slice(a, b);
    }
    addProbe({
      id: s.id,
      kind: "declaration",
      text,
      source: "data/declaration/master-glyphs.json",
      meta: {
        note: s.note || null,
        masterTotal: master.total || glyphs.length,
        range: s.filter ? "line-filter" : `${s.start || 0}-${s.end}`,
      },
    });
  }
}

// ── Chart titles (flowClass exemplars + diversity) ────────
const chartIndexPath = join(root, "data/lyrics/charts/index.json");
const chartSlugs = [
  "too-sweet-hozier",
  "anxiety-doechii",
  "die-with-a-smile-lady-gaga",
  "a-bar-song-shaboozey",
  "uptown-funk-mark-ronson-bruno-mars",
  "all-too-well-taylor-swift",
  "blinding-lights-the-weeknd",
  "as-it-was-harry-styles",
  "flowers-miley-cyrus",
  "not-like-us-kendrick-lamar",
];
if (existsSync(chartIndexPath)) {
  const idx = JSON.parse(readFileSync(chartIndexPath, "utf8"));
  const bySlug = Object.fromEntries((idx.tracks || []).map((t) => [t.slug, t]));
  for (const slug of chartSlugs) {
    const t = bySlug[slug];
    if (!t) continue;
    const text = [t.title, t.artist, t.title].filter(Boolean).join("\n");
    addProbe({
      id: `chart-${slug}`,
      kind: "chart-title-path",
      text,
      source: `data/lyrics/analyses/${slug}.json`,
      meta: {
        slug,
        title: t.title,
        artist: t.artist,
        year: t.year,
        peak: t.peak,
        numberOne: !!t.numberOne,
      },
    });
  }
}

// ── SO orthographic probes ───────────────────────────────
const soProbes = [
  { id: "so-cv-open", text: "aeaieiou", note: "open/vowel heavy" },
  { id: "so-cv-closed", text: "strchkpt", note: "closed/consonant heavy" },
  { id: "so-sso", text: "street strength", note: "SSO clusters" },
  { id: "so-oso", text: "america open area", note: "OSO patterns" },
  { id: "so-sos", text: "total system", note: "SOS patterns" },
  { id: "so-pangram", text: "the quick brown fox jumps over the lazy dog", note: "pangram path" },
  { id: "so-home", text: "asdf jkl;", note: "home-row only (punctuation stripped in SO)" },
  { id: "so-type-once", text: "type once understand everywhere", note: "site motto path" },
  { id: "so-declaration-phrase", text: "life liberty and the pursuit of happiness", note: "Declaration phrase" },
  { id: "so-people", text: "people", note: "high-freq Declaration word" },
];
for (const s of soProbes) {
  addProbe({
    id: s.id,
    kind: "so-probe",
    text: s.text,
    source: "calibration",
    meta: { note: s.note },
  });
}

// Pairwise SO distances among so-probes + declaration head (cheap prior matrix sample)
const soIds = probes.filter((p) => p.kind === "so-probe" || p.id === "decl-head-40").map((p) => p.id);
const soDist = {};
for (const a of soIds) {
  soDist[a] = {};
  const pa = probes.find((p) => p.id === a);
  for (const b of soIds) {
    const pb = probes.find((p) => p.id === b);
    soDist[a][b] = Math.round(jaccardNgram(pa.text, pb.text, 2) * 1000) / 1000;
  }
}

const doc = {
  schema: "kbatch-calibration-probe-set-v1",
  generated: new Date().toISOString(),
  purpose:
    "Feature-bank probes for cross-language calibration: Declaration head, chart title-paths, SO orthographic filters. Pair with data/world-path/cost-matrix.json.",
  counts: {
    total: probes.length,
    declaration: probes.filter((p) => p.kind === "declaration").length,
    chart: probes.filter((p) => p.kind === "chart-title-path").length,
    so: probes.filter((p) => p.kind === "so-probe").length,
  },
  layouts: 15,
  layoutRing: [
    "qwerty",
    "dvorak",
    "colemak",
    "azerty",
    "qwertz",
    "jcuken",
    "korean",
    "japanese",
    "arabic",
    "hindi",
    "hebrew",
    "greek",
    "thai",
    "turkish_f",
    "vietnamese",
  ],
  soDistance: {
    metric: "1 - Jaccard(SO bigrams)",
    note: "d_SO(u,v); blend into transfer prior: c̃ = c · (1 + μ · E[d_SO])",
    sample: soDist,
  },
  featureBankHint: {
    shape: "X[probes × 15 layouts]",
    fill: "For each probe text, run analyze/shadows per layout → strain, efficiency, travelMM, homeRowPct, rsiRisk",
    staticCost: "data/world-path/cost-matrix.json matrix[88×88]",
    agentPipeline: [
      "Load cost-matrix.json + portal-subgraph.json",
      "Load probe-set.json",
      "On language jump a→b: lookup C[a,b]; if large expand via portal Dijkstra",
      "Optional SO prefilter on short text before full path_rank",
      "Bind Shadow Live / Rubik Focus for context",
      "calibrate_check → recalibrate on drift",
    ],
  },
  probes,
  urls: {
    costMatrix: "data/world-path/cost-matrix.json",
    portals: "data/world-path/portal-subgraph.json",
    declarationCadence: "kbatch_declaration_cadence",
    worldPath: "kbatch_world_path",
    docs: "docs/CALIBRATION-PROBE-SET.md",
  },
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "probe-set.json"), JSON.stringify(doc, null, 2));
console.log(
  `✓ calibration probes ${doc.counts.total} (decl ${doc.counts.declaration} · chart ${doc.counts.chart} · so ${doc.counts.so}) → data/calibration/probe-set.json`
);
