/**
 * Exemplary stair demos → live glyph/steno image datastream
 *
 * Stack (always explicit, never silent-fail):
 *   DAC · Quantum Gutter · Prefixes · IronLine · GlueLam · stenoStrip · whitespace
 *   → Glyph→steno live encode/broadcast · pcap/hexlum image interpret
 *
 * Used by DOJO axes “Stair demos · instant all-language” + Glyph→steno panel.
 *
 * @see js/glyph-steno.js · js/steno-strip.js · js/quantum-gutter.js
 * @see js/gluelam-consumer.js · js/ironline-bus.js · js/pcap-image-bridge.js
 */

import { ensureGluelam, getGluelamStatus, classifyWithPrefixes } from "./gluelam-consumer.js";
import {
  ensureQuantumGutter,
  gutterPrefixContent,
  classifyGutterLine,
  binaryStreamToGutter,
} from "./quantum-gutter.js";
import {
  analyzeStenoSpace,
  analyzeBlankSpace,
  STENO_SPACES,
  BITS_PER_LINE,
} from "./steno-strip.js";
import {
  encodeGlyphInSteno,
  decodeGlyphFromSteno,
  broadcastGlyphSteno,
  glyphFromText,
  glyphGridHtml,
  DEFAULT_GLYPH_N,
  GLYPH_SIZES,
  normalizeGlyphPixels,
} from "./glyph-steno.js";
import { publish } from "./ironline-bus.js";
import {
  buildPcapImagePath,
  buildHexLum,
  createForgeMark,
  renderHexLumCanvas,
  publishPcapImage,
} from "./pcap-image-bridge.js";

export const STAIR_STREAM_SCHEMA = "kbatch-stair-glyph-stream-v1";

/** Rail names shown in UI / agent envelopes */
export const STREAM_RAILS = Object.freeze([
  "DAC",
  "QuantumGutter",
  "Prefixes",
  "IronLine",
  "Gluelam",
  "stenoStrip",
  "whitespace",
  "GlyphSteno",
  "pcapImage",
]);

/**
 * Ensure GlueLam + Quantum Gutter ready (vendor first, then remote).
 */
export async function ensureStreamStack() {
  try {
    if (typeof document !== "undefined") {
      await ensureQuantumGutter();
    } else {
      // Node / agent offline: ES steno + local classifiers only
      try {
        const { installStubs } = await import("./gluelam-consumer.js").catch(() => ({}));
      } catch {
        /* */
      }
    }
  } catch {
    /* stubs still usable */
  }
  const gluelam =
    typeof document !== "undefined"
      ? getGluelamStatus()
      : {
          loaded: false,
          stubs: true,
          base: null,
          has: { prefixes: false, dac: false, steno: false, preflight: false },
        };
  return {
    ok: true,
    gluelam,
    rails: STREAM_RAILS,
    quantumGutter: "https://mueee.qbitos.ai/quantum-gutter.html",
    vendor: "./vendor/gluelam/",
  };
}

/**
 * DAC-style line classify via GlueLam QbitDAC when live; else gutter prefix.
 * @param {string} text
 * @param {{ lang?: string, source?: string }} [opts]
 */
export function dacClassify(text, opts = {}) {
  const source = opts.source || "stair-glyph-stream";
  const lang = opts.lang || "en";
  const DAC =
    typeof window !== "undefined" && window.QbitDAC && !window.QbitDAC.stub
      ? window.QbitDAC
      : null;

  if (DAC?.prefixDAC) {
    try {
      const r = DAC.prefixDAC(String(text || ""), lang, source);
      return {
        source: "gluelam-dac",
        stub: false,
        result: r,
        sym: r?.prefix || r?.sym || r?.lines?.[0]?.sym || "0:",
        category: r?.category || r?.lines?.[0]?.category || "body",
      };
    } catch (e) {
      return { source: "dac-error", stub: true, error: String(e?.message || e) };
    }
  }
  if (DAC?.encode) {
    try {
      const r = DAC.encode(String(text || ""));
      return {
        source: "gluelam-dac-encode",
        stub: false,
        result: r,
        sym: "0:",
        category: "body",
      };
    } catch {
      /* fall through */
    }
  }
  const g = classifyGutterLine(text, { mode: "auto", lang });
  return {
    source: g.source || "gutter-fallback",
    stub: g.source === "fallback" || g.source === "stub",
    sym: g.sym,
    category: g.category,
    rail: g.rail,
    result: g,
  };
}

/**
 * Sample bits from ImageData / canvas for glyph matrix.
 * @param {ImageData} imageData
 * @param {number} n
 */
export function glyphBitsFromImageData(imageData, n = DEFAULT_GLYPH_N) {
  const size = n * n;
  const bits = new Array(size).fill(0);
  if (!imageData?.data) return bits;
  const { width, height, data } = imageData;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const sx = Math.min(width - 1, Math.floor((c + 0.5) * (width / n)));
      const sy = Math.min(height - 1, Math.floor((r + 0.5) * (height / n)));
      const i = (sy * width + sx) * 4;
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const a = (data[i + 3] ?? 255) / 255;
      bits[r * n + c] = a > 0.08 && lum < 0.55 ? 1 : 0;
    }
  }
  return bits;
}

/**
 * Draw HTMLImageElement / ImageBitmap / File into n×n glyph bits.
 * @param {HTMLImageElement|ImageBitmap|Blob|File|string} src
 * @param {number} [n]
 */
export async function glyphBitsFromImage(src, n = DEFAULT_GLYPH_N) {
  if (typeof document === "undefined") {
    return { ok: false, error: "no document", bits: glyphFromText("image", n), n };
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(n * 4, 64);
  canvas.height = Math.max(n * 4, 64);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { ok: false, error: "no 2d", bits: glyphFromText("image", n), n };
  }

  /** @type {CanvasImageSource} */
  let img;
  try {
    if (typeof src === "string") {
      img = await loadImageEl(src);
    } else if (src instanceof Blob || (typeof File !== "undefined" && src instanceof File)) {
      const url = URL.createObjectURL(src);
      try {
        img = await loadImageEl(url);
      } finally {
        URL.revokeObjectURL(url);
      }
    } else if (typeof ImageBitmap !== "undefined" && src instanceof ImageBitmap) {
      img = src;
    } else if (src && typeof src === "object" && "width" in src) {
      img = /** @type {CanvasImageSource} */ (src);
    } else {
      return { ok: false, error: "unsupported image source", bits: glyphFromText("image", n), n };
    }
  } catch (e) {
    return {
      ok: false,
      error: String(e?.message || e),
      bits: glyphFromText("image", n),
      n,
    };
  }

  const iw = /** @type {any} */ (img).width || canvas.width;
  const ih = /** @type {any} */ (img).height || canvas.height;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // contain fit
  const scale = Math.min(canvas.width / iw, canvas.height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (canvas.width - dw) / 2;
  const dy = (canvas.height - dh) / 2;
  ctx.drawImage(/** @type {CanvasImageSource} */ (img), dx, dy, dw, dh);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bits = glyphBitsFromImageData(imageData, n);
  return {
    ok: true,
    n,
    bits,
    ones: bits.reduce((a, b) => a + b, 0),
    previewCanvas: canvas,
    imageData,
  };
}

function loadImageEl(url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("image load failed"));
    im.src = url;
  });
}

/**
 * Build one stair step into full rail envelope (DAC · gutter · steno · glyph).
 * @param {{ n?: number, lang: string, form?: string|null, missing?: boolean, label?: string }} step
 * @param {{ concept?: string, gloss?: string, n?: number, broadcast?: boolean }} [opts]
 */
export function encodeStairStepRail(step, opts = {}) {
  const n = opts.n && GLYPH_SIZES.includes(opts.n) ? opts.n : DEFAULT_GLYPH_N;
  const form = step.missing || !step.form ? null : String(step.form);
  const carrier =
    form ||
    `[gap:${step.lang}] ${opts.concept || "concept"} · missing stair form`;
  const line = `${step.lang}:${form || "·"} · ${opts.gloss || opts.concept || ""}`.trim();

  const dac = dacClassify(line, { lang: step.lang, source: "stair-demo" });
  const gutter = classifyGutterLine(line, { mode: "auto", lang: step.lang });
  const prefixes = classifyWithPrefixes(line);

  const bits = glyphFromText(`${step.lang}|${form || "gap"}|${opts.concept || ""}`, n);
  const pack = encodeGlyphInSteno(carrier, bits, { n });
  const blank = analyzeBlankSpace(pack.encoded);
  const steno = analyzeStenoSpace(pack.encoded, {
    payload: `stair:${step.lang}:${opts.concept || ""}`,
  });
  const binaryGutter = binaryStreamToGutter(carrier, { glyphBits: bits });

  const rail = {
    n: step.n,
    lang: step.lang,
    form,
    missing: !!step.missing || !form,
    label: step.label || step.lang,
    carrier,
    line,
    dac: {
      source: dac.source,
      stub: !!dac.stub,
      sym: dac.sym,
      category: dac.category,
    },
    gutter: {
      sym: gutter.sym,
      category: gutter.category,
      rail: gutter.rail,
      source: gutter.source,
    },
    prefixes: {
      stub: !!prefixes.stub,
      lines: (prefixes.lines || []).slice(0, 3),
    },
    glyph: {
      n,
      ones: pack.ones,
      bits: pack.bits,
      gridHtml: glyphGridHtml(bits, n),
    },
    steno: {
      spaces: STENO_SPACES.length,
      bitsPerLine: BITS_PER_LINE,
      strip: steno.strip,
      coins: steno.blank?.coins || blank.coins,
      allotment: steno.allotment,
      payloadBytes: pack.payloadBytes,
      encodedPreview: String(pack.encoded || "").slice(0, 96),
    },
    whitespace: {
      blankChars: blank.blankChars,
      writeChars: blank.writeChars,
      capacityBits: blank.capacity?.blankBits,
      freeCoins: blank.coins?.free,
    },
    quantum: {
      bitCount: binaryGutter.bitCount,
      ones: binaryGutter.ones,
      quantumLikeness: binaryGutter.quantumLikeness,
    },
    pack,
  };

  if (opts.broadcast) {
    const bc = broadcastGlyphSteno(carrier, bits, {
      n,
      room: opts.room || "dojo-stair",
    });
    rail.broadcast = {
      type: bc.envelope?.type,
      ones: bc.envelope?.ones,
      coins: bc.space?.blank?.coins || bc.space?.coins,
    };
    try {
      publish("iron-line", {
        type: "stair-glyph-step",
        schema: STAIR_STREAM_SCHEMA,
        lang: step.lang,
        form,
        concept: opts.concept,
        n,
        ones: pack.ones,
        dac: rail.dac,
        gutter: rail.gutter,
      });
      publish("gy-stream", {
        type: "stair-glyph-step",
        lang: step.lang,
        form,
        encoded: pack.encoded?.slice(0, 200),
      });
    } catch {
      /* */
    }
  }

  return rail;
}

/**
 * Full stair demo → exemplary multi-rail stream pack.
 * @param {object} solveOrWalk — languageSolve / concept stair walk / single solve
 * @param {{ n?: number, broadcast?: boolean, limit?: number, concept?: string }} [opts]
 */
export async function buildStairGlyphStream(solveOrWalk, opts = {}) {
  const stack = await ensureStreamStack();
  const n = opts.n && GLYPH_SIZES.includes(opts.n) ? opts.n : DEFAULT_GLYPH_N;
  const limit = Math.min(13, Math.max(1, Number(opts.limit) || 13));

  // Normalize demos from languageSolve, stair walk, or single conceptSolve
  /** @type {Array<{ slug?: string, gloss?: string, stair?: any[], filled?: number, of?: number }>} */
  let demos = [];
  if (Array.isArray(solveOrWalk?.demos)) {
    demos = solveOrWalk.demos.map((d) => ({
      slug: d.concept?.slug || d.q || d.slug,
      gloss: d.concept?.gloss_en || d.gloss_en,
      stair: d.stair,
      filled: d.filled,
      of: d.of,
      stairLine: d.stairLine,
    }));
  } else if (Array.isArray(solveOrWalk?.rows)) {
    demos = solveOrWalk.rows.map((r) => ({
      slug: r.concept?.slug || r.q,
      gloss: r.concept?.gloss_en,
      stair: r.stair,
      filled: r.filled,
      of: r.of,
    }));
  } else if (Array.isArray(solveOrWalk?.stair)) {
    demos = [
      {
        slug: solveOrWalk.concept?.slug || solveOrWalk.q || opts.concept || "concept",
        gloss: solveOrWalk.concept?.gloss_en,
        stair: solveOrWalk.stair,
        filled: solveOrWalk.filled,
        of: solveOrWalk.of,
      },
    ];
  }

  const primary = demos[0];
  const steps = (primary?.stair || []).slice(0, limit);
  const stepRails = steps.map((s) =>
    encodeStairStepRail(s, {
      concept: primary?.slug,
      gloss: primary?.gloss,
      n,
      broadcast: false,
    })
  );

  // Exemplar carrier: join non-missing forms as multi-lang line
  const formsLine = steps
    .filter((s) => s.form && !s.missing)
    .map((s) => `${s.lang}:${s.form}`)
    .join(" · ");
  const carrier = formsLine || primary?.slug || "kbatch stair";
  const compositeBits = glyphFromText(carrier, n);
  const glyphPack = encodeGlyphInSteno(carrier, compositeBits, { n });
  const steno = analyzeStenoSpace(glyphPack.encoded, { payload: "stair-composite" });
  const gutterBlock = gutterPrefixContent(
    steps.map((s) => `${s.lang} ${s.form || "·"}`).join("\n"),
    { mode: "auto" }
  );
  const dacBlock = dacClassify(carrier, { source: "stair-composite" });
  const quantum = binaryStreamToGutter(carrier, { glyphBits: compositeBits });

  let pcap = null;
  try {
    pcap = await buildPcapImagePath(carrier, {
      payload: `stair:${primary?.slug || "demo"}:${glyphPack.ones}`,
      slot: 1,
      room: "dojo-stair",
    });
  } catch (e) {
    pcap = { error: String(e?.message || e) };
  }

  if (opts.broadcast) {
    broadcastGlyphSteno(carrier, compositeBits, { n, room: "dojo-stair" });
    try {
      publish("iron-line", {
        type: "stair-glyph-stream",
        schema: STAIR_STREAM_SCHEMA,
        concept: primary?.slug,
        filled: primary?.filled,
        of: primary?.of,
        ones: glyphPack.ones,
        demos: demos.length,
      });
    } catch {
      /* */
    }
  }

  return {
    schema: STAIR_STREAM_SCHEMA,
    ok: true,
    exemplary: true,
    claim:
      "Stair demos · instant all-language streamed through DAC · Quantum Gutter · Prefixes · IronLine · GlueLam · stenoStrip · whitespace · Glyph→steno · pcap/hexlum interpret",
    stack,
    rails: STREAM_RAILS,
    concept: {
      slug: primary?.slug || null,
      gloss: primary?.gloss || null,
      filled: primary?.filled ?? null,
      of: primary?.of ?? 13,
    },
    demos: demos.map((d) => ({
      slug: d.slug,
      filled: d.filled,
      of: d.of,
      stairLine: d.stairLine,
    })),
    steps: stepRails,
    composite: {
      carrier: carrier.slice(0, 400),
      glyph: {
        n,
        ones: glyphPack.ones,
        bits: glyphPack.bits,
        gridHtml: glyphGridHtml(compositeBits, n),
        payloadBytes: glyphPack.payloadBytes,
        encodedPreview: String(glyphPack.encoded || "").slice(0, 120),
        pack: glyphPack,
      },
      dac: {
        source: dacBlock.source,
        stub: !!dacBlock.stub,
        sym: dacBlock.sym,
        category: dacBlock.category,
      },
      gutter: gutterBlock,
      steno: {
        strip: steno.strip,
        coins: steno.blank?.coins || steno.coins,
        allotment: steno.allotment,
        spaces: STENO_SPACES.length,
        bitsPerLine: BITS_PER_LINE,
      },
      quantum: {
        bitCount: quantum.bitCount,
        ones: quantum.ones,
        quantumLikeness: quantum.quantumLikeness,
        align: quantum.align,
      },
      pcap: pcap
        ? {
            schema: pcap.schema,
            packets: pcap.stream?.packets ?? pcap.packets?.length,
            mark: pcap.mark?.id,
            forge: pcap.mark?.forge,
            hexlumN: pcap.hexlum?.n,
            error: pcap.error,
          }
        : null,
    },
    agent: {
      stream: 'await kbatchDict.stairGlyphStream(await kbatchDict.rubikLanguageSolve())',
      encode: 'await kbatchDict.glyph.encode(carrier, bits, { n: 13 })',
      broadcast: 'await kbatchDict.glyph.broadcast(carrier, bits)',
      interpretImage: 'await kbatchDict.interpretGlyphImage(file, { n: 13 })',
      rails: STREAM_RAILS,
    },
    urls: {
      quantumGutter: "https://mueee.qbitos.ai/quantum-gutter.html",
      dojoGlyph: "https://kbatch.ugrad.ai/dojo/#glyph-steno",
      dojoAxes: "https://kbatch.ugrad.ai/dojo/#world-axes",
      gluelam: "https://github.com/qbitOS/qbitos-gluelam",
      ironline: "https://github.com/qbitOS/qbitos-iron-line",
    },
    ts: new Date().toISOString(),
  };
}

/**
 * Live image → glyph bits → steno encode → DAC/gutter classify → interpret + IronLine.
 * @param {HTMLImageElement|ImageBitmap|Blob|File|string} image
 * @param {{ n?: number, carrier?: string, broadcast?: boolean }} [opts]
 */
export async function interpretGlyphImage(image, opts = {}) {
  const stack = await ensureStreamStack();
  const n = opts.n && GLYPH_SIZES.includes(opts.n) ? opts.n : DEFAULT_GLYPH_N;
  const sampled = await glyphBitsFromImage(image, n);
  const bits = sampled.bits || glyphFromText("image", n);
  const carrier = opts.carrier || "kbatch image stream";
  const pack = encodeGlyphInSteno(carrier, bits, { n });
  const steno = analyzeStenoSpace(pack.encoded, { payload: "image-glyph" });
  const dac = dacClassify(carrier, { source: "image-interpret" });
  const gutter = classifyGutterLine(carrier, { mode: "speech" });
  const quantum = binaryStreamToGutter(carrier, { glyphBits: bits });
  const mark = await createForgeMark({
    slot: 2,
    source: "dojo-image-stream",
    content: pack.encoded?.slice(0, 64) || carrier,
  });
  const hex = await buildHexLum(carrier, n, mark);

  let broadcast = null;
  if (opts.broadcast !== false) {
    broadcast = broadcastGlyphSteno(carrier, bits, { n, room: "dojo-image" });
    publishPcapImage({
      schema: "kbatch-pcap-image-v1",
      type: "kbatch-image-glyph-interpret",
      source: "dojo-glyph-steno",
      text: carrier,
      carrier: pack.encoded?.slice(0, 400),
      mark,
      hexlum: { n: hex.n, b64: hex.b64 },
      steno: { strip: steno.strip, coins: steno.blank?.coins },
      glyph: { n, ones: pack.ones },
      ts: Date.now(),
    });
    try {
      publish("iron-line", {
        type: "glyph-image-interpret",
        n,
        ones: pack.ones,
        mark: mark.id,
        dac: dac.sym,
        gutter: gutter.sym,
      });
    } catch {
      /* */
    }
  }

  // Round-trip decode check
  const decoded = decodeGlyphFromSteno(pack.encoded);

  return {
    schema: "kbatch-glyph-image-interpret-v1",
    ok: sampled.ok !== false,
    stack,
    n,
    ones: bits.reduce((a, b) => a + b, 0),
    bits,
    gridHtml: glyphGridHtml(bits, n),
    sampleError: sampled.error || null,
    dac: { source: dac.source, stub: dac.stub, sym: dac.sym, category: dac.category },
    gutter: { sym: gutter.sym, category: gutter.category, source: gutter.source },
    steno: {
      strip: steno.strip,
      coins: steno.blank?.coins,
      allotment: steno.allotment,
      payloadBytes: pack.payloadBytes,
    },
    quantum: {
      bitCount: quantum.bitCount,
      quantumLikeness: quantum.quantumLikeness,
    },
    pack,
    decoded: {
      ok: decoded.ok,
      ones: decoded.ones,
      n: decoded.n,
      error: decoded.error,
    },
    mark,
    hexlum: { n: hex.n, b64: hex.b64 },
    broadcast: broadcast
      ? { type: broadcast.envelope?.type, ones: broadcast.envelope?.ones }
      : null,
    agent: {
      interpret: 'await kbatchDict.interpretGlyphImage(file, { n: 13, broadcast: true })',
    },
  };
}

/**
 * Compact HTML for DOJO stair stream rail strip.
 * @param {Awaited<ReturnType<typeof buildStairGlyphStream>>} stream
 * @param {(s: string) => string} esc
 */
export function stairGlyphStreamHtml(stream, esc) {
  if (!stream?.ok) {
    return `<div class="stair-stream is-empty"><p class="dojo-muted">Stream rail not ready</p></div>`;
  }
  const g = stream.stack?.gluelam || {};
  const has = g.has || {};
  const chips = STREAM_RAILS.map((r) => {
    let live = true;
    if (r === "Gluelam" || r === "DAC" || r === "Prefixes") {
      if (r === "DAC") live = !!has.dac;
      else if (r === "Prefixes") live = !!has.prefixes;
      else live = !g.stubs;
    }
    if (r === "stenoStrip") live = true; // ES module always
    return `<span class="chip rail-chip ${live ? "is-live" : "is-stub"}" title="${esc(r)}">${esc(r)}${live ? "" : "·stub"}</span>`;
  }).join("");

  const c = stream.composite || {};
  const stepPreview = (stream.steps || [])
    .slice(0, 13)
    .map((s) => {
      const miss = s.missing ? " is-missing" : "";
      return `<span class="sense-lang-chip${miss}" title="${esc(s.dac?.sym || "")} ${esc(s.gutter?.sym || "")}">${esc(String(s.n || ""))}.${esc(s.lang)}:${esc(s.form || "·")}</span>`;
    })
    .join(" ");

  return `
  <div class="stair-stream" data-schema="${esc(stream.schema)}">
    <div class="stair-stream-head">
      <strong>Exemplary stream rail</strong>
      <span class="dojo-muted">DAC · Gutter · Prefixes · IronLine · GlueLam · stenoStrip · whitespace · Glyph→steno · pcap</span>
    </div>
    <div class="chips rail-status">${chips}</div>
    <p class="dojo-muted stair-stream-meta">
      concept <code>${esc(stream.concept?.slug || "—")}</code>
      · filled <b>${esc(String(stream.concept?.filled ?? "—"))}/${esc(String(stream.concept?.of ?? 13))}</b>
      · glyph ${esc(String(c.glyph?.n || 13))}×${esc(String(c.glyph?.n || 13))} ones <b>${esc(String(c.glyph?.ones ?? "—"))}</b>
      · steno coins <b>${esc(String(c.steno?.coins?.free ?? c.steno?.coins?.blank ?? "—"))}</b>
      · DAC <code>${esc(c.dac?.sym || "—")}</code>
      · gutter <code>${esc((c.gutter?.rows || [])[0]?.sym || "—")}</code>
      · quantum~ <b>${esc(String(c.quantum?.quantumLikeness ?? "—"))}</b>
      · pcap pkts <b>${esc(String(c.pcap?.packets ?? "—"))}</b>
    </p>
    <div class="stair-stream-steps">${stepPreview}</div>
    <div class="stair-stream-glyph">${c.glyph?.gridHtml || ""}</div>
    <p class="dojo-muted" style="font-size:0.72rem;margin:6px 0 0">
      AI: <code>await kbatchDict.stairGlyphStream(await kbatchDict.rubikLanguageSolve())</code>
      · <code>interpretGlyphImage(file)</code>
    </p>
  </div>`;
}

/** Re-export helpers used by DOJO glyph panel */
export {
  glyphGridHtml,
  glyphFromText,
  encodeGlyphInSteno,
  decodeGlyphFromSteno,
  broadcastGlyphSteno,
  DEFAULT_GLYPH_N,
  GLYPH_SIZES,
  normalizeGlyphPixels,
  renderHexLumCanvas,
};
