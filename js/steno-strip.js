/**
 * stenoSTRIP + blank-space coin analysis
 *
 * Writing spends "coins" as visible glyphs; blank/whitespace is capacity that can be
 * re-allotted for side-channel payloads (routing, weight, cortical history, tool data).
 *
 * Alphabet: 13 Unicode space-class chars → log2(13) ≈ 3.7 bits/symbol
 * Doc claim: ~19 bits/line when packing ~5 space-slots per line (3.7×5).
 *
 * Aligns with GlueLam qbit-steno (when present) and falls back to this pure ES module.
 *
 * @see docs/ECOSYSTEM-MAP.md · GrokYtalkY forge/hexlum packet path
 */

/** 13 space-class code points used as stego alphabet (visible-invisible mix) */
export const STENO_SPACES = [
  "\u0020", // SPACE
  "\u00A0", // NO-BREAK SPACE
  "\u2000", // EN QUAD
  "\u2001", // EM QUAD
  "\u2002", // EN SPACE
  "\u2003", // EM SPACE
  "\u2004", // THREE-PER-EM
  "\u2005", // FOUR-PER-EM
  "\u2006", // SIX-PER-EM
  "\u2007", // FIGURE SPACE
  "\u2008", // PUNCTUATION SPACE
  "\u2009", // THIN SPACE
  "\u200A", // HAIR SPACE
];

/** Zero-width / invisible extras (not in 13-pack encode; counted in blank analysis) */
export const INVISIBLE_SPACES = [
  "\u200B", // ZERO WIDTH SPACE
  "\u200C", // ZWNJ
  "\u200D", // ZWJ
  "\u2060", // WORD JOINER
  "\uFEFF", // BOM / ZWNBSP
  "\u202F", // NARROW NO-BREAK
  "\u205F", // MEDIUM MATH SPACE
  "\u3000", // IDEOGRAPHIC SPACE
  "\t",
];

const SPACE_SET = new Set([...STENO_SPACES, ...INVISIBLE_SPACES, "\n", "\r"]);
const BITS_PER_SYMBOL = Math.log2(STENO_SPACES.length); // ~3.700
const SLOTS_PER_LINE = 5; // → ~18.5 bits/line ≈ doc "19 bits/line"
export const BITS_PER_LINE = Math.floor(BITS_PER_SYMBOL * SLOTS_PER_LINE); // 18

/** 1 coin = 1 bit of usable blank/steno capacity */
export const COIN_BIT = 1;

/**
 * Prefer live GlueLam QbitSteno when non-stub.
 */
function realSteno() {
  if (typeof window === "undefined") return null;
  const S = window.QbitSteno;
  if (S && !S.stub && typeof S.encode === "function") return S;
  return null;
}

/**
 * @param {string} ch
 */
export function isWhitespaceChar(ch) {
  return SPACE_SET.has(ch) || /\s/.test(ch);
}

/**
 * Visible writing vs blank capacity for a string.
 * @param {string} text
 */
export function analyzeBlankSpace(text) {
  const raw = String(text ?? "");
  let writeChars = 0;
  let blankChars = 0;
  let newlines = 0;
  let tabs = 0;
  let asciiPrintable = 0;
  let nonAscii = 0;
  const runs = [];
  let runStart = -1;
  let runLen = 0;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const code = ch.codePointAt(0);
    if (ch === "\n") {
      newlines++;
      blankChars++;
      if (runLen) {
        runs.push({ start: runStart, len: runLen });
        runLen = 0;
        runStart = -1;
      }
      continue;
    }
    if (ch === "\t") {
      tabs++;
      blankChars++;
      if (runStart < 0) runStart = i;
      runLen++;
      continue;
    }
    if (isWhitespaceChar(ch) || ch === " ") {
      blankChars++;
      if (runStart < 0) runStart = i;
      runLen++;
      continue;
    }
    // writing glyph
    if (runLen) {
      runs.push({ start: runStart, len: runLen });
      runLen = 0;
      runStart = -1;
    }
    writeChars++;
    if (code >= 0x20 && code <= 0x7e) asciiPrintable++;
    else nonAscii++;
  }
  if (runLen) runs.push({ start: runStart, len: runLen });

  const lines = raw.length ? raw.split(/\n/).length : 0;
  // Steno capacity: each line can carry SLOTS_PER_LINE space-slots (~19 bits)
  // Plus existing blank runs can be remapped (1 symbol per blank char, clamped)
  const lineCapacityBits = lines * BITS_PER_LINE;
  const runCapacityBits = Math.floor(
    runs.reduce((n, r) => n + Math.min(r.len, SLOTS_PER_LINE) * BITS_PER_SYMBOL, 0)
  );
  const blankCapacityBits = Math.max(lineCapacityBits, runCapacityBits);

  // Coins: writing spends; blanks are allotable
  const writeCoins = writeChars; // 1 coin per visible glyph "spent"
  const blankCoins = blankCapacityBits; // allotable side-channel coins (bits)
  const freeCoins = blankCoins; // available for other use
  const totalCoins = writeCoins + blankCoins;

  return {
    schema: "kbatch-blank-space-v1",
    length: raw.length,
    lines,
    writeChars,
    blankChars,
    newlines,
    tabs,
    asciiPrintable,
    nonAscii,
    runs: runs.length,
    longestRun: runs.reduce((m, r) => Math.max(m, r.len), 0),
    bitsPerSymbol: Number(BITS_PER_SYMBOL.toFixed(3)),
    bitsPerLine: BITS_PER_LINE,
    slotsPerLine: SLOTS_PER_LINE,
    capacity: {
      lineBits: lineCapacityBits,
      runBits: runCapacityBits,
      blankBits: blankCapacityBits,
      blankBytes: Math.floor(blankCapacityBits / 8),
    },
    coins: {
      write: writeCoins,
      blank: blankCoins,
      free: freeCoins,
      total: totalCoins,
      unit: "bit-coin (1 coin = 1 steno bit of blank capacity; write = 1 glyph)",
      allotable: freeCoins,
      spentWriting: writeCoins,
    },
  };
}

/**
 * Hex / binary / ascii tool totals for a string (and optional payload).
 * @param {string} text
 * @param {string} [payload]
 */
export function toolAnalysisTotal(text, payload = "") {
  const raw = String(text ?? "");
  const pay = String(payload ?? "");
  const bytes = new TextEncoder().encode(raw);
  const payBytes = pay ? new TextEncoder().encode(pay) : new Uint8Array(0);

  const toHex = (u8) =>
    [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
  const toBin = (u8, max = 256) =>
    [...u8]
      .slice(0, max)
      .map((b) => b.toString(2).padStart(8, "0"))
      .join(" ");

  const asciiCodes = [...raw]
    .filter((c) => {
      const n = c.codePointAt(0);
      return n >= 0x20 && n <= 0x7e;
    })
    .map((c) => c.codePointAt(0));

  return {
    schema: "kbatch-tool-analysis-v1",
    ascii: {
      printable: asciiCodes.length,
      codes: asciiCodes.slice(0, 64),
      sample: raw.replace(/[^\x20-\x7E]/g, "·").slice(0, 120),
    },
    hexadecimal: {
      length: bytes.length * 2,
      head: toHex(bytes.slice(0, 48)),
      fullChars: bytes.length * 2,
    },
    binary: {
      bits: bytes.length * 8,
      head: toBin(bytes, 24),
    },
    utf8: {
      bytes: bytes.length,
      payloadBytes: payBytes.length,
      combinedBytes: bytes.length + payBytes.length,
    },
    totals: {
      chars: raw.length,
      utf8Bytes: bytes.length,
      hexDigits: bytes.length * 2,
      binaryBits: bytes.length * 8,
      asciiPrintable: asciiCodes.length,
      payloadUtf8: payBytes.length,
      /** Combined "tool score" for UI strip */
      score:
        bytes.length * 8 +
        asciiCodes.length +
        Math.floor(payBytes.length * 8),
    },
  };
}

/**
 * Encode payload bits into a stego trailer of steno spaces (appended after text).
 * @param {string} text
 * @param {string|Uint8Array} payload
 */
export function stenoEncode(text, payload) {
  const live = realSteno();
  if (live?.encode && payload != null) {
    try {
      const out = live.encode(String(text ?? ""), payload);
      if (typeof out === "string") return out;
    } catch {
      /* fall through */
    }
  }

  const base = String(text ?? "");
  const bytes =
    typeof payload === "string"
      ? new TextEncoder().encode(payload)
      : payload instanceof Uint8Array
        ? payload
        : new TextEncoder().encode(String(payload ?? ""));

  if (!bytes.length) return base;

  // bit stream → base-13 space symbols
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  // pad to multiple of symbol bit-width using floor(log2(13))=3 bits/symbol packing
  const packBits = 3; // 8 of 13 symbols used for clean 3-bit packing
  while (bits.length % packBits) bits += "0";

  let stego = "";
  for (let i = 0; i < bits.length; i += packBits) {
    const n = parseInt(bits.slice(i, i + packBits), 2);
    stego += STENO_SPACES[n % STENO_SPACES.length];
  }
  // marker: hair space + figure space framing (detectable)
  const mark = STENO_SPACES[12] + STENO_SPACES[9];
  return base + mark + stego + mark;
}

/**
 * Decode trailing steno space payload if present.
 * @param {string} text
 */
export function stenoDecode(text) {
  const live = realSteno();
  if (live?.decode) {
    try {
      const out = live.decode(String(text ?? ""));
      if (out != null && out !== text) return out;
    } catch {
      /* */
    }
  }

  const raw = String(text ?? "");
  const mark = STENO_SPACES[12] + STENO_SPACES[9];
  const first = raw.indexOf(mark);
  if (first < 0) return { text: raw, payload: "", found: false };
  const second = raw.indexOf(mark, first + mark.length);
  if (second < 0) return { text: raw, payload: "", found: false };

  const body = raw.slice(0, first);
  const stego = raw.slice(first + mark.length, second);
  const packBits = 3;
  let bits = "";
  for (const ch of stego) {
    const idx = STENO_SPACES.indexOf(ch);
    if (idx < 0 || idx > 7) continue; // only 3-bit pack symbols 0–7
    bits += idx.toString(2).padStart(packBits, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  // trim trailing null pad
  while (bytes.length && bytes[bytes.length - 1] === 0) bytes.pop();
  let payload = "";
  try {
    payload = new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    payload = "";
  }
  return { text: body, payload, found: true, bytes: bytes.length };
}

/**
 * Full analysis pack: blank coins + tool totals + steno capacity allotment.
 * @param {string} text
 * @param {{ payload?: string }} [opts]
 */
export function analyzeStenoSpace(text, opts = {}) {
  const blank = analyzeBlankSpace(text);
  const tools = toolAnalysisTotal(text, opts.payload || "");
  const payload = opts.payload != null ? String(opts.payload) : "";
  const payloadBits = payload
    ? new TextEncoder().encode(payload).length * 8
    : 0;

  const allotable = blank.coins.allotable;
  const needed = payloadBits;
  const fitsInBlank = !payload || needed <= allotable;
  // Append mode always works: stego trailer extends blank capacity
  const fits = Boolean(payload) || fitsInBlank;
  const fitsByAppend = Boolean(payload) && needed > allotable;
  const remaining = Math.max(0, allotable - Math.min(needed, allotable));

  // Allotment plan for "other use" (from free blank coins first)
  const allotment = {
    fits: true, // encode can always append trailer
    fitsInBlank,
    fitsByAppend,
    mode: fitsByAppend ? "append-trailer" : payload ? "blank-allot" : "analyze",
    neededCoins: needed,
    freeCoins: allotable,
    remainingCoins: remaining,
    uses: [
      {
        id: "steno-routing",
        label: "stenoSTRIP routing / weight",
        coins: Math.min(BITS_PER_LINE, allotable),
      },
      {
        id: "pcap-chunk",
        label: "GYST/pcap image chunk meta",
        coins: Math.min(64, Math.max(0, allotable - BITS_PER_LINE)),
      },
      {
        id: "watermark",
        label: "forge mark / hexlum watermark id",
        coins: Math.min(128, Math.max(0, allotable - BITS_PER_LINE - 64)),
      },
      fitsByAppend
        ? {
            id: "append-trailer",
            label: "append steno trailer (extends blank)",
            coins: needed,
          }
        : null,
    ].filter((u) => u && u.coins > 0),
  };

  let encoded = null;
  if (payload) {
    encoded = stenoEncode(text, payload);
  }

  return {
    schema: "kbatch-steno-space-v1",
    blank,
    tools,
    payload: {
      text: payload.slice(0, 200),
      bits: payloadBits,
      bytes: Math.ceil(payloadBits / 8),
    },
    allotment,
    encoded,
    strip: formatStrip(blank, tools, allotment),
    gluelam: Boolean(realSteno()),
  };
}

/**
 * One-line strip for UI / metrics bar.
 */
export function formatStrip(blank, tools, allotment) {
  const c = blank?.coins || {};
  const t = tools?.totals || {};
  return `Write ${c.spentWriting ?? 0} · Blank ${c.allotable ?? 0} coins · free ${allotment?.remainingCoins ?? c.free ?? 0} · ASCII ${t.asciiPrintable ?? 0} · hex ${t.hexDigits ?? 0} · bin ${t.binaryBits ?? 0}b · utf8 ${t.utf8Bytes ?? 0}B`;
}

/**
 * Strip trailing stego for display (visible writing only).
 * @param {string} text
 */
export function stripSteno(text) {
  const live = realSteno();
  if (live?.strip) {
    try {
      return live.strip(String(text ?? ""));
    } catch {
      /* */
    }
  }
  const d = stenoDecode(text);
  return d.found ? d.text : String(text ?? "");
}

/**
 * HTML for Shadow Live panel.
 * @param {ReturnType<typeof analyzeStenoSpace>} pack
 */
export function stenoSpaceHtml(pack) {
  if (!pack) return "";
  const c = pack.blank.coins;
  const cap = pack.blank.capacity;
  const t = pack.tools.totals;
  const a = pack.allotment;
  const uses = (a.uses || [])
    .map(
      (u) =>
        `<span class="coin-use" title="${esc(u.label)}">${esc(u.id)} <b>${u.coins}</b></span>`
    )
    .join("");

  return `<div class="steno-space-panel" data-steno-space="1">
    <div class="coin-strip" title="${esc(pack.strip)}">${esc(pack.strip)}</div>
    <div class="coin-grid">
      <div class="coin-cell is-write"><span class="sense-k">Write coins</span><b>${c.spentWriting}</b><small>visible glyphs spent</small></div>
      <div class="coin-cell is-blank"><span class="sense-k">Blank coins</span><b>${c.allotable}</b><small>allotable steno bits</small></div>
      <div class="coin-cell is-free"><span class="sense-k">Free</span><b>${a.remainingCoins}</b><small>other-use remaining</small></div>
      <div class="coin-cell"><span class="sense-k">Capacity</span><b>${cap.blankBytes}B</b><small>${cap.blankBits} bits · ${pack.blank.lines} lines</small></div>
    </div>
    <div class="coin-tools">
      <span class="pill mid">ASCII ${t.asciiPrintable}</span>
      <span class="pill mid">hex ${t.hexDigits}</span>
      <span class="pill mid">bin ${t.binaryBits}b</span>
      <span class="pill mid">utf8 ${t.utf8Bytes}B</span>
      <span class="pill ${a.fitsInBlank ? "high" : a.fitsByAppend ? "mid" : "high"}">payload ${a.neededCoins}c ${a.fitsInBlank ? "in-blank" : a.fitsByAppend ? "append" : "ok"}</span>
    </div>
    ${uses ? `<div class="coin-allot"><span class="sense-k">Allotment</span> ${uses}</div>` : ""}
    <p class="coin-hex" title="hex head">${esc(pack.tools.hexadecimal.head || "—")}</p>
  </div>`;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Browser global for GlueLam compatibility
if (typeof window !== "undefined") {
  window.QbitSteno = window.QbitSteno && !window.QbitSteno.stub
    ? window.QbitSteno
    : {
        stub: false,
        source: "kbatch-steno-strip",
        spaces: STENO_SPACES,
        encode: (t, p) => stenoEncode(t, p ?? ""),
        decode: (t) => stenoDecode(t).payload || t,
        strip: (t) => stripSteno(t),
        analyze: (t) => analyzeStenoSpace(t),
      };
}
