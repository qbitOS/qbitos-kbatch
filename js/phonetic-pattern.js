/**
 * Phonetic pattern analysis — phone-class / CV streams + articulatory vectors.
 *
 * Parallel to SO (orthographic stop/open). Does NOT modify jax.x[10].
 * English-first grapheme→phone approximation; expandable per lang.
 *
 * @see docs/PHONETIC-PATTERN-ANALYSIS.md
 */

/** Articulatory feature names (12-D) */
export const ARTICULATORY_FEATURES = [
  "syllabic",
  "consonantal",
  "sonorant",
  "continuant",
  "nasal",
  "voice",
  "labial",
  "coronal",
  "dorsal",
  "high",
  "low",
  "back",
];

/**
 * Coarse phone-class → articulatory binary vector (+1 / 0)
 * Order: syllabic, consonantal, sonorant, continuant, nasal, voice,
 *        labial, coronal, dorsal, high, low, back
 */
export const PHONE_CLASS_ART = {
  P: [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // stop (default coronal; refined per letter)
  F: [0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  A: [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  N: [0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0],
  L: [0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0],
  Vh: [1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0],
  Vm: [1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0],
  Vl: [1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0],
  X: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/** English letter → coarse phone class (approx, rights-safe rules) */
const EN_LETTER_PHONE = {
  a: "Vl",
  e: "Vm",
  i: "Vh",
  o: "Vm",
  u: "Vh",
  y: "Vh",
  b: "P",
  p: "P",
  t: "P",
  d: "P",
  k: "P",
  g: "P",
  c: "P", // default stop; digraphs override
  q: "P",
  f: "F",
  v: "F",
  s: "F",
  z: "F",
  h: "F",
  x: "F",
  j: "A",
  m: "N",
  n: "N",
  l: "L",
  r: "L",
  w: "L",
};

/** Digraph / multigraph overrides (checked longest first) */
const EN_DIGRAPHS = [
  ["tch", "A"],
  ["dge", "A"],
  ["sch", "F"],
  ["shr", "F"],
  ["thr", "F"],
  ["ch", "A"],
  ["sh", "F"],
  ["th", "F"],
  ["ph", "F"],
  ["gh", "F"],
  ["ck", "P"],
  ["ng", "N"],
  ["qu", "P"],
  ["wh", "L"],
  ["kn", "N"],
  ["wr", "L"],
  ["ee", "Vh"],
  ["ea", "Vh"],
  ["oo", "Vh"],
  ["oa", "Vm"],
  ["ai", "Vm"],
  ["ay", "Vm"],
  ["oi", "Vm"],
  ["oy", "Vm"],
  ["ou", "Vm"],
  ["ow", "Vm"],
  ["au", "Vl"],
  ["aw", "Vl"],
  ["ie", "Vh"],
  ["ei", "Vh"],
  ["ue", "Vh"],
  ["ui", "Vh"],
];

/**
 * Place refinements for common English letters (labial / dorsal)
 * @param {string} ch
 * @param {number[]} base
 */
function refinePlace(ch, base) {
  const f = base.slice();
  const c = ch.toLowerCase();
  // labial
  if ("bpmfvw".includes(c)) {
    f[6] = 1;
    f[7] = 0;
    f[8] = 0;
  }
  // dorsal
  if ("kg".includes(c) || c === "q") {
    f[6] = 0;
    f[7] = 0;
    f[8] = 1;
  }
  // glottal-ish h
  if (c === "h") {
    f[6] = 0;
    f[7] = 0;
    f[8] = 0;
  }
  // voice
  if ("bdgvzjlmnwr".includes(c)) f[5] = 1;
  if ("ptkfsxhqc".includes(c)) f[5] = 0;
  // vowel backness / height refinements
  if (c === "i" || c === "y") {
    f[9] = 1;
    f[10] = 0;
    f[11] = 0;
  }
  if (c === "u") {
    f[9] = 1;
    f[10] = 0;
    f[11] = 1;
  }
  if (c === "e") {
    f[9] = 0;
    f[10] = 0;
    f[11] = 0;
  }
  if (c === "o") {
    f[9] = 0;
    f[10] = 0;
    f[11] = 1;
  }
  if (c === "a") {
    f[9] = 0;
    f[10] = 1;
    f[11] = 1;
  }
  return f;
}

/**
 * Grapheme → phone-class sequence (English approx).
 * @param {string} word
 * @returns {{ classes: string[], phones: string, arts: number[][] }}
 */
export function englishWordToPhones(word) {
  const w = String(word || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  /** @type {string[]} */
  const classes = [];
  /** @type {number[][]} */
  const arts = [];
  let i = 0;
  while (i < w.length) {
    let matched = false;
    for (const [dg, cls] of EN_DIGRAPHS) {
      if (w.startsWith(dg, i)) {
        classes.push(cls);
        const base = PHONE_CLASS_ART[cls] || PHONE_CLASS_ART.X;
        arts.push(refinePlace(dg[0], base));
        i += dg.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = w[i];
    const cls = EN_LETTER_PHONE[ch] || "X";
    classes.push(cls);
    arts.push(refinePlace(ch, PHONE_CLASS_ART[cls] || PHONE_CLASS_ART.X));
    i += 1;
  }
  return { classes, phones: classes.join(""), arts };
}

/** Collapse phone-class → C/V */
export function phoneClassToCV(cls) {
  if (cls === "Vh" || cls === "Vm" || cls === "Vl") return "V";
  if (cls === "X") return "C";
  return "C";
}

/**
 * @param {string} phones phone-class string e.g. FVhP
 */
export function phonesToCV(phones) {
  // phones may be concatenated multi-char classes — use token array if possible
  return String(phones || "")
    .replace(/Vh|Vm|Vl/g, "V")
    .replace(/[PFANLX]/g, "C");
}

/**
 * @param {string[]} classes
 */
export function classesToCV(classes) {
  return (classes || []).map(phoneClassToCV).join("");
}

/**
 * Compress runs: CCCVV → C×3 V×2
 * @param {string} stream
 */
export function compressStream(stream) {
  if (!stream) return "";
  const out = [];
  let prev = stream[0];
  let n = 1;
  for (let i = 1; i < stream.length; i++) {
    if (stream[i] === prev) n++;
    else {
      out.push(n > 1 ? `${prev}×${n}` : prev);
      prev = stream[i];
      n = 1;
    }
  }
  out.push(n > 1 ? `${prev}×${n}` : prev);
  return out.join(" ");
}

/**
 * @param {string} stream
 * @param {number} n
 */
export function streamNgrams(stream, n = 2) {
  /** @type {Record<string, number>} */
  const counts = {};
  if (!stream || stream.length < n) {
    if (stream) counts[stream] = 1;
    return counts;
  }
  for (let i = 0; i <= stream.length - n; i++) {
    const g = stream.slice(i, i + n);
    counts[g] = (counts[g] || 0) + 1;
  }
  return counts;
}

/**
 * Jaccard distance on n-grams of two streams
 * @param {string} a
 * @param {string} b
 * @param {number} [n]
 */
export function streamJaccardDistance(a, b, n = 2) {
  const A = new Set(Object.keys(streamNgrams(a, n)));
  const B = new Set(Object.keys(streamNgrams(b, n)));
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const uni = A.size + B.size - inter;
  return uni ? 1 - inter / uni : 0;
}

/**
 * Mean articulatory vector
 * @param {number[][]} arts
 */
export function meanArticulatory(arts) {
  const dim = ARTICULATORY_FEATURES.length;
  if (!arts?.length) return new Array(dim).fill(0);
  const acc = new Array(dim).fill(0);
  for (const f of arts) {
    for (let i = 0; i < dim; i++) acc[i] += f[i] || 0;
  }
  return acc.map((v) => Math.round((v / arts.length) * 1000) / 1000);
}

/**
 * Per-word phonetic record
 * @param {string} word
 * @param {string} [lang]
 */
export function analyzePhonWord(word, lang = "en") {
  const text = String(word || "");
  // Only English rule table for now; other langs fall back to letterSO-like Latin if [a-z]
  const { classes, phones, arts } =
    lang === "en" || !lang
      ? englishWordToPhones(text)
      : englishWordToPhones(text); // expandable
  const cv = classesToCV(classes);
  const open =
    cv.length === 0
      ? 0
      : Math.round(((cv.split("V").length - 1) / cv.length) * 1000) / 10;
  const tri = streamNgrams(cv, 3);
  const dominant =
    Object.entries(tri).sort((a, b) => b[1] - a[1])[0]?.[0] || cv || phones;
  return {
    text,
    phones,
    phoneClasses: classes,
    cv,
    compressed: compressStream(cv),
    openRatioPhon: open,
    dominant,
    artMean: meanArticulatory(arts),
  };
}

/**
 * Full phonetic analysis for text (mirror analyzeOrder shape)
 * @param {string} text
 * @param {{ lang?: string, level?: string }} [opts]
 */
export function analyzePhonPattern(text, opts = {}) {
  const raw = String(text || "");
  const lang = opts.lang || "en";
  const tokens = raw.match(/[\p{L}']+/gu) || [];
  const words = tokens.map((w) => analyzePhonWord(w, lang));

  // Phrase-level: concat CV / phones
  const cv = words.map((w) => w.cv).join("");
  const phones = words.map((w) => w.phones).join(" ");
  const allArts = words.flatMap((w) => {
    // reconstruct arts from phone classes for mean
    return (w.phoneClasses || []).map((c) => PHONE_CLASS_ART[c] || PHONE_CLASS_ART.X);
  });
  // Better: re-run englishWordToPhones on full alnum strip for continuous stream
  const joined = tokens.join("");
  const full = englishWordToPhones(joined);
  const cvFull = classesToCV(full.classes);
  const bigrams = streamNgrams(cvFull, 2);
  const trigrams = streamNgrams(cvFull, 3);
  const openRatioPhon =
    cvFull.length === 0
      ? 0
      : Math.round(((cvFull.split("V").length - 1) / cvFull.length) * 1000) / 10;

  /** @type {Record<string, number>} */
  const junctions = {};
  for (let i = 1; i < words.length; i++) {
    const a = words[i - 1].cv.slice(-1) || "·";
    const b = words[i].cv[0] || "·";
    const j = `${a}→${b}`;
    junctions[j] = (junctions[j] || 0) + 1;
  }

  const patternHits = { ...bigrams, ...trigrams };
  const topPatterns = Object.entries(patternHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([pattern, count]) => ({ pattern, count }));

  const orderChain = words.map((w) => w.cv || w.phones).join("|");

  return {
    text: raw.slice(0, 500),
    lang,
    level: opts.level || null,
    phones: full.phones,
    phoneClasses: full.classes,
    cv: cvFull,
    compressed: compressStream(cvFull),
    length: cvFull.length,
    openRatioPhon,
    closedRatioPhon:
      cvFull.length === 0
        ? 0
        : Math.round(((cvFull.split("C").length - 1) / cvFull.length) * 1000) / 10,
    bigrams,
    trigrams,
    topPatterns,
    words,
    orderChain,
    junctions,
    artMean: meanArticulatory(full.arts.length ? full.arts : allArts),
    articulatory: {
      dim: ARTICULATORY_FEATURES.length,
      feature_names: ARTICULATORY_FEATURES.slice(),
      mean: meanArticulatory(full.arts.length ? full.arts : allArts),
    },
    labels: {
      C: "consonantal (P F A N L X)",
      V: "vocalic (Vh Vm Vl)",
      phoneClasses: "P stop · F fricative · A affricate · N nasal · L liquid/glide · Vh/Vm/Vl vowels · X other",
      note: "English grapheme→phone approximation · not IPA licensing; SO remains orthographic",
    },
    blend: {
      muSO: 0.2,
      muPhon: 0.3,
      muArt: 0.12,
      form: "c_tilde = c * (1 + muSO*E[d_SO] + muPhon*E[d_PHON] + muArt*E[d_art])",
      dPhon: "1 - Jaccard(CV bigrams/trigrams)",
      dArt: "L2(artMean) z-scored over articulatory bank (optional continuous prior)",
      purity: "jax.x[10] unchanged — fetch JAX bank for layout rank only",
    },
  };
}

/**
 * Blend transfer cost with SO + PHON (+ optional articulatory) distances
 * @param {number} c base language cost
 * @param {number} dSO
 * @param {number} dPHON
 * @param {{ muSO?: number, muPhon?: number, muArt?: number, dArt?: number, cap?: number }} [opts]
 */
export function blendTransferCost(c, dSO = 0, dPHON = 0, opts = {}) {
  const muSO = opts.muSO ?? 0.2;
  const muPhon = opts.muPhon ?? 0.3;
  const muArt = opts.muArt ?? 0;
  const dArt = opts.dArt ?? 0;
  const cap = opts.cap ?? 2.5;
  const factor = 1 + muSO * dSO + muPhon * dPHON + muArt * dArt;
  const tilde = c * factor;
  return Math.min(tilde, cap * c);
}

/**
 * Distance between two texts' phonetic CV streams
 */
export function phonDistance(textA, textB, opts = {}) {
  const a = analyzePhonPattern(textA, opts);
  const b = analyzePhonPattern(textB, opts);
  const n = opts.n || 2;
  const dCV = streamJaccardDistance(a.cv, b.cv, n);
  const d3 = streamJaccardDistance(a.cv, b.cv, 3);
  const alpha = opts.alpha ?? 0.6;
  const dPHON = alpha * dCV + (1 - alpha) * d3;
  // articulatory L2 (raw, unnormalized)
  let dArt = 0;
  const aa = a.artMean || [];
  const bb = b.artMean || [];
  for (let i = 0; i < ARTICULATORY_FEATURES.length; i++) {
    dArt += ((aa[i] || 0) - (bb[i] || 0)) ** 2;
  }
  dArt = Math.sqrt(dArt);
  return {
    dPHON: Math.round(dPHON * 1000) / 1000,
    dCV2: Math.round(dCV * 1000) / 1000,
    dCV3: Math.round(d3 * 1000) / 1000,
    dArt: Math.round(dArt * 1000) / 1000,
    a: { cv: a.cv, openRatioPhon: a.openRatioPhon },
    b: { cv: b.cv, openRatioPhon: b.openRatioPhon },
  };
}
