/**
 * KBatch Colossus / DOJO data schema
 * OED · Wiki · Grokipedia–scale dictionary + live multi-level analysis
 *
 * Levels: letter → word → bigram → sentence → paragraph → caption → blob → document
 * Layouts: all geometric KEYBOARD_LAYOUTS (pattern placement on each)
 * Pipes: caption_in / caption_out · LLM · MCP · JAX feature vectors
 */

export const SCHEMA_VERSION = "kbatch-colossus-v1";

export const ANALYSIS_LEVELS = [
  { id: "letter", label: "Letter", unit: "grapheme" },
  { id: "word", label: "Word", unit: "token" },
  { id: "bigram", label: "Bigram", unit: "pair" },
  { id: "sentence", label: "Sentence", unit: "clause" },
  { id: "paragraph", label: "Paragraph", unit: "block" },
  { id: "caption", label: "Caption", unit: "stream" },
  { id: "blob", label: "Blob", unit: "binary/text" },
  { id: "document", label: "Document", unit: "corpus" },
];

export const PIPE_CHANNELS = [
  "caption_in",
  "caption_out",
  "llm_prompt",
  "llm_completion",
  "mcp_tool",
  "mcp_resource",
  "jax_tensor",
  "dict_lookup",
];

/**
 * Envelope for every analysis unit — live-pipe ready.
 * @param {object} partial
 */
export function makeEnvelope(partial = {}) {
  const ts = new Date().toISOString();
  const id =
    partial.id ||
    `kbx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    schema: SCHEMA_VERSION,
    id,
    ts,
    level: partial.level || "word",
    source: partial.source || "kbatch-dictionary",
    lang: partial.lang || "en",
    layout: partial.layout || "qwerty",
    text: partial.text ?? "",
    // hierarchical payload
    atoms: partial.atoms ?? null,
    tokens: partial.tokens ?? [],
    patterns: partial.patterns ?? null,
    layouts: partial.layouts ?? null,
    metrics: partial.metrics ?? null,
    modes: partial.modes ?? null,
    strip: partial.strip ?? null,
    encodings: partial.encodings ?? null,
    // live piping
    streams: {
      caption_in: partial.streams?.caption_in ?? null,
      caption_out: partial.streams?.caption_out ?? null,
      ...(partial.streams || {}),
    },
    // LLM / MCP
    llm: partial.llm ?? null,
    mcp: partial.mcp ?? {
      resource: `kbatch://dict/${partial.level || "word"}/${encodeURIComponent(String(partial.text || "").slice(0, 64))}`,
      tools: ["analyze", "lookup", "pipe", "export_jax", "layout_shadow"],
    },
    // training
    jax: partial.jax ?? null,
    // provenance
    refs: partial.refs ?? {
      oed: null,
      wiki: null,
      grokipedia: null,
    },
    children: partial.children ?? [],
    parent_id: partial.parent_id ?? null,
    meta: partial.meta ?? {},
  };
}

/**
 * MCP-shaped tool descriptor (for agent / LLM integration).
 */
export const MCP_TOOLS = [
  {
    name: "kbatch_analyze",
    description:
      "Analyze text at letter/word/sentence/paragraph/caption/blob level with geometric keyboard stack: path, 15-layout shadows, strain, efficiency, travel, encodings",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        level: {
          type: "string",
          enum: ANALYSIS_LEVELS.map((l) => l.id),
        },
        layout: { type: "string", description: "qwerty | dvorak | colemak | …" },
        caption_in: { type: "string" },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_lookup",
    description: "Dictionary lookup — word card + layout pattern placements + metrics",
    inputSchema: {
      type: "object",
      properties: {
        word: { type: "string" },
        layout: { type: "string" },
      },
      required: ["word"],
    },
  },
  {
    name: "kbatch_pipe",
    description: "Live pipe caption_in → analysis → caption_out envelope (LLM/agent stream channel)",
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", enum: PIPE_CHANNELS },
        payload: { type: "string" },
        layout: { type: "string" },
      },
      required: ["channel", "payload"],
    },
  },
  {
    name: "kbatch_phon_pattern",
    description:
      "Phonetic CV / phone-class pattern analysis (English approx). openRatioPhon, n-grams, articulatory mean. Not SO orthography; does not change jax.x geometry vector.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        lang: { type: "string", description: "Grapheme→phone table (default en)" },
        level: { type: "string" },
        compare: {
          type: "string",
          description: "Optional second text → return d_PHON / d_art distances",
        },
        n: { type: "number", description: "n-gram order for compare (default 2)" },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_export_jax",
    description: "Export feature vectors for JAX/numpy training from path metrics",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        level: { type: "string" },
        layout: { type: "string" },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_letter_atom",
    description: "Letter atom — physical position on every layout, encodings, neighbors",
    inputSchema: {
      type: "object",
      properties: {
        letter: { type: "string" },
      },
      required: ["letter"],
    },
  },
  {
    name: "kbatch_steno_path",
    description:
      "Steno path / stenoSTRIP geometry for text: blank coins, flow arrows, DDR rhythm, music/MIDI sketch, layout-agnostic path unit",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        layout: { type: "string" },
        payload: {
          type: "string",
          description: "Optional stego/steno payload bits to allot into blank coins",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_matrix",
    description: "Pattern matrix — geometric slots × 15 keyboard layouts (Colossus data plane)",
    inputSchema: {
      type: "object",
      properties: {
        layout: { type: "string" },
      },
    },
  },
  {
    name: "kbatch_colossus",
    description:
      "Colossus snapshot: alphabet atoms + pattern matrix + sample word analyses + MCP tool list",
    inputSchema: {
      type: "object",
      properties: {
        words: {
          type: "array",
          items: { type: "string" },
          description: "Sample words to analyze (default quantum/kbatch set)",
        },
        layout: { type: "string" },
      },
    },
  },
  {
    name: "kbatch_shadows",
    description:
      "Same physical key path → glyph strings on all 15 layouts (shadow ranking by strain/efficiency)",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        layout: { type: "string", description: "Base layout for path" },
        maxRank: { type: "number" },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_path_rank",
    description:
      "Rank alternate layout interpretations for a path (ergonomic alternatives agents can suggest)",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        baseLayout: { type: "string" },
        limit: { type: "number" },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_chart_lookup",
    description:
      "Chart Geometry lookup — search 1141 world chart title-path packs (2015–2026): slug/title/artist, BPM/key, strain/efficiency, flowClass, musica, metadata capsules. Not full commercial lyrics.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free text or slug, e.g. \"too sweet hozier\" or too-sweet-hozier",
        },
        slug: { type: "string" },
        year: { type: "number", description: "Chart year filter" },
        yearMin: { type: "number" },
        yearMax: { type: "number" },
        numberOne: { type: "boolean", description: "Only peak #1 tracks" },
        region: {
          type: "string",
          description: "US | AU | KR | CA | Global",
        },
        bpmMin: { type: "number" },
        bpmMax: { type: "number" },
        flowClass: {
          type: "string",
          enum: ["dense", "balanced", "glide"],
          description: "BPM/trail-derived flow class",
        },
        capsule: {
          type: "string",
          description: "Metadata capsule id, e.g. chart-flow-dense, chart-us-2024-hot",
        },
        listCapsules: {
          type: "boolean",
          description: "If true, return capsule catalog only",
        },
        matchMode: {
          type: "string",
          enum: ["auto", "exact", "fuzzy"],
          description:
            "auto: prefer score≥900 when any exact hit; exact: only ≥900; fuzzy: all token matches",
        },
        exact: {
          type: "boolean",
          description: "Alias for matchMode=exact (slug/title/title+artist only)",
        },
        limit: { type: "number", description: "Max hits (default 8)" },
        level: {
          type: "string",
          description: "Analysis level for live path recompute (default caption)",
        },
        layout: { type: "string" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "path",
              "musica",
              "metrics",
              "steno",
              "pack",
              "rights",
              "lyricsUpgrade",
              "all",
            ],
          },
          description:
            "Sections to attach (default path, musica, metrics, rights, lyricsUpgrade)",
        },
      },
    },
  },
  {
    name: "kbatch_world_predict",
    description:
      "Rubik live-predict next words from path flow, cadence, strain, and likely divergence over a candidate orthography pool (world pack slivers or caller-supplied list).",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Typed prefix / phrase" },
        candidates: {
          type: "array",
          items: { type: "string" },
          description: "Candidate spellings (from world slivers)",
        },
        lang: { type: "string", description: "ISO-ish pack id, e.g. en, es, zh" },
        limit: { type: "number" },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_glyph_steno",
    description:
      "Encode/decode GrokYtalkY-style binary glyph matrices (13/25/37/49) into steno whitespace stream for mesh / blank-coin rails.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["encode", "decode"] },
        text: { type: "string", description: "Carrier text (encode) or stego text (decode)" },
        pixels: {
          description: "0/1 matrix, flat bits, or bitstring for encode",
        },
        n: { type: "number", description: "Glyph size 13|25|37|49" },
      },
      required: ["mode", "text"],
    },
  },
  {
    name: "kbatch_quantum_binary",
    description:
      "Map text or pack binary (bi) / glyph bits into a quantum-gutter 0–1 stream aligned with mueee quantum-gutter + school corpus rails.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        binary: { type: "string", description: "Optional 01 string from analyzed pack field bi" },
        glyphBits: {
          type: "array",
          items: { type: "number" },
          description: "Optional GY glyph bits",
        },
        layout: { type: "string" },
      },
      required: ["text"],
    },
  },
  {
    name: "kbatch_declaration_cadence",
    description:
      "Project Declaration master glyph stream onto 15-layout slot shadows + path metrics (range e.g. 0-143, L01, all).",
    inputSchema: {
      type: "object",
      properties: {
        range: {
          type: "string",
          description: "0-143 | L01 | title | body | all",
        },
        baseLayout: { type: "string", default: "qwerty" },
        layout: { type: "string", description: "Alias for baseLayout" },
        N: { type: "number", description: "Grid size for layer hint (default 12)" },
        metrics: { type: "boolean", default: true },
        rank: { type: "boolean", description: "Include ranked layouts if analyzer available" },
      },
    },
  },
  {
    name: "kbatch_world_path",
    description:
      "Fastest multi-language learning path through the world catalog: minimize layout+script+family transfer; script portals; ready packs first; honor langs opt-in only.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Mother tongue / origin lang id (default en)" },
        mode: {
          type: "string",
          enum: ["full", "ready", "portals", "ladder"],
          description: "full = all; ready = packs only; portals = script hubs; ladder = CEFR-style rungs",
        },
        includeHonor: { type: "boolean" },
        includePlaceholder: { type: "boolean" },
        readyOnly: { type: "boolean" },
        max: { type: "number" },
      },
    },
  },
  {
    name: "kbatch_concept_solve",
    description:
      "Instant multilingual meaning solve: one concept/word → all mesh language forms with pure C transfer rank + path geometry. Geometry≠gloss. Honor opt-in.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Word form, slug, or concept:id" },
        conceptId: { type: "string", description: "Optional concept:water style id" },
        from: { type: "string", description: "Source lang for C ranking (default en)" },
        mode: {
          type: "string",
          enum: ["ready", "all", "honor"],
          description: "ready = default; honor/all include FN educational seeds",
        },
        includeHonor: { type: "boolean" },
        includePaths: { type: "boolean", description: "Path geometry per form (default true)" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "kbatch_world_axes",
    description:
      "World-ranking five axes scores, pathway dial state (D3–R3), and Colossus pipe metadata.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_freya_convert",
    description:
      "FreyaUnits convert (freya.qbitos.ai) — length/mass/temp/speed/time/energy/digital between symbols (e.g. ly→km, °C→K).",
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
    description: "List FreyaUnits symbols by category (length, mass, temperature, speed, time, energy, digital).",
    inputSchema: {
      type: "object",
      properties: { cat: { type: "string" } },
    },
  },
  {
    name: "kbatch_math",
    description:
      "Safe math ops for agents: add/sub/mul/div/pow/sqrt/log/trig/mean/… or op=const|list. No free eval.",
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
    description:
      "Detect LLM/agent slip or drift vs live KBatch doctrine + tool fingerprint. Call after long sessions or suspicious answers.",
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
    description:
      "Return full system prompt + doctrine + tool list to rebind an agent after drift. Prefer over inventing KBatch behavior.",
    inputSchema: {
      type: "object",
      properties: { reason: { type: "string" } },
    },
  },
  {
    name: "kbatch_llm_train_pack",
    description:
      "Export LLM train-as-tool pack: system prompt, few-shots, tool schemas, doctrine — for SFT/RAG/agent config.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kbatch_deity_lookup",
    description:
      "Open deity lookup (Wikidata CC0). Never Turner/OUP text. Returns name, culture, description, links.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        id: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "kbatch_book_stub",
    description:
      "Living-books / Gutenberg catalog stub lookup (metadata; full text on demand PD only).",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        gutenbergId: { type: "number" },
        limit: { type: "number" },
      },
    },
  },
  /* ── Declaration Letter-Grid (Grok / Dojo / Colossus pipe) ── */
  {
    name: "kbatch_lettergrid_ping",
    description:
      "Health: engine ver, masterGlyphs 6235, layersAt, tool list, static URLs. No board required.",
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
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_glyphs",
    description:
      "Return master glyph list or a slice (6235). Primary data source for Colossus and training pipes.",
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
    name: "kbatch_lettergrid_step",
    description:
      "Advance one glyph (or play a short burst). Returns new state + whether the step was correct. Requires live letterGrid session for play/next.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["next", "play", "reset", "skip-layer"],
          default: "next",
        },
        count: { type: "integer", minimum: 1, maximum: 50, default: 1 },
        speedMs: { type: "integer", enum: [120, 60, 30, 12] },
      },
    },
  },
  {
    name: "kbatch_lettergrid_play_round",
    description:
      "Start a 70-second WebGrid scoring round. Returns final score report (or dryRun structure).",
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
        dryRun: { type: "boolean", default: false },
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
      "Full DOJO-ready Letter-Grid snapshot for kbatch_colossus composition (state + glyphs + layer map + crossref + paleography).",
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
        },
      },
    },
  },
  {
    name: "kbatch_lettergrid_finale",
    description:
      "After all grid layers are cleared, return the finale wandering path, peak BPS, and completion report.",
    inputSchema: {
      type: "object",
      properties: {
        includePath: { type: "boolean", default: true },
        includeScores: { type: "boolean", default: true },
        N: { type: "integer", enum: [8, 12, 16], default: 12 },
      },
    },
  },
  {
    name: "kbatch_lettergrid_rubik",
    description:
      "Shadow Rubik × Letter-Grid bind: 13 origin cubes, 6 faces, pie-germanic-en Focus, calibration bank URLs.",
    inputSchema: {
      type: "object",
      properties: {
        pathId: { type: "string" },
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
  /* ── Cage litmus (epistemic FACT / FICTION / STONE_TRAP) ── */
  {
    name: "kbatch_cage_litmus_quiz",
    description:
      "Cage-grade litmus quiz (12 claims). Static FACT / FICTION / STONE_TRAP keys. answers:false for blinded trials.",
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" } },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["doctrine", "grades", "labels", "items", "agentPrompt", "calibration"],
          },
        },
        answers: { type: "boolean", default: true },
      },
    },
  },
  {
    name: "kbatch_cage_litmus_grade",
    description:
      "Scoring contract: grade bands, hard rule (zero STONE_TRAP → fail), calibration profiles.",
    inputSchema: {
      type: "object",
      properties: {
        profile: {
          type: "string",
          enum: ["bands", "oracle", "stoneOnly", "movieBeliever", "grokLive", "all"],
          default: "bands",
        },
        includeDoctrine: { type: "boolean", default: true },
      },
    },
  },
  {
    name: "kbatch_cage_litmus_verify",
    description:
      "Submit {id,answer}[] and receive score/grade. Hard rule: zero STONE_TRAP catches → fail if score ≥ 0.5.",
    inputSchema: {
      type: "object",
      properties: {
        answers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              answer: { type: "string", enum: ["FACT", "FICTION", "STONE_TRAP"] },
            },
            required: ["id", "answer"],
          },
        },
        strict: { type: "boolean", default: true },
      },
      required: ["answers"],
    },
  },
];

/**
 * OED-scale index metadata scaffold.
 */
export function makeCorpusIndex(partial = {}) {
  return {
    schema: SCHEMA_VERSION,
    name: partial.name || "KBatch Colossus Corpus",
    version: partial.version || "0.1.0",
    generated: new Date().toISOString(),
    scale_target: ["oed", "wikipedia", "grokipedia"],
    levels: ANALYSIS_LEVELS.map((l) => l.id),
    layouts: partial.layouts || [],
    shards: partial.shards || {},
    counts: {
      letters: partial.counts?.letters ?? 26,
      words: partial.counts?.words ?? 0,
      senses: partial.counts?.senses ?? 0,
      captions: partial.counts?.captions ?? 0,
      blobs: partial.counts?.blobs ?? 0,
    },
    pipes: PIPE_CHANNELS,
    mcp: { tools: MCP_TOOLS.map((t) => t.name) },
  };
}
