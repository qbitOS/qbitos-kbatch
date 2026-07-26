/**
 * Quantum gutter fold-through — prefixes on *every* language + code rail
 *
 * Ensures the 11-symbol gutter (n: +1: -n: +0: 0: -1: +n: +2: -0: +3: 1:)
 * flows through Shadow Live, tool stack, mesh, terminal, and exports —
 * not only code editors on mueee.
 *
 * Loads GlueLam quantum-prefixes (vendor or remote) then classifies
 * utterances as structural lines ready for T5/WASM/quantum speed paths.
 *
 * @see vendor/gluelam/quantum-prefixes.js · docs/ECOSYSTEM-MAP.md
 */

import { ensureGluelam, getGluelamStatus } from "./gluelam-consumer.js";

const LANG_HINTS = {
  en: "javascript", // structural English treated as freeform body
  py: "python",
  python: "python",
  js: "javascript",
  ts: "javascript",
  rust: "rust",
  rs: "rust",
  go: "go",
  cpp: "cpp",
  c: "c",
  java: "java",
  html: "html",
  css: "css",
  sql: "sql",
  shell: "bash",
  bash: "bash",
  sh: "bash",
};

/** Speech/utterance structural categories (language rail) */
const SPEECH_PATTERNS = [
  { cat: "output", re: /^(print|say|speak|utter|echo)\b/i, sym: "+3:" },
  { cat: "condition", re: /^(if|when|unless|whether)\b/i, sym: "+n:" },
  { cat: "loop", re: /^(while|for each|repeat|again)\b/i, sym: "+2:" },
  { cat: "return", re: /^(so|therefore|thus|hence|return)\b/i, sym: "-0:" },
  { cat: "import", re: /^(from|via|according to|cite)\b/i, sym: "-n:" },
  { cat: "function", re: /^(let us|we will|define|call)\b/i, sym: "0:" },
  { cat: "comment", re: /^(note:|nb:|#|\/\/|—)/i, sym: "+1:" },
  { cat: "error", re: /^(error|fail|cannot|don't|wrong)\b/i, sym: "-1:" },
  { cat: "class", re: /^(the|a|an)\s+\w+\s+(is|are)\b/i, sym: "+0:" },
  { cat: "variable", re: /^\w+\s*(=|is|equals)\s+/i, sym: "1:" },
];

/**
 * Ensure QuantumPrefixes global is present (vendor path preferred).
 */
export async function ensureQuantumGutter() {
  await ensureGluelam({
    // prefer local vendored modules for offline / quantum-speed path
    base: "./vendor/gluelam/",
  });
  // second try remote if still stub
  const st = getGluelamStatus();
  if (st.stubs) {
    await ensureGluelam({ base: "https://mueee.qbitos.ai/", force: true });
  }
  return getQuantumApi();
}

/**
 * Map orthography / pack `bi` binary + glyph bits → quantum-gutter style 0–1 stream.
 * Aligns analyzed pack field `bi` and GY glyph embeds with
 * https://mueee.qbitos.ai/quantum-gutter.html
 *
 * @param {string} text
 * @param {{
 *   binary?: string,
 *   glyphBits?: number[],
 *   layout?: string,
 * }} [opts]
 */
export function binaryStreamToGutter(text, opts = {}) {
  const raw = String(text ?? "");
  /** @type {number[]} */
  let bits = [];
  if (opts.binary) {
    bits = String(opts.binary)
      .replace(/[^01]/g, "")
      .split("")
      .map((c) => (c === "1" ? 1 : 0));
  } else if (opts.glyphBits?.length) {
    bits = opts.glyphBits.map((b) => (b ? 1 : 0));
  } else {
    // UTF-8 → bits (MSB first) for free text when no pack bi
    const bytes = new TextEncoder().encode(raw.slice(0, 256));
    for (const b of bytes) {
      for (let k = 7; k >= 0; k--) bits.push((b >> k) & 1);
    }
  }

  const lines = raw.split(/\r?\n/);
  const classified = lines.map((line) => classifyGutterLine(line, { mode: "auto" }));

  // Fold bits into gutter symbols (0 → -0: / +0:, 1 → 1: / +1:)
  const stream = bits.map((bit, i) => {
    const sym = bit ? (i % 3 === 0 ? "1:" : "+1:") : i % 3 === 0 ? "0:" : "-0:";
    return { i, bit, sym };
  });

  const ones = bits.reduce((a, b) => a + b, 0);
  const balance = bits.length ? ones / bits.length : 0.5;

  return {
    schema: "kbatch-quantum-binary-stream-v1",
    text: raw.slice(0, 240),
    bitCount: bits.length,
    ones,
    zeros: bits.length - ones,
    balance: Number(balance.toFixed(4)),
    /** closer to 0.5 = more “quantum-ish” mixed; extremes = classical */
    quantumLikeness: Number((1 - Math.abs(balance - 0.5) * 2).toFixed(4)),
    stream: stream.slice(0, 512),
    gutterLines: classified,
    align: {
      gutter: "https://mueee.qbitos.ai/quantum-gutter.html",
      school: "https://mueee.qbitos.ai/school/corpus/school-corpus.html",
      digitalAlphabet: "https://mueee.qbitos.ai/digital_alphabet.html",
      packField: "analyzed.*.bi",
    },
    layout: opts.layout || "qwerty",
    ts: Date.now(),
  };
}

function getQuantumApi() {
  if (typeof window !== "undefined" && window.QuantumPrefixes) {
    return window.QuantumPrefixes;
  }
  return null;
}

/**
 * Classify one line — code language or speech rail.
 * @param {string} line
 * @param {{ lang?: string, mode?: "code"|"speech"|"auto" }} [opts]
 */
export function classifyGutterLine(line, opts = {}) {
  const text = String(line ?? "");
  const mode = opts.mode || "auto";
  const qp = getQuantumApi();

  // Prefer real GlueLam classifier for code-like input
  const looksCode =
    mode === "code" ||
    (mode === "auto" &&
      (/[{};=<>]|^\s*(def|class|import|function|const|let|var|fn |pub |package )/m.test(
        text
      ) ||
        text.trimStart().startsWith("#!")));

  if (looksCode && qp?.classifyLine) {
    const lang = LANG_HINTS[opts.lang] || opts.lang || "javascript";
    try {
      const r = qp.classifyLine(text, lang);
      return {
        ...r,
        rail: "code",
        source: qp.stub ? "stub" : "gluelam",
        line: text,
      };
    } catch {
      /* fall through */
    }
  }

  // Speech / language rail
  for (const p of SPEECH_PATTERNS) {
    if (p.re.test(text.trim())) {
      return {
        sym: p.sym,
        category: p.cat,
        cls: `pfx-${p.cat}`,
        rail: "speech",
        source: "kbatch-speech",
        line: text,
      };
    }
  }

  // Default body
  if (qp?.classifyLine) {
    try {
      const r = qp.classifyLine(text, "javascript");
      return { ...r, rail: "speech", source: qp.stub ? "stub" : "gluelam", line: text };
    } catch {
      /* */
    }
  }
  return {
    sym: "   ",
    category: "default",
    cls: "pfx-default",
    rail: "speech",
    source: "fallback",
    line: text,
  };
}

/**
 * Prefix full content (multi-line) for gutter display / mesh / export.
 * @param {string} content
 * @param {{ lang?: string, mode?: string }} [opts]
 */
export function gutterPrefixContent(content, opts = {}) {
  const lines = String(content || "").split(/\r?\n/);
  const rows = lines.map((line) => {
    const c = classifyGutterLine(line, opts);
    return {
      sym: c.sym,
      category: c.category,
      rail: c.rail,
      source: c.source,
      line,
      display: `${c.sym} ${line}`,
    };
  });
  const counts = {};
  for (const r of rows) counts[r.category] = (counts[r.category] || 0) + 1;
  return {
    schema: "kbatch-quantum-gutter-v1",
    rows,
    counts,
    strip: rows
      .slice(0, 12)
      .map((r) => r.sym.trim() || "·")
      .join(" "),
    gluelam: getGluelamStatus(),
    ts: Date.now(),
  };
}

/**
 * HTML gutter for Shadow Live / terminal.
 * @param {ReturnType<typeof gutterPrefixContent>} pack
 */
export function gutterHtml(pack) {
  if (!pack?.rows?.length) {
    return `<p class="writer-muted">Quantum gutter idle — type code or speech.</p>`;
  }
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const body = pack.rows
    .slice(0, 48)
    .map(
      (r) =>
        `<div class="qg-row ${esc(r.cls || "")}" data-cat="${esc(r.category)}" data-rail="${esc(r.rail)}"><span class="qg-sym">${esc(r.sym)}</span><span class="qg-line">${esc(r.line)}</span></div>`
    )
    .join("");
  return `<div class="quantum-gutter" data-schema="kbatch-quantum-gutter-v1">
    <p class="coin-strip">gutter ${esc(pack.strip)} · ${Object.keys(pack.counts || {}).length} cats · gluelam ${pack.gluelam?.stubs ? "stub" : "live"}</p>
    <div class="qg-body">${body}</div>
  </div>`;
}

/**
 * Broadcast gutter state on quantum-prefixes channel (cross-app).
 * @param {string} app
 * @param {object} state
 */
export function broadcastGutter(app, state) {
  const qp = getQuantumApi();
  try {
    qp?.broadcastState?.(app || "ugrad.kbatch.shadow", state);
  } catch {
    /* */
  }
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const bc = new BroadcastChannel("quantum-prefixes");
      bc.postMessage({
        type: "kbatch-gutter",
        app: app || "ugrad.kbatch.shadow",
        state,
        ts: Date.now(),
      });
      bc.close();
    } catch {
      /* */
    }
  }
}

export function getGutterSymbols() {
  const qp = getQuantumApi();
  return qp?.PREFIXES || {
    shebang: { sym: "n:" },
    comment: { sym: "+1:" },
    import: { sym: "-n:" },
    class: { sym: "+0:" },
    function: { sym: "0:" },
    error: { sym: "-1:" },
    condition: { sym: "+n:" },
    loop: { sym: "+2:" },
    return: { sym: "-0:" },
    output: { sym: "+3:" },
    variable: { sym: "1:" },
  };
}
