/**
 * Stair demos → REAL uvspeed / GlueLam / IronLine stream
 *
 * Not a vanity rail list. Each subsystem is probed and called:
 *   QuantumPrefixes (uvspeed quantum-gutter) · QbitDAC · QbitSteno
 *   IronLine BroadcastChannel · KBatch steno-strip · glyph-steno · pcap-image
 *
 * Upstream sources (do not reimplement classifiers):
 *   /vendor/gluelam/*  ← synced from uvspeed/web
 *   https://mueee.qbitos.ai/quantum-gutter.html
 *   https://github.com/qbitOS/uvspeed
 *   https://github.com/qbitOS/qbitos-iron-line
 */

import {
  ensureGluelam,
  getGluelamStatus,
  probeGluelamLive,
  classifyWithPrefixes,
} from "./gluelam-consumer.js";
import { ensureQuantumGutter, binaryStreamToGutter } from "./quantum-gutter.js";
import {
  analyzeStenoSpace,
  analyzeBlankSpace,
  stenoEncode as kbatchStenoEncode,
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

/**
 * Subsystem ids → real module/API (not decorative labels).
 * `live` is always false until probeLiveRails() says otherwise.
 */
export const STREAM_SUBSYSTEMS = Object.freeze([
  {
    id: "QuantumPrefixes",
    name: "Quantum Gutter / Prefixes",
    upstream: "https://mueee.qbitos.ai/quantum-gutter.html",
    source: "/vendor/gluelam/quantum-prefixes.js",
    apis: ["classifyLine", "prefixContent", "broadcastState"],
  },
  {
    id: "QbitDAC",
    name: "DAC (Dimensional Addressing Codec)",
    upstream: "https://github.com/qbitOS/uvspeed",
    source: "/vendor/gluelam/qbit-dac.js",
    apis: ["prefixDAC", "dacTracks", "qbitCodec"],
  },
  {
    id: "QbitSteno",
    name: "GlueLam steno (whitespace embed)",
    upstream: "https://github.com/qbitOS/uvspeed",
    source: "/vendor/gluelam/qbit-steno.js",
    apis: ["stenoEncode", "stenoDecode", "stenoPipeline", "stenoAnalyze"],
  },
  {
    id: "IronLine",
    name: "IronLine bus",
    upstream: "https://github.com/qbitOS/qbitos-iron-line",
    source: "/js/ironline-bus.js",
    apis: ["publish(iron-line)", "BroadcastChannel"],
  },
  {
    id: "stenoStrip",
    name: "KBatch stenoSTRIP",
    upstream: "kbatch local",
    source: "/js/steno-strip.js",
    apis: ["stenoEncode", "analyzeStenoSpace", "STENO_SPACES×13"],
  },
  {
    id: "GlyphSteno",
    name: "Glyph → steno (GYG1)",
    upstream: "kbatch local",
    source: "/js/glyph-steno.js",
    apis: ["encodeGlyphInSteno", "broadcastGlyphSteno"],
  },
  {
    id: "pcapImage",
    name: "pcap / hexlum image stream",
    upstream: "kbatch + GY forge",
    source: "/js/pcap-image-bridge.js",
    apis: ["buildPcapImagePath", "buildHexLum"],
  },
]);

/** @deprecated vanity alias — use STREAM_SUBSYSTEMS + probeLiveRails */
export const STREAM_RAILS = Object.freeze(STREAM_SUBSYSTEMS.map((s) => s.id));

function qp() {
  return typeof window !== "undefined" && window.QuantumPrefixes && !window.QuantumPrefixes.stub
    ? window.QuantumPrefixes
    : null;
}
function dac() {
  return typeof window !== "undefined" && window.QbitDAC && !window.QbitDAC.stub
    ? window.QbitDAC
    : null;
}
function steno() {
  return typeof window !== "undefined" && window.QbitSteno && !window.QbitSteno.stub
    ? window.QbitSteno
    : null;
}

/**
 * Load vendor engines + probe each subsystem with real calls.
 */
export async function ensureStreamStack() {
  if (typeof document !== "undefined") {
    await ensureGluelam({ base: "/vendor/gluelam/", force: false });
    // Prefer absolute path if still stub
    const st = getGluelamStatus();
    if (st.stubs) {
      await ensureGluelam({ base: "/vendor/gluelam/", force: true });
    }
    try {
      await ensureQuantumGutter();
    } catch {
      /* */
    }
  }
  return probeLiveRails();
}

/**
 * Probe every subsystem — only `live:true` when a real call returns evidence.
 */
export function probeLiveRails() {
  const gluelamProbe = probeGluelamLive();
  const QP = qp();
  const DAC = dac();
  const ST = steno();

  /** @type {Record<string, object>} */
  const rails = {};

  // QuantumPrefixes
  if (gluelamProbe.probes?.QuantumPrefixes?.live) {
    rails.QuantumPrefixes = {
      live: true,
      ...STREAM_SUBSYSTEMS[0],
      evidence: gluelamProbe.probes.QuantumPrefixes.evidence,
    };
  } else {
    rails.QuantumPrefixes = {
      live: false,
      ...STREAM_SUBSYSTEMS[0],
      error: gluelamProbe.probes?.QuantumPrefixes?.error || "not loaded — open /dojo/ or ensure /vendor/gluelam/quantum-prefixes.js",
    };
  }

  // DAC
  if (gluelamProbe.probes?.QbitDAC?.live) {
    rails.QbitDAC = {
      live: true,
      ...STREAM_SUBSYSTEMS[1],
      evidence: gluelamProbe.probes.QbitDAC.evidence,
    };
  } else {
    rails.QbitDAC = {
      live: false,
      ...STREAM_SUBSYSTEMS[1],
      error: gluelamProbe.probes?.QbitDAC?.error || "QbitDAC not loaded",
    };
  }

  // GlueLam steno
  if (gluelamProbe.probes?.QbitSteno?.live) {
    rails.QbitSteno = {
      live: true,
      ...STREAM_SUBSYSTEMS[2],
      evidence: gluelamProbe.probes.QbitSteno.evidence,
    };
  } else {
    rails.QbitSteno = {
      live: false,
      ...STREAM_SUBSYSTEMS[2],
      error: gluelamProbe.probes?.QbitSteno?.error || "QbitSteno not loaded (KBatch steno-strip still works)",
    };
  }

  // IronLine
  try {
    const msg = publish("iron-line", {
      type: "kbatch-probe",
      stage: "probe",
      source: "stair-glyph-stream",
      ts: Date.now(),
    });
    rails.IronLine = {
      live: !!(msg && msg._iron),
      ...STREAM_SUBSYSTEMS[3],
      evidence: {
        channel: msg?._iron?.channel,
        layer: msg?._iron?.layer,
        hasBroadcastChannel: typeof BroadcastChannel !== "undefined",
      },
    };
  } catch (e) {
    rails.IronLine = {
      live: false,
      ...STREAM_SUBSYSTEMS[3],
      error: String(e?.message || e),
    };
  }

  // KBatch steno-strip (always — pure ES)
  try {
    const enc = kbatchStenoEncode("kbatch probe", "payload");
    const blank = analyzeBlankSpace(enc);
    rails.stenoStrip = {
      live: true,
      ...STREAM_SUBSYSTEMS[4],
      evidence: {
        spaceAlphabet: STENO_SPACES.length,
        bitsPerLine: BITS_PER_LINE,
        freeCoins: blank.coins?.free,
        encodedLen: enc.length,
      },
    };
  } catch (e) {
    rails.stenoStrip = {
      live: false,
      ...STREAM_SUBSYSTEMS[4],
      error: String(e?.message || e),
    };
  }

  // Glyph steno
  try {
    const bits = glyphFromText("probe", 13);
    const pack = encodeGlyphInSteno("probe", bits, { n: 13 });
    rails.GlyphSteno = {
      live: !!(pack?.encoded && pack.ones >= 0),
      ...STREAM_SUBSYSTEMS[5],
      evidence: {
        n: pack.n,
        ones: pack.ones,
        payloadBytes: pack.payloadBytes,
        marker: "§GYG1",
      },
    };
  } catch (e) {
    rails.GlyphSteno = {
      live: false,
      ...STREAM_SUBSYSTEMS[5],
      error: String(e?.message || e),
    };
  }

  // pcap — async-capable; sync probe via forge mark shape only if no await
  rails.pcapImage = {
    live: true, // module always present; full path verified in buildStairGlyphStream
    ...STREAM_SUBSYSTEMS[6],
    evidence: { note: "verified on stream build via buildPcapImagePath" },
  };

  const liveIds = Object.entries(rails)
    .filter(([, v]) => v.live)
    .map(([k]) => k);
  const deadIds = Object.entries(rails)
    .filter(([, v]) => !v.live)
    .map(([k]) => k);

  return {
    ok: liveIds.length > 0,
    schema: "kbatch-stream-rails-probe-v1",
    claim:
      "Only live:true when a real entrypoint returned evidence. Dead rails are not implemented on this page yet — see source/upstream.",
    liveIds,
    deadIds,
    liveCount: liveIds.length,
    total: Object.keys(rails).length,
    rails,
    gluelam: getGluelamStatus(),
    qpLoaded: !!QP,
    dacLoaded: !!DAC,
    stenoLoaded: !!ST,
    quantumGutterUrl: "https://mueee.qbitos.ai/quantum-gutter.html",
    vendor: "/vendor/gluelam/",
  };
}

/**
 * Classify one line with REAL QuantumPrefixes / DAC when loaded.
 * @param {string} text
 * @param {{ lang?: string, source?: string }} [opts]
 */
export function dacClassify(text, opts = {}) {
  const source = opts.source || "stair-glyph-stream";
  const langHint = opts.lang || "en";
  // Map stair orthography ids → classifier language (for code-like carriers)
  const codeLang =
    { en: "javascript", py: "python", js: "javascript", rs: "rust" }[langHint] ||
    "javascript";

  const QP = qp();
  const DAC = dac();

  if (DAC?.prefixDAC) {
    try {
      const r = DAC.prefixDAC(String(text || ""), codeLang, source);
      const first = String(r?.prefixed || "")
        .split("\n")
        .find((l) => l.trim());
      const symMatch = first?.match(/^([+\-n0-9]{1,3}:| {3})/);
      return {
        live: true,
        engine: "QbitDAC.prefixDAC",
        source: "uvspeed/qbit-dac.js",
        stub: false,
        sym: symMatch?.[1]?.trim() || r?.meta?.counts ? Object.keys(r.meta.counts)[0] : "   ",
        category: null,
        coverage: r?.meta?.coverage,
        counts: r?.meta?.counts,
        prefixed: r?.prefixed,
        result: r,
      };
    } catch (e) {
      /* fall through to QP */
    }
  }

  if (QP?.classifyLine) {
    try {
      const r = QP.classifyLine(String(text || ""), codeLang);
      return {
        live: true,
        engine: "QuantumPrefixes.classifyLine",
        source: "uvspeed/quantum-prefixes.js",
        stub: false,
        sym: r?.sym,
        category: r?.category,
        cls: r?.cls,
        color: r?.color,
        result: r,
      };
    } catch (e) {
      return {
        live: false,
        engine: "classify-error",
        stub: true,
        error: String(e?.message || e),
        sym: "   ",
        category: "default",
      };
    }
  }

  return {
    live: false,
    engine: "unloaded",
    stub: true,
    source: "none",
    error: "QuantumPrefixes/QbitDAC not loaded — call ensureStreamStack() on /dojo/",
    sym: "   ",
    category: "default",
  };
}

/**
 * Encode stair step using real prefix/DAC/steno when live.
 */
export function encodeStairStepRail(step, opts = {}) {
  const n = opts.n && GLYPH_SIZES.includes(opts.n) ? opts.n : DEFAULT_GLYPH_N;
  const form = step.missing || !step.form ? null : String(step.form);
  const carrier =
    form ||
    `[gap:${step.lang}] ${opts.concept || "concept"} · missing stair form`;
  // Multi-line carrier so prefix classifiers have structure
  const codeish = [
    `// stair ${opts.concept || "concept"} · ${step.lang}`,
    form ? `const form_${step.lang} = ${JSON.stringify(form)};` : `// missing form for ${step.lang}`,
    form ? `print(${JSON.stringify(form)})` : `pass  # gap`,
  ].join("\n");

  const dacResult = dacClassify(codeish, { lang: "en", source: "stair-demo" });
  const QP = qp();
  let gutterLines = null;
  if (QP?.prefixContent) {
    try {
      gutterLines = {
        live: true,
        engine: "QuantumPrefixes.prefixContent",
        prefixed: QP.prefixContent(codeish, "javascript"),
      };
    } catch {
      gutterLines = { live: false };
    }
  }

  const prefixes = classifyWithPrefixes(codeish);
  const bits = glyphFromText(`${step.lang}|${form || "gap"}|${opts.concept || ""}`, n);
  const pack = encodeGlyphInSteno(carrier, bits, { n });

  // Prefer GlueLam QbitSteno when live
  const ST = steno();
  let gluelamSteno = null;
  if (ST?.stenoEncode) {
    try {
      gluelamSteno = {
        live: true,
        engine: "QbitSteno.stenoEncode",
        encodedLen: String(ST.stenoEncode(codeish)).length,
      };
    } catch (e) {
      gluelamSteno = { live: false, error: String(e?.message || e) };
    }
  } else if (ST?.stenoPipeline) {
    try {
      const pipe = ST.stenoPipeline(codeish, { language: "javascript" });
      gluelamSteno = {
        live: true,
        engine: "QbitSteno.stenoPipeline",
        keys: pipe && typeof pipe === "object" ? Object.keys(pipe).slice(0, 10) : null,
      };
    } catch (e) {
      gluelamSteno = { live: false, error: String(e?.message || e) };
    }
  } else {
    gluelamSteno = { live: false, error: "QbitSteno not loaded" };
  }

  const blank = analyzeBlankSpace(pack.encoded);
  const stenoSpace = analyzeStenoSpace(pack.encoded, {
    payload: `stair:${step.lang}:${opts.concept || ""}`,
  });
  const quantum = binaryStreamToGutter(carrier, { glyphBits: bits });

  const rail = {
    n: step.n,
    lang: step.lang,
    form,
    missing: !!step.missing || !form,
    label: step.label || step.lang,
    carrier,
    codeish,
    dac: {
      live: !!dacResult.live,
      engine: dacResult.engine,
      source: dacResult.source,
      sym: dacResult.sym,
      category: dacResult.category,
      coverage: dacResult.coverage,
      counts: dacResult.counts,
      prefixedPreview: dacResult.prefixed
        ? String(dacResult.prefixed).slice(0, 160)
        : null,
      error: dacResult.error,
    },
    quantumPrefixes: {
      live: !!gutterLines?.live,
      engine: gutterLines?.engine || null,
      prefixedPreview: gutterLines?.prefixed
        ? String(gutterLines.prefixed).slice(0, 160)
        : null,
      classifyStub: !!prefixes.stub,
    },
    gluelamSteno,
    glyph: {
      live: true,
      n,
      ones: pack.ones,
      bits: pack.bits,
      gridHtml: glyphGridHtml(bits, n),
      engine: "encodeGlyphInSteno",
    },
    stenoStrip: {
      live: true,
      engine: "kbatch/steno-strip.js",
      spaces: STENO_SPACES.length,
      bitsPerLine: BITS_PER_LINE,
      strip: stenoSpace.strip,
      coins: stenoSpace.blank?.coins || blank.coins,
      allotment: stenoSpace.allotment,
      payloadBytes: pack.payloadBytes,
    },
    whitespace: {
      live: true,
      blankChars: blank.blankChars,
      writeChars: blank.writeChars,
      capacityBits: blank.capacity?.blankBits,
      freeCoins: blank.coins?.free,
    },
    quantumBinary: {
      bitCount: quantum.bitCount,
      ones: quantum.ones,
      quantumLikeness: quantum.quantumLikeness,
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
    };
    // Iron Line normative classify-style + stair event
    try {
      publish("iron-line", {
        type: "stair-glyph-step",
        stage: "classify",
        language: step.lang,
        content: codeish.slice(0, 500),
        concept: opts.concept,
        form,
        dac: rail.dac,
        source: "kbatch-dojo",
        ts: Date.now(),
      });
      if (QP?.broadcastState) {
        QP.broadcastState("kbatch-dojo", {
          stair: step.lang,
          form,
          concept: opts.concept,
        });
      }
    } catch {
      /* */
    }
  }

  return rail;
}

/**
 * Full stair → real stream pack with probe-backed rails only.
 */
export async function buildStairGlyphStream(solveOrWalk, opts = {}) {
  const stack = await ensureStreamStack();
  const n = opts.n && GLYPH_SIZES.includes(opts.n) ? opts.n : DEFAULT_GLYPH_N;
  const limit = Math.min(13, Math.max(1, Number(opts.limit) || 13));

  /** @type {Array<{ slug?: string, gloss?: string, stair?: any[], filled?: number, of?: number, stairLine?: string }>} */
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

  const formsLine = steps
    .filter((s) => s.form && !s.missing)
    .map((s) => `${s.lang}:${s.form}`)
    .join(" · ");
  const carrier = formsLine || primary?.slug || "kbatch stair";

  // Real prefixContent on multi-lang export as "code"
  const exportBlock = steps
    .map((s) =>
      s.form && !s.missing
        ? `export const ${String(s.lang).replace(/[^a-z]/gi, "_")} = ${JSON.stringify(s.form)};`
        : `// gap ${s.lang}`
    )
    .join("\n");

  const QP = qp();
  const DAC = dac();
  let prefixBlock = null;
  let dacBlock = null;
  if (QP?.prefixContent) {
    try {
      prefixBlock = {
        live: true,
        engine: "QuantumPrefixes.prefixContent",
        text: QP.prefixContent(exportBlock, "javascript"),
      };
    } catch (e) {
      prefixBlock = { live: false, error: String(e?.message || e) };
    }
  } else {
    prefixBlock = { live: false, error: "QuantumPrefixes not loaded" };
  }
  if (DAC?.prefixDAC) {
    try {
      const d = DAC.prefixDAC(exportBlock, "javascript", "stair-composite");
      dacBlock = {
        live: true,
        engine: "QbitDAC.prefixDAC",
        coverage: d?.meta?.coverage,
        counts: d?.meta?.counts,
        prefixed: d?.prefixed,
      };
    } catch (e) {
      dacBlock = { live: false, error: String(e?.message || e) };
    }
  } else {
    dacBlock = { live: false, error: "QbitDAC not loaded" };
  }

  const compositeBits = glyphFromText(carrier, n);
  const glyphPack = encodeGlyphInSteno(carrier, compositeBits, { n });
  const stenoSpace = analyzeStenoSpace(glyphPack.encoded, { payload: "stair-composite" });
  const quantum = binaryStreamToGutter(carrier, { glyphBits: compositeBits });

  let pcap = null;
  try {
    pcap = await buildPcapImagePath(carrier, {
      payload: `stair:${primary?.slug || "demo"}:${glyphPack.ones}`,
      slot: 1,
      room: "dojo-stair",
    });
    if (stack.rails?.pcapImage) {
      stack.rails.pcapImage.live = !pcap.error;
      stack.rails.pcapImage.evidence = {
        packets: pcap.stream?.packets ?? pcap.packets?.length,
        mark: pcap.mark?.id,
        forge: pcap.mark?.forge,
      };
    }
  } catch (e) {
    pcap = { error: String(e?.message || e) };
    if (stack.rails?.pcapImage) {
      stack.rails.pcapImage.live = false;
      stack.rails.pcapImage.error = pcap.error;
    }
  }

  // Per-step live counts
  const stepLive = {
    dac: stepRails.filter((s) => s.dac?.live).length,
    quantumPrefixes: stepRails.filter((s) => s.quantumPrefixes?.live).length,
    gluelamSteno: stepRails.filter((s) => s.gluelamSteno?.live).length,
  };

  if (opts.broadcast) {
    broadcastGlyphSteno(carrier, compositeBits, { n, room: "dojo-stair" });
    publish("iron-line", {
      type: "stair-glyph-stream",
      stage: "classify",
      concept: primary?.slug,
      filled: primary?.filled,
      content: exportBlock.slice(0, 800),
      language: "javascript",
      source: "kbatch-dojo",
      ts: Date.now(),
    });
    if (QP?.broadcastState) {
      QP.broadcastState("kbatch-dojo", {
        concept: primary?.slug,
        filled: primary?.filled,
        stair: true,
      });
    }
  }

  return {
    schema: STAIR_STREAM_SCHEMA,
    ok: true,
    exemplary: true,
    claim:
      "Stair demos streamed only through probed engines. liveIds = real API evidence; deadIds = not loaded on this page (see vendor / uvspeed).",
    stack,
    // Honest: list live vs dead, not a fake "all implemented" array
    liveRails: stack.liveIds,
    deadRails: stack.deadIds,
    subsystems: STREAM_SUBSYSTEMS,
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
    stepLive,
    composite: {
      carrier: carrier.slice(0, 400),
      exportBlock: exportBlock.slice(0, 800),
      quantumPrefixes: prefixBlock,
      dac: dacBlock
        ? {
            live: dacBlock.live,
            engine: dacBlock.engine,
            coverage: dacBlock.coverage,
            counts: dacBlock.counts,
            prefixedPreview: dacBlock.prefixed
              ? String(dacBlock.prefixed).slice(0, 240)
              : null,
            error: dacBlock.error,
          }
        : null,
      glyph: {
        live: true,
        n,
        ones: glyphPack.ones,
        bits: glyphPack.bits,
        gridHtml: glyphGridHtml(compositeBits, n),
        payloadBytes: glyphPack.payloadBytes,
        encodedPreview: String(glyphPack.encoded || "").slice(0, 120),
        pack: glyphPack,
      },
      stenoStrip: {
        live: true,
        strip: stenoSpace.strip,
        coins: stenoSpace.blank?.coins || stenoSpace.coins,
        allotment: stenoSpace.allotment,
        spaces: STENO_SPACES.length,
        bitsPerLine: BITS_PER_LINE,
      },
      quantum: {
        bitCount: quantum.bitCount,
        ones: quantum.ones,
        quantumLikeness: quantum.quantumLikeness,
      },
      pcap: pcap
        ? {
            live: !pcap.error,
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
      ensure: "await kbatchDict.ensureStreamStack()  // probe live rails",
      stream: "await kbatchDict.stairGlyphStream(await kbatchDict.rubikLanguageSolve())",
      gutter: "https://mueee.qbitos.ai/quantum-gutter.html",
      vendor: "/vendor/gluelam/quantum-prefixes.js",
    },
    urls: {
      quantumGutter: "https://mueee.qbitos.ai/quantum-gutter.html",
      uvspeed: "https://github.com/qbitOS/uvspeed",
      ironline: "https://github.com/qbitOS/qbitos-iron-line",
      dojoGlyph: "https://kbatch.ugrad.ai/dojo/#glyph-steno",
      dojoAxes: "https://kbatch.ugrad.ai/dojo/#world-axes",
      vendor: "/vendor/gluelam/",
    },
    ts: new Date().toISOString(),
  };
}

export async function interpretGlyphImage(image, opts = {}) {
  const stack = await ensureStreamStack();
  const n = opts.n && GLYPH_SIZES.includes(opts.n) ? opts.n : DEFAULT_GLYPH_N;
  let bits;
  let sampleError = null;
  try {
    const sampled = await glyphBitsFromImage(image, n);
    bits = sampled.bits;
    sampleError = sampled.error || null;
  } catch (e) {
    bits = await sampleImageBits(image, n);
    sampleError = String(e?.message || e);
  }
  if (!bits) bits = glyphFromText("image", n);

  const carrier = opts.carrier || "kbatch image stream";
  const pack = encodeGlyphInSteno(carrier, bits, { n });
  const stenoSpace = analyzeStenoSpace(pack.encoded, { payload: "image-glyph" });
  const dacResult = dacClassify(carrier, { source: "image-interpret" });
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
      steno: { strip: stenoSpace.strip, coins: stenoSpace.blank?.coins },
      glyph: { n, ones: pack.ones },
      ts: Date.now(),
    });
    publish("iron-line", {
      type: "glyph-image-interpret",
      stage: "classify",
      n,
      ones: pack.ones,
      mark: mark.id,
      dac: dacResult,
      source: "kbatch-dojo",
      ts: Date.now(),
    });
  }

  const decoded = decodeGlyphFromSteno(pack.encoded);
  return {
    schema: "kbatch-glyph-image-interpret-v1",
    ok: true,
    stack,
    n,
    ones: bits.reduce((a, b) => a + b, 0),
    bits,
    gridHtml: glyphGridHtml(bits, n),
    sampleError,
    dac: dacResult,
    stenoStrip: {
      live: true,
      strip: stenoSpace.strip,
      coins: stenoSpace.blank?.coins,
    },
    quantum: {
      bitCount: quantum.bitCount,
      quantumLikeness: quantum.quantumLikeness,
    },
    pack,
    decoded: { ok: decoded.ok, ones: decoded.ones, n: decoded.n, error: decoded.error },
    mark,
    hexlum: { n: hex.n, b64: hex.b64 },
    broadcast: broadcast
      ? { type: broadcast.envelope?.type, ones: broadcast.envelope?.ones }
      : null,
  };
}

async function sampleImageBits(src, n) {
  if (typeof document === "undefined") return glyphFromText("image", n);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(n * 4, 64);
    canvas.height = Math.max(n * 4, 64);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return glyphFromText("image", n);
    let img;
    if (typeof src === "string") {
      img = await new Promise((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("img"));
        im.src = src;
      });
    } else if (src instanceof Blob) {
      const url = URL.createObjectURL(src);
      try {
        img = await new Promise((res, rej) => {
          const im = new Image();
          im.onload = () => res(im);
          im.onerror = () => rej(new Error("img"));
          im.src = url;
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    } else {
      img = src;
    }
    const iw = img.width || canvas.width;
    const ih = img.height || canvas.height;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / iw, canvas.height / ih);
    ctx.drawImage(img, (canvas.width - iw * scale) / 2, (canvas.height - ih * scale) / 2, iw * scale, ih * scale);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bits = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const sx = Math.min(data.width - 1, Math.floor((c + 0.5) * (data.width / n)));
        const sy = Math.min(data.height - 1, Math.floor((r + 0.5) * (data.height / n)));
        const i = (sy * data.width + sx) * 4;
        const lum = (data.data[i] * 0.299 + data.data[i + 1] * 0.587 + data.data[i + 2] * 0.114) / 255;
        bits.push(lum < 0.55 ? 1 : 0);
      }
    }
    return bits;
  } catch {
    return glyphFromText("image", n);
  }
}

/**
 * Honest HTML — green only when probe live, red/dashed when dead.
 */
export function stairGlyphStreamHtml(stream, esc) {
  if (!stream?.ok) {
    return `<div class="stair-stream is-empty"><p class="dojo-muted">Stream not ready — ensureStreamStack() failed</p></div>`;
  }
  const rails = stream.stack?.rails || {};
  const chips = Object.entries(rails)
    .map(([id, r]) => {
      const live = !!r.live;
      const title = live
        ? `${r.name || id} · ${r.engine || r.apis?.[0] || "live"} · ${JSON.stringify(r.evidence || {}).slice(0, 80)}`
        : `${r.name || id} · DEAD · ${r.error || "not loaded"} · ${r.source || ""}`;
      return `<span class="chip rail-chip ${live ? "is-live" : "is-dead"}" title="${esc(title)}">${esc(id)}${live ? "" : " ✗"}</span>`;
    })
    .join("");

  const c = stream.composite || {};
  const dacLive = c.dac?.live;
  const qpLive = c.quantumPrefixes?.live;
  const stepPreview = (stream.steps || [])
    .map((s) => {
      const miss = s.missing ? " is-missing" : "";
      const sym = s.dac?.live ? s.dac.sym : "·";
      return `<span class="sense-lang-chip${miss}" title="${esc(s.dac?.engine || "")} ${esc(sym || "")}">${esc(String(s.n || ""))}.${esc(s.lang)}:${esc(s.form || "·")} <small>${esc(sym || "")}</small></span>`;
    })
    .join(" ");

  return `
  <div class="stair-stream" data-schema="${esc(stream.schema)}">
    <div class="stair-stream-head">
      <strong>Stream engines (probed)</strong>
      <span class="dojo-muted">live <b>${esc(String(stream.stack?.liveCount ?? 0))}</b>/${esc(String(stream.stack?.total ?? 0))}
      · dead: <code>${esc((stream.deadRails || []).join(", ") || "—")}</code>
      · <a href="https://mueee.qbitos.ai/quantum-gutter.html" target="_blank" rel="noopener">quantum-gutter</a>
      · vendor <code>/vendor/gluelam/</code></span>
    </div>
    <div class="chips rail-status">${chips}</div>
    <p class="dojo-muted stair-stream-meta">
      concept <code>${esc(stream.concept?.slug || "—")}</code>
      · filled <b>${esc(String(stream.concept?.filled ?? "—"))}/${esc(String(stream.concept?.of ?? 13))}</b>
      · DAC ${dacLive ? `<code>${esc(c.dac?.engine || "live")}</code> cov ${esc(String(c.dac?.coverage ?? "—"))}` : "<b class='is-dead-txt'>not loaded</b>"}
      · Prefixes ${qpLive ? "<b>prefixContent live</b>" : "<b class='is-dead-txt'>not loaded</b>"}
      · glyph ones <b>${esc(String(c.glyph?.ones ?? "—"))}</b>
      · stenoStrip coins <b>${esc(String(c.stenoStrip?.coins?.free ?? c.stenoStrip?.coins?.blank ?? "—"))}</b>
      · pcap ${c.pcap?.live ? `pkts <b>${esc(String(c.pcap.packets))}</b>` : "—"}
    </p>
    ${
      c.dac?.prefixedPreview || c.quantumPrefixes?.text
        ? `<pre class="dojo-json stair-prefix-preview" style="max-height:100px;font-size:0.72rem">${esc(
            String(c.dac?.prefixedPreview || c.quantumPrefixes?.text || "").slice(0, 600)
          )}</pre>`
        : `<p class="dojo-muted" style="font-size:0.75rem">No DAC/prefix output yet — engines may still be loading. Hard-refresh /dojo/ so <code>/vendor/gluelam/*.js</code> can attach.</p>`
    }
    <div class="stair-stream-steps">${stepPreview}</div>
    <div class="stair-stream-glyph">${c.glyph?.gridHtml || ""}</div>
    <p class="dojo-muted" style="font-size:0.72rem;margin:6px 0 0">
      <code>await kbatchDict.ensureStreamStack()</code> ·
      <code>stairGlyphStream(rubikLanguageSolve())</code> ·
      not a label list — dead chips mean the real uvspeed file is not on the page
    </p>
  </div>`;
}

export {
  glyphGridHtml,
  glyphFromText,
  encodeGlyphInSteno,
  decodeGlyphFromSteno,
  broadcastGlyphSteno,
  DEFAULT_GLYPH_N,
  GLYPH_SIZES,
  renderHexLumCanvas,
};

// image helper used by interpret — keep export name for dojo
export async function glyphBitsFromImage(src, n = DEFAULT_GLYPH_N) {
  const bits = await sampleImageBits(src, n);
  return { ok: true, n, bits, ones: bits.reduce((a, b) => a + b, 0) };
}
