/**
 * Live analysis pipeline — caption in/out, sentence/paragraph/blob,
 * LLM + MCP envelopes, JAX tensors. Pipes text through Colossus stack.
 */

import { makeEnvelope, ANALYSIS_LEVELS, MCP_TOOLS, SCHEMA_VERSION } from "./schema.js";
import { analyzeWord, LAYOUT_RING_ORDER, KEYBOARD_LAYOUTS } from "./analyze.js";
import { letterAtom, wordLetterBreakdown, patternMatrix, alphabetAtoms } from "./letter-atom.js";
import { BASE_LAYOUT_ID } from "./layouts.js";
import { analyzeOrder } from "./order-analysis.js";
import { analyzePhonPattern } from "./phonetic-pattern.js";
import { analyzeHistorical } from "./historical.js";
import { analyzeTextPaleography } from "./paleography.js";
import { toOverviewWorkspace, pipeToOverview } from "./overview-pipe.js";
import { coverageReport } from "./corpus-sources.js";
import { analyzeSentenceUse } from "./pos.js";
import {
  composePresentation,
  analyzeEverything,
  BLOCK_TYPES,
} from "./x-article.js";
import { DESC_LANGS } from "./i18n-desc.js";
import { lookupMeaning } from "./live-dict.js";
import { analyzePhonation, VOICE_REGISTERS, PLACEMENTS } from "./phonation.js";
import {
  analyzeScholarLinguistics,
  LING_FRAMEWORKS,
  leipzigGloss,
  citationPack,
} from "./scholar-linguistics.js";
import { worldPathSnapshot } from "./world-path.js";

/**
 * Detect analysis level from text shape (overridable).
 * @param {string} text
 * @param {string} [force]
 */
export function detectLevel(text, force) {
  if (force && ANALYSIS_LEVELS.some((l) => l.id === force)) return force;
  const t = String(text || "").trim();
  if (!t) return "word";
  if (t.length === 1) return "letter";
  if (/\n\n/.test(t) || t.split(/\n/).length > 3) return "paragraph";
  if (/[.!?][\s"')\]]*$/.test(t) && t.split(/\s+/).length > 3) return "sentence";
  if (t.split(/\s+/).length === 1) return "word";
  if (t.length > 500) return "blob";
  return "sentence";
}

/**
 * Tokenize conservatively for multi-level analysis.
 * @param {string} text
 */
export function tokenize(text) {
  const raw = String(text || "");
  const words = raw.match(/[\p{L}\p{N}']+/gu) || [];
  return words.map((w, i) => ({
    i,
    text: w,
    start: raw.indexOf(w), // first occurrence approx
  }));
}

/**
 * Sentence split.
 * @param {string} text
 */
export function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Paragraph split.
 * @param {string} text
 */
export function splitParagraphs(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Aggregate metrics from word analyses.
 * @param {object[]} wordEntries
 */
function aggregateMetrics(wordEntries) {
  const n = wordEntries.length || 1;
  const sum = (k) =>
    wordEntries.reduce((s, e) => s + (e.metrics?.[k] ?? 0), 0);
  return {
    words: wordEntries.length,
    keys: sum("keys"),
    efficiency: Math.round((sum("efficiency") / n) * 10) / 10,
    complexity: Math.round((sum("complexity") / n) * 10) / 10,
    strain: Math.round((sum("strain") / n) * 10) / 10,
    travelMM: Math.round(sum("travelMM") * 10) / 10,
    calories: +sum("calories").toFixed(6),
    trails: sum("trails"),
    rsiRisk: Math.round((sum("rsiRisk") / n) * 10) / 10,
    homeRowPct: Math.round((sum("homeRowPct") / n) * 10) / 10,
    bpm: Math.round(sum("bpm") / n),
  };
}

function jaxFromMetrics(metrics, labels = {}) {
  const names = [
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
  const x = names.map((n) => {
    const map = {
      keys: metrics.keys,
      efficiency: metrics.efficiency,
      complexity: metrics.complexity,
      strain: metrics.strain,
      home_row_pct: metrics.homeRowPct,
      travel_mm: metrics.travelMM,
      trails: metrics.trails,
      calories: metrics.calories,
      rsi_risk: metrics.rsiRisk,
      bpm: metrics.bpm,
    };
    return map[n] ?? 0;
  });
  return { feature_names: names, x, dtype: "float32", labels };
}

/**
 * Analyze at any level — returns Colossus envelope.
 * @param {string} text
 * @param {{ level?: string, layout?: string, caption_in?: string, source?: string, parent_id?: string }} [opts]
 */
export function analyzeLevel(text, opts = {}) {
  const layout = opts.layout || BASE_LAYOUT_ID;
  const level = detectLevel(text, opts.level);
  const raw = String(text ?? "");

  if (level === "letter") {
    const atom = letterAtom(raw.slice(0, 1) || "a");
    const word = analyzeWord(atom?.letter || raw, layout);
    return makeEnvelope({
      level: "letter",
      text: atom?.letter || raw,
      layout,
      source: opts.source,
      parent_id: opts.parent_id,
      atoms: atom,
      patterns: {
        slot: atom?.patternSlot,
        geometricGlyphs: atom?.geometricGlyphs,
        placements: atom?.placements,
      },
      layouts: atom?.geometricGlyphs,
      metrics: word?.metrics,
      modes: word?.modes,
      strip: word?.strip,
      encodings: atom?.encodings,
      streams: {
        caption_in: opts.caption_in ?? null,
        caption_out: formatCaptionOut("letter", atom, word),
      },
      jax: word ? jaxFromMetrics(word.metrics, { letter: atom?.letter }) : null,
      refs: atom?.refs,
      children: [],
    });
  }

  if (level === "word") {
    const word = analyzeWord(raw.trim().split(/\s+/)[0] || raw, layout);
    if (!word) {
      return makeEnvelope({
        level: "word",
        text: raw,
        layout,
        source: opts.source,
        streams: { caption_in: opts.caption_in, caption_out: null },
      });
    }
    const breakdown = wordLetterBreakdown(word.word);
    const order = analyzeOrder(word.word);
    const historical = analyzeHistorical(word.word, layout);
    const paleography = analyzeTextPaleography(word.word, { layout, maxGlyphs: 32 });
    return makeEnvelope({
      level: "word",
      text: word.word,
      layout,
      source: opts.source,
      parent_id: opts.parent_id,
      atoms: breakdown,
      tokens: [{ i: 0, text: word.word }],
      patterns: {
        path: breakdown.path,
        pathGlyphs: breakdown.pathGlyphs,
        layoutMetrics: word.layoutMetrics,
        order,
      },
      layouts: word.layouts,
      metrics: word.metrics,
      modes: word.modes,
      strip: word.strip,
      encodings: {
        braille: word.braille,
        morse: word.morse,
        nato: word.nato,
        asl: word.asl,
        bsl: word.bsl,
      },
      streams: {
        caption_in: opts.caption_in ?? null,
        caption_out: formatCaptionOut("word", breakdown, word),
      },
      jax: jaxFromMetrics(word.metrics, {
        word: word.word,
        braille: word.braille,
        ddr: word.flow?.ddr,
        so: order.so,
      }),
      refs: {
        oed: `https://www.oed.com/search/dictionary/?q=${encodeURIComponent(word.word)}`,
        wiki: `https://en.wikipedia.org/wiki/${encodeURIComponent(word.word)}`,
        wiktionary: `https://en.wiktionary.org/wiki/${encodeURIComponent(word.word)}`,
        grokipedia: null,
        paleography: historical.refs.paleography,
      },
      children: breakdown.atoms
        .filter((a) => a.atom)
        .map((a) =>
          makeEnvelope({
            level: "letter",
            text: a.atom.letter,
            layout,
            parent_id: null,
            atoms: a.atom,
            source: opts.source || "word-child",
          })
        ),
      meta: {
        letter: word.letter,
        activeLayout: word.activeLayout,
        order,
        historical,
        paleography: {
          epistemic: paleography.epistemic,
          dominantScript: paleography.dominantScript,
          scriptMix: paleography.scriptMix,
          textFeatureVector: paleography.textFeatureVector,
          glyphs: (paleography.glyphs || []).slice(0, 24),
        },
      },
    });
  }

  // multi-token levels
  const tokens = tokenize(raw);
  const wordEntries = tokens
    .map((t) => analyzeWord(t.text, layout))
    .filter(Boolean);
  const metrics = aggregateMetrics(wordEntries);
  const children = [];

  if (level === "sentence" || level === "caption") {
    for (const t of tokens) {
      children.push(
        analyzeLevel(t.text, {
          level: "word",
          layout,
          source: `${level}-child`,
        })
      );
    }
  } else if (level === "paragraph" || level === "document" || level === "blob") {
    const sents = splitSentences(raw);
    for (const s of sents) {
      children.push(
        analyzeLevel(s, {
          level: sents.length === 1 && tokens.length === 1 ? "word" : "sentence",
          layout,
          source: `${level}-child`,
        })
      );
    }
  } else if (level === "bigram") {
    for (let i = 0; i < tokens.length - 1; i++) {
      const pair = `${tokens[i].text} ${tokens[i + 1].text}`;
      children.push(
        analyzeLevel(pair, { level: "sentence", layout, source: "bigram-child" })
      );
    }
  }

  // wire parent ids
  const order = analyzeOrder(raw);
  const phon = analyzePhonPattern(raw, {
    lang: opts.lang || "en",
    level,
  });
  const historical = analyzeHistorical(raw, layout);

  const env = makeEnvelope({
    level,
    text: raw,
    layout,
    source: opts.source,
    parent_id: opts.parent_id,
    tokens,
    children,
    metrics,
    strip: {
      keys: metrics.keys,
      eff: metrics.efficiency,
      cpx: metrics.complexity,
      trails: metrics.trails,
      travelMM: metrics.travelMM,
      calories: metrics.calories,
      label: `Keys: ${metrics.keys} | Eff: ${metrics.efficiency}% | Cpx: ${metrics.complexity}% | Trails: ${metrics.trails} | ${Math.round(metrics.travelMM)}mm | ${metrics.calories.toFixed(6)} cal`,
    },
    patterns: {
      wordCount: wordEntries.length,
      layoutCoverage: LAYOUT_RING_ORDER.length,
      order,
      phon,
    },
    streams: {
      caption_in: opts.caption_in ?? (level === "caption" ? raw : null),
      caption_out: formatCaptionOut(level, { tokens, metrics }, null),
    },
    jax: jaxFromMetrics(metrics, {
      level,
      chars: raw.length,
      openRatio: order.openRatio,
      openRatioPhon: phon.openRatioPhon,
    }),
    llm: {
      role: "analysis",
      summary: `${level} · ${tokens.length} tokens · eff ${metrics.efficiency}% · SO ${order.compressed} · CV ${phon.compressed} · ${historical.era?.label || ""}`,
      prompt_hint: `Analyze keyboard geometry, SO order, phonetic CV, and historical/scribal reading of: ${raw.slice(0, 200)}`,
    },
    meta: {
      charCount: raw.length,
      tokenCount: tokens.length,
      childCount: children.length,
      order,
      phon,
      historical,
    },
  });

  // attach parent_id on children
  env.children = children.map((c) => ({ ...c, parent_id: env.id }));
  return env;
}

/**
 * Format caption_out line for live pipes (broadcast / subtitles / HLS).
 */
function formatCaptionOut(level, data, word) {
  if (level === "letter" && data) {
    return `[${data.letter}] braille:${data.encodings?.braille} slot:${data.patternSlot} nato:${data.encodings?.nato}`;
  }
  if (level === "word" && word) {
    return `${word.word} · ${word.strip?.label || ""} · ${word.flow?.ddr || ""} · ${word.braille}`;
  }
  if (data?.metrics) {
    const m = data.metrics;
    return `[${level}] tokens:${data.tokens?.length ?? m.words} · Eff ${m.efficiency}% · ${m.travelMM}mm · ${m.calories} cal`;
  }
  return `[${level}] analyzed`;
}

/**
 * Live pipe: channel + payload → envelope (+ optional caption_out string).
 * @param {string} channel
 * @param {string} payload
 * @param {{ layout?: string, level?: string }} [opts]
 */
export function pipe(channel, payload, opts = {}) {
  const layout = opts.layout || BASE_LAYOUT_ID;
  let level = opts.level;

  if (channel === "caption_in" || channel === "caption_out") {
    level = level || "caption";
  } else if (channel === "llm_prompt" || channel === "llm_completion") {
    level = level || detectLevel(payload);
  } else if (channel === "dict_lookup") {
    level = "word";
  }

  const env = analyzeLevel(payload, {
    level,
    layout,
    caption_in: channel === "caption_in" ? payload : null,
    source: `pipe:${channel}`,
  });

  env.streams = {
    ...env.streams,
    [channel]: payload,
    caption_out: env.streams.caption_out,
  };

  if (channel === "jax_tensor") {
    env.jax = env.jax || jaxFromMetrics(env.metrics || {}, { raw: payload });
  }

  return env;
}

/**
 * MCP tool dispatcher (browser-side simulation of MCP server).
 * May return a Promise for async tools (e.g. kbatch_chart_lookup).
 * @param {string} name
 * @param {object} args
 * @returns {object|Promise<object>}
 */
export function mcpCall(name, args = {}) {
  switch (name) {
    case "kbatch_analyze":
      return analyzeLevel(args.text || "", {
        level: args.level,
        layout: args.layout,
        caption_in: args.caption_in,
        source: "mcp:kbatch_analyze",
      });
    case "kbatch_lookup":
      return analyzeLevel(args.word || "", {
        level: "word",
        layout: args.layout,
        source: "mcp:kbatch_lookup",
      });
    case "kbatch_pipe":
      return pipe(args.channel || "caption_in", args.payload || "", {
        layout: args.layout,
      });
    case "kbatch_export_jax": {
      const e = analyzeLevel(args.text || "", {
        level: args.level,
        layout: args.layout,
        lang: args.lang,
      });
      return e.jax;
    }
    case "kbatch_phon_pattern":
      return import("./phonetic-pattern.js").then(({ analyzePhonPattern, phonDistance }) => {
        if (args.compare) {
          return phonDistance(args.text || "", args.compare, {
            lang: args.lang || "en",
            n: args.n || 2,
          });
        }
        return analyzePhonPattern(args.text || "", {
          lang: args.lang || "en",
          level: args.level || "caption",
        });
      });
    case "kbatch_letter_atom":
      return letterAtom(args.letter || "a");
    case "kbatch_matrix":
      return {
        schema: SCHEMA_VERSION,
        layout: args.layout || BASE_LAYOUT_ID,
        matrix: patternMatrix(),
        layouts: LAYOUT_RING_ORDER,
      };
    case "kbatch_colossus": {
      const snap = colossusSnapshot(
        Array.isArray(args.words) ? args.words : undefined,
        args.layout || BASE_LAYOUT_ID
      );
      if (args.full === true || args.full === "true") {
        return colossusSnapshotFull(
          Array.isArray(args.words) ? args.words : undefined,
          args.layout || BASE_LAYOUT_ID
        );
      }
      return snap;
    }
    case "kbatch_declaration_cadence":
      return import("./declaration-cadence.js").then(({ declarationCadenceMcp }) =>
        declarationCadenceMcp(args)
      );
    case "kbatch_world_path":
      return import("./world-path.js").then(({ computeWorldPath, worldPathSnapshot }) => {
        if (args.snapshot === true || args.snapshot === "true") {
          return worldPathSnapshot({ from: args.from || "en" });
        }
        return computeWorldPath({
          from: args.from || "en",
          mode: args.mode || "full",
          includeHonor: args.includeHonor === true,
          includePlaceholder: args.includePlaceholder !== false,
          readyOnly: args.readyOnly === true,
          max: args.max,
        });
      });
    case "kbatch_concept_solve":
      return import("./concept-solve.js").then(({ conceptSolve }) =>
        conceptSolve({
          q: args.q || args.text || args.word || "",
          conceptId: args.conceptId || args.id,
          from: args.from || args.lang || "en",
          mode: args.mode || "ready",
          includeHonor: args.includeHonor === true,
          includePaths: args.includePaths !== false,
          limit: args.limit,
        })
      );
    case "kbatch_concept_stair_walk":
      return import("./concept-solve.js").then(({ conceptStairWalk }) =>
        conceptStairWalk({
          concepts: args.concepts || args.q || args.words,
          from: args.from || args.lang || "en",
          includePaths: args.includePaths !== false,
          limit: args.limit,
        })
      );
    case "kbatch_world_axes":
      return fetchWorldAxesBundle();
    case "kbatch_shadows":
    case "kbatch_path_rank": {
      const text = args.text || "";
      const layout = args.layout || args.baseLayout || BASE_LAYOUT_ID;
      const env = analyzeLevel(text, {
        level: args.level || "auto",
        layout,
        source: `mcp:${name}`,
      });
      const ranked = (env.ranked || env.ring || []).slice(
        0,
        Math.max(1, Number(args.limit || args.maxRank) || 8)
      );
      return {
        schema: SCHEMA_VERSION,
        tool: name,
        text,
        baseLayout: layout,
        strip: env.strip,
        metrics: env.metrics,
        ranked,
        shadows: ranked.map((r) => ({
          id: r.id,
          name: r.name,
          shadow: r.shadow || r.glyph || r.label,
          score: r.score ?? r.strain ?? null,
          efficiency: r.metrics?.efficiency ?? r.efficiency ?? null,
          strain: r.metrics?.strain ?? r.strain ?? null,
        })),
        path: env.path || env.pathBase || null,
      };
    }
    case "kbatch_steno_path": {
      // Lazy imports keep pipeline boot light; resolve via dynamic when available
      const text = String(args.text || "");
      const layout = args.layout || BASE_LAYOUT_ID;
      const env = analyzeLevel(text, {
        level: "auto",
        layout,
        source: "mcp:kbatch_steno_path",
      });
      /** @type {object} */
      let steno = null;
      /** @type {object} */
      let musica = null;
      try {
        // sync-friendly: only if already on window from SPA
        if (typeof window !== "undefined" && window.__KBATCH_STENO__) {
          steno = window.__KBATCH_STENO__(text, args.payload);
        }
      } catch {
        /* */
      }
      return {
        schema: SCHEMA_VERSION,
        tool: "kbatch_steno_path",
        text,
        layout,
        strip: env.strip,
        metrics: env.metrics,
        flow: env.a11y?.flow || env.flow || null,
        encodings: env.encodings || null,
        steno,
        musica,
        note:
          "Steno path = layout-agnostic geometric unit. Full stenoSTRIP blank-coin analysis loads with SPA modules (steno-strip / qbpm-music).",
        mcp: {
          resource: `kbatch://steno/${encodeURIComponent(text.slice(0, 48))}`,
        },
      };
    }
    case "kbatch_chart_lookup":
      // Async: catalog + analysis packs via fetch
      return import("./billboard-2026.js").then(({ chartLookup }) =>
        chartLookup({
          ...args,
          analyze: (text, opts) => analyzeLevel(text, opts),
        })
      );
    case "kbatch_world_predict":
      return import("./rubik-language-map.js").then(async ({ predictWordsFromPath }) => {
        let candidates = Array.isArray(args.candidates) ? args.candidates : [];
        const text = String(args.text || "");
        // Auto-pull prefix candidates from corpus slivers when pool empty
        if (!candidates.length && typeof window !== "undefined") {
          try {
            const corpus = await import("./corpus.js");
            const stem =
              text
                .toLowerCase()
                .split(/[^\p{L}\p{N}'-]+/u)
                .filter(Boolean)
                .pop() || text.toLowerCase().slice(0, 4);
            if (args.lang) corpus.setWordLang(args.lang);
            candidates = await corpus.searchPrefixLazy(stem, 80);
          } catch {
            candidates = [];
          }
        }
        return predictWordsFromPath(text, {
          candidates,
          limit: args.limit || 12,
          lang: args.lang || "en",
        });
      });
    case "kbatch_glyph_steno":
      return import("./glyph-steno.js").then(({ encodeGlyphInSteno, decodeGlyphFromSteno }) => {
        const mode = String(args.mode || "encode").toLowerCase();
        if (mode === "decode") {
          return decodeGlyphFromSteno(args.text || "");
        }
        return encodeGlyphInSteno(args.text || "", args.pixels ?? "", {
          n: args.n,
        });
      });
    case "kbatch_quantum_binary":
      return import("./quantum-gutter.js").then(({ binaryStreamToGutter }) =>
        binaryStreamToGutter(args.text || "", {
          binary: args.binary,
          glyphBits: args.glyphBits,
          layout: args.layout,
        })
      );
    case "kbatch_freya_convert":
      return import("./freya-math.js").then(({ freyaConvert }) =>
        freyaConvert(args.value, args.from, args.to)
      );
    case "kbatch_freya_units":
      return import("./freya-math.js").then(({ freyaListUnits }) =>
        freyaListUnits(args.cat)
      );
    case "kbatch_math":
      return import("./freya-math.js").then(({ mathEval }) =>
        mathEval(args.op, args.operands ?? args.args ?? [])
      );
    case "kbatch_calibrate_check":
      return import("./llm-tool-calibrate.js").then(async ({ calibrateCheck }) => {
        let axesMin = null;
        try {
          const ax = await fetchWorldAxesBundle();
          axesMin =
            ax?.live?.min ??
            (Array.isArray(ax?.axes)
              ? Math.min(...ax.axes.map((a) => a.scoreToday ?? 1))
              : null);
        } catch {
          /* */
        }
        return calibrateCheck(
          {
            toolNames: args.toolNames,
            doctrineId: args.doctrineId,
            fingerprint: args.fingerprint,
            axesMin: args.axesMin,
          },
          {
            toolNames: MCP_TOOLS.map((t) => t.name),
            axesMin,
          }
        );
      });
    case "kbatch_recalibrate":
      return import("./llm-tool-calibrate.js").then(({ recalibrate }) =>
        recalibrate(args.reason || "mcp-request", {
          toolNames: MCP_TOOLS.map((t) => t.name),
        })
      );
    case "kbatch_llm_train_pack":
      return import("./llm-tool-calibrate.js").then(({ buildTrainPack }) =>
        buildTrainPack()
      );
    case "kbatch_deity_lookup":
      return deityLookupMcp(args);
    case "kbatch_book_stub":
      return bookStubMcp(args);
    /* Declaration Letter-Grid pipe (draft shapes · live session or static master) */
    case "kbatch_lettergrid_ping":
    case "kbatch_lettergrid_rubik":
    case "kbatch_lettergrid_state":
    case "kbatch_lettergrid_step":
    case "kbatch_lettergrid_play_round":
    case "kbatch_lettergrid_glyphs":
    case "kbatch_lettergrid_layer":
    case "kbatch_lettergrid_colossus":
    case "kbatch_lettergrid_next_glyph":
    case "kbatch_lettergrid_export_training":
    case "kbatch_lettergrid_finale":
      return import("./letter-grid-mcp.js").then(({ lettergridMcpCall }) =>
        lettergridMcpCall(name, args)
      );
    case "kbatch_cage_litmus_quiz":
    case "kbatch_cage_litmus_verify":
    case "kbatch_cage_litmus_grade":
      return import("./cage-litmus-mcp.js").then(({ cageLitmusMcpCall }) =>
        cageLitmusMcpCall(name, args)
      );
    default:
      return { error: `unknown tool: ${name}`, tools: MCP_TOOLS.map((t) => t.name) };
  }
}

async function deityLookupMcp(args = {}) {
  const q = String(args.q || args.name || args.id || "")
    .trim()
    .toLowerCase();
  const limit = Math.min(20, Math.max(1, Number(args.limit) || 5));
  const bases = [
    "./data/mythology/deities-index.json",
    "/data/mythology/deities-index.json",
    "https://kbatch.ugrad.ai/data/mythology/deities-index.json",
    "https://data.ugrad.ai/kbatch/mythology/deities-index.json",
  ];
  let doc = null;
  for (const url of bases) {
    try {
      const r = await fetch(url, { cache: "force-cache" });
      if (r.ok) {
        doc = await r.json();
        break;
      }
    } catch {
      /* */
    }
  }
  const list = Array.isArray(doc?.deities) ? doc.deities : [];
  if (!q) {
    return {
      tool: "kbatch_deity_lookup",
      count: list.length,
      claim: doc?.claim,
      forbid: doc?.licensePolicy?.forbid || ["OUP/Turner"],
      sample: list.slice(0, 3).map((d) => ({
        id: d.id,
        name: d.name,
        culture: d.culture,
      })),
    };
  }
  const hits = list
    .filter((d) => {
      const hay = `${d.id} ${d.name} ${d.spelling} ${d.culture || ""} ${d.description || ""}`.toLowerCase();
      return hay.includes(q) || d.id === args.id;
    })
    .slice(0, limit)
    .map((d) => ({
      id: d.id,
      name: d.name,
      spelling: d.spelling,
      culture: d.culture,
      description: d.description,
      alsoKnownAs: d.alsoKnownAs || [],
      seeAlso: d.seeAlso || [],
      wikidata: d.wikidata,
      wikipedia: d.wikipedia,
      license: d.license,
      source: d.source,
    }));
  return {
    tool: "kbatch_deity_lookup",
    q,
    hits,
    hitCount: hits.length,
    doctrine: "Open Wikidata only — never Turner/OUP body text",
  };
}

async function bookStubMcp(args = {}) {
  const q = String(args.q || args.title || "")
    .trim()
    .toLowerCase();
  const gid = args.gutenbergId != null ? Number(args.gutenbergId) : null;
  const limit = Math.min(40, Math.max(1, Number(args.limit) || 8));
  const bases = [
    "./data/living-books/",
    "/data/living-books/",
    "https://kbatch.ugrad.ai/data/living-books/",
  ];
  async function load(rel) {
    for (const b of bases) {
      try {
        const r = await fetch(b + rel, { cache: "force-cache" });
        if (r.ok) return r.json();
      } catch {
        /* */
      }
    }
    return null;
  }
  const idx = await load("gutenberg-stubs/index.json");
  const catalogTotal = idx?.count || 0;
  /** @type {object[]} */
  let hits = [];

  if (gid != null && Number.isFinite(gid)) {
    const shardSize = idx?.shardSize || 5000;
    const start = Math.floor(gid / shardSize) * shardSize;
    const end = start + shardSize - 1;
    const file = `gutenberg-stubs/shard-${String(start).padStart(5, "0")}-${String(end).padStart(5, "0")}.json`;
    const shard = await load(file);
    const stubs = shard?.stubs || [];
    hits = stubs.filter((s) => Number(s.gutenbergId) === gid);
  } else if (q) {
    // Fast path: resolved catalogue + title index sample + curated entries
    const [resolved, sample, curated] = await Promise.all([
      load("gutenberg-stubs/resolved-catalogue.json"),
      load("gutenberg-stubs/title-index-sample.json"),
      load("entries.json"),
    ]);
    const pool = [];
    if (Array.isArray(resolved?.stubs)) pool.push(...resolved.stubs);
    const entries = Array.isArray(curated)
      ? curated
      : curated?.entries || [];
    for (const e of entries) {
      pool.push({
        id: e.id,
        gutenbergId: e.gutenbergId,
        title: e.title,
        author: e.author,
        status: e.gutenbergId ? "resolved" : "stub",
        links: e.links,
        viewer: e.viewer || "folio",
      });
    }
    const letter = q[0];
    const samplePool =
      sample?.titleIndex?.[letter] ||
      sample?.titleIndex?.["#"] ||
      [];
    for (const s of samplePool) pool.push(s);
    // If still thin, scan first two shards (common low ids)
    if (pool.length < 200) {
      for (const f of [
        "gutenberg-stubs/shard-00000-04999.json",
        "gutenberg-stubs/shard-05000-09999.json",
      ]) {
        const sh = await load(f);
        if (sh?.stubs) pool.push(...sh.stubs);
      }
    }
    const seen = new Set();
    for (const e of pool) {
      const hay = `${e.id || ""} ${e.title || ""} ${e.author || ""}`.toLowerCase();
      if (!hay.includes(q)) continue;
      const key = e.gutenbergId || e.id;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(e);
      if (hits.length >= limit) break;
    }
  } else {
    const resolved = await load("gutenberg-stubs/resolved-catalogue.json");
    hits = (resolved?.stubs || []).slice(0, limit);
  }

  hits = hits.slice(0, limit).map((e) => ({
    id: e.id,
    title: e.title,
    author: e.author || null,
    gutenbergId: e.gutenbergId,
    kind: e.kind || null,
    status: e.status || (e.gutenbergId ? "stub" : "unknown"),
    links: e.links || {
      gutenbergHtml: e.gutenbergId
        ? `https://www.gutenberg.org/ebooks/${e.gutenbergId}`
        : null,
    },
    viewer: e.viewer || "folio",
  }));
  return {
    tool: "kbatch_book_stub",
    q: q || null,
    gutenbergId: gid,
    hitCount: hits.length,
    catalogueLive: catalogTotal,
    curatedResolved: idx?.resolvedOverlay ?? null,
    shards: idx?.shards?.length ?? null,
    hits,
    note:
      catalogTotal > 0
        ? `Full PG catalog stubs live (${catalogTotal}) · text on demand`
        : "Curated catalogue only",
  };
}

/**
 * Full Colossus dump for DOJO page: alphabet + pattern matrix + sample words + world path spine.
 * Sync core — use colossusSnapshotFull() to pipe axes/collaborators/senses/music from data/.
 * @param {string[]} [words]
 * @param {string} [layout]
 */
export function colossusSnapshot(words = [], layout = BASE_LAYOUT_ID) {
  const alphabet = alphabetAtoms();
  const matrix = patternMatrix();
  const sample = (words.length ? words : ["the", "quantum", "kbatch", "flow", "dictionary"])
    .map((w) => analyzeLevel(w, { level: "word", layout, source: "colossus" }));

  let worldPath = null;
  try {
    worldPath = worldPathSnapshot({ from: "en" });
  } catch {
    worldPath = { error: "world-path unavailable" };
  }

  return {
    schema: SCHEMA_VERSION,
    ts: new Date().toISOString(),
    layout,
    rung: "R3-scaffold",
    layouts: LAYOUT_RING_ORDER.map((id) => ({
      id,
      name: KEYBOARD_LAYOUTS[id].name,
      script: KEYBOARD_LAYOUTS[id].script,
      region: KEYBOARD_LAYOUTS[id].region,
    })),
    alphabet,
    patternMatrix: matrix,
    words: sample,
    worldPath,
    glyphSteno: {
      tool: "kbatch_glyph_steno",
      sizes: [13, 25, 37, 49],
      browser: "window.kbatchDict.glyph.encode(text, pixels)",
      dojo: "https://kbatch.ugrad.ai/dojo/#glyph-steno",
    },
    pipe: {
      axes: "kbatch_world_axes",
      worldPath: "kbatch_world_path",
      collaborators: "HTTP /api/mcp kbatch_collaborators",
      senses: "HTTP /api/mcp kbatch_sense_lookup",
      music: "HTTP /api/mcp kbatch_music_rights",
      museum: "HTTP /api/mcp kbatch_museum_resource",
      glyph: "kbatch_glyph_steno",
    },
    mcp: { tools: MCP_TOOLS },
    levels: ANALYSIS_LEVELS,
  };
}

const DATA_BASES = [
  "./data/",
  "../data/",
  "https://data.ugrad.ai/kbatch/",
  "https://kbatch.ugrad.ai/data/",
];

async function fetchDataJson(rel) {
  for (const base of DATA_BASES) {
    try {
      const res = await fetch(new URL(rel, base).href, { cache: "default" });
      if (res.ok) return await res.json();
    } catch {
      /* next */
    }
  }
  // try absolute from document
  if (typeof location !== "undefined") {
    try {
      const res = await fetch(new URL(rel, location.origin + "/data/").href);
      if (res.ok) return await res.json();
    } catch {
      /* */
    }
  }
  return null;
}

/** Axes + pathway dial state for MCP / Colossus full pipe */
export async function fetchWorldAxesBundle() {
  const axes = await fetchDataJson("world-ranking/axes.json");
  const pathways = {};
  for (const key of ["dictionaries", "schools", "museums", "typing", "music"]) {
    pathways[key] = await fetchDataJson(`world-ranking/pathways/${key}.json`);
  }
  const outreach = await fetchDataJson("world-ranking/pathways/r3-outreach.json");
  return {
    tool: "kbatch_world_axes",
    rung: axes?.rung || "R3-scaffold",
    axes: axes || { error: "axes.json not loaded" },
    pathways,
    outreach: outreach
      ? {
          status: outreach.status,
          queueCount: (outreach.queue || []).length,
          doctrine: outreach.doctrine,
        }
      : null,
    page: "https://kbatch.ugrad.ai/world-ranking.html",
    strategy: "https://kbatch.ugrad.ai/docs/WORLD-AXIS-DOMINANCE.md",
  };
}

/**
 * Colossus full pipe: geometry + world axes + collaborators + senses + music + world-path + glyph.
 * @param {string[]} [words]
 * @param {string} [layout]
 */
export async function colossusSnapshotFull(words = [], layout = BASE_LAYOUT_ID) {
  const base = colossusSnapshot(words, layout);
  const [axesBundle, collaborators, senses, music, museum] = await Promise.all([
    fetchWorldAxesBundle(),
    fetchDataJson("world-ranking/collaborators.json"),
    fetchDataJson("senses/index.json"),
    fetchDataJson("music-rights/index.json"),
    fetchDataJson("museum-resource/index.json"),
  ]);

  if (!base.worldPath || base.worldPath.error) {
    base.worldPath = worldPathSnapshot({ from: "en" });
  }

  return {
    ...base,
    full: true,
    axes: axesBundle,
    collaborators: collaborators
      ? {
          schema: collaborators.schema,
          count: (collaborators.collaborators || []).length,
          statusMachine: collaborators.statusMachine,
          live: (collaborators.collaborators || []).filter((c) => c.status === "live"),
          head: (collaborators.collaborators || []).slice(0, 12),
        }
      : null,
    senses: senses
      ? {
          status: senses.status,
          count: senses.count,
          licensePolicy: senses.licensePolicy,
          sample: (senses.senses || []).slice(0, 6),
        }
      : null,
    musicRights: music
      ? {
          status: music.status,
          claim: music.claim,
          tiers: (music.tiers || []).map((t) => ({
            id: t.id,
            name: t.name,
            live: t.live,
          })),
        }
      : null,
    museum: museum
      ? {
          status: museum.status || museum.schema,
          kits: museum.kits || museum.resources || museum.exhibits || null,
          head: Array.isArray(museum.resources)
            ? museum.resources.slice(0, 6)
            : Array.isArray(museum.kits)
              ? museum.kits.slice(0, 6)
              : null,
        }
      : null,
    note: "R3 scaffold pipe — pathways dialed; outreach human-gated via r3-outreach CRM.",
  };
}

/** Browser global API for live piping */
export function installGlobalAPI() {
  if (typeof window === "undefined") return;
  window.kbatchDict = {
    schema: SCHEMA_VERSION,
    levels: ANALYSIS_LEVELS,
    tools: MCP_TOOLS,
    analyze: analyzeLevel,
    pipe,
    mcp: mcpCall,
    /** @param {object} args chart geometry lookup (async) */
    chartLookup: (args = {}) => mcpCall("kbatch_chart_lookup", args),
    letter: letterAtom,
    breakdown: wordLetterBreakdown,
    matrix: patternMatrix,
    alphabet: alphabetAtoms,
    languageAlphabetMatrix: null, // filled if module loaded
    colossus: colossusSnapshot,
    colossusFull: colossusSnapshotFull,
    worldPath: (opts = {}) =>
      import("./world-path.js").then(({ computeWorldPath }) => computeWorldPath(opts)),
    worldPathSnapshot: (opts = {}) =>
      import("./world-path.js").then(({ worldPathSnapshot }) => worldPathSnapshot(opts)),
    worldAxes: () => fetchWorldAxesBundle(),
    order: analyzeOrder,
    historical: analyzeHistorical,
    pos: analyzeSentenceUse,
    meaning: lookupMeaning,
    phonation: analyzePhonation,
    registers: VOICE_REGISTERS,
    placements: PLACEMENTS,
    scholar: analyzeScholarLinguistics,
    frameworks: LING_FRAMEWORKS,
    gloss: leipzigGloss,
    cite: citationPack,
    presentation: {
      compose: composePresentation,
      everything: analyzeEverything,
      blocks: BLOCK_TYPES,
      langs: DESC_LANGS,
    },
    overview: {
      toWorkspace: toOverviewWorkspace,
      pipe: pipeToOverview,
      pages: "https://fornevercollective.github.io/overview/",
      local: "http://127.0.0.1:5173/",
    },
    coverage: coverageReport,
    layouts: () =>
      LAYOUT_RING_ORDER.map((id) => ({
        id,
        ...KEYBOARD_LAYOUTS[id],
      })),
    /** World + path prediction / glyph / quantum funnels */
    predict: (text, opts) => mcpCall("kbatch_world_predict", { text, ...opts }),
    glyph: {
      encode: (text, pixels, opts) =>
        mcpCall("kbatch_glyph_steno", { mode: "encode", text, pixels, ...opts }),
      decode: (text) => mcpCall("kbatch_glyph_steno", { mode: "decode", text }),
    },
    quantum: {
      binaryStream: (text, opts) =>
        mcpCall("kbatch_quantum_binary", { text, ...opts }),
      gutter: "https://mueee.qbitos.ai/quantum-gutter.html",
    },
    funnel: "https://data.ugrad.ai/kbatch/funnel.json",
    data: "https://data.ugrad.ai/kbatch/",
  };
}
