#!/usr/bin/env node
/**
 * Materialize JAX feature bank: probes × 15 layouts → float32[10]
 *
 *   node scripts/build-jax-feature-bank.mjs
 *
 * Reads:  data/calibration/probe-set.json
 * Writes: data/calibration/jax-feature-bank.json
 *         data/calibration/jax-feature-bank.meta.json (compact stats)
 *
 * Schema: docs/JAX-FEATURE-BANK.md
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "data/calibration");
const probePath = join(outDir, "probe-set.json");

if (!existsSync(probePath)) {
  console.error("Missing probe-set.json — run: node scripts/build-calibration-probes.mjs");
  process.exit(1);
}

const { analyzeLevel } = await import(pathToFileURL(join(root, "js/pipeline.js")).href);
const probesDoc = JSON.parse(readFileSync(probePath, "utf8"));
const layouts = probesDoc.layoutRing || [
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
];
const probes = probesDoc.probes || [];
const featureNames = [
  "keys",
  "efficiency",
  "complexity",
  "strain",
  "home_row_pct",
  "travel_mm",
  "trails",
  "calories",
  "rsi_risk",
  "bpm",
];

const levelForKind = {
  declaration: "caption",
  "chart-title-path": "caption",
  "so-probe": "sentence",
};

function textHash(t) {
  return createHash("sha1").update(String(t || "").toLowerCase().replace(/\s+/g, " ").trim()).digest("hex").slice(0, 12);
}

/** @type {Record<string, Record<string, number[]>>} */
const X = {};
/** @type {Record<string, object>} */
const labels = {};
/** @type {object[]} */
const rows = [];

let cells = 0;
const t0 = Date.now();

for (const p of probes) {
  const level = levelForKind[p.kind] || "caption";
  const text = String(p.text || "");
  labels[p.id] = {
    level,
    chars: text.length,
    openRatio: p.so?.openFrac != null ? Math.round(p.so.openFrac * 1000) / 10 : null,
    kind: p.kind,
    textId: textHash(text),
    source: p.source || null,
  };
  X[p.id] = {};

  for (const layout of layouts) {
    let jax;
    try {
      const env = analyzeLevel(text, { level, layout, source: "build-jax-feature-bank" });
      jax = env?.jax;
      if (jax?.labels?.openRatio != null && labels[p.id].openRatio == null) {
        labels[p.id].openRatio = jax.labels.openRatio;
      }
      if (jax?.labels?.level) labels[p.id].level = jax.labels.level;
      if (jax?.labels?.chars != null) labels[p.id].chars = jax.labels.chars;
    } catch (e) {
      console.warn(`warn ${p.id} @ ${layout}:`, e.message || e);
      jax = null;
    }
    const x = Array.isArray(jax?.x)
      ? jax.x.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0))
      : featureNames.map(() => 0);
    // ensure length 10
    while (x.length < 10) x.push(0);
    X[p.id][layout] = x.slice(0, 10);
    rows.push({
      probe_id: p.id,
      layout,
      x: X[p.id][layout],
      openRatio: labels[p.id].openRatio,
      level: labels[p.id].level,
    });
    cells++;
  }
}

// Per-feature stats for normalization (over all cells)
const flat = rows.map((r) => r.x);
const D = featureNames.length;
const mu = new Array(D).fill(0);
const m2 = new Array(D).fill(0);
const mins = new Array(D).fill(Infinity);
const maxs = new Array(D).fill(-Infinity);
for (const x of flat) {
  for (let i = 0; i < D; i++) {
    const v = x[i];
    mu[i] += v;
    mins[i] = Math.min(mins[i], v);
    maxs[i] = Math.max(maxs[i], v);
  }
}
for (let i = 0; i < D; i++) mu[i] /= flat.length || 1;
for (const x of flat) {
  for (let i = 0; i < D; i++) {
    const d = x[i] - mu[i];
    m2[i] += d * d;
  }
}
const sigma = m2.map((s) => Math.sqrt(s / Math.max(1, flat.length - 1)) || 1e-6);

// Pairwise layout kernel sample for probe so-type-once (qwerty base)
function l2(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const da = (a[i] - mu[i]) / (sigma[i] + 1e-6);
    const db = (b[i] - mu[i]) / (sigma[i] + 1e-6);
    s += (da - db) ** 2;
  }
  return Math.sqrt(s);
}

const sampleProbe = "so-type-once";
const sampleKernel = {};
if (X[sampleProbe]) {
  const base = X[sampleProbe].qwerty;
  const lambda = 0.15;
  for (const layout of layouts) {
    const d = l2(base, X[sampleProbe][layout]);
    sampleKernel[layout] = {
      d_geom: Math.round(d * 1000) / 1000,
      K: Math.round(Math.exp(-lambda * d * d) * 1000) / 1000,
    };
  }
}

const bank = {
  schema: "kbatch-jax-feature-bank-v1",
  generated: new Date().toISOString(),
  dtype: "float32",
  feature_names: featureNames,
  dim: 10,
  shape: {
    probes: probes.length,
    layouts: layouts.length,
    features: 10,
    cells,
  },
  layouts,
  probe_ids: probes.map((p) => p.id),
  labels,
  /** X[probe_id][layout_id] = float[10] */
  X,
  /** Flat rows for simple consumers / JSONL export */
  rows,
  normalization: {
    method: "zscore",
    mu: mu.map((v) => Math.round(v * 1e6) / 1e6),
    sigma: sigma.map((v) => Math.round(v * 1e6) / 1e6),
    min: mins.map((v) => Math.round(v * 1e6) / 1e6),
    max: maxs.map((v) => Math.round(v * 1e6) / 1e6),
    note: "hat_x_i = (x_i - mu_i) / (sigma_i + eps)",
  },
  kernel: {
    form: "K(ℓ,ℓ';t) = exp(-λ ‖x̂(t,ℓ)-x̂(t,ℓ')‖²)",
    lambda: 0.15,
    sampleProbe,
    baseLayout: "qwerty",
    sample: sampleKernel,
  },
  so: {
    note: "openRatio in labels from probe SO / analyze; d_SO prior in probe-set.json",
    probeSet: "data/calibration/probe-set.json",
  },
  invalidation: [
    "layout table / strain model version bump",
    "probe text change",
    "doctrine / calibrate fingerprint change",
  ],
  buildMs: Date.now() - t0,
  urls: {
    probes: "data/calibration/probe-set.json",
    costMatrix: "data/world-path/cost-matrix.json",
    docs: "docs/JAX-FEATURE-BANK.md",
    mcp: "kbatch_export_jax",
  },
  agent: {
    hotRank: "rank layouts by kernel K against baseLayout using cached X[probe, layout]",
    coldFill: "this file — rebuilt by scripts/build-jax-feature-bank.mjs",
    blendTransfer: "c̃(a,b)=c(a,b)·(1+μ·E[d_SO]); geometric distance from X",
  },
};

mkdirSync(outDir, { recursive: true });
const bankPath = join(outDir, "jax-feature-bank.json");
writeFileSync(bankPath, JSON.stringify(bank));

const meta = {
  schema: "kbatch-jax-feature-bank-meta-v1",
  generated: bank.generated,
  shape: bank.shape,
  feature_names: featureNames,
  layouts,
  probe_ids: bank.probe_ids,
  normalization: bank.normalization,
  kernelSample: sampleKernel,
  buildMs: bank.buildMs,
  bankUrl: "data/calibration/jax-feature-bank.json",
};
writeFileSync(join(outDir, "jax-feature-bank.meta.json"), JSON.stringify(meta, null, 2));

const kb = Buffer.byteLength(JSON.stringify(bank)) / 1024;
console.log(
  `✓ JAX feature bank ${probes.length} probes × ${layouts.length} layouts = ${cells} cells · ${kb.toFixed(1)} KB · ${bank.buildMs} ms`
);
console.log("  kernel sample (so-type-once vs qwerty):");
for (const [lay, v] of Object.entries(sampleKernel).slice(0, 8)) {
  console.log(`    ${lay.padEnd(12)} d=${v.d_geom}  K=${v.K}`);
}
