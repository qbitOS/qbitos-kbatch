/**
 * Letter-Grid MCP TypeScript surface (v8-pipe + paleography + finale)
 * Tools: kbatch_lettergrid_* · page API: letterGrid / __letterGridApi
 */

declare namespace KBatch {
  interface LetterGridState {
    timer: string;
    bps: number;
    ntpm: number;
    grid: "8x8" | "12x12" | "16x16" | string;
    glyphs: { done: number; total: number };
    layer: { current: number; total: number };
    nextGlyph: string | null;
    masterIndex: number;
    peakBps: number;
    mode: "lobby" | "dojo" | "round" | "finale" | "codex" | string;
    phase?: string;
    ver?: string;
    session?: string;
  }

  interface MasterGlyph {
    gi: number;
    ch: string;
    lineId: string;
    kind: "title" | "subtitle" | "body" | "grievance" | "closing" | "signature" | string;
    wordStart: 0 | 1;
    sentenceStart: 0 | 1;
  }

  /** Compact tuple as shipped in master-glyphs.json */
  type MasterGlyphTuple = [
    gi: number,
    ch: string,
    lineId: string,
    kind: string,
    wordStart: 0 | 1,
    sentenceStart: 0 | 1
  ];

  interface PaleographyCapsule {
    scribe: string;
    ink: string;
    support?: string;
    substrate?: string;
    dimensions?: string;
    source?: string;
    notes?: string | string[];
    signatureColumns?: string;
    rights?: string;
  }

  interface PaleographyDoc {
    schema: "kbatch-declaration-paleography-v1" | string;
    docId: "declaration-of-independence" | string;
    source?: {
      institution?: string;
      item?: string;
      location?: string;
      transcript?: string;
      highRes?: string;
    };
    physical?: {
      scribe?: string;
      dateEngrossed?: string;
      support?: string;
      dimensions?: string;
      ink?: string;
      condition?: string;
    };
    layout?: Record<string, string>;
    restorationNotes?: string[];
    methods?: Record<string, string>;
    compact?: PaleographyCapsule;
  }

  interface ColossusPack {
    schema: "kbatch-letter-grid-colossus-v1" | string;
    ver?: string;
    version?: string;
    docId?: "declaration-of-independence" | string;
    document?: string;
    masterGlyphs: number;
    layers: number;
    state: LetterGridState;
    glyphs?: string[] | MasterGlyph[];
    layerMap?: Record<string, { label: string; range: [number, number]; count?: number }>;
    gridLayerMap?: Record<
      string,
      { layer?: number; range?: [number, number]; start?: number; end?: number; cells?: number }
    >;
    paleography?: PaleographyCapsule;
    paleographyDoc?: PaleographyDoc | null;
    paleographyUrl?: string;
    scoreHistory?: unknown[];
    layerClearLog?: unknown[];
    layerClears?: unknown[];
    training?: TrainingPack;
  }

  interface FinalePack {
    schema: "kbatch-letter-grid-finale-v1" | string;
    tool?: "kbatch_lettergrid_finale";
    ready?: boolean;
    codexDone?: boolean;
    finaleActive?: boolean;
    finaleDone?: boolean;
    complete?: boolean;
    N: number;
    layers?: number;
    pathLen?: number;
    pathStep?: number;
    path?: number[];
    pathPreview?: number[];
    peakBps?: number;
    peakNtpm?: number;
    hits?: number;
    misses?: number;
    note?: string;
    session?: string;
  }

  interface TrainingPack {
    schema?: "kbatch-letter-grid-training-v1" | string;
    format?: "json" | "jsonl" | "jax";
    masterGlyphs?: number;
    layers?: number;
    sequence?: string[];
    lines?: string[];
    vectors?: number[][];
    include?: string[];
    meta?: Record<string, unknown>;
  }

  type LettergridTool =
    | "kbatch_lettergrid_state"
    | "kbatch_lettergrid_glyphs"
    | "kbatch_lettergrid_step"
    | "kbatch_lettergrid_play_round"
    | "kbatch_lettergrid_layer"
    | "kbatch_lettergrid_colossus"
    | "kbatch_lettergrid_next_glyph"
    | "kbatch_lettergrid_export_training"
    | "kbatch_lettergrid_finale";
}

/** Page API */
export interface LetterGridPageApi {
  ver: string;
  getState(): Record<string, unknown>;
  mcpState(include?: string[]): KBatch.LetterGridState;
  nextGlyph(opts?: object): { ok: boolean; glyph?: unknown; state?: unknown };
  playRound(opts?: object): Promise<unknown>;
  exportColossus(opts?: object): Record<string, unknown>;
  exportColossusDraft(opts?: object): KBatch.ColossusPack;
  exportFinale(opts?: {
    includePath?: boolean;
    includeScores?: boolean;
    start?: boolean;
  }): KBatch.FinalePack;
  setDojoMode(on?: boolean): unknown;
  masterGlyphs(opts?: object): { total: number; glyphs: unknown[] };
  exportTraining(opts?: {
    format?: "json" | "jsonl" | "jax";
    include?: string[];
  }): KBatch.TrainingPack;
  paleography(): KBatch.PaleographyDoc | { compact: KBatch.PaleographyCapsule };
  jumpToLayer(layer: number): unknown;
  skipLayer(): unknown;
}

declare global {
  interface Window {
    letterGrid?: LetterGridPageApi;
    __letterGridApi?: LetterGridPageApi;
    __mgLetterGridApi?: LetterGridPageApi;
    kbatchDict?: {
      mcp(
        name: KBatch.LettergridTool | string,
        args?: object
      ): Promise<unknown> | unknown;
    };
  }
}

export {};

/*
 * Usage:
 *   await kbatchDict.mcp("kbatch_lettergrid_state")
 *   await kbatchDict.mcp("kbatch_lettergrid_glyphs", { range: "L01" })
 *   await kbatchDict.mcp("kbatch_lettergrid_colossus", { depth: "light" })
 *   await kbatchDict.mcp("kbatch_lettergrid_step", { action: "next" })
 *   await kbatchDict.mcp("kbatch_lettergrid_play_round", { gridSize: "12x12", speedMs: 60, dryRun: true })
 *   await kbatchDict.mcp("kbatch_lettergrid_export_training", { format: "jsonl" })
 *   await kbatchDict.mcp("kbatch_lettergrid_finale")
 */
