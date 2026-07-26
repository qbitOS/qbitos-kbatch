/**
 * KBatch · Living books catalogue
 * PD / Gutenberg / cited literature as orthography fuel — remote catalogue, no local disk paths.
 * Data: data/living-books/index.json · entries.json
 * Lab:  labs/living-books.html
 */

import { toMusicNotation } from "./encoder.js";
import { keyPathForText, BASE_LAYOUT_ID } from "./layouts.js";
import { flowSignature } from "./keyboard-pattern-lab.js";
import { toKeyboardFlow } from "./encoder.js";

export const LIVING_SCHEMA = "kbatch-living-books-catalogue-v1";

/** @type {null | object} */
let _index = null;
/** @type {null | { entries?: BookEntry[] }} */
let _pack = null;
/** @type {null | { projects?: VisualProject[] }} */
let _visual = null;
/** @type {null | object} */
let _unsolved = null;

/**
 * @typedef {object} VisualProject
 * @property {string} id
 * @property {string} title
 * @property {string} [mediaType]
 * @property {string} [viewer]
 * @property {{ min?: number, max?: number }} [zoom]
 * @property {Array<{ n?: number, url: string, label?: string }>} [pages]
 * @property {string} [externalViewer]
 * @property {string} [externalHub]
 * @property {string} [localPath]
 * @property {string[]} [layers]
 * @property {string} [note]
 * @property {string[]} [howTo]
 */

/**
 * @typedef {object} BookEntry
 * @property {string} id
 * @property {string} title
 * @property {string} author
 * @property {number} [year]
 * @property {string} kind
 * @property {string[]} [tags]
 * @property {number} [gutenbergId]
 * @property {{ gutenbergHtml?: string, gutenbergTxt?: string, openLibrary?: string }} [links]
 * @property {string} [samplePhrase]
 * @property {string} [rights]
 * @property {string} [note]
 */

function dataUrl(base, file) {
  const b = String(base || "").replace(/\/?$/, "/");
  if (b === "/" || b === "") return `/data/living-books/${file}`;
  return `${b}data/living-books/${file}`.replace(/([^:]\/)\/+/g, "$1");
}

/**
 * @param {string[]} [bases]
 */
export async function loadLivingIndex(bases) {
  if (_index) return _index;
  const list =
    bases ||
    [
      "",
      "../",
      "/",
      "https://kbatch.ugrad.ai/",
      "https://data.ugrad.ai/kbatch/",
    ];
  let lastErr = null;
  for (const base of list) {
    try {
      const res = await fetch(dataUrl(base, "index.json"), { cache: "default" });
      if (!res.ok) throw new Error(String(res.status));
      _index = await res.json();
      return _index;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("living-books index load failed");
}

/**
 * @param {string[]} [bases]
 */
export async function loadLivingEntries(bases) {
  if (_pack?.entries?.length) return _pack;
  const list =
    bases ||
    [
      "",
      "../",
      "/",
      "https://kbatch.ugrad.ai/",
      "https://data.ugrad.ai/kbatch/",
    ];
  let lastErr = null;
  for (const base of list) {
    try {
      const res = await fetch(dataUrl(base, "entries.json"), { cache: "default" });
      if (!res.ok) throw new Error(String(res.status));
      _pack = await res.json();
      return _pack;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("living-books entries load failed");
}

/**
 * Graphic novels · comics · codex facsimiles · large PDF / deep-zoom projects.
 * Data: data/living-books/visual-projects.json
 * @param {string[]} [bases]
 */
export async function loadVisualProjects(bases) {
  if (_visual?.projects) return _visual;
  const list =
    bases ||
    [
      "",
      "../",
      "/",
      "https://kbatch.ugrad.ai/",
      "https://data.ugrad.ai/kbatch/",
    ];
  let lastErr = null;
  for (const base of list) {
    try {
      const res = await fetch(dataUrl(base, "visual-projects.json"), {
        cache: "default",
      });
      if (!res.ok) throw new Error(String(res.status));
      _visual = await res.json();
      return _visual;
    } catch (e) {
      lastErr = e;
    }
  }
  // Soft-fail: empty pack so catalogue still works
  _visual = { projects: [], schema: "kbatch-living-books-visual-v1", error: String(lastErr) };
  return _visual;
}

/** @param {string} id */
export function getVisualProject(id) {
  return (_visual?.projects || []).find((p) => p.id === id) || null;
}

/** @returns {VisualProject[]} */
export function listVisualProjects() {
  return _visual?.projects || [];
}

/**
 * Unsolved / hard manuscripts — high-res docs + Memory Glass batch jobs.
 * Data: data/living-books/unsolved-manuscripts.json
 * @param {string[]} [bases]
 */
export async function loadUnsolvedManuscripts(bases) {
  if (_unsolved?.manuscripts?.length) return _unsolved;
  const list =
    bases ||
    [
      "",
      "../",
      "/",
      "https://kbatch.ugrad.ai/",
      "https://data.ugrad.ai/kbatch/",
    ];
  let lastErr = null;
  for (const base of list) {
    try {
      const res = await fetch(dataUrl(base, "unsolved-manuscripts.json"), {
        cache: "default",
      });
      if (!res.ok) throw new Error(String(res.status));
      _unsolved = await res.json();
      return _unsolved;
    } catch (e) {
      lastErr = e;
    }
  }
  _unsolved = {
    manuscripts: [],
    batchManifest: { jobs: [] },
    schema: "kbatch-unsolved-manuscripts-v1",
    error: String(lastErr),
  };
  return _unsolved;
}

/** @returns {object[]} */
export function listUnsolvedManuscripts() {
  return _unsolved?.manuscripts || [];
}

/** @param {string} id */
export function getUnsolvedManuscript(id) {
  return (_unsolved?.manuscripts || []).find((m) => m.id === id) || null;
}

/**
 * Flat Memory Glass batch job list (path · zoom · cage · study · beats).
 * @param {{ manuscriptId?: string, type?: string, priority?: number }} [opts]
 */
export function batchManifest(opts = {}) {
  const jobs =
    _unsolved?.batchManifest?.jobs ||
    (_unsolved?.manuscripts || []).flatMap((m) =>
      (m.batchJobs || []).map((j) => ({
        ...j,
        manuscriptId: m.id,
        title: m.title,
      }))
    );
  let out = jobs;
  if (opts.manuscriptId) {
    out = out.filter((j) => j.manuscriptId === opts.manuscriptId);
  }
  if (opts.type) out = out.filter((j) => j.type === opts.type);
  if (opts.priority != null) {
    out = out.filter((j) => (j.priority ?? 99) <= opts.priority);
  }
  return {
    schema: "kbatch-mg-batch-manifest-v1",
    count: out.length,
    jobs: out,
    pipeline: _unsolved?.memoryGlass?.pipeline || [],
    doctrine: _unsolved?.doctrine || null,
  };
}

/**
 * @param {{ kind?: string, tag?: string, tradition?: string, corpus?: string, mediaType?: string, q?: string, limit?: number }} [opts]
 * @returns {BookEntry[]}
 */
export function searchBooks(opts = {}) {
  const entries = _pack?.entries || [];
  const q = String(opts.q || "")
    .trim()
    .toLowerCase();
  let out = entries;
  if (opts.kind) out = out.filter((e) => e.kind === opts.kind);
  if (opts.tag) out = out.filter((e) => (e.tags || []).includes(opts.tag));
  if (opts.tradition) {
    const t = String(opts.tradition).toLowerCase();
    out = out.filter(
      (e) =>
        String(e.tradition || "").toLowerCase() === t ||
        (e.tags || []).map((x) => String(x).toLowerCase()).includes(t)
    );
  }
  if (opts.corpus) {
    out = out.filter(
      (e) =>
        e.corpus === opts.corpus ||
        (opts.corpus === "sacred-wisdom" &&
          ((e.tags || []).includes("sacred-corpus") ||
            ["scripture", "mythology", "esoteric"].includes(e.kind))) ||
        (opts.corpus === "visual" &&
          (e.corpus === "visual" ||
            e.kind === "visual-project" ||
            e.kind === "unsolved-manuscript" ||
            (e.tags || []).some((t) =>
              ["comic", "graphic", "deep-zoom", "pdf-zoom", "facsimile"].includes(t)
            ))) ||
        (opts.corpus === "unsolved" &&
          (e.kind === "unsolved-manuscript" ||
            (e.tags || []).some((t) =>
              ["unsolved", "mg-batch", "cipher", "undeciphered"].includes(t)
            )))
    );
  }
  if (opts.mediaType) {
    out = out.filter((e) => e.mediaType === opts.mediaType);
  }
  if (q) {
    out = out.filter((e) => {
      const hay = [
        e.id,
        e.title,
        e.author,
        e.kind,
        e.tradition,
        e.samplePhrase,
        ...(e.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  return out.slice(0, opts.limit ?? out.length);
}

/** @param {string} id */
export function getBook(id) {
  return (_pack?.entries || []).find((e) => e.id === id) || null;
}

/**
 * Path geometry pack for a sample phrase (dictionary spine).
 * @param {BookEntry|string} bookOrPhrase
 * @param {{ layout?: string }} [opts]
 */
export function bookToPathGeometry(bookOrPhrase, opts = {}) {
  const book = typeof bookOrPhrase === "string" ? null : bookOrPhrase;
  const text =
    typeof bookOrPhrase === "string"
      ? bookOrPhrase
      : book?.samplePhrase || book?.title || "";
  const layout = opts.layout || BASE_LAYOUT_ID;
  const path = keyPathForText(text, layout);
  const flow = flowSignature(path);
  const kb = toKeyboardFlow(text);
  return {
    schema: "kbatch-living-book-path-v1",
    id: book?.id || null,
    title: book?.title || null,
    text,
    layout,
    pathLen: path.length,
    flow: flow.dirs,
    arrows: kb.arrows,
    ddr: kb.ddr,
    pattern: kb.pattern,
    music: toMusicNotation(text),
    dictionaryUrl: `/?shadow=${encodeURIComponent(text.slice(0, 200))}`,
    shadowUrl: `/shadow.html?q=${encodeURIComponent(text.slice(0, 200))}`,
    lyricsUrl: `/lyrics.html`,
  };
}

/**
 * Sample contrail beats (no MG required) for preview.
 */
export function sampleStoryBeats() {
  return {
    ver: "webgrid-contrail-v2",
    source: "kbatch-living-books-sample",
    beats: [
      { mood: "wonder", glyph: "E2S3", hops: 2, hint: "Slow steps. Look around." },
      { mood: "rush", glyph: "NE4E2", hops: 5, hint: "A sudden dash across the page!" },
      { mood: "tension", glyph: "WSWN", hops: 3, hint: "The path twisted — try again carefully." },
      { mood: "triumph", glyph: "E3", hops: 1, hint: "The path found its mark." },
      { mood: "journey", glyph: "E4N2E3", hops: 4, hint: "The road continued under quiet stars." },
    ],
  };
}

/**
 * @param {object} data
 * @returns {string}
 */
export function formatStoryBeats(data) {
  const beats = data?.beats || [];
  if (!beats.length) return "no beats";
  return beats
    .map(
      (b, i) =>
        `${i + 1}. [${b.mood || "?"}] «${b.glyph || ""}» — ${b.hint || ""}`
    )
    .join("\n");
}

export function livingStats() {
  return {
    schema: LIVING_SCHEMA,
    entryCount: _pack?.count || _pack?.entries?.length || _index?.entryCount || 0,
    kinds: _index?.kinds || _pack?.kinds || {},
    visualProjects: _visual?.projects?.length || _index?.visualProjects || 0,
    unsolvedManuscripts:
      _unsolved?.counts?.manuscripts ||
      _unsolved?.manuscripts?.length ||
      _index?.unsolvedManuscripts?.count ||
      0,
    batchJobs:
      _unsolved?.counts?.batchJobs ||
      _unsolved?.batchManifest?.jobCount ||
      0,
    loaded: !!(_pack?.entries?.length),
    page: _index?.page || "labs/living-books.html",
  };
}

/** True when entry should open the deep-zoom surface (comics · codex · PDF plates). */
export function isVisualBook(book) {
  if (!book) return false;
  return (
    book.kind === "visual-project" ||
    book.kind === "unsolved-manuscript" ||
    book.corpus === "visual" ||
    book.viewer === "deep-zoom" ||
    [
      "comic",
      "graphic-novel",
      "codex-facsimile",
      "pdf-zoom",
      "deep-zoom",
      "artifact-facsimile",
      "tablet-facsimile",
      "seal-corpus",
      "palimpsest",
      "wall-inscription",
      "spectral-scroll",
      "papyrus-ct",
      "stele",
      "mechanism-inscription",
      "papyrus-fragments",
      "block-inscription",
    ].includes(book.mediaType) ||
    (book.tags || []).some((t) =>
      [
        "deep-zoom",
        "comic",
        "graphic",
        "pdf-zoom",
        "facsimile",
        "unsolved",
        "mg-batch",
        "high-res",
      ].includes(t)
    )
  );
}

if (typeof window !== "undefined") {
  window.__kbatchLivingBooks = {
    loadIndex: loadLivingIndex,
    loadEntries: loadLivingEntries,
    loadVisual: loadVisualProjects,
    listVisual: listVisualProjects,
    getVisual: getVisualProject,
    loadUnsolved: loadUnsolvedManuscripts,
    listUnsolved: listUnsolvedManuscripts,
    getUnsolved: getUnsolvedManuscript,
    batchManifest,
    search: searchBooks,
    get: getBook,
    isVisual: isVisualBook,
    path: bookToPathGeometry,
    sampleBeats: sampleStoryBeats,
    formatBeats: formatStoryBeats,
    stats: livingStats,
    /** Codex-style reader: import from /js/living-book-reader.js */
    readerModule: "/js/living-book-reader.js",
    deepZoomModule: "/js/deep-zoom-viewer.js",
  };
}
