/**
 * Declaration Letter-Grid MCP tools
 * Shapes: kbatch_lettergrid_* (Grok / Dojo / Colossus pipe)
 *
 * Live path: window.letterGrid / __letterGridApi (letter-grid page or pipe harness)
 * Static path: /data/declaration/master-glyphs.json (no session)
 */
import { SCHEMA_VERSION } from "./schema.js";

export const LETTERGRID_MCP_TOOLS = [
  {
    name: "kbatch_lettergrid_ping",
    description:
      "Lightweight health check: engine version, master glyph count (6235), layer counts, tool list, static URLs. No board session required.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_lettergrid_state",
    description:
      "Return the full current state of the Declaration Letter-Grid (timer, BPS, NTPM, layer, next glyph, progress).",
    inputSchema: {
      type: "object",
      properties: {
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["glyphs", "layers", "score", "crossref", "session"],
          },
          description: "Optional extra slices to include",
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_step",
    description:
      "Advance one glyph (or play a short burst). Returns new state + whether the step was correct.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["next", "play", "reset", "skip-layer"],
          default: "next",
        },
        count: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 1,
          description: "How many glyphs to advance when action=play",
        },
        speedMs: {
          type: "integer",
          enum: [120, 60, 30, 12],
          description: "Only used when action=play",
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_play_round",
    description:
      "Start a 70-second WebGrid scoring round. Returns the final score report when the round ends (or immediately if dryRun=true).",
    inputSchema: {
      type: "object",
      properties: {
        gridSize: {
          type: "string",
          enum: ["8x8", "12x12", "16x16"],
          default: "12x12",
        },
        speedMs: {
          type: "integer",
          enum: [120, 60, 30, 12],
          default: 60,
        },
        dryRun: {
          type: "boolean",
          default: false,
          description: "If true, return the expected structure without starting the timer",
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_glyphs",
    description:
      "Return master glyph list or a slice. Primary data source for Colossus and training pipes.",
    inputSchema: {
      type: "object",
      properties: {
        range: {
          type: "string",
          description: "e.g. '0-99', 'L01', 'title', 'body', 'all'",
        },
        format: {
          type: "string",
          enum: ["array", "string", "atoms"],
          default: "array",
        },
        includeMeta: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "kbatch_lettergrid_layer",
    description: "Get or jump to a specific N×N grid layer (1–44 @ 12×12).",
    inputSchema: {
      type: "object",
      properties: {
        layer: { type: "integer", minimum: 1, maximum: 64 },
        action: {
          type: "string",
          enum: ["get", "jump", "clear"],
          default: "get",
        },
      },
      required: ["layer"],
    },
  },
  {
    name: "kbatch_lettergrid_colossus",
    description:
      "Full DOJO-ready snapshot of the Letter-Grid: current state + master glyphs + layer map + score history + cross-ref trails. Designed for kbatch_colossus composition.",
    inputSchema: {
      type: "object",
      properties: {
        depth: {
          type: "string",
          enum: ["light", "full", "training"],
          default: "full",
        },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["glyphs", "layers", "scores", "crossref", "session", "paleography"],
          },
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_next_glyph",
    description: "Simple one-shot: return the next expected glyph and its metadata.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_lettergrid_export_training",
    description:
      "Emit a clean training pack. jsonl = one record per glyph (gi, ch, lineId, kind, layer, …).",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["json", "jsonl", "jax"],
          default: "jsonl",
        },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart", "layer"],
          },
          description: "Fields to include in each jsonl/atom record",
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_finale",
    description:
      "After all grid layers are cleared, return the finale wandering path, peak BPS, and completion report. Static: returns deterministic spiral path for N.",
    inputSchema: {
      type: "object",
      properties: {
        includePath: { type: "boolean", default: true },
        includeScores: { type: "boolean", default: true },
        N: {
          type: "integer",
          enum: [8, 12, 16],
          default: 12,
          description: "Board size for static path generation",
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_rubik",
    description:
      "Shadow Rubik bind for Letter-Grid: 13 origin pathways, 6 modality faces, default pie-germanic-en Focus, calibration bank URLs (JAX / cost matrix / SO probes). Static; no live board required.",
    inputSchema: {
      type: "object",
      properties: {
        pathId: {
          type: "string",
          description: "Optional origin pathway id (default declaration pie-germanic-en)",
        },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["pathways", "faces", "calibration", "patterns", "compose"],
          },
        },
      },
    },
  },
];

const MASTER_URL = "/data/declaration/master-glyphs.json";
const PALEO_URL = "/data/declaration/paleography.json";
const RUBIK_URL = "/data/declaration/letter-grid-rubik.json";
const PLAY_URL = "/labs/declaration-digital-edition/letter-grid.html?v=pipe8";
const PIPE_URL = "/labs/declaration-digital-edition/letter-grid-pipe.html";

function liveApi() {
  if (typeof window === "undefined") return null;
  return window.letterGrid || window.__letterGridApi || window.__mgLetterGridApi || null;
}

let _masterCache = null;
let _paleoCache = null;
let _rubikCache = null;

export async function loadMasterGlyphs(fetchImpl) {
  if (_masterCache) return _masterCache;
  const f = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (!f) throw new Error("no fetch for master-glyphs");
  const r = await f(MASTER_URL, { cache: "force-cache" });
  if (!r.ok) throw new Error("master-glyphs HTTP " + r.status);
  _masterCache = await r.json();
  return _masterCache;
}

export async function loadLetterGridRubik(fetchImpl) {
  if (_rubikCache) return _rubikCache;
  const f = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (!f) throw new Error("no fetch for letter-grid-rubik");
  const r = await f(RUBIK_URL, { cache: "force-cache" });
  if (!r.ok) throw new Error("letter-grid-rubik HTTP " + r.status);
  _rubikCache = await r.json();
  return _rubikCache;
}

/** NARA-aware paleography capsule (static file preferred) */
export async function loadPaleography(fetchImpl) {
  if (_paleoCache) return _paleoCache;
  const f = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (f) {
    try {
      const r = await f(PALEO_URL, { cache: "force-cache" });
      if (r.ok) {
        _paleoCache = await r.json();
        return _paleoCache;
      }
    } catch {
      /* fall through */
    }
  }
  _paleoCache = {
    schema: "kbatch-declaration-paleography-v1",
    docId: "declaration-of-independence",
    capsule: paleographyFallback(),
  };
  return _paleoCache;
}

/** Deterministic spiral path (matches engine wanderingPathIndices) */
function wanderingPathIndices(N) {
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

function trainingRecord(g, need, include) {
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

function parseGridSize(gs) {
  const m = String(gs || "12x12").toLowerCase().match(/(\d+)\s*[x×]\s*(\d+)/);
  if (!m) return 12;
  return Number(m[1]) || 12;
}

function staticState(master, N = 12) {
  const total = master.total || (master.glyphs && master.glyphs.length) || 0;
  const layers = Math.ceil(total / (N * N)) || 1;
  const first = master.glyphs && master.glyphs[0];
  const ch = Array.isArray(first) ? first[1] : first && first.ch;
  return {
    tool: "kbatch_lettergrid_state",
    ver: master.ver || "declaration-letter-grid-v8-pipe",
    timer: "01:10",
    bps: 0,
    ntpm: 0,
    grid: N + "×" + N,
    N,
    glyphs: { done: 0, total },
    layer: { current: 1, total: layers },
    nextGlyph: ch || "I",
    next: first
      ? {
          mode: "codex",
          gi: Array.isArray(first) ? first[0] : 0,
          ch,
          lineId: Array.isArray(first) ? first[2] : "L01",
          kind: Array.isArray(first) ? first[3] : "title",
        }
      : null,
    masterIndex: 0,
    peakBps: 0,
    peakNtpm: 0,
    mode: "lobby",
    phase: "lobby",
    playing: false,
    session: "static",
    note: "No live letterGrid session — open " + PLAY_URL + " or " + PIPE_URL,
    urls: { play: PLAY_URL, pipe: PIPE_URL, master: MASTER_URL },
  };
}

function filterGlyphs(master, range) {
  const glyphs = master.glyphs || [];
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

function formatGlyphSlice(glyphs, format, includeMeta) {
  if (format === "string") {
    return glyphs.map((g) => (Array.isArray(g) ? g[1] : g.ch)).join("");
  }
  if (format === "atoms") {
    return glyphs.map((g) => {
      if (Array.isArray(g)) {
        return {
          gi: g[0],
          ch: g[1],
          lineId: g[2],
          kind: g[3],
          wordStart: !!g[4],
          sentenceStart: !!g[5],
        };
      }
      return g;
    });
  }
  /* array of chars by default; includeMeta → tuples */
  if (includeMeta) return glyphs;
  return glyphs.map((g) => (Array.isArray(g) ? g[1] : g.ch));
}

function buildLineMap(master) {
  const map = {};
  for (const g of master.glyphs || []) {
    const gi = Array.isArray(g) ? g[0] : g.gi;
    const ch = Array.isArray(g) ? g[1] : g.ch;
    const lineId = Array.isArray(g) ? g[2] : g.lineId;
    const kind = Array.isArray(g) ? g[3] : g.kind;
    if (!map[lineId]) map[lineId] = { label: kind || "body", range: [gi, gi], count: 0 };
    map[lineId].range[1] = gi;
    map[lineId].count++;
    map[lineId]._chars = (map[lineId]._chars || 0) + 1;
  }
  return map;
}

function buildCrossref(master) {
  const xr = {};
  for (const g of master.glyphs || []) {
    const ch = (Array.isArray(g) ? g[1] : g.ch || "").toUpperCase();
    const lineId = Array.isArray(g) ? g[2] : g.lineId;
    if (!ch) continue;
    if (!xr[ch]) xr[ch] = {};
    xr[ch][lineId] = (xr[ch][lineId] || 0) + 1;
  }
  return xr;
}

function paleographyFallback() {
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

function paleography() {
  if (_paleoCache && _paleoCache.capsule) return _paleoCache.capsule;
  if (_paleoCache && _paleoCache.compact) return _paleoCache.compact;
  if (_paleoCache && _paleoCache.physical) {
    return {
      scribe: _paleoCache.physical.scribe || "Timothy Matlack",
      ink: _paleoCache.physical.ink || "iron-gall",
      support: _paleoCache.physical.support || "parchment",
      substrate: "parchment",
      dimensions: _paleoCache.physical.dimensions,
      source: "NARA engrossed copy",
      notes: _paleoCache.restorationNotes || [],
      signatureColumns: (_paleoCache.layout && _paleoCache.layout.signatures) || "",
      rights: "public-domain transcript",
    };
  }
  return paleographyFallback();
}

async function paleographyFull(fetchImpl) {
  const doc = await loadPaleography(fetchImpl);
  return {
    capsule: paleography(),
    doc: doc.schema ? doc : null,
    url: PALEO_URL,
  };
}

function needLive(tool) {
  return {
    error: "live_session_required",
    tool,
    message:
      "This action needs a live Letter-Grid session (browser DOJO / letter-grid page). Static master data is available via kbatch_lettergrid_glyphs / kbatch_lettergrid_colossus depth=light.",
    open: PLAY_URL,
    pipe: PIPE_URL,
    tip: "On letter-grid.html: letterGrid is registered; kbatchDict.mcp routes here automatically.",
  };
}

/**
 * Dispatch one letter-grid MCP tool.
 * @param {string} name
 * @param {object} args
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function lettergridMcpCall(name, args = {}, opts = {}) {
  const api = liveApi();
  const fetchImpl = opts.fetch;

  switch (name) {
    case "kbatch_lettergrid_ping": {
      const master = await loadMasterGlyphs(fetchImpl).catch(() => null);
      const total = master?.total || 6235;
      const layersAt = master?.layersAt || {
        "8": Math.ceil(total / 64),
        "12": Math.ceil(total / 144),
        "16": Math.ceil(total / 256),
      };
      const live = liveApi();
      return {
        schema: "kbatch-letter-grid-ping-v1",
        tool: name,
        ok: true,
        ver: (live && live.ver) || master?.ver || "declaration-letter-grid-v8-pipe",
        masterGlyphs: total,
        first: master?.first || "INCONGRE",
        layersAt,
        liveSession: !!live,
        tools: LETTERGRID_MCP_TOOLS.map((t) => t.name),
        toolCount: LETTERGRID_MCP_TOOLS.length,
        urls: {
          play: PLAY_URL,
          pipe: PIPE_URL,
          master: MASTER_URL,
          paleography: PALEO_URL,
          rubik: RUBIK_URL,
          rubikAllPath: "/data/declaration/rubik-all-language-path.json",
          mcp: "/api/mcp",
          costMatrix: "/data/world-path/cost-matrix.json",
          jaxBank: "/data/calibration/jax-feature-bank.json",
        },
        at: new Date().toISOString(),
      };
    }

    case "kbatch_lettergrid_rubik": {
      const pack = await loadLetterGridRubik(fetchImpl);
      const include = args.include || [
        "pathways",
        "faces",
        "calibration",
        "patterns",
        "compose",
        "tour",
      ];
      const pathId =
        args.pathId ||
        pack.letterGrid?.defaultFocus ||
        "pie-germanic-en";
      const focus =
        (pack.pathways || []).find((p) => p.pathId === pathId) ||
        (pack.pathways || []).find((p) => p.declarationDefault) ||
        null;
      const out = {
        schema: pack.schema || "kbatch-letter-grid-rubik-v1",
        tool: name,
        ver: pack.ver,
        docId: pack.docId,
        purpose: pack.purpose,
        letterGrid: pack.letterGrid,
        focus,
        pathId: focus?.pathId || pathId,
        allMap: pack.allMap,
        mcp: pack.mcp,
        engine: pack.engine,
      };
      if (include.includes("pathways")) out.pathways = pack.pathways;
      if (include.includes("faces")) out.cubeFaces = pack.cubeFaces;
      if (include.includes("calibration")) out.calibration = pack.calibration;
      if (include.includes("patterns")) out.patterns = pack.patterns;
      if (include.includes("compose")) out.compose = pack.compose;
      // All-13 Rubik mathematical tour (pure C, DOJO-true — no tilde_c)
      const TOUR_URL = "/data/declaration/rubik-all-language-path.json";
      if (include.includes("tour") || args.tour) {
        try {
          const base =
            typeof location !== "undefined" && location.origin
              ? location.origin
              : "https://kbatch.ugrad.ai";
          const tr = await (fetchImpl || fetch)(base + TOUR_URL, {
            cache: "default",
          });
          if (tr.ok) {
            const tour = await tr.json();
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
          }
        } catch {
          out.tour = { error: "tour pack load failed", url: TOUR_URL };
        }
      }
      out.urls = {
        bind: RUBIK_URL,
        doc: "/docs/SHADOW-RUBIK-LETTER-GRID.md",
        allLanguagePath: TOUR_URL,
        allLanguagePathDoc: "/docs/RUBIK-ALL-LANGUAGE-PATH.md",
        costMatrix: pack.patterns?.worldPath?.costMatrix,
        jaxBank: pack.calibration?.jaxFeatureBank,
        probeSet: pack.calibration?.probeSet,
      };
      return out;
    }

    case "kbatch_lettergrid_state": {
      if (api && typeof api.mcpState === "function") {
        return api.mcpState(args.include || []);
      }
      if (api && typeof api.getState === "function") {
        const s = api.getState();
        return {
          tool: name,
          timer: s.timer,
          bps: +Number(s.bps).toFixed(2),
          ntpm: s.ntpm,
          grid: s.N + "×" + s.N,
          glyphs: { done: s.masterPos, total: s.masterTotal },
          layer: { current: s.layer, total: s.layers },
          nextGlyph: s.next && s.next.ch,
          masterIndex: s.masterPos,
          peakBps: +Number(s.peakBps).toFixed(2),
          mode: s.phase === "lobby" ? "lobby" : s.dojoMode ? "dojo" : s.mode,
          phase: s.phase,
          ver: s.ver,
        };
      }
      const master = await loadMasterGlyphs(fetchImpl);
      return staticState(master, 12);
    }

    case "kbatch_lettergrid_next_glyph": {
      if (api && typeof api.getState === "function") {
        const s = api.getState();
        return {
          tool: name,
          nextGlyph: s.next && s.next.ch,
          meta: s.next,
          masterIndex: s.masterPos,
          layer: s.layer,
        };
      }
      const master = await loadMasterGlyphs(fetchImpl);
      const g = master.glyphs && master.glyphs[0];
      return {
        tool: name,
        nextGlyph: Array.isArray(g) ? g[1] : "I",
        meta: Array.isArray(g)
          ? { gi: g[0], ch: g[1], lineId: g[2], kind: g[3] }
          : null,
        masterIndex: 0,
        session: "static",
      };
    }

    case "kbatch_lettergrid_step": {
      if (!api) return needLive(name);
      const action = args.action || "next";
      if (action === "reset") {
        if (api.setDojoMode) api.setDojoMode(true);
        else if (api.startCodex) api.startCodex();
        return { tool: name, action: "reset", ok: true, state: api.mcpState ? api.mcpState() : api.getState() };
      }
      if (action === "skip-layer") {
        if (!api.skipLayer) return { error: "skipLayer not available", ver: api.ver };
        const r = api.skipLayer();
        return { tool: name, action: "skip-layer", ...r };
      }
      if (action === "play") {
        const count = Math.max(1, Math.min(50, Number(args.count) || 1));
        const speed = Number(args.speedMs) || 120;
        if (api.setHop) api.setHop(speed);
        if (api.setDojoMode) api.setDojoMode(true);
        const steps = [];
        for (let i = 0; i < count; i++) {
          steps.push(api.nextGlyph());
        }
        return {
          tool: name,
          action: "play",
          count: steps.length,
          ok: steps.every((s) => s && s.ok),
          last: steps[steps.length - 1],
          state: api.mcpState ? api.mcpState() : api.getState(),
        };
      }
      /* next */
      const one = api.nextGlyph();
      return { tool: name, action: "next", ...one };
    }

    case "kbatch_lettergrid_play_round": {
      const N = parseGridSize(args.gridSize || "12x12");
      const speed = Number(args.speedMs) || 60;
      if (args.dryRun) {
        return {
          tool: name,
          dryRun: true,
          wouldStart: {
            gridSize: N + "x" + N,
            speedMs: speed,
            roundS: 70,
            scoreShape: {
              peakBps: "number",
              peakNtpm: "number",
              hits: "number",
              misses: "number",
              hitRate: "percent",
              growthStair: "S0–S7",
            },
          },
          live: !!api,
          note: api
            ? "Call again with dryRun:false to run agentPlay"
            : "Open letter-grid for live round",
        };
      }
      if (!api || !api.playRound) return needLive(name);
      const rep = await api.playRound({ size: N, speed, timed: true });
      return { tool: name, dryRun: false, ...rep };
    }

    case "kbatch_lettergrid_glyphs": {
      let master;
      if (api && typeof api.masterGlyphs === "function") {
        master = api.masterGlyphs({ compact: true });
      } else {
        master = await loadMasterGlyphs(fetchImpl);
      }
      const range = args.range || "all";
      const format = args.format || "array";
      const includeMeta = !!args.includeMeta;
      const slice = filterGlyphs(master, range);
      const payload = formatGlyphSlice(slice, format, includeMeta);
      return {
        tool: name,
        range,
        format,
        count: Array.isArray(payload) ? payload.length : String(payload).length,
        total: master.total || (master.glyphs && master.glyphs.length),
        glyphSchema: master.glyphSchema || ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart"],
        data: payload,
      };
    }

    case "kbatch_lettergrid_layer": {
      const layer = Number(args.layer);
      const action = args.action || "get";
      if (!layer || layer < 1) {
        return { error: "layer required (1–44 @ 12×12)", tool: name };
      }
      if (action === "get") {
        if (api && api.gridLayerMap) {
          const map = api.gridLayerMap();
          const row = map[String(layer)];
          return {
            tool: name,
            action: "get",
            layer,
            ...row,
            state: api.mcpState ? api.mcpState() : api.getState(),
          };
        }
        const master = await loadMasterGlyphs(fetchImpl);
        const N = 12;
        const need = N * N;
        const total = Math.ceil((master.total || 0) / need) || 1;
        const start = (layer - 1) * need;
        const end = Math.min((master.total || 0) - 1, start + need - 1);
        return {
          tool: name,
          action: "get",
          layer,
          layers: total,
          range: [start, end],
          cells: need,
          session: "static",
        };
      }
      if (!api) return needLive(name);
      if (action === "jump") {
        return { tool: name, ...(api.jumpToLayer ? api.jumpToLayer(layer) : { error: "no jumpToLayer" }) };
      }
      if (action === "clear") {
        /* jump to layer start then skip (consume) to next — or jump past layer */
        if (api.jumpToLayer) api.jumpToLayer(layer);
        const r = api.skipLayer ? api.skipLayer() : api.jumpToLayer(layer + 1);
        return { tool: name, action: "clear", fromLayer: layer, ...r };
      }
      return { error: "unknown action", action };
    }

    case "kbatch_lettergrid_colossus": {
      const depth = args.depth || "full";
      const include = args.include || ["glyphs", "layers", "scores", "crossref", "session", "paleography"];
      const paleoPack = await paleographyFull(fetchImpl);
      if (api && typeof api.exportColossusDraft === "function") {
        const draft = api.exportColossusDraft({ depth, include });
        return {
          tool: name,
          ...draft,
          paleography: draft.paleography || paleoPack.capsule,
          paleographyDoc: paleoPack.doc,
          paleographyUrl: PALEO_URL,
        };
      }
      if (api && typeof api.exportColossus === "function" && depth !== "light") {
        const pack = api.exportColossus({
          includeGlyphs: depth === "full" || depth === "training",
          compact: true,
        });
        return {
          tool: name,
          document: "declaration-of-independence",
          version: pack.ver,
          masterGlyphs: pack.master && pack.master.total,
          layers: pack.layer && pack.layer.total,
          state: api.mcpState ? api.mcpState(["score"]) : pack.score,
          ...pack,
          paleography: paleoPack.capsule,
          paleographyDoc: paleoPack.doc,
          paleographyUrl: PALEO_URL,
        };
      }
      /* static / light */
      const master = await loadMasterGlyphs(fetchImpl);
      const N = 12;
      const total = master.total || 0;
      const layers = Math.ceil(total / (N * N)) || 1;
      const out = {
        tool: name,
        document: "declaration-of-independence",
        version: master.ver || "declaration-letter-grid-v8-pipe",
        masterGlyphs: total,
        layers,
        state: staticState(master, N),
        paleography: paleoPack.capsule,
        paleographyDoc: paleoPack.doc,
        paleographyUrl: PALEO_URL,
        session: "static",
        schema: "kbatch-letter-grid-colossus-v1",
      };
      if (depth !== "light" && include.includes("glyphs")) {
        out.glyphs = (master.glyphs || []).map((g) => (Array.isArray(g) ? g[1] : g.ch));
      }
      if (depth !== "light") {
        out.layerMap = buildLineMap(master);
        out.gridLayerMap = {};
        for (let L = 1; L <= layers; L++) {
          const start = (L - 1) * N * N;
          out.gridLayerMap[String(L)] = {
            layer: L,
            range: [start, Math.min(total - 1, start + N * N - 1)],
          };
        }
      }
      if (include.includes("crossref") && depth !== "light") {
        out.crossref = buildCrossref(master);
      }
      out.scoreHistory = [];
      if (depth === "training") {
        out.training = await lettergridMcpCall(
          "kbatch_lettergrid_export_training",
          { format: "jsonl" },
          opts
        );
      }
      return out;
    }

    case "kbatch_lettergrid_finale": {
      const includePath = args.includePath !== false;
      const includeScores = args.includeScores !== false;
      const N = Number(args.N) || 12;
      if (api && typeof api.exportFinale === "function") {
        return { tool: name, ...api.exportFinale({ includePath, includeScores }) };
      }
      if (api && typeof api.getState === "function") {
        const s = api.getState();
        const path =
          includePath && api.finalePath
            ? api.finalePath()
            : includePath
              ? wanderingPathIndices(s.N || N)
              : undefined;
        const ready =
          s.mode === "finale" ||
          (s.glyphs && s.glyphs.done >= (s.glyphs.total || 0)) ||
          s.phase === "end";
        return {
          tool: name,
          schema: "kbatch-letter-grid-finale-v1",
          ready: !!ready,
          N: s.N || N,
          pathLen: path ? path.length : undefined,
          path: includePath ? path : undefined,
          pathStep: s.pathStep,
          complete: s.mode === "finale" && s.finaleDone,
          peakBps: includeScores ? s.peakBps : undefined,
          peakNtpm: includeScores ? s.peakNtpm : undefined,
          score: includeScores ? s : undefined,
          session: "live",
          note: ready
            ? "Finale available or complete"
            : "Codex still in progress — path is the target spiral for N",
        };
      }
      /* static spiral (no live scores) */
      const path = includePath ? wanderingPathIndices(N) : undefined;
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
        open: PLAY_URL,
        pipe: PIPE_URL,
      };
    }

    case "kbatch_lettergrid_export_training": {
      if (api && typeof api.exportTraining === "function") {
        return api.exportTraining({
          format: args.format || "jsonl",
          include: args.include,
        });
      }
      const master = await loadMasterGlyphs(fetchImpl);
      const N = 12;
      const need = N * N;
      const total = master.total || 0;
      const layers = Math.ceil(total / need) || 1;
      const format = args.format || "jsonl";
      const include = args.include;
      const seq = (master.glyphs || []).map((g) => (Array.isArray(g) ? g[1] : g.ch));
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
          lines: (master.glyphs || []).map((g) =>
            JSON.stringify(trainingRecord(g, need, include))
          ),
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
        const vectors = (master.glyphs || []).map((g) => {
          const gi = Array.isArray(g) ? g[0] : g.gi;
          const ch = Array.isArray(g) ? g[1] : g.ch;
          const kind = Array.isArray(g) ? g[3] : g.kind;
          return [
            gi,
            String(ch).charCodeAt(0),
            Math.floor(gi / need) + 1,
            Array.isArray(g) ? g[4] || 0 : g.wordStart ? 1 : 0,
            Array.isArray(g) ? g[5] || 0 : g.sentenceStart ? 1 : 0,
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
        documentLineMap: buildLineMap(master),
        bps: {
          factor: +(Math.log(N * N - 1) / Math.LN2).toFixed(4),
          note: "BPS = factor * NTPM/60",
        },
      };
    }

    default:
      return { error: "unknown lettergrid tool: " + name };
  }
}

export function isLettergridTool(name) {
  return String(name || "").startsWith("kbatch_lettergrid_");
}
