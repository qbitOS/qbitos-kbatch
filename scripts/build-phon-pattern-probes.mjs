#!/usr/bin/env node
/**
 * Phonetic probe set + d_PHON sample + articulatory bank
 *
 *   node scripts/build-phon-pattern-probes.mjs
 *
 * Writes:
 *   data/calibration/phon-probe-set.json
 *   data/calibration/articulatory-bank.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "data/calibration");

const phon = await import(pathToFileURL(join(root, "js/phonetic-pattern.js")).href);
const {
  analyzePhonPattern,
  streamJaccardDistance,
  ARTICULATORY_FEATURES,
  blendTransferCost,
} = phon;

/** Minimal ship set (12) + dual companions */
const SPECS = [
  { id: "phon-cv-open", text: "aeaieiou", kind: "phon-probe", intent: "pure vocalic" },
  { id: "phon-cv-closed", text: "strchkpt", kind: "phon-probe", intent: "pure consonantal" },
  { id: "phon-cv-alt", text: "patiko seluma", kind: "phon-probe", intent: "alternating CV" },
  { id: "phon-cv-cluster", text: "strengths scripts", kind: "phon-probe", intent: "heavy clusters" },
  { id: "phon-stops", text: "pop tot kick bag dig", kind: "phon-probe", intent: "stop-heavy" },
  { id: "phon-fricatives", text: "safe shoes five this", kind: "phon-probe", intent: "fricative-heavy" },
  { id: "phon-nasals", text: "man moon ring name", kind: "phon-probe", intent: "nasal-heavy" },
  { id: "phon-liquids", text: "lull roar yellow will", kind: "phon-probe", intent: "liquid/glide" },
  { id: "phon-vowel-high", text: "see key who boot", kind: "phon-probe", intent: "high vowels" },
  { id: "phon-vowel-low", text: "cat father hot", kind: "phon-probe", intent: "low vowels" },
  { id: "phon-type-once", text: "type once understand everywhere", kind: "phon-probe", intent: "site motto dual", dualOf: "so-type-once" },
  { id: "phon-life-liberty", text: "life liberty and the pursuit of happiness", kind: "phon-probe", intent: "Declaration phrase dual", dualOf: "so-declaration-phrase" },
  { id: "phon-people", text: "people", kind: "phon-probe", intent: "high-freq Declaration word", dualOf: "so-people" },
  { id: "phon-too-sweet", text: "Too Sweet\nHozier\nToo Sweet", kind: "phon-probe", intent: "chart title dual", dualOf: "chart-too-sweet-hozier" },
];

const probes = [];
/** @type {Record<string, number[]>} */
const A = {};

for (const s of SPECS) {
  const analysis = analyzePhonPattern(s.text, { lang: "en", level: "caption" });
  probes.push({
    id: s.id,
    kind: s.kind,
    text: s.text,
    intent: s.intent,
    dualOf: s.dualOf || null,
    source: "calibration",
    cv: analysis.cv,
    phones: analysis.phones,
    compressed: analysis.compressed,
    openRatioPhon: analysis.openRatioPhon,
    dominant: analysis.words?.[0]?.dominant || analysis.cv.slice(0, 8),
    artMean: analysis.artMean,
    bigrams: analysis.bigrams,
    topPatterns: analysis.topPatterns.slice(0, 6),
  });
  A[s.id] = analysis.artMean;
}

// d_PHON sample matrix (CV bigram Jaccard)
const dPhon = {};
for (const a of probes) {
  dPhon[a.id] = {};
  for (const b of probes) {
    dPhon[a.id][b.id] =
      Math.round(streamJaccardDistance(a.cv, b.cv, 2) * 1000) / 1000;
  }
}

// articulatory bank normalization
const dim = ARTICULATORY_FEATURES.length;
const flat = Object.values(A);
const mu = new Array(dim).fill(0);
const m2 = new Array(dim).fill(0);
for (const v of flat) {
  for (let i = 0; i < dim; i++) mu[i] += v[i] || 0;
}
for (let i = 0; i < dim; i++) mu[i] /= flat.length || 1;
for (const v of flat) {
  for (let i = 0; i < dim; i++) {
    const d = (v[i] || 0) - mu[i];
    m2[i] += d * d;
  }
}
const sigma = m2.map((s) => Math.sqrt(s / Math.max(1, flat.length - 1)) || 1e-6);

const openId = "phon-cv-open";
const closedId = "phon-cv-closed";
const sampleBlend = {
  c_en_ru: 9.3,
  dSO_open_closed: 1.0,
  dPHON_open_closed: dPhon[openId][closedId],
  cTilde: blendTransferCost(9.3, 1.0, dPhon[openId][closedId], {
    muSO: 0.2,
    muPhon: 0.3,
  }),
  note: "Example blend only; real d_SO from probe-set soDistance",
};

const phonDoc = {
  schema: "kbatch-phon-probe-set-v1",
  generated: new Date().toISOString(),
  purpose:
    "Phonetic CV/phone-class probes + d_PHON for transfer prior. Parallel to SO probes; does not alter JAX geometry bank.",
  counts: { total: probes.length },
  blend: {
    muSO: 0.2,
    muPhon: 0.3,
    cap: 2.5,
    form: "c_tilde = c * (1 + muSO*E[d_SO] + muPhon*E[d_PHON])",
    sample: sampleBlend,
  },
  dPhon: {
    metric: "1 - Jaccard(CV bigrams)",
    n: 2,
    sample: {
      [`${openId}|${closedId}`]: dPhon[openId][closedId],
      "phon-type-once|phon-life-liberty": dPhon["phon-type-once"]["phon-life-liberty"],
      "phon-stops|phon-nasals": dPhon["phon-stops"]["phon-nasals"],
    },
    matrix: dPhon,
  },
  probes,
  phoneClasses: {
    P: "stop",
    F: "fricative",
    A: "affricate",
    N: "nasal",
    L: "liquid/glide",
    Vh: "vowel high",
    Vm: "vowel mid",
    Vl: "vowel low",
    X: "other",
  },
  urls: {
    articulatoryBank: "data/calibration/articulatory-bank.json",
    jaxBank: "data/calibration/jax-feature-bank.json",
    probeSet: "data/calibration/probe-set.json",
    costMatrix: "data/world-path/cost-matrix.json",
    docs: "docs/PHONETIC-PATTERN-ANALYSIS.md",
    mcp: "kbatch_phon_pattern",
  },
};

const artDoc = {
  schema: "kbatch-articulatory-bank-v1",
  generated: phonDoc.generated,
  dim: 12,
  feature_names: ARTICULATORY_FEATURES.slice(),
  A,
  normalization: {
    method: "zscore",
    mu: mu.map((v) => Math.round(v * 1e6) / 1e6),
    sigma: sigma.map((v) => Math.round(v * 1e6) / 1e6),
  },
  note: "Mean articulatory vectors per phonetic probe (English approx). Separate from jax.x[10].",
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "phon-probe-set.json"), JSON.stringify(phonDoc, null, 2));
writeFileSync(join(outDir, "articulatory-bank.json"), JSON.stringify(artDoc, null, 2));

console.log(
  `✓ phon probes ${probes.length} · d_PHON open|closed=${dPhon[openId][closedId]} · sample cTilde=${sampleBlend.cTilde.toFixed(3)}`
);
console.log(`  → data/calibration/phon-probe-set.json`);
console.log(`  → data/calibration/articulatory-bank.json`);
