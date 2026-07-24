/**
 * Declaration Letter-Grid MCP — TypeScript surfaces for Grok / Dojo / Colossus.
 * Tools: kbatch_lettergrid_* (see LETTERGRID_MCP_TOOLS / mcp manifest)
 */

export type LettergridInclude =
  | "glyphs"
  | "layers"
  | "score"
  | "crossref"
  | "session"
  | "paleography"
  | "scores";

export type LettergridStepAction = "next" | "play" | "reset" | "skip-layer";
export type LettergridLayerAction = "get" | "jump" | "clear";
export type LettergridDepth = "light" | "full" | "training";
export type LettergridGlyphFormat = "array" | "string" | "atoms";
export type LettergridTrainFormat = "json" | "jsonl" | "jax";
export type LettergridGridSize = "8x8" | "12x12" | "16x16";
export type LettergridSpeedMs = 120 | 60 | 30 | 12;

/** Compact master glyph tuple */
export type MasterGlyphTuple = [
  gi: number,
  ch: string,
  lineId: string,
  kind: string,
  wordStart: 0 | 1,
  sentenceStart: 0 | 1
];

export interface LettergridState {
  tool?: "kbatch_lettergrid_state";
  ver?: string;
  timer: string;
  bps: number;
  ntpm: number;
  grid: string;
  N?: number;
  glyphs: { done: number; total: number };
  layer: { current: number; total: number };
  nextGlyph: string | null;
  next?: LettergridNextMeta | null;
  masterIndex: number;
  peakBps: number;
  peakNtpm?: number;
  mode: string;
  phase?: string;
  playing?: boolean;
  session?: "static" | string;
  note?: string;
  urls?: { play?: string; pipe?: string };
}

export interface LettergridNextMeta {
  mode?: string;
  gi?: number | null;
  ch?: string | null;
  display?: string;
  lineId?: string;
  kind?: string;
  letterKey?: string;
  wordStart?: boolean;
  sentenceStart?: boolean;
  cell?: number;
  pathStep?: number;
  pathTotal?: number;
}

export interface LettergridPaleography {
  scribe: string;
  ink: string;
  substrate?: string;
  notes?: string;
  rights?: string;
}

export interface LettergridColossus {
  tool?: "kbatch_lettergrid_colossus";
  document: "declaration-of-independence" | string;
  version: string;
  schema?: string;
  masterGlyphs: number;
  layers: number;
  state: LettergridState | Record<string, unknown>;
  glyphs?: string[];
  layerMap?: Record<string, { label: string; range: [number, number]; count?: number }>;
  gridLayerMap?: Record<string, { layer: number; range: [number, number]; cells?: number }>;
  scoreHistory?: unknown[];
  crossref?: Record<string, Record<string, number>>;
  paleography?: LettergridPaleography;
  session?: string;
  training?: LettergridTrainingPack;
  urls?: Record<string, string>;
}

export interface LettergridTrainingPack {
  schema?: "kbatch-letter-grid-training-v1" | string;
  tool?: string;
  document?: string;
  N?: number;
  masterGlyphs: number;
  layers: number;
  sequence?: string[];
  layerBoundaries?: { layer: number; start: number; end: number }[];
  documentLineMap?: Record<string, unknown>;
  bps?: { factor: number; note?: string; targets?: Record<string, unknown> };
  format?: LettergridTrainFormat;
  lines?: string[];
  vectors?: number[][];
  columns?: string[];
  shape?: [number, number];
}

export interface LettergridLiveSessionRequired {
  error: "live_session_required";
  tool: string;
  message: string;
  open?: string;
  pipe?: string;
  browser?: string;
}

/** Args per tool */
export interface LettergridToolArgs {
  kbatch_lettergrid_state: { include?: LettergridInclude[] };
  kbatch_lettergrid_glyphs: {
    range?: string;
    format?: LettergridGlyphFormat;
    includeMeta?: boolean;
  };
  kbatch_lettergrid_step: {
    action?: LettergridStepAction;
    count?: number;
    speedMs?: LettergridSpeedMs | number;
  };
  kbatch_lettergrid_play_round: {
    gridSize?: LettergridGridSize | string;
    speedMs?: LettergridSpeedMs | number;
    dryRun?: boolean;
  };
  kbatch_lettergrid_layer: {
    layer: number;
    action?: LettergridLayerAction;
  };
  kbatch_lettergrid_colossus: {
    depth?: LettergridDepth;
    include?: LettergridInclude[];
  };
  kbatch_lettergrid_next_glyph: Record<string, never>;
  kbatch_lettergrid_export_training: {
    format?: LettergridTrainFormat;
  };
}

export type LettergridToolName = keyof LettergridToolArgs;

/** Browser page API (letterGrid / __letterGridApi) */
export interface LetterGridPageApi {
  ver: string;
  getState(): Record<string, unknown>;
  mcpState(include?: LettergridInclude[]): LettergridState;
  nextGlyph(opts?: object): {
    ok: boolean;
    glyph?: LettergridNextMeta | null;
    cell?: number;
    state?: LettergridState | Record<string, unknown>;
    reason?: string;
  };
  playRound(opts?: {
    size?: number;
    N?: number;
    speed?: number;
    hopMs?: number;
    timed?: boolean;
    dojo?: boolean;
    maxHits?: number;
  }): Promise<unknown>;
  exportColossus(opts?: {
    includeGlyphs?: boolean;
    compact?: boolean;
    hitLimit?: number;
  }): Record<string, unknown>;
  exportColossusDraft(opts?: {
    depth?: LettergridDepth;
    include?: LettergridInclude[];
  }): LettergridColossus;
  setDojoMode(on?: boolean): LettergridState | Record<string, unknown>;
  masterGlyphs(opts?: { compact?: boolean }): {
    schema: string;
    total: number;
    glyphs: MasterGlyphTuple[] | unknown[];
  };
  jumpToLayer(layer: number): Record<string, unknown>;
  skipLayer(): Record<string, unknown>;
  exportTraining(opts?: { format?: LettergridTrainFormat }): LettergridTrainingPack;
  agentPlay(opts?: { paceMs?: number; openCodex?: boolean; maxHits?: number }): Promise<unknown>;
}

declare global {
  interface Window {
    letterGrid?: LetterGridPageApi;
    __letterGridApi?: LetterGridPageApi;
    __mgLetterGridApi?: LetterGridPageApi;
    kbatchDict?: {
      mcp: <T extends LettergridToolName | string>(
        name: T,
        args?: T extends LettergridToolName ? LettergridToolArgs[T] : object
      ) => Promise<unknown> | unknown;
    };
  }
}

export {};
