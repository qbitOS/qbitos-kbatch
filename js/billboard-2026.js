/**
 * Chart catalogs + batch analysis helpers.
 * Prefer world multi-year charts: data/lyrics/charts/index.json
 * Fallback: data/lyrics/billboard-2026/index.json
 */

/** @type {object|null} */
let chartIndex = null;
/** @type {Map<string, object>} */
const analysisCache = new Map();

function dataBase() {
  if (typeof document !== "undefined") {
    const meta = document.querySelector('meta[name="kbatch-data-base"]');
    if (meta?.content) return meta.content.replace(/\/?$/, "/");
  }
  return "./data/";
}

async function fetchJson(rel) {
  const paths = [`./data/${rel}`, dataBase() + rel];
  for (const url of paths) {
    try {
      const res = await fetch(url, { cache: "default" });
      if (res.ok) return await res.json();
    } catch {
      /* */
    }
  }
  return null;
}

/**
 * Load largest available chart catalog (world → 2025 → billboard-2026).
 */
export async function loadBillboard2026() {
  if (chartIndex) return chartIndex;
  const world = await fetchJson("lyrics/charts/index.json");
  if (world?.tracks?.length) {
    chartIndex = world;
    return chartIndex;
  }
  const y25 = await fetchJson("lyrics/charts/2025.json");
  if (y25?.tracks?.length) {
    chartIndex = y25;
    return chartIndex;
  }
  chartIndex =
    (await fetchJson("lyrics/billboard-2026/index.json")) || {
      tracks: [],
      count: 0,
      year: 2026,
    };
  return chartIndex;
}

/** Alias */
export async function loadWorldCharts() {
  return loadBillboard2026();
}

export function getBillboardIndex() {
  return chartIndex;
}

/**
 * Path text used when full lyrics are not available (copyright-safe).
 * @param {{ title?: string, artist?: string }} track
 */
export function titlePathText(track) {
  const title = String(track?.title || "Untitled").trim();
  const artist = String(track?.artist || "").trim();
  // Multi-line pseudo-lyric for richer geometry / rhythm
  return [
    title,
    artist,
    title,
    artist.split(/\s*[&,/]\s*/)[0] || artist,
    title.split(/\s+/).reverse().join(" "),
    `${title} ${artist}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Load precomputed analysis for a track slug if present.
 * @param {string} slug
 */
export async function loadTrackAnalysis(slug) {
  if (!slug) return null;
  if (analysisCache.has(slug)) return analysisCache.get(slug);
  const rel = `lyrics/analyses/${slug}.json`;
  const data = await fetchJson(rel);
  if (data) analysisCache.set(slug, data);
  return data;
}

/** @type {object|null} */
let chartCorpus = null;

/**
 * Lightweight corpus (1141 track summaries) — no per-track re-analyze.
 * data/lyrics/charts/corpus.json
 */
export async function loadChartCorpus() {
  if (chartCorpus?.tracks?.length) return chartCorpus;
  chartCorpus =
    (await fetchJson("lyrics/charts/corpus.json")) ||
    (await fetchJson("lyrics/billboard-2026/corpus.json"));
  return chartCorpus;
}

export function getChartCorpus() {
  return chartCorpus;
}

/**
 * Merge corpus / index `analyzed` summaries onto catalog tracks (list chips).
 * @param {object} index chart index
 * @param {object|null} [corpus]
 */
export function hydrateTracksFromPrecomputed(index, corpus = null) {
  if (!index?.tracks?.length) return index;
  /** @type {Map<string, object>} */
  const bySlug = new Map();
  for (const row of corpus?.tracks || []) {
    if (row?.slug) bySlug.set(row.slug, row.analysis || row.analyzed || null);
  }
  for (const t of index.tracks) {
    const fromCorpus = bySlug.get(t.slug);
    const a = t.analyzed || fromCorpus || null;
    if (a) {
      t.analyzed = {
        bpm: a.bpm ?? null,
        key: a.key ?? null,
        timeSig: a.timeSig ?? null,
        avgStrain: a.avgStrain ?? null,
        avgEfficiency: a.avgEfficiency ?? null,
        midiNotes: a.midiNotes ?? null,
        source: t.analyzed ? "index" : "corpus",
      };
    }
  }
  return index;
}

/**
 * Normalize disk analysis pack → album lyrics pack for renderPack().
 * Precomputed lines are flat; live analyzer uses { kind, text, analysis }.
 * @param {object} pre
 * @param {object} [track]
 */
export function normalizePrecomputedPack(pre, track = null) {
  if (!pre || typeof pre !== "object") return null;
  const meta = {
    title: pre.meta?.title || track?.title || "Untitled",
    artist: pre.meta?.artist || track?.artist || "Unknown",
    album: pre.meta?.album || track?.chart || "Chart Geometry",
    year: pre.meta?.year || String(track?.year || ""),
    coverUrl: pre.meta?.coverUrl || "",
    layout: pre.meta?.layout || "qwerty",
    lyricsMode: pre.meta?.lyricsMode || track?.lyricsMode || "title-path",
  };
  const lines = (pre.lines || []).map((ln, i) => {
    // already nested
    if (ln?.analysis || ln?.kind === "section" || ln?.kind === "blank") {
      return {
        i: ln.i ?? i,
        kind: ln.kind || "lyric",
        text: ln.text || "",
        analysis: ln.analysis || null,
      };
    }
    // flat precomputed line
    const { text, ...rest } = ln || {};
    return {
      i,
      kind: "lyric",
      text: text || "",
      analysis: Object.keys(rest).length ? rest : null,
    };
  });
  const summary = pre.summary || {};
  const coverSeed = pre.coverSeed || {
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    hue: Math.round(((summary.avgStrain || 40) / 100) * 360),
    density: Number((summary.avgEfficiency || 50) / 100),
    pathEnergy: Math.min(1, (summary.avgPathLen || 10) / 40),
    lines: summary.lyricLines || lines.length,
    words: summary.words || 0,
  };
  // Citation required for full lyrics; title-path packs get explicit stub
  const citation =
    pre.citation ||
    (meta.lyricsMode === "title-path"
      ? {
          source: "Chart title/artist path (no full lyrics)",
          license: "metadata-only",
          note: "Geometry from title-path. Full lyrics require cited-file / public-domain / user-paste — see docs/LYRICS-CITATION-AND-SONG-FLOW.md",
        }
      : null);

  return {
    schema: pre.schema || "kbatch-album-lyrics-v2",
    generated: pre.generated || new Date().toISOString(),
    meta,
    citation,
    chart: pre.chart || {
      id: track?.id,
      slug: track?.slug,
      peak: track?.peak,
      numberOne: track?.numberOne,
      rights: track?.rights || null,
    },
    rights: pre.rights || track?.rights || null,
    lines,
    summary,
    musica: pre.musica || null,
    timeline: pre.timeline || null,
    coverSeed,
    fullLive: pre.fullLive || null,
    blank: pre.blank || {
      url: "https://fornevercollective.github.io/blank/",
      note: "Open blank geometric keyboard with track text as path unit",
    },
    qbpm: pre.qbpm || null,
    precomputed: true,
    analysisPath:
      pre.analysisPath ||
      track?.analysisPath ||
      (track?.slug ? `data/lyrics/analyses/${track.slug}.json` : null),
  };
}

/**
 * Lyrics text reconstructed from precomputed pack lines (no re-analyze).
 * @param {object} pack
 * @param {object} [track]
 */
export function lyricsTextFromPack(pack, track = null) {
  const lines = (pack?.lines || [])
    .filter((ln) => (ln.kind || "lyric") === "lyric" && ln.text?.trim())
    .map((ln) => ln.text);
  if (lines.length) return lines.join("\n");
  return titlePathText(track || { title: pack?.meta?.title, artist: pack?.meta?.artist });
}

/**
 * Sort tracks by peak then title.
 * @param {object[]} tracks
 */
export function sortChartTracks(tracks) {
  return [...(tracks || [])].sort((a, b) => {
    const pa = a.peak ?? 999;
    const pb = b.peak ?? 999;
    if (pa !== pb) return pa - pb;
    return String(a.title).localeCompare(String(b.title));
  });
}

/**
 * Aggregate stats across analysis packs.
 * @param {object[]} packs
 */
export function chartCorpusStats(packs) {
  const bpms = packs.map((p) => p?.musica?.bpm).filter((n) => n != null);
  const strains = packs.map((p) => p?.summary?.avgStrain).filter((n) => n != null);
  const effs = packs.map((p) => p?.summary?.avgEfficiency).filter((n) => n != null);
  const avg = (a) =>
    a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  return {
    tracks: packs.length,
    avgBpm: avg(bpms) != null ? Number(avg(bpms).toFixed(1)) : null,
    avgStrain: avg(strains) != null ? Number(avg(strains).toFixed(1)) : null,
    avgEfficiency: avg(effs) != null ? Number(avg(effs).toFixed(1)) : null,
    bpmMin: bpms.length ? Math.min(...bpms) : null,
    bpmMax: bpms.length ? Math.max(...bpms) : null,
    numberOnes: packs.filter((p) => p?.chart?.numberOne).length,
  };
}

/**
 * Honest flow class from BPM + trail density (title-path safe; not syllable stress).
 * @param {{ bpm?: number|null, flow?: string|null, strain?: number|null }} opts
 * @returns {"dense"|"balanced"|"glide"|"unknown"}
 */
export function flowClassFromMetrics(opts = {}) {
  const bpm = Number(opts.bpm);
  const flow = String(opts.flow || "");
  const trail = (flow.match(/[●→←↑↓↗↖↘↙]/g) || []).length;
  // Short flow strings are trail-heavy by construction — prefer BPM when present
  const dens =
    flow.length >= 24 ? trail / Math.max(1, flow.length) : null;
  if (!Number.isFinite(bpm) && dens == null) return "unknown";
  // High BPM or dense trail → dense; low BPM / sparse → glide; else balanced
  if ((Number.isFinite(bpm) && bpm >= 155) || (dens != null && dens >= 0.55)) {
    return "dense";
  }
  if ((Number.isFinite(bpm) && bpm <= 140) || (dens != null && dens < 0.35)) {
    return "glide";
  }
  if (Number.isFinite(bpm) || dens != null) return "balanced";
  return "unknown";
}

function normQ(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Score catalog track against free-text query / slug.
 * Higher scores = more exact. Agents can filter with matchMode.
 *
 * 1000 slug exact · 980 title+artist exact · 950 title exact ·
 * 900 normalized hay exact · 500+ substring · token hits
 *
 * @param {object} t
 * @param {string} q
 * @returns {{ score: number, match: string }}
 */
export function scoreTrackDetailed(t, q) {
  if (!q) return { score: 0, match: "none" };
  const slug = String(t.slug || "").toLowerCase();
  const raw = String(q).trim().toLowerCase();
  const nq = normQ(q);
  const slugQ = nq.replace(/\s+/g, "-");
  if (!nq && !raw) return { score: 0, match: "none" };

  if (slug === raw || slug === slugQ || slug === raw.replace(/\s+/g, "-")) {
    return { score: 1000, match: "slug-exact" };
  }

  const title = normQ(t.title || "");
  const artist = normQ(t.artist || "");
  const hay = normQ(`${t.title || ""} ${t.artist || ""} ${slug}`);

  if (title && artist && (nq === `${title} ${artist}` || nq === `${artist} ${title}`)) {
    return { score: 980, match: "title-artist-exact" };
  }
  if (title && nq === title) {
    return { score: 950, match: "title-exact" };
  }
  if (artist && nq === artist) {
    return { score: 920, match: "artist-exact" };
  }
  if (hay === nq) {
    return { score: 900, match: "hay-exact" };
  }
  if (title && nq.startsWith(title + " ") && artist && nq.includes(artist)) {
    return { score: 880, match: "title-prefix-artist" };
  }
  if (hay.includes(nq)) {
    return { score: 500 + Math.min(80, nq.length), match: "substring" };
  }
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

/**
 * Score catalog track against free-text query / slug (numeric only).
 * @param {object} t
 * @param {string} q
 */
function scoreTrack(t, q) {
  return scoreTrackDetailed(t, q).score;
}

/**
 * Rights-safe lyrics upgrade status for a track / pack.
 * @param {object} t catalog track
 * @param {object|null} pack analysis pack
 */
export function lyricsUpgradeStatus(t, pack = null) {
  const slug = t?.slug || pack?.meta?.slug || "";
  const mode =
    pack?.meta?.lyricsMode || t?.lyricsMode || t?.analyzed?.lyricsMode || "title-path";
  const hasCitedPath = !!(t?.lyricsPath || pack?.meta?.lyricsPath);
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
    hasCitedPath,
    steps: upgradeable
      ? [
          "Place PD/licensed lyrics at data/lyrics/cited/{slug}.txt",
          "Add citation sidecar data/lyrics/cited/{slug}.cite.json (required)",
          "Re-run npm run analyze:charts (or analyze that slug)",
          "Pack lyricsMode becomes cited-file|public-domain; re-query include:[\"pack\"]",
        ]
      : ["Full-text mode already set — open pack.lines for geometry"],
    docs: "docs/LYRICS-CITATION-AND-SONG-FLOW.md",
    policy:
      "Never bulk-scrape commercial lyrics. Title-path is the default rights-safe geometry.",
  };
}

/** @type {object|null} */
let capsulesCache = null;

/**
 * Load metadata chart-geometry capsules (year / region / flow bins).
 */
export async function loadChartCapsules() {
  if (capsulesCache) return capsulesCache;
  capsulesCache = (await fetchJson("lyrics/charts/capsules.json")) || {
    schema: "kbatch-chart-geometry-capsules-v1",
    capsules: [],
  };
  return capsulesCache;
}

/**
 * @param {object} t catalog track
 * @returns {number|null}
 */
function trackBpmHint(t) {
  const n = Number(t?.analysis?.bpm ?? t?.bpm ?? t?.metrics?.bpm);
  return Number.isFinite(n) ? n : null;
}

/**
 * MCP / agent chart geometry lookup — catalog + optional pack + live path.
 * Rights-safe: default title-path; full lyrics only if licensed file was analyzed.
 *
 * @param {object} args
 * @param {string} [args.query] free text or slug
 * @param {string} [args.slug]
 * @param {number|string} [args.year]
 * @param {number} [args.yearMin]
 * @param {number} [args.yearMax]
 * @param {boolean} [args.numberOne]
 * @param {string} [args.region] US | AU | KR | CA | Global
 * @param {number} [args.bpmMin]
 * @param {number} [args.bpmMax]
 * @param {string} [args.flowClass] dense | balanced | glide
 * @param {string} [args.capsule] capsule id e.g. chart-flow-dense
 * @param {boolean} [args.listCapsules] return capsule catalog only
 * @param {number} [args.limit=8]
 * @param {string} [args.level="caption"] analysis level for path recompute
 * @param {string} [args.layout="qwerty"]
 * @param {string[]|string} [args.include] path | musica | metrics | steno | pack | rights | lyricsUpgrade | all
 * @param {string} [args.matchMode] auto | exact | fuzzy — exact keeps score≥900 only
 * @param {boolean} [args.exact] alias for matchMode=exact
 * @param {(text: string, opts?: object) => object} [args.analyze] inject analyzeLevel
 * @returns {Promise<object>}
 */
export async function chartLookup(args = {}) {
  // Capsule catalog only
  if (args.listCapsules === true || args.listCapsules === "true") {
    const capDoc = await loadChartCapsules();
    return {
      schema: "kbatch-chart-capsules-v1",
      tool: "kbatch_chart_lookup",
      mode: "listCapsules",
      claim: capDoc.claim || "Metadata chart-geometry capsules (title-path only).",
      capsuleCount: capDoc.capsuleCount ?? capDoc.capsules?.length ?? 0,
      corpus: capDoc.corpus || null,
      capsules: (capDoc.capsules || []).map((c) => ({
        id: c.id,
        label: c.label,
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

  const catalog = await loadBillboard2026();
  // Prefer corpus.json tracks when present — they carry analysis.bpm for flow filters
  const corpusFull = await fetchJson("lyrics/charts/corpus.json");
  const tracks = Array.isArray(corpusFull?.tracks) && corpusFull.tracks.length
    ? corpusFull.tracks
    : Array.isArray(catalog?.tracks)
      ? catalog.tracks
      : [];
  const query = String(args.query || args.slug || args.q || "").trim();
  const slugArg = String(args.slug || "").trim().toLowerCase();
  const year =
    args.year != null && args.year !== ""
      ? Number(args.year)
      : null;
  const yearMin =
    args.yearMin != null && args.yearMin !== "" ? Number(args.yearMin) : null;
  const yearMax =
    args.yearMax != null && args.yearMax !== "" ? Number(args.yearMax) : null;
  const wantOne = args.numberOne === true || args.numberOne === "true" || args.numberOne === 1;
  const region = args.region ? String(args.region).toUpperCase() : null;
  const bpmMin =
    args.bpmMin != null && args.bpmMin !== "" ? Number(args.bpmMin) : null;
  const bpmMax =
    args.bpmMax != null && args.bpmMax !== "" ? Number(args.bpmMax) : null;
  const flowClassFilter = args.flowClass
    ? String(args.flowClass).toLowerCase()
    : null;
  const capsuleId = args.capsule ? String(args.capsule).trim() : "";
  const limit = Math.max(1, Math.min(40, Number(args.limit) || 8));
  const level = args.level || "caption";
  const layout = args.layout || "qwerty";

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

  /** @type {"auto"|"exact"|"fuzzy"} */
  let matchMode = String(args.matchMode || "auto").toLowerCase();
  if (args.exact === true || args.exact === "true" || args.exact === 1) {
    matchMode = "exact";
  }
  if (!["auto", "exact", "fuzzy"].includes(matchMode)) matchMode = "auto";

  /** @type {object|null} */
  let capsuleMeta = null;
  if (capsuleId) {
    const capDoc = await loadChartCapsules();
    capsuleMeta = (capDoc.capsules || []).find((c) => c.id === capsuleId) || null;
    // Expand capsule filters into args if not already set
    if (capsuleMeta?.filters) {
      const f = capsuleMeta.filters;
      if (!Number.isFinite(year) && f.year != null) args.year = f.year;
      if (!Number.isFinite(yearMin) && f.yearMin != null) args.yearMin = f.yearMin;
      if (!Number.isFinite(yearMax) && f.yearMax != null) args.yearMax = f.yearMax;
      if (!wantOne && f.numberOne) args.numberOne = true;
      if (!region && f.region) args.region = f.region;
      if (!Number.isFinite(bpmMin) && f.bpmMin != null) args.bpmMin = f.bpmMin;
      if (!Number.isFinite(bpmMax) && f.bpmMax != null) args.bpmMax = f.bpmMax;
      if (!flowClassFilter && f.flowClass) args.flowClass = f.flowClass;
    }
  }

  // re-read filters after capsule expand
  const year2 =
    args.year != null && args.year !== "" ? Number(args.year) : null;
  const yearMin2 =
    args.yearMin != null && args.yearMin !== "" ? Number(args.yearMin) : null;
  const yearMax2 =
    args.yearMax != null && args.yearMax !== "" ? Number(args.yearMax) : null;
  const wantOne2 =
    args.numberOne === true || args.numberOne === "true" || args.numberOne === 1;
  const region2 = args.region ? String(args.region).toUpperCase() : null;
  const bpmMin2 =
    args.bpmMin != null && args.bpmMin !== "" ? Number(args.bpmMin) : null;
  const bpmMax2 =
    args.bpmMax != null && args.bpmMax !== "" ? Number(args.bpmMax) : null;
  const flowClass2 = args.flowClass ? String(args.flowClass).toLowerCase() : null;

  let filtered = tracks.slice();
  if (Number.isFinite(year2)) {
    filtered = filtered.filter((t) => Number(t.year) === year2);
  }
  if (Number.isFinite(yearMin2)) {
    filtered = filtered.filter((t) => Number(t.year) >= yearMin2);
  }
  if (Number.isFinite(yearMax2)) {
    filtered = filtered.filter((t) => Number(t.year) <= yearMax2);
  }
  if (wantOne2) {
    filtered = filtered.filter((t) => t.numberOne === true || t.peak === 1);
  }
  if (region2) {
    filtered = filtered.filter((t) => {
      const regs = t.regions || t.region || [];
      const arr = Array.isArray(regs) ? regs : [regs];
      return arr.some((r) => String(r).toUpperCase() === region2);
    });
  }
  if (Number.isFinite(bpmMin2) || Number.isFinite(bpmMax2) || flowClass2) {
    filtered = filtered.filter((t) => {
      const bpm = trackBpmHint(t);
      if (Number.isFinite(bpmMin2) && (bpm == null || bpm < bpmMin2)) return false;
      if (Number.isFinite(bpmMax2) && (bpm == null || bpm > bpmMax2)) return false;
      if (flowClass2) {
        const fc = flowClassFromMetrics({ bpm });
        if (fc !== flowClass2) return false;
      }
      return true;
    });
  }
  // Capsule example slugs as soft boost later — if capsule has examples only and no other filter match, still ok

  /** @type {{ track: object, score: number, match: string }[]} */
  let scored;
  if (slugArg && !query) {
    const slugNorm = slugArg.replace(/\s+/g, "-");
    scored = filtered
      .filter((t) => String(t.slug || "").toLowerCase() === slugNorm)
      .map((t) => ({ track: t, score: 1000, match: "slug-exact" }));
  } else if (query) {
    scored = filtered
      .map((t) => {
        const d = scoreTrackDetailed(t, query);
        return { track: t, score: d.score, match: d.match };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (a.track.peak ?? 999) - (b.track.peak ?? 999));

    if (matchMode === "exact") {
      scored = scored.filter((x) => x.score >= 900);
    } else if (matchMode === "auto") {
      const exacts = scored.filter((x) => x.score >= 900);
      if (exacts.length) scored = exacts;
    }
    // fuzzy: keep all score > 0
  } else {
    // browse mode: peak order
    scored = sortChartTracks(filtered).map((t, i) => ({
      track: t,
      score: 100 - Math.min(99, i),
      match: "browse",
    }));
  }

  const top = scored.slice(0, limit);
  const hits = [];

  for (const { track: t, score, match } of top) {
    const pathText = titlePathText(t);
    const pack = await loadTrackAnalysis(t.slug);
    const bpm =
      pack?.musica?.bpm ??
      pack?.qbpm?.live?.bpm ??
      pack?.summary?.bpm ??
      t.analysis?.bpm ??
      t.analyzed?.bpm ??
      null;
    const key =
      pack?.musica?.key ??
      pack?.summary?.key ??
      t.analysis?.key ??
      t.analyzed?.key ??
      null;
    const strain =
      pack?.summary?.avgStrain ??
      t.analysis?.avgStrain ??
      t.analyzed?.avgStrain ??
      null;
    const efficiency =
      pack?.summary?.avgEfficiency ??
      t.analysis?.avgEfficiency ??
      t.analyzed?.avgEfficiency ??
      null;
    const flow =
      pack?.qbpm?.live?.flow ??
      pack?.fullLive?.flow ??
      null;
    /* Prefer pure-BPM capsule class when bpm known; trail density only as fallback */
    const flowClass = Number.isFinite(Number(bpm))
      ? Number(bpm) >= 155
        ? "dense"
        : Number(bpm) <= 140
          ? "glide"
          : "balanced"
      : flowClassFromMetrics({ bpm, flow, strain });

    const lyricsMode = pack?.meta?.lyricsMode || t.lyricsMode || "title-path";
    const pathSource =
      lyricsMode === "title-path" || lyricsMode === "metadata-only"
        ? "title-path"
        : lyricsMode;

    /** @type {object} */
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
      match: match || "unknown",
      analysisPath: t.analysisPath || `data/lyrics/analyses/${t.slug}.json`,
      flowClass,
      metrics: want.has("metrics")
        ? {
            bpm,
            key,
            timeSig: pack?.musica?.timeSig || pack?.summary?.timeSig || null,
            avgStrain: strain,
            avgEfficiency: efficiency,
            midiNotes: pack?.summary?.midiNotes ?? t.analysis?.midiNotes ?? null,
            bestLayout: pack?.summary?.bestLayout ?? null,
          }
        : undefined,
      path: want.has("path")
        ? {
            text: pathText,
            source: pathSource,
            note:
              pathSource === "title-path"
                ? "Copyright-safe title+artist geometry. Licensed full lyrics: see lyricsUpgrade."
                : "Path text derived from cited/full lyric mode pack lines when available.",
          }
        : undefined,
      musica: want.has("musica")
        ? pack?.musica ||
          pack?.qbpm?.live ||
          {
            bpm,
            key,
            notation: pack?.qbpm?.live?.musica || null,
          }
        : undefined,
      rights:
        want.has("rights") || want.has("all")
          ? pack?.rights || t.rights || null
          : undefined,
      lyricsUpgrade:
        want.has("lyricsupgrade") || want.has("lyricsUpgrade") || want.has("all")
          ? lyricsUpgradeStatus(t, pack)
          : undefined,
      pack: want.has("pack") ? pack : undefined,
    };

    // Optional live recompute (agent chains to analyze/steno)
    if ((want.has("path") || want.has("steno")) && typeof args.analyze === "function") {
      try {
        const env = args.analyze(pathText, {
          level,
          layout,
          source: "mcp:kbatch_chart_lookup",
        });
        if (want.has("path") && hit.path) {
          hit.path.live = {
            strip: env.strip,
            metrics: env.metrics,
            flow: env.a11y?.flow || env.flow || null,
          };
        }
        if (want.has("steno")) {
          hit.steno = {
            strip: env.strip,
            flow: env.a11y?.flow || env.flow || null,
            metrics: env.metrics,
            note: "Geometric steno path unit; blank-coin allotment available via kbatch_steno_path",
          };
        }
      } catch {
        /* */
      }
    } else if (want.has("steno") && flow) {
      hit.steno = {
        flow,
        note: "From precomputed pack; call kbatch_steno_path on path.text for live unit",
      };
    }

    // Drop undefined optional keys
    for (const k of Object.keys(hit)) {
      if (hit[k] === undefined) delete hit[k];
    }
    hits.push(hit);
  }

  const corpus = catalog?.count != null
    ? {
        tracks: catalog.count,
        years: catalog.years || null,
        byYear: catalog.byYear || null,
        byRegion: catalog.byRegion || null,
        schema: catalog.schema || null,
      }
    : { tracks: tracks.length };

  // Prefer corpus.json stats when available (cheap second fetch, cached via browser)
  let corpusStats = null;
  try {
    const c = await fetchJson("lyrics/charts/corpus.json");
    if (c?.stats) corpusStats = c.stats;
  } catch {
    /* */
  }

  // Contrast demos for flowClass storytelling
  const contrast = {
    dense: { slug: "anxiety-doechii", title: "Anxiety", artist: "Doechii", bpm: 164 },
    balanced: { slug: "too-sweet-hozier", title: "Too Sweet", artist: "Hozier", bpm: 149 },
    glide: { slug: "die-with-a-smile-lady-gaga", title: "Die with a Smile", artist: "Lady Gaga", bpm: 135 },
  };

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
      year: Number.isFinite(year2) ? year2 : null,
      yearMin: Number.isFinite(yearMin2) ? yearMin2 : null,
      yearMax: Number.isFinite(yearMax2) ? yearMax2 : null,
      numberOne: wantOne2 || null,
      region: region2,
      bpmMin: Number.isFinite(bpmMin2) ? bpmMin2 : null,
      bpmMax: Number.isFinite(bpmMax2) ? bpmMax2 : null,
      flowClass: flowClass2,
      capsule: capsuleId || null,
      matchMode,
      limit,
      include: [...want],
    },
    catalog: corpus,
    corpusStats,
    scored: scored.length,
    count: hits.length,
    exactCount: hits.filter((h) => (h.score || 0) >= 900).length,
    hits,
    demo: {
      slug: "too-sweet-hozier",
      title: "Too Sweet",
      artist: "Hozier",
      note: "Canonical #1 demo — open /lyrics.html or re-query this slug",
    },
    contrast,
    qbpm: {
      project: "https://github.com/fornevercollective/qbpm",
      forge: "https://fornevercollective.github.io/Qbpm/",
      bus: "qbpm-live",
      graph: "music.clock → tool.kbatch → music.score",
      liveCharts: "graphs/live-charts.json",
    },
    resources: {
      catalog: "data/lyrics/charts/index.json",
      corpus: "data/lyrics/charts/corpus.json",
      capsules: "data/lyrics/charts/capsules.json",
      packs: "data/lyrics/analyses/{slug}.json",
      ui: "https://kbatch.ugrad.ai/lyrics.html",
    },
  };
}
