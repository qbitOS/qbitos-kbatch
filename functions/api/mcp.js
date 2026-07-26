/**
 * HTTP MCP surface for KBatch (Cloudflare Pages Function).
 *
 * GET  /api/mcp           → manifest + tools
 * POST /api/mcp           → { "tool": "kbatch_chart_lookup", "args": { ... } }
 * POST /api/mcp           → JSON-RPC style { "method": "tools/call", "params": { "name", "arguments" } }
 *
 * Data plane: same-origin /data/* or https://data.ugrad.ai/kbatch/
 */

import {
  analyzePhonPattern,
  phonDistance,
  blendTransferCost,
} from "../lib/phonetic-pattern.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

const TOOLS = [
  {
    name: "kbatch_chart_lookup",
    description:
      "Chart Geometry lookup — 1141 title-path packs (2015–2026). Exact slug/title match, flowClass, metrics, rights, lyricsUpgrade. Not full commercial lyrics.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        slug: { type: "string" },
        year: { type: "number" },
        yearMin: { type: "number" },
        yearMax: { type: "number" },
        numberOne: { type: "boolean" },
        region: { type: "string" },
        bpmMin: { type: "number" },
        bpmMax: { type: "number" },
        flowClass: { type: "string", enum: ["dense", "balanced", "glide"] },
        capsule: { type: "string" },
        listCapsules: { type: "boolean" },
        matchMode: { type: "string", enum: ["auto", "exact", "fuzzy"] },
        exact: { type: "boolean" },
        limit: { type: "number" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["path", "musica", "metrics", "steno", "pack", "rights", "lyricsUpgrade", "all"],
          },
        },
      },
    },
  },
  {
    name: "kbatch_list_capsules",
    description: "List canonical capsules (ladder 0–7 index).",
    inputSchema: {
      type: "object",
      properties: {
        cat: { type: "string" },
        rung: { type: "number" },
        q: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "kbatch_open_capsule",
    description: "Open one capsule by id (metadata + word sample).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "kbatch_word_index",
    description: "Return live word-index / corpus scale snapshot.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_school_skills",
    description: "School skill graph topics (learn path).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
    },
  },
  {
    name: "kbatch_analyze_lite",
    description:
      "Lightweight path metrics via precomputed analyzed sliver or title-path heuristic (full browser MCP for full CapsuleAnalyzer).",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        word: { type: "string" },
      },
    },
  },
  {
    name: "kbatch_world_axes",
    description: "World-ranking five axes scores, targets, and pathways (dominance plan).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_collaborators",
    description: "List partnership/collaboration placeholder slots (OED, Duolingo, Spotify, museums…).",
    inputSchema: {
      type: "object",
      properties: {
        axis: { type: "number" },
        status: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "kbatch_sense_lookup",
    description: "Open sense/gloss pilot linked to orthography (CC0 stubs; Wiktionary path planned).",
    inputSchema: {
      type: "object",
      properties: {
        spelling: { type: "string" },
        word: { type: "string" },
        lang: { type: "string" },
      },
    },
  },
  {
    name: "kbatch_music_rights",
    description: "Music rights tiers and accreditation path (Spotify/Apple/Amazon/Tidal counterpart).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_museum_resource",
    description: "Museum/library exhibit kits and embed offer.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_world_path",
    description:
      "Fastest multi-language path snapshot (ready/portals/ladder/full). Full compute is browser MCP; HTTP serves precomputed snapshot + doctrine.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string" },
        mode: { type: "string", enum: ["full", "ready", "portals", "ladder", "snapshot"] },
      },
    },
  },
  {
    name: "kbatch_r3_outreach",
    description: "R3 outreach CRM scaffold (human-gated; no auto-send).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_freya_convert",
    description: "FreyaUnits convert (freya.qbitos.ai) — ly↔km, °C↔K, etc.",
    inputSchema: {
      type: "object",
      properties: {
        value: { type: "number" },
        from: { type: "string" },
        to: { type: "string" },
      },
      required: ["value", "from", "to"],
    },
  },
  {
    name: "kbatch_freya_units",
    description: "List Freya unit symbols by category.",
    inputSchema: {
      type: "object",
      properties: { cat: { type: "string" } },
    },
  },
  {
    name: "kbatch_math",
    description: "Safe math ops (add/mul/pow/sqrt/…) or op=const|list.",
    inputSchema: {
      type: "object",
      properties: {
        op: { type: "string" },
        operands: { type: "array", items: { type: "number" } },
      },
      required: ["op"],
    },
  },
  {
    name: "kbatch_calibrate_check",
    description: "Detect agent slip/drift vs KBatch doctrine + tools.",
    inputSchema: {
      type: "object",
      properties: {
        toolNames: { type: "array", items: { type: "string" } },
        doctrineId: { type: "string" },
        fingerprint: { type: "string" },
        axesMin: { type: "number" },
      },
    },
  },
  {
    name: "kbatch_recalibrate",
    description: "System prompt + doctrine + tool list after drift.",
    inputSchema: {
      type: "object",
      properties: { reason: { type: "string" } },
    },
  },
  {
    name: "kbatch_llm_train_pack",
    description: "LLM train-as-tool pack (system prompt, few-shots, schemas).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_deity_lookup",
    description: "Open Wikidata deities (never Turner/OUP text).",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "kbatch_book_stub",
    description: "Living-books catalogue / Gutenberg stub lookup.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        gutenbergId: { type: "number" },
        limit: { type: "number" },
      },
    },
  },
  /* Declaration Letter-Grid — static-capable; live step/play needs browser session */
  {
    name: "kbatch_lettergrid_ping",
    description:
      "Health: engine ver, masterGlyphs 6235, layersAt, tool list, static URLs. No board required.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_lettergrid_state",
    description:
      "Letter-Grid state (timer, BPS, layer, next glyph). HTTP returns static lobby unless session bridge present.",
    inputSchema: {
      type: "object",
      properties: {
        include: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_glyphs",
    description: "Master glyph list/slice (6235) for Colossus / training.",
    inputSchema: {
      type: "object",
      properties: {
        range: { type: "string" },
        format: { type: "string", enum: ["array", "string", "atoms"] },
        includeMeta: { type: "boolean" },
      },
    },
  },
  {
    name: "kbatch_lettergrid_step",
    description: "Advance glyph(s). Live browser session required (HTTP returns live_session_required).",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["next", "play", "reset", "skip-layer"] },
        count: { type: "integer" },
        speedMs: { type: "integer" },
      },
    },
  },
  {
    name: "kbatch_lettergrid_play_round",
    description: "70s WebGrid round (dryRun on HTTP; live run in browser MCP).",
    inputSchema: {
      type: "object",
      properties: {
        gridSize: { type: "string", enum: ["8x8", "12x12", "16x16"] },
        speedMs: { type: "integer" },
        dryRun: { type: "boolean" },
      },
    },
  },
  {
    name: "kbatch_lettergrid_layer",
    description: "Get N×N grid layer info (1–44 @ 12×12). jump/clear need browser.",
    inputSchema: {
      type: "object",
      properties: {
        layer: { type: "integer" },
        action: { type: "string", enum: ["get", "jump", "clear"] },
      },
      required: ["layer"],
    },
  },
  {
    name: "kbatch_lettergrid_colossus",
    description:
      "DOJO-ready Letter-Grid snapshot (glyphs + layerMap + paleography). Compose with kbatch_colossus.",
    inputSchema: {
      type: "object",
      properties: {
        depth: { type: "string", enum: ["light", "full", "training"] },
        include: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "kbatch_lettergrid_next_glyph",
    description: "Next expected glyph (static: master[0]; live: session next).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_lettergrid_export_training",
    description:
      "Emit a clean training pack. jsonl = one record per glyph (gi, ch, lineId, kind, layer, …).",
    inputSchema: {
      type: "object",
      properties: {
        format: { type: "string", enum: ["json", "jsonl", "jax"] },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart", "layer"],
          },
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_finale",
    description:
      "Finale wandering path + peak report (static spiral path; live scores need browser session).",
    inputSchema: {
      type: "object",
      properties: {
        includePath: { type: "boolean" },
        includeScores: { type: "boolean" },
        N: { type: "integer", enum: [8, 12, 16] },
      },
    },
  },
  {
    name: "kbatch_lettergrid_rubik",
    description:
      "Shadow Rubik × Letter-Grid: 13 origin pathways, 6 faces, calibration URLs. Static bind pack.",
    inputSchema: {
      type: "object",
      properties: {
        pathId: { type: "string" },
        include: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "kbatch_phon_pattern",
    description:
      "Phonetic CV / phone-class analysis (English G2P approx). openRatioPhon, n-grams, artMean. Does not change jax.x geometry.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        lang: { type: "string" },
        level: { type: "string" },
        compare: { type: "string", description: "Second text → d_PHON / d_art" },
        n: { type: "number" },
        blend: {
          type: "object",
          description: "Optional { c, dSO, dPHON, dArt, muSO, muPhon, muArt }",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_cage_litmus_quiz",
    description:
      "Cage-grade litmus quiz (12 claims). FACT / FICTION / STONE_TRAP. Static; answers:false for blinded trials.",
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" } },
        include: { type: "array", items: { type: "string" } },
        answers: { type: "boolean" },
      },
    },
  },
  {
    name: "kbatch_cage_litmus_grade",
    description:
      "Scoring contract: bands, hard rule (zero STONE_TRAP → fail), calibration profiles.",
    inputSchema: {
      type: "object",
      properties: {
        profile: {
          type: "string",
          enum: ["bands", "oracle", "stoneOnly", "movieBeliever", "grokLive", "all"],
        },
        includeDoctrine: { type: "boolean" },
      },
    },
  },
  {
    name: "kbatch_cage_litmus_verify",
    description:
      "Submit {id,answer}[] → score/grade. Hard rule: zero STONE_TRAP catches → fail if score ≥ 0.5.",
    inputSchema: {
      type: "object",
      properties: {
        answers: { type: "array" },
        strict: { type: "boolean" },
      },
      required: ["answers"],
    },
  },
];

/* ── Freya + math (HTTP-safe, no browser modules) ── */
const FREYA_UNITS = [
  { sym: "ℓp", factor: 1.616255e-35, cat: "length", name: "Planck Length" },
  { sym: "nm", factor: 1e-9, cat: "length", name: "Nanometer" },
  { sym: "mm", factor: 1e-3, cat: "length", name: "Millimeter" },
  { sym: "cm", factor: 1e-2, cat: "length", name: "Centimeter" },
  { sym: "in", factor: 0.0254, cat: "length", name: "Inch" },
  { sym: "ft", factor: 0.3048, cat: "length", name: "Foot" },
  { sym: "m", factor: 1, cat: "length", name: "Meter" },
  { sym: "km", factor: 1e3, cat: "length", name: "Kilometer" },
  { sym: "mi", factor: 1609.34, cat: "length", name: "Mile" },
  { sym: "AU", factor: 1.496e11, cat: "length", name: "Astronomical Unit" },
  { sym: "ly", factor: 9.461e15, cat: "length", name: "Light Year" },
  { sym: "pc", factor: 3.086e16, cat: "length", name: "Parsec" },
  { sym: "g", factor: 1e-3, cat: "mass", name: "Gram" },
  { sym: "kg", factor: 1, cat: "mass", name: "Kilogram" },
  { sym: "lb", factor: 0.453592, cat: "mass", name: "Pound" },
  { sym: "t", factor: 1000, cat: "mass", name: "Metric Ton" },
  { sym: "K", factor: 1, cat: "temperature", name: "Kelvin", offset: 0 },
  { sym: "°C", factor: 1, cat: "temperature", name: "Celsius", offset: 273.15 },
  { sym: "°F", factor: 5 / 9, cat: "temperature", name: "Fahrenheit", offset: 255.372 },
  { sym: "m/s", factor: 1, cat: "speed", name: "Meters/sec" },
  { sym: "km/h", factor: 1 / 3.6, cat: "speed", name: "km per hour" },
  { sym: "mph", factor: 0.44704, cat: "speed", name: "Miles/hour" },
  { sym: "c", factor: 299792458, cat: "speed", name: "Speed of Light" },
  { sym: "s", factor: 1, cat: "time", name: "Second" },
  { sym: "min", factor: 60, cat: "time", name: "Minute" },
  { sym: "h", factor: 3600, cat: "time", name: "Hour" },
  { sym: "d", factor: 86400, cat: "time", name: "Day" },
  { sym: "J", factor: 1, cat: "energy", name: "Joule" },
  { sym: "eV", factor: 1.602176634e-19, cat: "energy", name: "Electronvolt" },
  { sym: "B", factor: 1, cat: "digital", name: "Byte" },
  { sym: "KiB", factor: 1024, cat: "digital", name: "Kibibyte" },
  { sym: "MiB", factor: 1048576, cat: "digital", name: "Mebibyte" },
];

function freyaFind(sym) {
  const s = String(sym || "").trim();
  return (
    FREYA_UNITS.find((u) => u.sym === s) ||
    FREYA_UNITS.find((u) => u.sym.toLowerCase() === s.toLowerCase()) ||
    null
  );
}

function toolFreyaConvert(args) {
  const v = Number(args.value);
  const a = freyaFind(args.from);
  const b = freyaFind(args.to);
  if (!Number.isFinite(v)) return { error: "value must be finite" };
  if (!a || !b) {
    return { error: "unknown unit", known: FREYA_UNITS.map((u) => u.sym) };
  }
  if (a.cat !== b.cat) {
    return { error: "category mismatch", fromCat: a.cat, toCat: b.cat };
  }
  let result;
  if (a.cat === "temperature") {
    const k = v * a.factor + (a.offset ?? 0);
    result = (k - (b.offset ?? 0)) / b.factor;
  } else {
    result = (v * a.factor) / b.factor;
  }
  return {
    tool: "kbatch_freya_convert",
    value: v,
    from: a.sym,
    to: b.sym,
    result,
    freya: "https://freya.qbitos.ai/",
  };
}

function toolMath(args) {
  const op = String(args.op || "").toLowerCase();
  const xs = (Array.isArray(args.operands) ? args.operands : []).map(Number);
  const [a, b] = xs;
  if (op === "list") {
    return {
      tool: "kbatch_math",
      ops: ["add", "sub", "mul", "div", "pow", "sqrt", "log", "mean", "const"],
    };
  }
  if (op === "const") {
    return {
      tool: "kbatch_math",
      constants: { pi: Math.PI, e: Math.E, c: 299792458, phi: (1 + Math.sqrt(5)) / 2 },
    };
  }
  if (xs.some((x) => !Number.isFinite(x))) return { error: "operands must be finite" };
  let result;
  switch (op) {
    case "add":
    case "+":
      result = xs.reduce((s, x) => s + x, 0);
      break;
    case "sub":
    case "-":
      result = xs.slice(1).reduce((s, x) => s - x, a);
      break;
    case "mul":
    case "*":
      result = xs.reduce((s, x) => s * x, 1);
      break;
    case "div":
    case "/":
      if (xs.slice(1).some((x) => x === 0)) return { error: "division by zero" };
      result = xs.slice(1).reduce((s, x) => s / x, a);
      break;
    case "pow":
      result = Math.pow(a, b ?? 2);
      break;
    case "sqrt":
      result = Math.sqrt(a);
      break;
    case "log":
      result = Math.log(a);
      break;
    case "mean":
      result = xs.reduce((s, x) => s + x, 0) / xs.length;
      break;
    default:
      return { error: `unknown op: ${op}`, hint: "op=list" };
  }
  return { tool: "kbatch_math", op, operands: xs, result };
}

const DOCTRINE = {
  id: "kbatch-doctrine-v1",
  rules: [
    "path geometry spine",
    "never OUP/Turner text",
    "never sacred-texts scrape",
    "never pirate comics/lyrics",
    "PD/Wikidata/Gutenberg open only",
    "Track C human — no fake scores",
  ],
};

function toolRecalibrate(args) {
  return {
    tool: "kbatch_recalibrate",
    reason: args.reason || "http-mcp",
    at: new Date().toISOString(),
    doctrine: DOCTRINE,
    freya: "https://freya.qbitos.ai/",
    systemPrompt:
      "Use KBatch MCP tools for path geometry, Freya units, math, open deities. On drift call kbatch_recalibrate. Never Turner/OUP or pirate text. https://kbatch.ugrad.ai/for-ai",
    tools: TOOLS.map((t) => t.name),
    browser: "await kbatchDict.mcp('kbatch_recalibrate', { reason })",
    trainPack: "/data/llm/train-pack.json",
  };
}

function toolCalibrateCheck(args) {
  const live = TOOLS.map((t) => t.name);
  const agent = Array.isArray(args.toolNames) ? args.toolNames : [];
  const missing = live.filter((t) => agent.length && !agent.includes(t));
  const drifted = !!(args.doctrineId && args.doctrineId !== DOCTRINE.id) || missing.length > 0;
  return {
    tool: "kbatch_calibrate_check",
    drifted,
    severity: drifted ? "warn" : "ok",
    missingTools: missing,
    doctrine: DOCTRINE,
    action: drifted ? "call kbatch_recalibrate" : "continue",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: CORS });
}

function dataBases(request) {
  const u = new URL(request.url);
  const origin = u.origin;
  return [
    `${origin}/data/`,
    "https://data.ugrad.ai/kbatch/",
    "https://kbatch.ugrad.ai/data/",
  ];
}

async function fetchJson(request, rel) {
  for (const base of dataBases(request)) {
    try {
      const res = await fetch(new URL(rel, base).href, {
        headers: { accept: "application/json" },
        cf: { cacheTtl: 300, cacheEverything: true },
      });
      if (res.ok) return await res.json();
    } catch {
      /* try next */
    }
  }
  return null;
}

function normChartQ(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Match browser billboard-2026 scoreTrackDetailed */
function scoreTrackDetailed(t, q) {
  if (!q) return { score: 0, match: "none" };
  const slug = String(t.slug || "").toLowerCase();
  const raw = String(q).trim().toLowerCase();
  const nq = normChartQ(q);
  const slugQ = nq.replace(/\s+/g, "-");
  if (!nq && !raw) return { score: 0, match: "none" };
  if (slug === raw || slug === slugQ || slug === raw.replace(/\s+/g, "-")) {
    return { score: 1000, match: "slug-exact" };
  }
  const title = normChartQ(t.title || "");
  const artist = normChartQ(t.artist || "");
  const hay = normChartQ(`${t.title || ""} ${t.artist || ""} ${slug}`);
  if (title && artist && (nq === `${title} ${artist}` || nq === `${artist} ${title}`)) {
    return { score: 980, match: "title-artist-exact" };
  }
  if (title && nq === title) return { score: 950, match: "title-exact" };
  if (artist && nq === artist) return { score: 920, match: "artist-exact" };
  if (hay === nq) return { score: 900, match: "hay-exact" };
  if (title && nq.startsWith(title + " ") && artist && nq.includes(artist)) {
    return { score: 880, match: "title-prefix-artist" };
  }
  if (hay.includes(nq)) return { score: 500 + Math.min(80, nq.length), match: "substring" };
  const tokens = nq.split(/\s+/).filter(Boolean);
  let hit = 0;
  let tokHits = 0;
  for (const tok of tokens) {
    if (hay.includes(tok)) {
      hit += 40;
      tokHits++;
    }
  }
  if (tokHits === tokens.length && tokens.length >= 2) {
    return { score: Math.min(860, 700 + hit), match: "all-tokens" };
  }
  return { score: hit, match: hit > 0 ? "token" : "none" };
}

function scoreTrack(t, q) {
  return scoreTrackDetailed(t, q).score;
}

function flowClassFromBpm(bpm) {
  const n = Number(bpm);
  if (!Number.isFinite(n)) return "unknown";
  if (n >= 155) return "dense";
  if (n <= 140) return "glide";
  return "balanced";
}

function titlePathTextHttp(track) {
  const title = String(track?.title || "Untitled").trim();
  const artist = String(track?.artist || "").trim();
  return [title, artist, title, artist.split(/\s*[&,/]\s*/)[0] || artist, title, `${title} ${artist}`]
    .filter(Boolean)
    .join("\n");
}

function lyricsUpgradeHttp(t, pack) {
  const slug = t?.slug || "";
  const mode = pack?.meta?.lyricsMode || t?.lyricsMode || "title-path";
  const upgradeable = mode === "title-path" || mode === "metadata-only";
  return {
    mode,
    upgradeable,
    hasFullText: mode === "cited-file" || mode === "public-domain" || mode === "user-paste",
    citation: pack?.citation || null,
    dropPaths: {
      citedTxt: slug ? `data/lyrics/cited/${slug}.txt` : null,
      citedCite: slug ? `data/lyrics/cited/${slug}.cite.json` : null,
      chartsLyrics: slug ? `data/lyrics/charts/lyrics/${slug}.txt` : null,
      analysis: slug ? `data/lyrics/analyses/${slug}.json` : null,
    },
    steps: upgradeable
      ? [
          "Place PD/licensed lyrics at data/lyrics/cited/{slug}.txt",
          "Add citation sidecar data/lyrics/cited/{slug}.cite.json",
          "Re-run analyze:charts for that slug",
          "Re-query with include:[\"pack\"]",
        ]
      : ["Full-text mode already set"],
    docs: "docs/LYRICS-CITATION-AND-SONG-FLOW.md",
  };
}

async function toolChartLookup(request, args) {
  if (args.listCapsules === true || args.listCapsules === "true") {
    const cap = await fetchJson(request, "lyrics/charts/capsules.json");
    return {
      schema: "kbatch-chart-capsules-v1",
      tool: "kbatch_chart_lookup",
      mode: "listCapsules",
      claim: cap?.claim || "Metadata chart-geometry capsules (title-path only).",
      capsuleCount: cap?.capsuleCount ?? cap?.capsules?.length ?? 0,
      corpus: cap?.corpus || null,
      capsules: (cap?.capsules || []).map((c) => ({
        id: c.id,
        label: c.label || c.name,
        kind: c.kind,
        filters: c.filters,
        metrics: c.metrics,
        examples: c.examples,
        mcp: c.mcp,
      })),
      open: 'kbatch_chart_lookup({ capsule: "chart-flow-dense" })',
      resources: {
        capsules: "data/lyrics/charts/capsules.json",
        ui: "https://kbatch.ugrad.ai/lyrics.html",
      },
    };
  }

  const index = await fetchJson(request, "lyrics/charts/index.json");
  const corpus = await fetchJson(request, "lyrics/charts/corpus.json");
  const pd = await fetchJson(request, "lyrics/cited/index.json");
  const pdTracks = (pd?.tracks || []).map((t) => ({
    id: t.id || `pd-${t.slug}`,
    slug: t.slug,
    title: t.title || t.slug,
    artist: t.artist || "Public domain",
    peak: 0,
    year: t.year || null,
    numberOne: false,
    regions: [],
    lyricsMode: "cited-file",
    analysis: t.bpm ? { bpm: t.bpm, avgStrain: t.strain } : null,
    analyzed: t.bpm ? { bpm: t.bpm, avgStrain: t.strain } : null,
  }));

  /** Merge corpus analysis onto index tracks for BPM filters */
  const bySlug = new Map();
  for (const row of corpus?.tracks || []) {
    if (row?.slug) bySlug.set(row.slug, row.analysis || row.analyzed || null);
  }
  const indexTracks = (index?.tracks || []).map((t) => {
    const a = t.analysis || t.analyzed || bySlug.get(t.slug) || null;
    return a ? { ...t, analysis: a, analyzed: a } : t;
  });
  let tracks = [...pdTracks, ...indexTracks];

  let include = args.include;
  if (typeof include === "string") {
    include =
      include === "all"
        ? ["path", "musica", "metrics", "steno", "pack", "rights", "lyricsUpgrade"]
        : include.split(/[,\s]+/);
  }
  if (!Array.isArray(include) || !include.length) {
    include = ["path", "musica", "metrics", "rights", "lyricsUpgrade"];
  }
  const want = new Set(include.map((x) => String(x).toLowerCase()));

  let matchMode = String(args.matchMode || "auto").toLowerCase();
  if (args.exact === true || args.exact === "true" || args.exact === 1) matchMode = "exact";
  if (!["auto", "exact", "fuzzy"].includes(matchMode)) matchMode = "auto";

  const query = String(args.query || args.q || "").trim();
  const slugArg = String(args.slug || args.id || "").trim().toLowerCase().replace(/\s+/g, "-");
  const limit = Math.max(1, Math.min(40, Number(args.limit) || 8));

  /* Capsule filter expand */
  let capsuleMeta = null;
  const capsuleId = args.capsule ? String(args.capsule).trim() : "";
  if (capsuleId) {
    const capDoc = await fetchJson(request, "lyrics/charts/capsules.json");
    capsuleMeta = (capDoc?.capsules || []).find((c) => c.id === capsuleId) || null;
    if (capsuleMeta?.filters) {
      const f = capsuleMeta.filters;
      if (args.year == null && f.year != null) args.year = f.year;
      if (args.yearMin == null && f.yearMin != null) args.yearMin = f.yearMin;
      if (args.yearMax == null && f.yearMax != null) args.yearMax = f.yearMax;
      if (!args.numberOne && f.numberOne) args.numberOne = true;
      if (!args.region && f.region) args.region = f.region;
      if (args.bpmMin == null && f.bpmMin != null) args.bpmMin = f.bpmMin;
      if (args.bpmMax == null && f.bpmMax != null) args.bpmMax = f.bpmMax;
      if (!args.flowClass && f.flowClass) args.flowClass = f.flowClass;
    }
  }

  const year = args.year != null && args.year !== "" ? Number(args.year) : null;
  const yearMin = args.yearMin != null && args.yearMin !== "" ? Number(args.yearMin) : null;
  const yearMax = args.yearMax != null && args.yearMax !== "" ? Number(args.yearMax) : null;
  const wantOne = args.numberOne === true || args.numberOne === "true" || args.numberOne === 1;
  const region = args.region ? String(args.region).toUpperCase() : null;
  const bpmMin = args.bpmMin != null && args.bpmMin !== "" ? Number(args.bpmMin) : null;
  const bpmMax = args.bpmMax != null && args.bpmMax !== "" ? Number(args.bpmMax) : null;
  const flowClass2 = args.flowClass ? String(args.flowClass).toLowerCase() : null;

  let filtered = tracks.slice();
  if (Number.isFinite(year)) filtered = filtered.filter((t) => Number(t.year) === year);
  if (Number.isFinite(yearMin)) filtered = filtered.filter((t) => Number(t.year) >= yearMin);
  if (Number.isFinite(yearMax)) filtered = filtered.filter((t) => Number(t.year) <= yearMax);
  if (wantOne) filtered = filtered.filter((t) => t.numberOne === true || t.peak === 1);
  if (region) {
    filtered = filtered.filter((t) => {
      const regs = t.regions || t.region || [];
      const arr = Array.isArray(regs) ? regs : [regs];
      return arr.some((r) => String(r).toUpperCase() === region);
    });
  }
  if (Number.isFinite(bpmMin) || Number.isFinite(bpmMax) || flowClass2) {
    filtered = filtered.filter((t) => {
      const bpm = Number(t.analysis?.bpm ?? t.analyzed?.bpm ?? t.bpm);
      const b = Number.isFinite(bpm) ? bpm : null;
      if (Number.isFinite(bpmMin) && (b == null || b < bpmMin)) return false;
      if (Number.isFinite(bpmMax) && (b == null || b > bpmMax)) return false;
      if (flowClass2) {
        if (b == null) return false;
        if (flowClassFromBpm(b) !== flowClass2) return false;
      }
      return true;
    });
  }

  let scored;
  if (slugArg && !query) {
    scored = filtered
      .filter((t) => String(t.slug || "").toLowerCase() === slugArg || t.id === slugArg)
      .map((t) => ({ track: t, score: 1000, match: "slug-exact" }));
  } else if (query) {
    scored = filtered
      .map((t) => {
        const d = scoreTrackDetailed(t, query);
        return { track: t, score: d.score, match: d.match };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (a.track.peak ?? 999) - (b.track.peak ?? 999));
    if (matchMode === "exact") scored = scored.filter((x) => x.score >= 900);
    else if (matchMode === "auto") {
      const exacts = scored.filter((x) => x.score >= 900);
      if (exacts.length) scored = exacts;
    }
  } else {
    scored = filtered
      .slice()
      .sort((a, b) => (a.peak ?? 999) - (b.peak ?? 999) || String(a.title).localeCompare(String(b.title)))
      .map((t, i) => ({ track: t, score: 100 - Math.min(99, i), match: "browse" }));
  }

  const top = scored.slice(0, limit);
  const hits = [];

  for (const { track: t, score, match } of top) {
    const pack = await fetchJson(request, `lyrics/analyses/${t.slug}.json`);
    const bpm =
      pack?.musica?.bpm ??
      pack?.summary?.bpm ??
      t.analysis?.bpm ??
      t.analyzed?.bpm ??
      null;
    const key = pack?.musica?.key ?? pack?.summary?.key ?? t.analysis?.key ?? null;
    const strain = pack?.summary?.avgStrain ?? t.analysis?.avgStrain ?? t.analyzed?.avgStrain ?? null;
    const efficiency =
      pack?.summary?.avgEfficiency ?? t.analysis?.avgEfficiency ?? t.analyzed?.avgEfficiency ?? null;
    const lyricsMode = pack?.meta?.lyricsMode || t.lyricsMode || "title-path";
    const flowClass = flowClassFromBpm(bpm);
    const pathText = titlePathTextHttp(t);

    const hit = {
      slug: t.slug,
      title: t.title,
      artist: t.artist,
      year: t.year,
      peak: t.peak,
      numberOne: !!t.numberOne,
      regions: t.regions || [],
      lyricsMode,
      score,
      match,
      analysisPath: t.analysisPath || `data/lyrics/analyses/${t.slug}.json`,
      flowClass,
    };

    if (want.has("metrics")) {
      hit.metrics = {
        bpm,
        key,
        timeSig: pack?.musica?.timeSig || pack?.summary?.timeSig || null,
        avgStrain: strain,
        avgEfficiency: efficiency,
        midiNotes: pack?.summary?.midiNotes ?? null,
        bestLayout: pack?.summary?.bestLayout ?? null,
      };
    }
    if (want.has("path")) {
      hit.path = {
        text: pathText,
        source: lyricsMode === "title-path" ? "title-path" : lyricsMode,
        note:
          lyricsMode === "title-path"
            ? "Copyright-safe title+artist geometry. See lyricsUpgrade for full-text path."
            : "Cited/full-text mode when pack was analyzed with lyrics file.",
      };
    }
    if (want.has("musica")) {
      hit.musica = pack?.musica || { bpm, key };
    }
    if (want.has("rights")) {
      hit.rights = pack?.rights || t.rights || null;
    }
    if (want.has("lyricsupgrade") || want.has("lyricsUpgrade")) {
      hit.lyricsUpgrade = lyricsUpgradeHttp(t, pack);
    }
    if (want.has("pack") && pack) {
      hit.pack = {
        meta: pack.meta,
        summary: pack.summary,
        musica: pack.musica,
        citation: pack.citation || null,
        rights: pack.rights || null,
        lines: (pack.lines || []).length,
        timeline: pack.timeline || null,
      };
    }
    if (want.has("steno")) {
      hit.steno = {
        note: "Call kbatch_steno_path on path.text for live unit (browser MCP preferred)",
        flow: pack?.qbpm?.live?.flow || pack?.fullLive?.flow || null,
      };
    }
    hits.push(hit);
  }

  /* Legacy slug-only convenience: also expose track/pack top-level when single exact slug */
  const legacy =
    slugArg && hits.length === 1
      ? {
          track: {
            id: hits[0].slug,
            slug: hits[0].slug,
            title: hits[0].title,
            artist: hits[0].artist,
            peak: hits[0].peak,
            lyricsMode: hits[0].lyricsMode,
          },
          analyzed: hits[0].metrics || null,
        }
      : {};

  return {
    schema: "kbatch-chart-lookup-v1",
    tool: "kbatch_chart_lookup",
    claim:
      "Chart Geometry Engine — title-path packs (not commercial full lyrics). Optional licensed .txt drops only.",
    query: query || null,
    slug: slugArg || null,
    matchMode,
    capsule: capsuleMeta
      ? { id: capsuleMeta.id, label: capsuleMeta.label, metrics: capsuleMeta.metrics }
      : capsuleId
        ? { id: capsuleId, error: "capsule not found — try listCapsules: true" }
        : null,
    filters: {
      year: Number.isFinite(year) ? year : null,
      yearMin: Number.isFinite(yearMin) ? yearMin : null,
      yearMax: Number.isFinite(yearMax) ? yearMax : null,
      numberOne: wantOne || null,
      region,
      bpmMin: Number.isFinite(bpmMin) ? bpmMin : null,
      bpmMax: Number.isFinite(bpmMax) ? bpmMax : null,
      flowClass: flowClass2,
      capsule: capsuleId || null,
      matchMode,
      limit,
      include: [...want],
    },
    catalog: {
      tracks: index?.count ?? indexTracks.length,
      years: index?.years || null,
      schema: index?.schema || null,
    },
    corpusStats: corpus?.stats || corpus?.corpus || null,
    scored: scored.length,
    count: hits.length,
    exactCount: hits.filter((h) => (h.score || 0) >= 900).length,
    hits,
    /* backwards-compatible alias */
    tracks: hits,
    ...legacy,
    demo: {
      slug: "too-sweet-hozier",
      title: "Too Sweet",
      artist: "Hozier",
      note: "Canonical #1 demo",
    },
    contrast: {
      dense: { slug: "anxiety-doechii", title: "Anxiety", artist: "Doechii", bpm: 164 },
      balanced: { slug: "too-sweet-hozier", title: "Too Sweet", artist: "Hozier", bpm: 149 },
      glide: {
        slug: "die-with-a-smile-lady-gaga",
        title: "Die with a Smile",
        artist: "Lady Gaga",
        bpm: 135,
      },
    },
    resources: {
      catalog: "data/lyrics/charts/index.json",
      corpus: "data/lyrics/charts/corpus.json",
      capsules: "data/lyrics/charts/capsules.json",
      packs: "data/lyrics/analyses/{slug}.json",
      cited: "data/lyrics/cited/{slug}.txt + .cite.json",
      docs: "docs/CHART-LOOKUP-RETURN-SHAPE.md",
      ui: "https://kbatch.ugrad.ai/lyrics.html",
    },
  };
}

async function toolListCapsules(request, args) {
  const idx = await fetchJson(request, "capsules/index.json");
  let rows = idx?.capsules || [];
  if (args.cat) rows = rows.filter((c) => c.cat === args.cat);
  if (args.rung != null && args.rung !== "") {
    const r = Number(args.rung);
    rows = rows.filter((c) => Number(c.rung) === r);
  }
  if (args.q) {
    const q = String(args.q).toLowerCase();
    rows = rows.filter((c) =>
      `${c.id} ${c.name} ${c.cat} ${c.desc || ""}`.toLowerCase().includes(q)
    );
  }
  const limit = Math.max(1, Math.min(200, Number(args.limit) || 40));
  return {
    tool: "kbatch_list_capsules",
    total: idx?.count ?? rows.length,
    byCat: idx?.byCat || null,
    byRung: idx?.byRung || null,
    count: Math.min(limit, rows.length),
    capsules: rows.slice(0, limit).map((c) => ({
      id: c.id,
      name: c.name,
      cat: c.cat,
      rung: c.rung,
      wordCount: c.wordCount,
      desc: (c.desc || "").slice(0, 160),
    })),
  };
}

async function toolOpenCapsule(request, args) {
  const id = String(args.id || "").trim();
  if (!id) return { error: "id required" };
  const idx = await fetchJson(request, "capsules/index.json");
  const c = (idx?.capsules || []).find(
    (x) => String(x.id).toLowerCase() === id.toLowerCase()
  );
  if (!c) return { error: "capsule not found", id };
  return { tool: "kbatch_open_capsule", capsule: c };
}

async function toolWordIndex(request) {
  const wi = await fetchJson(request, "word-index.json");
  const ai = await fetchJson(request, "analyzed-index.json");
  const lang = await fetchJson(request, "words/lang-index.json");
  return {
    tool: "kbatch_word_index",
    wordIndex: {
      total: wi?.total,
      profile: wi?.profile,
      profileLabel: wi?.profileLabel,
      sliverCount: wi?.slivers?.sliverCount ?? wi?.slivers,
    },
    analyzed: {
      totalWords: ai?.totalWords || ai?.corpusTotal,
      packVersion: ai?.packVersion,
    },
    world: {
      packsReady: lang?.packsReady,
      langsListed: lang?.total || lang?.languages?.length,
      totalSpellings: lang?.totalSpellingsAllLangs,
    },
  };
}

async function toolSchoolSkills(request, args) {
  const pack = await fetchJson(request, "education/school-concepts.json");
  if (args.id) {
    const t = (pack?.topics || []).find((x) => x.id === args.id);
    return t
      ? { tool: "kbatch_school_skills", topic: t }
      : { error: "topic not found", id: args.id };
  }
  return {
    tool: "kbatch_school_skills",
    subjects: pack?.subjects || [],
    topicCount: pack?.topics?.length || 0,
    topics: (pack?.topics || []).map((t) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      domain: t.domain,
      prerequisites: t.prerequisites || [],
      kbatchHooks: t.kbatchHooks || [],
    })),
  };
}

async function toolAnalyzeLite(request, args) {
  const text = String(args.text || args.word || "").trim();
  if (!text) return { error: "text required" };
  const word = text.toLowerCase().split(/\s+/)[0].replace(/[^a-z'-]/g, "");
  // try precomputed analyzed sliver if short latin word
  let pre = null;
  if (word.length >= 2 && word.length <= 24 && /^[a-z]+$/.test(word)) {
    const prefix = word.slice(0, Math.min(3, word.length));
    const sliver = await fetchJson(request, `analyzed/slivers/${prefix}.json`);
    if (sliver && typeof sliver === "object") {
      pre = sliver[word] || sliver.words?.[word] || null;
      if (!pre && Array.isArray(sliver)) {
        pre = sliver.find((e) => e.word === word || e.w === word) || null;
      }
    }
  }
  return {
    tool: "kbatch_analyze_lite",
    text,
    word,
    precomputed: pre,
    note: pre
      ? "Hit analyzed sliver"
      : "No sliver hit — use browser MCP kbatch_analyze for full CapsuleAnalyzer (15 layouts).",
    browserMcp: "window.kbatchDict.mcp('kbatch_analyze', { text })",
    dojo: "https://kbatch.ugrad.ai/dojo/",
  };
}

async function toolWorldAxes(request) {
  const doc = await fetchJson(request, "world-ranking/axes.json");
  return {
    tool: "kbatch_world_axes",
    axesDoc: doc,
    rung: doc?.rung,
    axes: doc?.axes,
    nicheLead: doc?.nicheLead,
    typicalProductBars: doc?.typicalProductBars,
    colossusPipe: doc?.colossusPipe,
    doctrine: doc?.doctrine,
    strategy: "https://kbatch.ugrad.ai/docs/WORLD-AXIS-DOMINANCE.md",
    page: "https://kbatch.ugrad.ai/world-ranking.html",
  };
}

async function toolCollaborators(request, args) {
  const doc = await fetchJson(request, "world-ranking/collaborators.json");
  let rows = doc?.collaborators || [];
  if (args.axis != null && args.axis !== "") {
    const a = Number(args.axis);
    rows = rows.filter((c) => (c.axis || []).includes(a));
  }
  if (args.status) {
    rows = rows.filter((c) => c.status === args.status);
  }
  const limit = Math.max(1, Math.min(100, Number(args.limit) || 50));
  return {
    tool: "kbatch_collaborators",
    statusMachine: doc?.statusMachine,
    count: Math.min(limit, rows.length),
    total: (doc?.collaborators || []).length,
    collaborators: rows.slice(0, limit),
  };
}

async function toolSenseLookup(request, args) {
  const spelling = String(args.spelling || args.word || "")
    .trim()
    .toLowerCase();
  const doc = await fetchJson(request, "senses/index.json");
  if (!spelling) {
    return {
      tool: "kbatch_sense_lookup",
      status: doc?.status,
      count: doc?.count,
      wiktionaryLinked: doc?.wiktionaryLinked ?? doc?.d5?.wiktionaryGlosses,
      d5: doc?.d5 || null,
      sample: (doc?.senses || []).slice(0, 5),
      note: doc?.licensePolicy,
      licensePolicy: doc?.licensePolicy,
    };
  }
  const hit = (doc?.senses || []).find(
    (s) => String(s.spelling).toLowerCase() === spelling
  );
  if (hit) {
    return {
      tool: "kbatch_sense_lookup",
      sense: hit,
      wiktionary: {
        title: hit.wiktionaryTitle || spelling,
        url:
          hit.sourceUrl?.includes("wiktionary")
            ? hit.sourceUrl
            : `https://en.wiktionary.org/wiki/${encodeURIComponent(spelling)}`,
        license: hit.license,
        shareAlike: hit.shareAlike || hit.license === "CC-BY-SA-4.0",
        attribution: hit.attribution || null,
      },
      geometry: "browser: window.kbatchDict.analyze(spelling)",
    };
  }
  // D5 soft miss: still return attribution scaffold URL
  return {
    tool: "kbatch_sense_lookup",
    spelling,
    error: "not in local sense index",
    wiktionary: {
      title: spelling,
      url: `https://en.wiktionary.org/wiki/${encodeURIComponent(spelling)}`,
      license: "CC-BY-SA-4.0",
      note: "Title reserved — run npm run senses:d5 to fetch extract under attribution",
    },
    note: "Local pilot may not include this spelling yet · D5 pipeline: scripts/d5-wiktionary-bulk.mjs",
  };
}

async function toolMusicRights(request) {
  return {
    tool: "kbatch_music_rights",
    ...(await fetchJson(request, "music-rights/index.json")),
  };
}

async function toolMuseumResource(request) {
  return {
    tool: "kbatch_museum_resource",
    ...(await fetchJson(request, "museum-resource/index.json")),
  };
}

async function toolWorldPath(request, args) {
  const snap = await fetchJson(request, "world-ranking/world-path.json");
  const mode = String(args.mode || "snapshot").toLowerCase();
  if (snap && mode === "snapshot") {
    return {
      tool: "kbatch_world_path",
      mode: "snapshot",
      ...(snap.from ? snap : { snapshot: snap }),
      browser:
        "window.kbatchDict.worldPath({ from: 'en', mode: 'full' }) · full greedy path in SPA/DOJO",
      dojo: "https://kbatch.ugrad.ai/dojo/#world-path",
    };
  }
  if (snap && mode === "ready" && snap.ready) {
    return { tool: "kbatch_world_path", mode: "ready", from: snap.from, ...snap.ready };
  }
  if (snap && mode === "portals" && snap.portals) {
    return { tool: "kbatch_world_path", mode: "portals", from: snap.from, ...snap.portals };
  }
  if (snap && mode === "ladder" && snap.ladder) {
    return { tool: "kbatch_world_path", mode: "ladder", from: snap.from, ...snap.ladder };
  }
  if (snap && mode === "full" && snap.full) {
    return {
      tool: "kbatch_world_path",
      mode: "full",
      from: snap.from,
      ...snap.full,
      note: "HTTP serves head/tail of full path; browser MCP computes complete order.",
      browser: "await kbatchDict.worldPath({ mode: 'full', includeHonor: true })",
    };
  }
  return {
    tool: "kbatch_world_path",
    error: snap ? "unknown mode" : "world-path.json not deployed",
    mode,
    browser: "await kbatchDict.worldPath({ from: 'en', mode: 'ready' })",
    dojo: "https://kbatch.ugrad.ai/dojo/#world-path",
  };
}

async function toolR3Outreach(request) {
  const doc = await fetchJson(request, "world-ranking/pathways/r3-outreach.json");
  return {
    tool: "kbatch_r3_outreach",
    ...(doc || { error: "r3-outreach.json missing" }),
    note: "Scaffold only — never auto-email. Human moves status scaffolded → drafted → sent.",
  };
}

/* ── Letter-Grid (static HTTP; live step/play → browser MCP) ── */
const LG_PLAY = "https://kbatch.ugrad.ai/labs/declaration-digital-edition/letter-grid.html";
const LG_PIPE = "https://kbatch.ugrad.ai/labs/declaration-digital-edition/letter-grid-pipe.html";

function lgNeedLive(tool) {
  return {
    error: "live_session_required",
    tool,
    message:
      "HTTP MCP cannot drive the live board. Use browser DOJO/letter-grid (letterGrid / kbatchDict.mcp) or open the pipe harness.",
    open: LG_PLAY,
    pipe: LG_PIPE,
    browser: `await kbatchDict.mcp('${tool}', args)`,
  };
}

function lgFilterGlyphs(glyphs, range) {
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

function lgFormat(glyphs, format, includeMeta) {
  if (format === "string") {
    return glyphs.map((g) => (Array.isArray(g) ? g[1] : g.ch)).join("");
  }
  if (format === "atoms") {
    return glyphs.map((g) =>
      Array.isArray(g)
        ? {
            gi: g[0],
            ch: g[1],
            lineId: g[2],
            kind: g[3],
            wordStart: !!g[4],
            sentenceStart: !!g[5],
          }
        : g
    );
  }
  if (includeMeta) return glyphs;
  return glyphs.map((g) => (Array.isArray(g) ? g[1] : g.ch));
}

function lgLineMap(glyphs) {
  const map = {};
  for (const g of glyphs) {
    const gi = Array.isArray(g) ? g[0] : g.gi;
    const lineId = Array.isArray(g) ? g[2] : g.lineId;
    const kind = Array.isArray(g) ? g[3] : g.kind;
    if (!map[lineId]) map[lineId] = { label: kind || "body", range: [gi, gi], count: 0 };
    map[lineId].range[1] = gi;
    map[lineId].count++;
  }
  return map;
}

function lgCrossref(glyphs) {
  const xr = {};
  for (const g of glyphs) {
    const ch = String(Array.isArray(g) ? g[1] : g.ch || "").toUpperCase();
    const lineId = Array.isArray(g) ? g[2] : g.lineId;
    if (!ch) continue;
    if (!xr[ch]) xr[ch] = {};
    xr[ch][lineId] = (xr[ch][lineId] || 0) + 1;
  }
  return xr;
}

/** Deterministic spiral — matches declaration-letter-grid wanderingPathIndices */
function lgWanderingPath(N) {
  const path = [];
  const seen = {};
  let x = Math.floor((N - 1) / 2);
  let y = Math.floor((N - 1) / 2);
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  let di = 0;
  let leg = 1;
  function push(cx, cy) {
    if (cx < 0 || cy < 0 || cx >= N || cy >= N) return false;
    const idx = cy * N + cx;
    if (seen[idx]) return false;
    seen[idx] = true;
    path.push(idx);
    return true;
  }
  push(x, y);
  while (path.length < N * N) {
    for (let rep = 0; rep < 2; rep++) {
      for (let s = 0; s < leg; s++) {
        x += dirs[di][0];
        y += dirs[di][1];
        push(x, y);
        if (path.length >= N * N) return path;
      }
      di = (di + 1) % 4;
    }
    leg++;
  }
  for (let i = 0; i < N * N; i++) if (!seen[i]) path.push(i);
  return path;
}

function lgPaleographyFallback() {
  return {
    scribe: "Timothy Matlack",
    ink: "iron-gall",
    support: "parchment",
    substrate: "parchment",
    dimensions: "~29.5 × 24 in",
    source: "NARA engrossed copy",
    notes: [
      "NARA engrossed transcript · orthographic master stream",
      "Letter-grid master is letter-only (spaces stripped) for scoring",
    ],
    signatureColumns: "Six vertical columns by state (Georgia → New Hampshire)",
    rights: "public-domain transcript",
  };
}

function lgTrainingRecord(g, need, include) {
  const fields =
    include && include.length
      ? include
      : ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart", "layer"];
  const gi = Array.isArray(g) ? g[0] : g.gi;
  const ch = Array.isArray(g) ? g[1] : g.ch;
  const lineId = Array.isArray(g) ? g[2] : g.lineId;
  const kind = Array.isArray(g) ? g[3] : g.kind;
  const wordStart = Array.isArray(g) ? g[4] || 0 : g.wordStart ? 1 : 0;
  const sentenceStart = Array.isArray(g) ? g[5] || 0 : g.sentenceStart ? 1 : 0;
  const layer = Math.floor(gi / need) + 1;
  const full = { gi, ch, lineId, kind, wordStart, sentenceStart, layer };
  const out = {};
  for (const f of fields) {
    if (full[f] !== undefined) out[f] = full[f];
  }
  return out;
}

async function toolLettergrid(request, name, args) {
  const master =
    (await fetchJson(request, "declaration/master-glyphs.json")) ||
    (await fetchJson(request, "../declaration/master-glyphs.json"));
  /* try same-origin lab path via absolute from site root */
  let pack = master;
  if (!pack) {
    try {
      const url = new URL("/data/declaration/master-glyphs.json", request.url);
      const r = await fetch(url.toString());
      if (r.ok) pack = await r.json();
    } catch {
      /* */
    }
  }
  if (!pack || !pack.glyphs) {
    return {
      error: "master-glyphs.json not deployed",
      tool: name,
      hint: "Ship data/declaration/master-glyphs.json (6235 glyphs)",
      play: LG_PLAY,
    };
  }
  const glyphs = pack.glyphs;
  const total = pack.total || glyphs.length;
  const N = 12;
  const need = N * N;
  const layers = Math.ceil(total / need) || 1;
  const first = glyphs[0];
  const firstCh = Array.isArray(first) ? first[1] : first?.ch;

  if (name === "kbatch_lettergrid_ping") {
    const lettergridTools = TOOLS.map((t) => t.name).filter((n) =>
      String(n).startsWith("kbatch_lettergrid_")
    );
    return {
      schema: "kbatch-letter-grid-ping-v1",
      tool: name,
      ok: true,
      ver: pack.ver || "declaration-letter-grid-v8-pipe",
      masterGlyphs: total,
      first: pack.first || firstCh || "I",
      layersAt: pack.layersAt || {
        8: Math.ceil(total / 64),
        12: layers,
        16: Math.ceil(total / 256),
      },
      liveSession: false,
      tools: lettergridTools,
      toolCount: lettergridTools.length,
      urls: {
        play: LG_PLAY,
        pipe: LG_PIPE,
        master: "/data/declaration/master-glyphs.json",
        paleography: "/data/declaration/paleography.json",
        rubik: "/data/declaration/letter-grid-rubik.json",
        mcp: "/api/mcp",
        costMatrix: "/data/world-path/cost-matrix.json",
        jaxBank: "/data/calibration/jax-feature-bank.json",
      },
      at: new Date().toISOString(),
    };
  }

  if (name === "kbatch_lettergrid_rubik") {
    let rubik =
      (await fetchJson(request, "declaration/letter-grid-rubik.json")) || null;
    if (!rubik) {
      try {
        const url = new URL("/data/declaration/letter-grid-rubik.json", request.url);
        const r = await fetch(url.toString());
        if (r.ok) rubik = await r.json();
      } catch {
        /* */
      }
    }
    if (!rubik) {
      return {
        error: "letter-grid-rubik.json not deployed",
        tool: name,
        hint: "Ship data/declaration/letter-grid-rubik.json",
      };
    }
    const include = args.include || [
      "pathways",
      "faces",
      "calibration",
      "patterns",
      "compose",
      "tour",
    ];
    const pathId =
      args.pathId || rubik.letterGrid?.defaultFocus || "pie-germanic-en";
    const focus =
      (rubik.pathways || []).find((p) => p.pathId === pathId) ||
      (rubik.pathways || []).find((p) => p.declarationDefault) ||
      null;
    const out = {
      schema: rubik.schema || "kbatch-letter-grid-rubik-v1",
      tool: name,
      ver: rubik.ver,
      docId: rubik.docId,
      purpose: rubik.purpose,
      letterGrid: rubik.letterGrid,
      focus,
      pathId: focus?.pathId || pathId,
      allMap: rubik.allMap,
      mcp: rubik.mcp,
      engine: rubik.engine,
    };
    if (include.includes("pathways")) out.pathways = rubik.pathways;
    if (include.includes("faces")) out.cubeFaces = rubik.cubeFaces;
    if (include.includes("calibration")) out.calibration = rubik.calibration;
    if (include.includes("patterns")) out.patterns = rubik.patterns;
    if (include.includes("compose")) out.compose = rubik.compose;
    const TOUR_PATH = "declaration/rubik-all-language-path.json";
    if (include.includes("tour") || args.tour) {
      let tour = await fetchJson(request, TOUR_PATH);
      if (!tour) {
        try {
          const u = new URL("/data/" + TOUR_PATH, request.url);
          const r = await fetch(u.toString());
          if (r.ok) tour = await r.json();
        } catch {
          /* */
        }
      }
      if (tour) {
        out.tour = {
          schema: tour.schema,
          at: tour.at,
          summary: tour.summary || null,
          primary: tour.tours?.rubikCubeCover
            ? {
                method: tour.tours.rubikCubeCover.method,
                order: tour.summary?.visitOrder,
                orderStr: tour.summary?.visitOrderStr,
                directHopSumC: tour.tours.rubikCubeCover.directHopCost,
                mstLowerBound: tour.tours.rubikCubeCover.mstLowerBoundOnReps,
                cubesCovered: tour.tours.rubikCubeCover.cubesCovered,
                hops: tour.summary?.hops || tour.tours.rubikCubeCover.hops,
              }
            : null,
          broader: tour.summary?.broader || null,
          doctrine:
            tour.summary?.doctrine ||
            "Pure C[88×88] — same as DOJO; no SO/phon tilde_c",
          urls: tour.urls,
        };
      } else {
        out.tour = {
          error: "rubik-all-language-path.json not deployed",
          url: "/data/" + TOUR_PATH,
        };
      }
    }
    out.urls = {
      bind: "/data/declaration/letter-grid-rubik.json",
      allLanguagePath: "/data/declaration/rubik-all-language-path.json",
      allLanguagePathDoc: "/docs/RUBIK-ALL-LANGUAGE-PATH.md",
      costMatrix: rubik.patterns?.worldPath?.costMatrix,
      jaxBank: rubik.calibration?.jaxFeatureBank,
      probeSet: rubik.calibration?.probeSet,
    };
    return out;
  }

  if (name === "kbatch_lettergrid_state") {
    return {
      tool: name,
      timer: "01:10",
      bps: 0,
      ntpm: 0,
      grid: "12×12",
      glyphs: { done: 0, total },
      layer: { current: 1, total: layers },
      nextGlyph: firstCh || "I",
      masterIndex: 0,
      peakBps: 0,
      mode: "lobby",
      session: "static",
      ver: pack.ver,
      note: "Static lobby snapshot — live state requires browser letterGrid session",
      urls: { play: LG_PLAY, pipe: LG_PIPE },
    };
  }

  if (name === "kbatch_lettergrid_next_glyph") {
    return {
      tool: name,
      nextGlyph: firstCh || "I",
      meta: Array.isArray(first)
        ? { gi: first[0], ch: first[1], lineId: first[2], kind: first[3] }
        : first,
      masterIndex: 0,
      session: "static",
    };
  }

  if (name === "kbatch_lettergrid_glyphs") {
    const range = args.range || "all";
    const format = args.format || "array";
    const slice = lgFilterGlyphs(glyphs, range);
    const data = lgFormat(slice, format, !!args.includeMeta);
    return {
      tool: name,
      range,
      format,
      count: Array.isArray(data) ? data.length : String(data).length,
      total,
      glyphSchema: pack.glyphSchema,
      data,
    };
  }

  if (name === "kbatch_lettergrid_layer") {
    const layer = Number(args.layer);
    if (!layer || layer < 1) return { error: "layer required", tool: name };
    if ((args.action || "get") !== "get") return lgNeedLive(name);
    const start = (layer - 1) * need;
    const end = Math.min(total - 1, start + need - 1);
    return {
      tool: name,
      action: "get",
      layer,
      layers,
      range: [start, end],
      cells: need,
      session: "static",
    };
  }

  if (name === "kbatch_lettergrid_step" || name === "kbatch_lettergrid_play_round") {
    if (name === "kbatch_lettergrid_play_round" && (args.dryRun === true || args.dryRun === "true")) {
      return {
        tool: name,
        dryRun: true,
        wouldStart: {
          gridSize: args.gridSize || "12x12",
          speedMs: args.speedMs || 60,
          roundS: 70,
          scoreShape: {
            peakBps: "number",
            peakNtpm: "number",
            hits: "number",
            misses: "number",
            growthStair: "S0–S7",
          },
        },
        live: false,
        browser: `await kbatchDict.mcp('kbatch_lettergrid_play_round', ${JSON.stringify({
          gridSize: args.gridSize || "12x12",
          speedMs: args.speedMs || 60,
        })})`,
      };
    }
    return lgNeedLive(name);
  }

  if (name === "kbatch_lettergrid_colossus") {
    const depth = args.depth || "full";
    let paleoDoc =
      (await fetchJson(request, "declaration/paleography.json")) || null;
    if (!paleoDoc) {
      try {
        const url = new URL("/data/declaration/paleography.json", request.url);
        const r = await fetch(url.toString());
        if (r.ok) paleoDoc = await r.json();
      } catch {
        /* */
      }
    }
    const capsule =
      (paleoDoc && paleoDoc.capsule) ||
      (paleoDoc && paleoDoc.compact) ||
      (paleoDoc && paleoDoc.physical
        ? {
            scribe: paleoDoc.physical.scribe,
            ink: paleoDoc.physical.ink,
            support: paleoDoc.physical.support,
            substrate: "parchment",
            dimensions: paleoDoc.physical.dimensions,
            source: "NARA engrossed copy",
            notes: paleoDoc.restorationNotes || [],
            signatureColumns: paleoDoc.layout && paleoDoc.layout.signatures,
            rights: "public-domain transcript",
          }
        : lgPaleographyFallback());
    const out = {
      tool: name,
      document: "declaration-of-independence",
      schema: "kbatch-letter-grid-colossus-v1",
      version: pack.ver || "declaration-letter-grid-v8-pipe",
      masterGlyphs: total,
      layers,
      state: {
        timer: "01:10",
        bps: 0,
        ntpm: 0,
        grid: "12×12",
        glyphs: { done: 0, total },
        layer: { current: 1, total: layers },
        nextGlyph: firstCh || "I",
        masterIndex: 0,
        peakBps: 0,
        mode: "lobby",
      },
      scoreHistory: [],
      paleography: capsule,
      paleographyDoc: paleoDoc || null,
      paleographyUrl: "/data/declaration/paleography.json",
      session: "static",
      urls: {
        play: LG_PLAY,
        pipe: LG_PIPE,
        master: "/data/declaration/master-glyphs.json",
        paleography: "/data/declaration/paleography.json",
      },
    };
    if (depth !== "light") {
      out.glyphs = glyphs.map((g) => (Array.isArray(g) ? g[1] : g.ch));
      out.layerMap = lgLineMap(glyphs);
      out.gridLayerMap = {};
      for (let L = 1; L <= layers; L++) {
        const start = (L - 1) * need;
        out.gridLayerMap[String(L)] = {
          layer: L,
          range: [start, Math.min(total - 1, start + need - 1)],
        };
      }
      out.crossref = lgCrossref(glyphs);
    }
    if (depth === "training") {
      out.training = await toolLettergrid(request, "kbatch_lettergrid_export_training", {
        format: "jsonl",
      });
    }
    return out;
  }

  if (name === "kbatch_lettergrid_finale") {
    const includePath = args.includePath !== false;
    const N = Number(args.N) || 12;
    const path = includePath ? lgWanderingPath(N) : undefined;
    return {
      tool: name,
      schema: "kbatch-letter-grid-finale-v1",
      ready: false,
      N,
      pathLen: path ? path.length : N * N,
      path,
      complete: false,
      session: "static",
      note:
        "Static spiral path only. Live peak BPS / completion requires letter-grid session after all layers clear.",
      urls: { play: LG_PLAY, pipe: LG_PIPE },
    };
  }

  if (name === "kbatch_lettergrid_export_training") {
    const format = args.format || "jsonl";
    const include = args.include;
    const seq = glyphs.map((g) => (Array.isArray(g) ? g[1] : g.ch));
    const boundaries = [];
    for (let L = 1; L <= layers; L++) {
      boundaries.push({
        layer: L,
        start: (L - 1) * need,
        end: Math.min(total, L * need),
      });
    }
    if (format === "jsonl") {
      return {
        format: "jsonl",
        tool: name,
        lines: glyphs.map((g) => JSON.stringify(lgTrainingRecord(g, need, include))),
        meta: {
          schema: "kbatch-letter-grid-training-v1",
          masterGlyphs: total,
          layers,
          include:
            include ||
            ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart", "layer"],
        },
      };
    }
    if (format === "jax") {
      const kindIds = {
        title: 0,
        subtitle: 1,
        body: 2,
        grievance: 3,
        closing: 4,
        signature: 5,
      };
      const vectors = glyphs.map((g) => {
        const gi = Array.isArray(g) ? g[0] : g.gi;
        const ch = Array.isArray(g) ? g[1] : g.ch;
        const kind = Array.isArray(g) ? g[3] : g.kind;
        return [
          gi,
          String(ch).charCodeAt(0),
          Math.floor(gi / need) + 1,
          Array.isArray(g) ? g[4] || 0 : 0,
          Array.isArray(g) ? g[5] || 0 : 0,
          kindIds[kind] != null ? kindIds[kind] : 2,
        ];
      });
      return {
        format: "jax",
        tool: name,
        columns: ["gi", "charCode", "layer", "wordStart", "sentenceStart", "kindId"],
        shape: [vectors.length, 6],
        vectors,
      };
    }
    return {
      schema: "kbatch-letter-grid-training-v1",
      tool: name,
      document: "declaration-of-independence",
      N,
      masterGlyphs: total,
      layers,
      sequence: seq,
      layerBoundaries: boundaries,
      documentLineMap: lgLineMap(glyphs),
      bps: {
        factor: +(Math.log(N * N - 1) / Math.LN2).toFixed(4),
        note: "BPS = factor * NTPM/60",
      },
    };
  }

  return { error: "unknown lettergrid tool", tool: name };
}

/* ── Cage litmus (static quiz + verify + grade) ── */
const CAGE_PAGE = "https://kbatch.ugrad.ai/labs/declaration-digital-edition/cage-litmus";

function cageNorm(s) {
  s = String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z_]/g, "");
  if (s === "STONETRAP" || s === "STONEONLY" || s === "TRAP") return "STONE_TRAP";
  if (s === "TRUE" || s === "HISTORICAL" || s === "REAL") return "FACT";
  if (s === "FALSE" || s === "MOVIE" || s === "FICTIONAL") return "FICTION";
  return s;
}

function cageVerify(quiz, responses, strict) {
  const byId = {};
  (quiz.items || []).forEach((it) => {
    byId[it.id] = it;
  });
  const submitted = responses || [];
  if (strict !== false) {
    const missing = (quiz.items || [])
      .map((it) => it.id)
      .filter((id) => !submitted.some((r) => r && r.id === id));
    if (missing.length) {
      return {
        schema: "kbatch-cage-litmus-verify-v1",
        error: "strict_incomplete",
        missing,
        submitted: submitted.length,
        total: (quiz.items || []).length,
      };
    }
  }
  const results = [];
  let correct = 0;
  let stoneTrapCaught = 0;
  let fictionCaught = 0;
  let pairHits = 0;
  let pairNeed = 0;
  submitted.forEach((resp, i) => {
    const item =
      (resp.id && byId[resp.id]) ||
      (quiz.items || []).find((it) => it.claim === resp.claim) ||
      quiz.items[i];
    if (!item) {
      results.push({ ok: false, error: "unknown item", resp });
      return;
    }
    const got = cageNorm(resp.answer || resp.label);
    const exp = cageNorm(item.answer);
    const ok = got === exp;
    if (ok) correct++;
    if (item.pairRequired) {
      pairNeed++;
      if (ok) pairHits++;
    }
    if (ok && exp === "STONE_TRAP") stoneTrapCaught++;
    if (ok && exp === "FICTION") fictionCaught++;
    results.push({
      id: item.id,
      ok,
      expected: exp,
      got,
      claim: item.claim,
      why: item.why,
      lane: item.lane,
      pairRequired: !!item.pairRequired,
    });
  });
  const total = (quiz.items || []).length;
  const answered = results.filter((r) => r.expected).length;
  const denom = strict !== false ? total || 1 : answered || total || 1;
  const score = correct / denom;
  const grades = quiz.grades || {};
  let grade = "fail";
  if (score >= (grades.cage?.min ?? 0.85)) grade = "cage";
  else if (score >= (grades.dojo?.min ?? 0.5)) grade = "dojo";
  const traps = (quiz.items || []).filter((it) => it.answer === "STONE_TRAP").length;
  let hardRuleTriggered = false;
  if (traps && stoneTrapCaught === 0 && score >= 0.5) {
    grade = "fail";
    hardRuleTriggered = true;
  }
  return {
    schema: "kbatch-cage-litmus-verify-v1",
    tool: "kbatch_cage_litmus_verify",
    submitted: answered,
    total: denom,
    correct,
    score: +score.toFixed(4),
    grade,
    gradeLabel: grades[grade]?.label || grade,
    gradeNote: grades[grade]?.note || "",
    stoneTrapCaught,
    fictionCaught,
    pairHits,
    pairNeed,
    hardRuleTriggered,
    perItem: results,
    note: hardRuleTriggered
      ? "zero STONE_TRAP catches → fail even though score ≥ 0.5"
      : grade === "cage"
        ? "Cage-grade · material pairing + all fiction & stone-traps caught"
        : grades[grade]?.note || "",
    doctrine: quiz.doctrine || [],
    page: CAGE_PAGE,
  };
}

function cageProfileAnswers(quiz, kind) {
  const items = quiz.items || [];
  if (kind === "oracle") return items.map((it) => ({ id: it.id, answer: it.answer }));
  if (kind === "stoneOnly") {
    return items.map((it) => {
      if (it.answer === "STONE_TRAP" || it.answer === "FICTION")
        return { id: it.id, answer: "FACT" };
      return { id: it.id, answer: it.answer };
    });
  }
  if (kind === "movieBeliever") {
    return items.map((it) => {
      if (it.answer === "STONE_TRAP") return { id: it.id, answer: "FACT" };
      return { id: it.id, answer: it.answer };
    });
  }
  return [];
}

async function toolCageLitmus(request, name, args) {
  let quiz =
    (await fetchJson(request, "declaration/cage-litmus-quiz.json")) || null;
  if (!quiz) {
    try {
      const url = new URL("/data/declaration/cage-litmus-quiz.json", request.url);
      const r = await fetch(url.toString());
      if (r.ok) quiz = await r.json();
    } catch {
      /* */
    }
  }
  if (!quiz || !quiz.items) {
    return {
      error: "cage-litmus-quiz.json not deployed",
      tool: name,
      page: CAGE_PAGE,
    };
  }

  if (name === "kbatch_cage_litmus_quiz") {
    const include = args.include || ["items", "labels", "grades"];
    const wantAnswers = args.answers !== false;
    let items = quiz.items || [];
    if (Array.isArray(args.ids) && args.ids.length) {
      const set = new Set(args.ids.map(String));
      items = items.filter((it) => set.has(it.id));
    }
    if (!wantAnswers) {
      items = items.map(({ answer, why, ...rest }) => rest);
    }
    const out = {
      schema: quiz.schema || "kbatch-declaration-cage-litmus-v1",
      tool: name,
      title: quiz.title,
      count: items.length,
      total: (quiz.items || []).length,
      blinded: !wantAnswers,
    };
    if (include.includes("labels")) out.labels = quiz.labels;
    if (include.includes("grades")) out.grades = quiz.grades;
    if (include.includes("doctrine")) out.doctrine = quiz.doctrine;
    if (include.includes("items")) out.items = items;
    if (include.includes("agentPrompt")) out.agentPrompt = quiz.agentPrompt;
    out.urls = {
      quiz: "/data/declaration/cage-litmus-quiz.json",
      page: CAGE_PAGE,
      trial: "/data/declaration/cage-litmus-grok-trial.json",
    };
    return out;
  }

  if (name === "kbatch_cage_litmus_verify") {
    if (!Array.isArray(args.answers)) {
      return { error: "answers array required", tool: name };
    }
    return cageVerify(quiz, args.answers, args.strict !== false);
  }

  if (name === "kbatch_cage_litmus_grade") {
    const profile = args.profile || "bands";
    const out = {
      schema: "kbatch-cage-litmus-grade-v1",
      tool: name,
      grades: quiz.grades,
      hardRule:
        "If stoneTrapCaught === 0 and score ≥ 0.5 → grade fail (even if score would be dojo)",
      labels: quiz.labels,
    };
    if (args.includeDoctrine !== false) out.doctrine = quiz.doctrine;

    const oracle = cageVerify(quiz, cageProfileAnswers(quiz, "oracle"), true);
    const stoneOnly = cageVerify(quiz, cageProfileAnswers(quiz, "stoneOnly"), true);
    const movieBeliever = cageVerify(
      quiz,
      cageProfileAnswers(quiz, "movieBeliever"),
      true
    );
    let grokLive = { score: 1.0, grade: "cage", when: "2026-07-24" };
    const trial =
      (await fetchJson(request, "declaration/cage-litmus-grok-trial.json")) || null;
    if (trial?.trial) {
      grokLive = {
        score: trial.trial.score,
        grade: trial.trial.grade,
        when: String(trial.trial.at || "").slice(0, 10),
        correct: trial.trial.correct,
        stoneTrapCaught: trial.trial.stoneTrapCaught,
        fictionCaught: trial.trial.fictionCaught,
      };
    }
    const calibration = {
      oracle: { score: oracle.score, grade: oracle.grade, correct: oracle.correct },
      stoneOnly: {
        score: stoneOnly.score,
        grade: stoneOnly.grade,
        hardRuleTriggered: stoneOnly.hardRuleTriggered,
        stoneTrapCaught: stoneOnly.stoneTrapCaught,
      },
      movieBeliever: {
        score: movieBeliever.score,
        grade: movieBeliever.grade,
        hardRuleTriggered: movieBeliever.hardRuleTriggered,
        stoneTrapCaught: movieBeliever.stoneTrapCaught,
        fictionCaught: movieBeliever.fictionCaught,
      },
      grokLive,
    };
    if (profile === "all") out.calibration = calibration;
    else if (profile !== "bands" && calibration[profile]) {
      out.profile = profile;
      out.result = calibration[profile];
    }
    out.urls = {
      quiz: "/data/declaration/cage-litmus-quiz.json",
      page: CAGE_PAGE,
    };
    return out;
  }

  return { error: "unknown cage litmus tool", tool: name };
}

async function dispatch(request, name, args) {
  switch (name) {
    case "kbatch_chart_lookup":
      return toolChartLookup(request, args || {});
    case "kbatch_list_capsules":
      return toolListCapsules(request, args || {});
    case "kbatch_open_capsule":
      return toolOpenCapsule(request, args || {});
    case "kbatch_word_index":
      return toolWordIndex(request);
    case "kbatch_school_skills":
      return toolSchoolSkills(request, args || {});
    case "kbatch_analyze_lite":
      return toolAnalyzeLite(request, args || {});
    case "kbatch_world_axes":
      return toolWorldAxes(request);
    case "kbatch_collaborators":
      return toolCollaborators(request, args || {});
    case "kbatch_sense_lookup":
      return toolSenseLookup(request, args || {});
    case "kbatch_music_rights":
      return toolMusicRights(request);
    case "kbatch_museum_resource":
      return toolMuseumResource(request);
    case "kbatch_world_path":
      return toolWorldPath(request, args || {});
    case "kbatch_r3_outreach":
      return toolR3Outreach(request);
    case "kbatch_freya_convert":
      return toolFreyaConvert(args || {});
    case "kbatch_freya_units":
      return {
        tool: "kbatch_freya_units",
        units: FREYA_UNITS.filter((u) => !args?.cat || u.cat === args.cat).map((u) => ({
          sym: u.sym,
          name: u.name,
          cat: u.cat,
        })),
        freya: "https://freya.qbitos.ai/",
      };
    case "kbatch_math":
      return toolMath(args || {});
    case "kbatch_calibrate_check":
      return toolCalibrateCheck(args || {});
    case "kbatch_recalibrate":
      return toolRecalibrate(args || {});
    case "kbatch_llm_train_pack": {
      const pack = await fetchJson(request, "llm/train-pack.json");
      return pack || toolRecalibrate({ reason: "train-pack-fallback" });
    }
    case "kbatch_deity_lookup": {
      const doc = await fetchJson(request, "mythology/deities-index.json");
      const q = String(args?.q || args?.name || "")
        .trim()
        .toLowerCase();
      const list = Array.isArray(doc?.deities) ? doc.deities : [];
      const limit = Math.min(20, Math.max(1, Number(args?.limit) || 5));
      if (!q) {
        return { tool: "kbatch_deity_lookup", count: list.length, forbid: ["Turner/OUP"] };
      }
      const hits = list
        .filter((d) =>
          `${d.name} ${d.spelling} ${d.culture || ""} ${d.description || ""}`
            .toLowerCase()
            .includes(q)
        )
        .slice(0, limit);
      return {
        tool: "kbatch_deity_lookup",
        q,
        hits,
        doctrine: "Wikidata CC0 only",
      };
    }
    case "kbatch_lettergrid_ping":
    case "kbatch_lettergrid_rubik":
    case "kbatch_lettergrid_state":
    case "kbatch_lettergrid_glyphs":
    case "kbatch_lettergrid_step":
    case "kbatch_lettergrid_play_round":
    case "kbatch_lettergrid_layer":
    case "kbatch_lettergrid_colossus":
    case "kbatch_lettergrid_next_glyph":
    case "kbatch_lettergrid_export_training":
    case "kbatch_lettergrid_finale":
      return toolLettergrid(request, name, args || {});
    case "kbatch_phon_pattern": {
      const text = String(args?.text || "");
      const lang = args?.lang || "en";
      if (args?.compare) {
        const dist = phonDistance(text, String(args.compare), {
          lang,
          n: args.n || 2,
        });
        const out = {
          tool: "kbatch_phon_pattern",
          mode: "compare",
          ...dist,
          purity: "jax.x unchanged — layout rank uses /data/calibration/jax-feature-bank.json",
        };
        if (args.blend && typeof args.blend === "object") {
          const b = args.blend;
          out.cTilde = blendTransferCost(Number(b.c) || 0, Number(b.dSO ?? dist.dCV2) || 0, Number(b.dPHON ?? dist.dPHON) || 0, {
            muSO: b.muSO,
            muPhon: b.muPhon,
            muArt: b.muArt ?? 0.12,
            dArt: Number(b.dArt ?? dist.dArt) || 0,
            cap: b.cap,
          });
        }
        return out;
      }
      const phon = analyzePhonPattern(text, {
        lang,
        level: args?.level || "caption",
      });
      return {
        tool: "kbatch_phon_pattern",
        ...phon,
        urls: {
          phonProbes: "/data/calibration/phon-probe-set.json",
          articulatoryBank: "/data/calibration/articulatory-bank.json",
          jaxBank: "/data/calibration/jax-feature-bank.json",
          costMatrix: "/data/world-path/cost-matrix.json",
          docs: "/docs/PHONETIC-PATTERN-ANALYSIS.md",
        },
      };
    }
    case "kbatch_cage_litmus_quiz":
    case "kbatch_cage_litmus_verify":
    case "kbatch_cage_litmus_grade":
      return toolCageLitmus(request, name, args || {});
    case "kbatch_book_stub": {
      const idx = await fetchJson(request, "living-books/gutenberg-stubs/index.json");
      const catalogTotal = idx?.count || 0;
      const q = String(args?.q || "")
        .trim()
        .toLowerCase();
      const gid = args?.gutenbergId != null ? Number(args.gutenbergId) : null;
      const limit = Math.min(40, Math.max(1, Number(args?.limit) || 8));
      let hits = [];
      if (gid != null && Number.isFinite(gid)) {
        const shardSize = idx?.shardSize || 5000;
        const start = Math.floor(gid / shardSize) * shardSize;
        const end = start + shardSize - 1;
        const file = `living-books/gutenberg-stubs/shard-${String(start).padStart(5, "0")}-${String(end).padStart(5, "0")}.json`;
        const shard = await fetchJson(request, file);
        hits = (shard?.stubs || []).filter((s) => Number(s.gutenbergId) === gid);
      } else if (q) {
        const resolved = await fetchJson(
          request,
          "living-books/gutenberg-stubs/resolved-catalogue.json"
        );
        const curated = await fetchJson(request, "living-books/entries.json");
        const pool = [
          ...((resolved?.stubs || [])),
          ...((Array.isArray(curated) ? curated : curated?.entries || []).map((e) => ({
            id: e.id,
            title: e.title,
            author: e.author,
            gutenbergId: e.gutenbergId,
            links: e.links,
            status: "resolved",
          }))),
        ];
        // first two shards for broader open catalog search
        for (const f of [
          "living-books/gutenberg-stubs/shard-00000-04999.json",
          "living-books/gutenberg-stubs/shard-05000-09999.json",
        ]) {
          const sh = await fetchJson(request, f);
          if (sh?.stubs) pool.push(...sh.stubs);
        }
        const seen = new Set();
        for (const e of pool) {
          const hay = `${e.title || ""} ${e.author || ""}`.toLowerCase();
          if (!hay.includes(q)) continue;
          const key = e.gutenbergId || e.id;
          if (seen.has(key)) continue;
          seen.add(key);
          hits.push(e);
          if (hits.length >= limit) break;
        }
      } else {
        const resolved = await fetchJson(
          request,
          "living-books/gutenberg-stubs/resolved-catalogue.json"
        );
        hits = (resolved?.stubs || []).slice(0, limit);
      }
      return {
        tool: "kbatch_book_stub",
        hitCount: Math.min(limit, hits.length),
        catalogueLive: catalogTotal || hits.length,
        shards: idx?.shards?.length ?? null,
        hits: hits.slice(0, limit).map((e) => ({
          id: e.id,
          title: e.title,
          author: e.author,
          gutenbergId: e.gutenbergId,
          status: e.status || "stub",
          links: e.links,
        })),
        note: catalogTotal
          ? `PG catalog stubs ${catalogTotal} · text on demand`
          : "curated only",
      };
    }
    case "tools/list":
    case "list_tools":
      return { tools: TOOLS };
    default:
      return {
        error: `unknown tool: ${name}`,
        tools: TOOLS.map((t) => t.name),
      };
  }
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method === "GET") {
    return json({
      schema: "kbatch-http-mcp-v1",
      name: "kbatch",
      transport: "http",
      endpoint: "/api/mcp",
      homepage: "https://kbatch.ugrad.ai/",
      forAi: "https://kbatch.ugrad.ai/for-ai.html",
      browserMcp: "window.kbatchDict.mcp",
      tools: TOOLS,
      usage: {
        post: {
          tool: "kbatch_chart_lookup",
          args: { query: "too sweet", limit: 5 },
        },
        jsonRpc: {
          method: "tools/call",
          params: { name: "kbatch_word_index", arguments: {} },
        },
      },
    });
  }

  if (request.method !== "POST") {
    return json({ error: "GET or POST only" }, 405);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  // JSON-RPC-ish
  if (body.method === "tools/list" || body.method === "list_tools") {
    return json({ tools: TOOLS });
  }
  if (body.method === "tools/call" || body.method === "call") {
    const name = body.params?.name || body.params?.tool;
    const args = body.params?.arguments || body.params?.args || {};
    const result = await dispatch(request, name, args);
    return json({ result });
  }

  const name = body.tool || body.name || body.method;
  const args = body.args || body.arguments || body.params || {};
  if (!name) {
    return json({ error: "tool name required", tools: TOOLS.map((t) => t.name) }, 400);
  }
  const result = await dispatch(request, name, args);
  return json(result);
}
