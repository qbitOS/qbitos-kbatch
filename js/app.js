/**
 * KBatch Dictionary — full corpus (100k–1M+ words) + on-demand analysis
 */

import {
  analyzeWord,
  analyzeWordSlim,
  setActiveLayout,
  LAYOUT_RING_ORDER,
  KEYBOARD_LAYOUTS,
} from "./analyze.js";
import {
  toBraille,
  toMorse,
  toNATO,
  toASL,
  toBSL,
  toDanceMoves,
  toMusicNotation,
  toKeyboardFlow,
} from "./encoder.js";
import {
  crossLayoutTransliterations,
  PRIMARY_LAYOUTS,
  alphabetForLayout,
  scriptAlphabetForLayout,
  SCRIPT_FONT_STACK,
} from "./layouts.js";
import { analyzeSentenceUse } from "./pos.js";
import {
  toJSON,
  toJAX,
  toCSV,
  toMarkdown,
  downloadText,
} from "./export.js";
import { composePresentation, BLOCK_TYPES } from "./x-article.js";
import { DESC_LANGS, describeWord, t as descT } from "./i18n-desc.js";
import {
  applyUiLanguage,
  langForLayout,
  languageDescriptionMatrix,
  renderLanguageCompareHtml,
  ui as uiPack,
} from "./ui-i18n.js";
import {
  enrichEntryWithMeaning,
  enrichEntries,
  lookupMeaning,
  senseLexHtml,
  fetchLexicalRelations,
  buildAdoption,
} from "./live-dict.js";
import { guessEtymology, guessEra, analyzeHistorical } from "./historical.js";
import { analyzePhonation, phonationCardLines } from "./phonation.js";
import {
  analyzeScholarLinguistics,
  attachScholarToEntry,
  LING_FRAMEWORKS,
} from "./scholar-linguistics.js";
import {
  COMM_SOUND_ORIGINS,
  SPEECH_REGISTERS,
  STEPPING_PATHS,
  MOTHER_TONGUES,
  languageCatalogStats,
  languagesByTier,
  LANG_TIER_META,
  SOFT_UI_LANG_MAP,
  ANCESTORY_FIRST_NATIONS,
  analyzeLanguageStepping,
  languageSteppingCardLines,
  motherTongueById,
  steppingPathById,
  pickSteppingPath,
} from "./language-stepping.js";
import {
  analyzeShadowLive,
  shadowLiveStatus,
  shadowLiveEnvelope,
} from "./shadow-live.js";
import { ensureGluelam, getGluelamStatus } from "./gluelam-consumer.js";
import { publishShadowLive, ironChannels } from "./ironline-bus.js";
import { bridgeToQuantum } from "./quantum-bridge.js";
import {
  shadowSearch,
  shadowSearchAcrossMedia,
  enrichShadowHits,
  buildMediaIndex,
  extractMediaUnits,
} from "./shadow-search.js";
import {
  spatialFromShadowLive,
  publishSpatial,
  renderSpatialCanvas,
} from "./spatial-hooks.js";
import { bridgeToBlank } from "./blank-bridge.js";
import {
  analyzeStenoSpace,
  analyzeBlankSpace,
  toolAnalysisTotal,
  stenoEncode,
  stenoDecode,
  stripSteno,
  stenoSpaceHtml,
  formatStrip,
} from "./steno-strip.js";
import {
  buildPcapImagePath,
  createForgeMark,
  chunkToPackets,
  publishPcapImage,
  renderHexLumCanvas,
  pcapImageHtml,
} from "./pcap-image-bridge.js";
import {
  loadVersion,
  getVersionSync,
  productIdentity,
  applyRegionMeta,
} from "./version.js";
import {
  publishKbatchToLive,
  publishKbatchPresence,
  pinToOverview,
  subscribeUgradLive,
  ugradLiveStatus,
} from "./ugrad-live-bus.js";
import { VIZ_MODES, renderVizMode } from "./contrails-viz.js";
import { installGlobalAPI, analyzeLevel } from "./pipeline.js";
import { analyzeOrder } from "./order-analysis.js";
import { pipeToOverview, pipeEducationToOverview } from "./overview-pipe.js";
import { mountTypingPractice } from "./typing-practice.js";
import { mountCollabLab } from "./collab-lab.js";
import {
  mountSchoolConcepts,
  runSkillHooks,
  loadSchoolConcepts,
} from "./education.js";
import { coverageReport, vocabBenchmarks } from "./corpus-sources.js";
import {
  loadWordIndex,
  loadAllLetters,
  loadLetter,
  loadSliverIndex,
  loadSliver,
  loadSliversForQuery,
  loadPrefixCoverage,
  wordsForLetter,
  wordsForPrefix,
  searchWords,
  searchWordsLazy,
  searchPrefix,
  searchPrefixLazy,
  letterCount,
  totalCount,
  loadAnalyzedIndex,
  loadAnalyzedLetter,
  loadAnalyzedForQuery,
  hasAnalyzedChunk,
  analyzedTotal,
  isFullyAnalyzedOnDisk,
  getAnalyzedIndex,
  getSliverIndex,
  prefixesForLetter,
  displayPrefixesForLetter,
  childPrefixesForStem,
  prefixCount,
  prefixDisplayLabel,
  prefixMatchStem,
  wordMatchesPrefix,
  loadedLetterCount,
  loadedSliverCount,
  setWordLang,
  getWordLang,
  hasWordPack,
  hasGeometryPack,
  hasPrecomputedAnalyzed,
  loadLangCatalog,
  loadLangWordIndex,
  getLangCatalog,
  activeBuckets,
} from "./corpus.js";
import {
  progressiveLoadLetters,
  idle,
  cancelIdle,
  LAZY_SECTION_CLASS,
} from "./lazy-loader.js";
import {
  corticalFast,
  corticalScheduleHeavy,
  getLastCorticalTick,
  DEFAULT_LOOP_BUDGET_MS,
} from "./cortical-loop.js";
import {
  buildToolStack,
  exportMultiRuntime,
  RUNTIME_TARGETS,
} from "./tool-stack.js";
import {
  suggestFromPersona,
  personaSuggestHtml,
  PERSONA_PRESETS,
  setActivePersona,
  getActivePersona,
} from "./persona-suggest.js";
import { initCacheAndPwa, buildStamp } from "./cache-bust.js";
import {
  ensureQuantumGutter,
  gutterPrefixContent,
  gutterHtml,
  broadcastGutter,
} from "./quantum-gutter.js";
import {
  meshJoinFromUrl,
  meshJoin,
  meshPublishKnowledge,
  meshSubscribe,
  meshStatus,
  nfcShare,
  nfcListen,
  meshPeer,
} from "./mesh-bus.js";
import { mountTerminal } from "./terminal-lane.js";
import {
  encodeGlyphInSteno,
  decodeGlyphFromSteno,
  broadcastGlyphSteno,
  glyphFromText,
  glyphGridHtml,
  DEFAULT_GLYPH_N,
} from "./glyph-steno.js";
import {
  REGISTER_IDS,
  REGISTER_META,
  AGE_CAPSULES,
  REGION_CAPSULES,
  THEME_CAPSULES,
  loadRegisterIndex,
  loadTagMap,
  loadMetaMap,
  loadCapsuleIndex,
  loadCapsule,
  loadRegisterLetter,
  registersForWord,
  metaForWord,
  registerMetaHtml,
  getRegisterIndex,
  getCapsuleIndex,
} from "./registers.js";
import {
  loadCapsuleCanon,
  listCanonCapsules,
  openCanonCapsule,
  getCanonCapsule,
  getCapsuleCanon,
  capsuleCanonApi,
} from "./capsules-canon.js";
import {
  analyzeKeyboardPatterns,
  patternLabHtml,
} from "./keyboard-pattern-lab.js";
import {
  buildRubikLanguageState,
  buildOriginTreeRubik,
  buildAllOriginRubiksMap,
  originTreeCubeDefs,
  rubikNetHtml,
  rubikAllMapHtml,
  CUBE_FACES,
} from "./rubik-language-map.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
/** Cards rendered per letter section before "Show more" */
const PAGE_SIZE = 60;

/** @type {Map<string, ReturnType<typeof analyzeWord>>} */
const analysisCache = new Map();
/** Letters whose analyzed JSON is already in analysisCache */
const analyzedLetterLoaded = new Set();

/** How many words shown per letter (offset pages) */
/** @type {Record<string, number>} */
const letterShown = {};
for (const L of LETTERS) letterShown[L] = PAGE_SIZE;

/** @type {Set<string>} */
const openSections = new Set(["A"]); // start with A open only for performance
/** Bumps on each language swap to abort progressive loads */
let langLoadGeneration = 0;
/** In-flight language swap */
let langSwapPromise = null;
let activeLetter = "A";
/** Active prefix subsection (aa, ab, ac… or 3-letter fat split). null = whole letter */
let activePrefix = null;
let searchQuery = "";
let vizMode = "geometric";
let globalLayoutId = "qwerty";
/** Language tier filter for chip row: all | mother | first-nations | classical | world */
let activeLangTier = "mother";

/** Active dictionary language (DESC_LANGS / catalog id) */
let activeLangId = "en";
/** Active historical stepping path id (language-stepping) */
let activePathId = "pie-germanic-en";
/** Active register filter id (spectrum + dict layer) */
let activeRegisterId = "standard";
/** Capsule filters (age / region / theme) — "all" = no filter */
let activeAgeCapsule = "all";
let activeRegionCapsule = "all";
let activeThemeCapsule = "all";
/** Cached register letter sets: `${reg}:${letter}` → Set */
/** @type {Record<string, Set<string>>} */
const registerLetterCache = {};
/** Cached capsule word sets: `age:id` etc. */
/** @type {Record<string, Set<string>>} */
const capsuleWordCache = {};
/** Last keyboard pattern lab pack */
let lastPatternLab = null;
/** Last Rubik language cube state */
let lastRubikState = null;
/** Last language-stepping analysis pack */
let lastStepping = null;
/** Last Shadow Live pack */
let lastShadowLive = null;
let shadowLiveTimer = null;
/** Media kinds enabled for Shadow Search */
const shadowSearchKinds = new Set(["word", "phrase", "lyric", "caption", "code"]);
/** @type {ReturnType<typeof analyzeWord> | null} */
let focusedEntry = null;
/** Search result word strings */
let searchHits = null;
/** Background chunk analyze running */
let chunkJob = null;

const $ = (sel) => document.querySelector(sel);

/**
 * Surface corpus health next to Spellings X / Y — never silent 0/0.
 * @param {{
 *   ok?: boolean,
 *   total?: number,
 *   count?: number,
 *   error?: string|null,
 *   detail?: string|null,
 *   phase?: string,
 * }} s
 */
function reportCorpusHealth(s = {}) {
  const total = s.total != null ? s.total : totalCount();
  const count = s.count != null ? s.count : total;
  const elCount = $("#stat-count");
  const elTotal = $("#stat-total");
  const errEl = $("#corpus-error");
  const line = $("#status-line");
  if (elCount) elCount.textContent = Number(count || 0).toLocaleString();
  if (elTotal) elTotal.textContent = Number(total || 0).toLocaleString();

  const zero = !total || total <= 0;
  const failed = s.ok === false || (zero && s.error);
  document.documentElement.dataset.corpusOk = failed ? "0" : total > 0 ? "1" : "pending";

  if (errEl) {
    if (failed || (zero && s.phase === "ready")) {
      errEl.hidden = false;
      errEl.classList.add("is-error");
      errEl.textContent =
        s.error ||
        (zero
          ? "Spellings 0/0 — corpus did not load (check network, SW cache, or data/word-index.json)"
          : "Corpus error");
      if (s.detail) errEl.title = s.detail;
    } else if (s.error) {
      errEl.hidden = false;
      errEl.classList.add("is-warn");
      errEl.classList.remove("is-error");
      errEl.textContent = s.error;
      errEl.title = s.detail || "";
    } else {
      errEl.hidden = true;
      errEl.classList.remove("is-error", "is-warn");
      errEl.textContent = "";
    }
  }
  if (line && s.phase === "error" && s.error) {
    line.textContent = s.error;
  }
  // Handshake for inline boot watchdog in index.html
  try {
    window.__KBATCH_BOOT__ = {
      ok: !failed && total > 0,
      total,
      count,
      error: s.error || null,
      at: Date.now(),
      phase: s.phase || "update",
    };
  } catch {
    /* */
  }
}

function updateAnalyzedStats() {
  const total = totalCount();
  // Prefer disk-analyzed total (full corpus) over in-memory cache
  const onDisk = analyzedTotal();
  const analyzed = Math.max(onDisk, analysisCache.size);
  // Header "Spellings X / Y" = corpus available (not analyzed-only — that stuck at 0/0)
  const elCount = $("#stat-count");
  const elTotal = $("#stat-total");
  const show = total > 0 ? total : analyzed;
  if (elCount) elCount.textContent = show.toLocaleString();
  if (elTotal) elTotal.textContent = (total || analyzed).toLocaleString();
  // Flag silent 0/0 after boot should have finished
  if (!total && !analyzed && document.documentElement.dataset.corpusOk !== "pending") {
    reportCorpusHealth({
      ok: false,
      total: 0,
      count: 0,
      error: "Spellings 0/0 — no index in memory",
      phase: "ready",
    });
  } else if (total > 0) {
    const errEl = $("#corpus-error");
    if (errEl && errEl.classList.contains("is-error")) {
      errEl.hidden = true;
      errEl.classList.remove("is-error");
    }
    document.documentElement.dataset.corpusOk = "1";
  }
  updateVocabHurdle(total);
  const hint = $("#list-count-hint");
  if (hint) {
    if (onDisk >= total && total > 0) {
      hint.textContent = `All ${total.toLocaleString()} words analyzed (letter chunks) · open letter to browse`;
    } else if (onDisk > 0) {
      const pct = ((onDisk / total) * 100).toFixed(1);
      hint.textContent = `${onDisk.toLocaleString()} analyzed on disk · ${total.toLocaleString()} spellings · ${pct}%`;
    } else if (total > 0) {
      const pct = ((analysisCache.size / total) * 100).toFixed(1);
      hint.textContent = `${total.toLocaleString()} spellings indexed · ${analysisCache.size.toLocaleString()} analyzed in memory (${pct}%)`;
    } else {
      hint.textContent = `Loading corpus…`;
    }
  }
}

/**
 * Header chip: progress vs OED / MW / Wiktionary / 1M public size claims.
 * @param {number} [total]
 */
function updateVocabHurdle(total) {
  const el = $("#vocab-hurdle");
  if (!el) return;
  const n = total != null ? total : totalCount();
  const vb = vocabBenchmarks(n);
  const next = vb.next;
  const cleared = vb.cleared?.length || 0;
  if (next) {
    el.textContent = `${n.toLocaleString()} · next ${next.short || next.label} +${next.gap.toLocaleString()}`;
    el.title = vb.headline + "\n" + vb.rows.map((r) =>
      `${r.achieved ? "✓" : "·"} ${r.label}: ${n.toLocaleString()} / ${r.target.toLocaleString()} (${r.pct}%)`
    ).join("\n");
    el.dataset.next = next.id;
    el.classList.toggle("is-clear", false);
  } else {
    el.textContent = `${n.toLocaleString()} · hurdles cleared`;
    el.title = vb.headline;
    el.dataset.next = "";
    el.classList.toggle("is-clear", true);
  }
  el.dataset.cleared = String(cleared);
}

/**
 * Header chip: all language packs sum (~54.6M) vs active-atlas Spellings X/Y.
 * @param {object|null} [cat] lang-index doc
 */
function paintWorldSpellingsChip(cat) {
  const el = $("#stat-world");
  if (!el) return;
  const doc = cat || getLangCatalog?.() || null;
  const world =
    Number(doc?.totalSpellingsAllLangs) ||
    Number(doc?.stats?.totalSpellingsAllLangs) ||
    0;
  const packs = Number(doc?.packsReady ?? doc?.stats?.packsReady) || 0;
  if (world > 0) {
    el.textContent = `World · ${world.toLocaleString()}`;
    el.title = [
      "Sum of ready language pack totals (not deduplicated across languages).",
      "Header Spellings X/Y = active atlas (EN fold by default).",
      packs ? `packsReady=${packs}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    el.hidden = false;
    el.dataset.world = String(world);
  } else {
    el.textContent = "World · …";
    el.title = "Loading lang-index for all-language spelling sum…";
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function metricClass(value, kind) {
  if (kind === "efficiency" || kind === "comfort" || kind === "home") {
    if (value >= 70) return "good";
    if (value >= 45) return "mid";
    return "low";
  }
  if (kind === "strain" || kind === "complexity" || kind === "rsi") {
    if (value <= 30) return "good";
    if (value <= 55) return "mid";
    return "low";
  }
  return "mid";
}

/**
 * Get or compute analysis for a word (slim for list; hydrate viz on focus).
 * @param {string} word
 * @param {{ full?: boolean }} [opts]
 */
/**
 * Orthography-only stub — no keyboard / flow / strip metrics.
 * Used for non-en language packs (placeholders + future orthography-only lists).
 * @param {string} word
 */
function orthographyOnlyEntry(word) {
  const w = String(word || "").toLowerCase();
  const letter = /[a-z]/.test(w[0]) ? w[0].toUpperCase() : "#";
  return {
    word: w,
    letter,
    orthographyOnly: true,
    needsVizHydrate: false,
    primaryLayouts: [],
    allLayouts: [],
    metrics: null,
    strip: null,
    flow: null,
    braille: "",
    ascii: "",
    binary: "",
    notation: null,
    activeLayout: globalLayoutId,
  };
}

function ensureAnalyzed(word, opts = {}) {
  const key = word.toLowerCase();
  // No pack: orthography-only stub (no keyboard mass-analysis)
  if (!hasWordPack() && !opts.forceGeometry) {
    if (analysisCache.has(key)) {
      const e = analysisCache.get(key);
      if (e?.orthographyOnly || opts.full) return e;
    }
    return orthographyOnlyEntry(word);
  }
  // Non-en with pack: live geometry on demand only when full:true (focus), not every list card
  if (!hasPrecomputedAnalyzed() && !opts.full && !opts.forceGeometry) {
    if (analysisCache.has(key) && !analysisCache.get(key)?.orthographyOnly) {
      return analysisCache.get(key);
    }
    const stub = orthographyOnlyEntry(word);
    analysisCache.set(key, stub);
    return stub;
  }
  if (analysisCache.has(key)) {
    let e = analysisCache.get(key);
    // Drop orthography stubs if we switched back to en geometry
    if (e?.orthographyOnly) {
      e = analyzeWordSlim(word, globalLayoutId);
      if (e) analysisCache.set(key, e);
      return e;
    }
    // Full hydrate for canvas when needed
    if (opts.full && (e.needsVizHydrate || !e.analysis)) {
      e = analyzeWordSlim(word, globalLayoutId) || e;
      analysisCache.set(key, e);
    } else if (
      e.activeLayout !== globalLayoutId &&
      e.byLayout &&
      e.byLayout[globalLayoutId]
    ) {
      e = setActiveLayout(e, globalLayoutId);
      analysisCache.set(key, e);
    } else if (opts.full && e.activeLayout !== globalLayoutId) {
      e = analyzeWordSlim(word, globalLayoutId) || e;
      analysisCache.set(key, e);
    }
    return e;
  }
  // Live analyze (letter chunk may not be in RAM yet)
  const entry = analyzeWordSlim(word, globalLayoutId);
  if (entry) analysisCache.set(key, entry);
  return entry;
}

/**
 * Ingest precomputed letter chunk into cache.
 * @param {string} L a-z or A-Z
 * @param {{ light?: boolean, force?: boolean }} [opts]
 *   light — only first analyzed slivers (default for UI)
 *   force — allow full monoletter R2 pack (admin / offline bulk)
 */
async function ingestAnalyzedLetter(L, opts = {}) {
  if (!hasGeometryPack()) return 0;
  const low = String(L).toLowerCase();
  if (!opts.force && analyzedLetterLoaded.has(low)) {
    return letterCount(low);
  }
  // light path: sliver-first, never fat pack
  const entries = await loadAnalyzedLetter(L, {
    force: !!opts.force && !opts.light,
  });
  for (const e of entries) {
    if (e?.word && !analysisCache.has(e.word.toLowerCase())) {
      analysisCache.set(e.word.toLowerCase(), e);
    }
  }
  // Only mark fully loaded when force-downloaded monoletter pack
  if (opts.force && !opts.light) {
    analyzedLetterLoaded.add(low);
  }
  updateAnalyzedStats();
  return entries.length;
}

/**
 * Ingest analyzed geometry for one orthography prefix only (aa, the, …).
 * @param {string} prefix
 */
async function ingestAnalyzedPrefix(prefix) {
  if (!hasGeometryPack() || !hasPrecomputedAnalyzed()) return 0;
  const entries = await loadAnalyzedForQuery(prefix);
  let n = 0;
  for (const e of entries) {
    const k = String(e?.word || "").toLowerCase();
    if (k && !analysisCache.has(k)) {
      analysisCache.set(k, e);
      n += 1;
    }
  }
  updateAnalyzedStats();
  return n;
}

/**
 * Analyze entire corpus by letter chunks (browser or after disk load).
 * @param {{ onProgress?: (info: object) => void }} [opts]
 */
async function analyzeAllByLetterChunks(opts = {}) {
  if (!hasGeometryPack()) {
    opts.onProgress?.({
      letter: "—",
      done: 0,
      total: 0,
      source: "skip",
      note: "Geometry analyze-all is English-only",
    });
    return 0;
  }
  if (chunkJob?.running) return chunkJob.promise;
  const state = { running: true, aborted: false };
  const promise = (async () => {
    await loadAllLetters();
    const total = totalCount();
    let done = analysisCache.size;

    for (const L of LETTERS) {
      if (state.aborted) break;
      const low = L.toLowerCase();

      // Prefer disk chunk (force full monoletter only in bulk job)
      if (hasAnalyzedChunk(low)) {
        const n = await ingestAnalyzedLetter(low, { force: true });
        done = analysisCache.size;
        opts.onProgress?.({
          letter: L,
          letterDone: n,
          letterTotal: letterCount(low),
          done,
          total,
          source: "disk",
        });
        await yieldToUI();
        continue;
      }

      // Live analyze this letter in small batches
      const words = await loadLetter(low);
      const BATCH = 40;
      for (let i = 0; i < words.length; i += BATCH) {
        if (state.aborted) break;
        const slice = words.slice(i, i + BATCH);
        for (const w of slice) {
          if (!analysisCache.has(w)) {
            const e = analyzeWordSlim(w, globalLayoutId);
            if (e) analysisCache.set(w, e);
          }
        }
        done = analysisCache.size;
        opts.onProgress?.({
          letter: L,
          letterDone: Math.min(i + BATCH, words.length),
          letterTotal: words.length,
          done,
          total,
          source: "live",
        });
        await yieldToUI();
      }
    }
    state.running = false;
    return analysisCache.size;
  })();
  chunkJob = { ...state, promise, abort: () => { state.aborted = true; } };
  return promise;
}

function yieldToUI() {
  return new Promise((r) => setTimeout(r, 0));
}

function stripHtml(e) {
  const s = e.strip || {};
  return `
    <div class="ct-strip" title="Contrails stats strip">
      <span><em>Keys</em> <b>${s.keys ?? 0}</b></span>
      <span class="sep">|</span>
      <span><em>Eff</em> <b class="${metricClass(s.eff, "efficiency")}">${s.eff ?? 0}%</b></span>
      <span class="sep">|</span>
      <span><em>Cpx</em> <b class="${metricClass(s.cpx, "complexity")}">${s.cpx ?? 0}%</b></span>
      <span class="sep">|</span>
      <span><em>Trails</em> <b>${s.trails ?? 0}</b></span>
      <span class="sep">|</span>
      <span><em>mm</em> <b>${Math.round(s.travelMM ?? 0)}</b></span>
      <span class="sep">|</span>
      <span><em>cal</em> <b class="cal">${(s.calories ?? 0).toFixed(6)}</b></span>
    </div>
  `;
}

function truncateDisplay(s, max = 48) {
  // Grapheme-safe truncate so Hangul / Arabic / Thai shadows don't garble
  const chars = Array.from(String(s ?? ""));
  if (chars.length <= max) return chars.join("");
  return `${chars.slice(0, max - 1).join("")}…`;
}

/** Mini 3-row keyboard face for shadow cards (proves layout glyphs render). */
function miniKeyboardHtml(layoutId) {
  const lay = KEYBOARD_LAYOUTS[layoutId];
  if (!lay?.rows) return "";
  const rows = lay.rows
    .map(
      (row) =>
        `<span class="mini-kb-row">${row
          .map((k) => `<i>${escapeHtml(k)}</i>`)
          .join("")}</span>`
    )
    .join("");
  return `<div class="mini-kb" data-layout="${escapeHtml(layoutId)}" dir="${escapeHtml(lay.dir || "ltr")}" style="font-family:${SCRIPT_FONT_STACK}" aria-hidden="true">${rows}</div>`;
}

function ensurePhonation(e) {
  if (!e?.word) return null;
  if (e.phonation) return e.phonation;
  e.phonation = analyzePhonation(e.word, {
    phonetic: e.sense?.phonetic || "",
  });
  return e.phonation;
}

function ensureScholar(e) {
  if (!e?.word) return null;
  if (e.scholar && e.scholar.head === e.word.toLowerCase() && e.scholar._senseBound === !!e.sense?.definition) {
    return e.scholar;
  }
  e.scholar = analyzeScholarLinguistics(e.word, {
    layout: e.activeLayout || globalLayoutId,
    sense: e.sense,
  });
  e.scholar._senseBound = !!e.sense?.definition;
  return e.scholar;
}

function scholarBlockHtml(e) {
  const sc = ensureScholar(e);
  if (!sc) return "";
  const gloss = sc.leipzig?.formatted || "";
  const ety = sc.historical?.etymology?.primary;
  const sound = sc.historical?.soundChange;
  const cite = sc.citations;
  const typ = sc.morphosyntax?.typology;
  return `<details class="scholar-block" data-scholar-word="${escapeHtml(e.word)}">
    <summary class="scholar-summary">Scholar linguistics · gloss · features · citations · frameworks</summary>
    <div class="scholar-body">
      <div class="scholar-sec">
        <span class="sense-k">Leipzig gloss</span>
        <pre class="scholar-pre">${escapeHtml(gloss)}</pre>
      </div>
      <div class="scholar-sec">
        <span class="sense-k">Historical</span>
        <p class="scholar-p">${escapeHtml(sc.historical?.era?.label || "—")} · ${escapeHtml(ety?.family || "—")} (${escapeHtml(ety?.via || "")})</p>
        <p class="scholar-p mono">${escapeHtml(truncateDisplay(sound?.hypothesizedPath || "", 160))}</p>
        <p class="scholar-p muted">${escapeHtml(truncateDisplay(sc.historical?.cognates?.caution || "", 180))}</p>
      </div>
      <div class="scholar-sec">
        <span class="sense-k">Typology</span>
        <p class="scholar-p">${escapeHtml(typ?.wordOrder || "")} · ${escapeHtml(typ?.alignment || "")} · ${escapeHtml(typ?.mood || "")}</p>
      </div>
      <div class="scholar-sec">
        <span class="sense-k">Citations</span>
        <details class="scholar-cite"><summary>APA</summary><pre class="scholar-pre">${escapeHtml(cite?.apa || "")}</pre></details>
        <details class="scholar-cite"><summary>BibTeX</summary><pre class="scholar-pre">${escapeHtml(cite?.bibtex || "")}</pre></details>
        <details class="scholar-cite"><summary>TEI</summary><pre class="scholar-pre">${escapeHtml(cite?.tei || "")}</pre></details>
        <details class="scholar-cite"><summary>Chicago</summary><pre class="scholar-pre">${escapeHtml(cite?.chicago || "")}</pre></details>
      </div>
      <div class="scholar-sec">
        <span class="sense-k">Frameworks</span>
        <div class="scholar-fw">${LING_FRAMEWORKS.map((f) => `<span class="scholar-fw-chip" title="${escapeHtml(f.body)}">${escapeHtml(f.label)}</span>`).join("")}</div>
      </div>
      <div class="scholar-sec">
        <span class="sense-k">Professor checklist</span>
        <ul class="scholar-check">${(sc.professorChecklist || []).slice(0, 6).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
      </div>
      <div class="sense-refs">
        ${(cite?.primarySources || []).slice(0, 4).map((u) => `<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u.replace(/^https?:\/\//, "").slice(0, 28))}…</a>`).join("")}
      </div>
    </div>
  </details>`;
}

function phonationBlockHtml(e) {
  const p = ensurePhonation(e);
  if (!p) return "";
  const lines = phonationCardLines(p);
  const regChips = (p.registers || [])
    .map(
      (r) =>
        `<span class="phono-reg" style="--reg:${escapeHtml(r.color)}" title="${escapeHtml(r.tip)}">${escapeHtml(r.label.split(/[ /]/)[0])} <b>${escapeHtml((r.notes || []).join("–") || "—")}</b></span>`
    )
    .join("");
  const placeChips = (p.placements?.top || [])
    .map(
      (pl) =>
        `<span class="phono-place" title="${escapeHtml(pl.desc)} · ${escapeHtml(pl.reason)}">${escapeHtml(pl.label)}</span>`
    )
    .join("");
  const mouthSeq = (p.mouth?.sequence || [])
    .slice(0, 12)
    .map(
      (s) =>
        `<span class="phono-mouth-unit" title="lips ${escapeHtml(s.lips)} · jaw ${escapeHtml(s.jaw)} · tongue ${escapeHtml(s.tongue)} · ${escapeHtml(s.ipa)}">${escapeHtml(s.g)}<i>${escapeHtml(s.shape)}</i></span>`
    )
    .join("");

  return `<div class="phono-block" data-phono-word="${escapeHtml(e.word)}">
    <div class="phono-row">
      <span class="sense-k">Mouth</span>
      <span class="phono-main" title="${escapeHtml(lines.mouth)}">${escapeHtml(truncateDisplay(lines.mouth, 72))}</span>
    </div>
    <div class="phono-mouth-seq">${mouthSeq || "—"}</div>
    <div class="phono-row">
      <span class="sense-k">Tone</span>
      <span class="phono-tone" title="${escapeHtml(lines.tone)}">${escapeHtml(lines.tone)}</span>
      <span class="phono-ipa" title="IPA sketch">${escapeHtml(truncateDisplay(lines.ipa, 40))}</span>
    </div>
    <div class="phono-row phono-regs-row">
      <span class="sense-k">Register</span>
      <div class="phono-regs">${regChips}</div>
    </div>
    <div class="phono-row phono-place-row">
      <span class="sense-k">Place</span>
      <div class="phono-places">${placeChips}</div>
    </div>
    <div class="phono-coach" title="${escapeHtml(lines.coach)}">${escapeHtml(truncateDisplay(lines.coach, 140))}</div>
  </div>`;
}

/** Heuristic etymology line when live sense not loaded yet */
function senseBlockHtml(e) {
  ensurePhonation(e);
  const s = e.sense;
  const phono = phonationBlockHtml(e);
  const lex = s && !s.loading ? senseLexHtml(s, { compact: true }) : "";

  if (s?.loading) {
    return `<div class="sense-block is-loading" data-sense-word="${escapeHtml(e.word)}">
      <div class="sense-meaning"><span class="sense-pos">…</span> Looking up meaning · relations · etymology…</div>
      ${phono}
      ${scholarBlockHtml(e)}
    </div>`;
  }

  // D3 dual pane: geometry + open gloss (lazy module; sync if preloaded)
  let dual = "";
  try {
    if (typeof window !== "undefined" && window.__KBATCH_DUAL_PANE__) {
      dual = window.__KBATCH_DUAL_PANE__(e) || "";
    }
  } catch {
    dual = "";
  }

  // Live sense
  if (s?.definition) {
    const pos = s.partOfSpeech ? `<span class="sense-pos">${escapeHtml(s.partOfSpeech)}</span>` : "";
    const phon = s.phonetic
      ? `<span class="sense-phonetic">${escapeHtml(s.phonetic)}</span>`
      : "";
    const more =
      s.meanings?.length > 1 || (s.definitions?.length || 0) > 1
        ? `<details class="sense-more"><summary>More senses</summary><ul>${(s.meanings || [])
            .slice(0, 4)
            .map(
              (m) =>
                `<li><em>${escapeHtml(m.partOfSpeech || "")}</em> ${escapeHtml((m.definitions || [])[0] || "")}</li>`
            )
            .join("")}</ul></details>`
        : "";
    const etym = s.etymologyText
      ? `<div class="sense-etym" title="${escapeHtml(s.etymologyText)}"><span class="sense-k">Etymology</span> ${escapeHtml(truncateDisplay(s.etymologyText, 180))}</div>`
      : "";
    const fam = s.etymology?.primary
      ? `<div class="sense-family"><span class="sense-k">Family</span> ${escapeHtml(s.etymology.primary.family)} · ${escapeHtml(s.era?.label || "")}</div>`
      : "";
    const refs = `<div class="sense-refs">
      <span class="sense-badge" title="KBatch independent research — external sites are citations only">KBatch research</span>
      <a href="${escapeHtml(s.refs?.paleography || "https://fornevercollective.github.io/codex-regius-digital/paleography-hub.html#scribe")}" target="_blank" rel="noopener">Paleography</a>
      <a href="${escapeHtml(s.refs?.wiktionary || `https://en.wiktionary.org/wiki/${encodeURIComponent(e.word)}`)}" target="_blank" rel="noopener">Wiktionary ↗</a>
      <a href="${escapeHtml(s.refs?.oed || `https://www.oed.com/search/dictionary/?q=${encodeURIComponent(e.word)}`)}" target="_blank" rel="noopener">OED ↗</a>
      <a href="${escapeHtml(s.refs?.ety || `https://www.etymonline.com/word/${encodeURIComponent(e.word)}`)}" target="_blank" rel="noopener">Etymonline ↗</a>
    </div>`;
    return `<div class="sense-block" data-sense-word="${escapeHtml(e.word)}">
      ${dual}
      <div class="sense-meaning">${pos} ${phon} ${escapeHtml(truncateDisplay(s.definition, 220))}</div>
      ${etym}
      ${fam}
      ${lex}
      ${more}
      ${refs}
      ${phono}
      ${scholarBlockHtml(e)}
    </div>`;
  }

  // Heuristic fallback always visible
  const etymH = guessEtymology(e.word);
  const era = guessEra(e.word);
  const adopt = buildAdoption(e.word, {
    etymology: etymH,
    era,
    etymologyText: "",
    firstRecorded: null,
  });
  return `<div class="sense-block sense-heuristic" data-sense-word="${escapeHtml(e.word)}">
    ${dual}
    <div class="sense-meaning"><span class="sense-pos">—</span> <em>Meaning loading…</em> or offline</div>
    <div class="sense-etym"><span class="sense-k">Etymology</span> ${escapeHtml(etymH.primary?.family || "—")} (${escapeHtml(etymH.primary?.via || "heuristic")}) · ${escapeHtml(era?.label || "")}</div>
    <div class="lex-row"><span class="sense-k">Adoption</span><span class="lex-text">${escapeHtml(adopt.pathLabel)}</span></div>
    <div class="lex-row"><span class="sense-k">Word agency</span><span class="lex-text">${escapeHtml(adopt.agency?.label || "General")}</span></div>
    <div class="sense-refs">
      <a href="https://en.wiktionary.org/wiki/${encodeURIComponent(e.word)}" target="_blank" rel="noopener">Wiktionary</a>
      <a href="https://www.etymonline.com/word/${encodeURIComponent(e.word)}" target="_blank" rel="noopener">Etymonline</a>
    </div>
    ${phono}
    ${scholarBlockHtml(e)}
  </div>`;
}

/** When false, word cards show primary layouts only (not full 15-board ring). */
let showAllKeyboards = false;

function renderWordCard(e) {
  const focused =
    focusedEntry?.word?.toLowerCase() === String(e.word || "").toLowerCase()
      ? "is-focused"
      : "";
  const wordFull = String(e.word || "");
  const wordShow = truncateDisplay(wordFull, 64);
  const uiId = uiLangIdFor(activeLangId);
  const L = descT(uiId);

  // Always attach meaning / description under the word (even orthography-only).
  // Previously ortho cards skipped the sense block → search felt “empty” under the list.
  const senseHtml = senseBlockHtml(e);

  // Orthography-only: spelling + sense; geometry deferred until refresh/focus
  if (e?.orthographyOnly || !hasGeometryPack()) {
    return `
    <article class="word-card is-ortho-only ${focused}" data-word="${escapeHtml(e.word)}" data-letter="${escapeHtml(e.letter)}" tabindex="0" data-ui-lang="${escapeHtml(uiId)}" data-mode="orthography">
      <div class="word-row word-row--primary">
        <h3 class="word-label" title="${escapeHtml(wordFull)}">${escapeHtml(wordShow)}</h3>
        <span class="ortho-badge" title="Spelling pack · open card or Refresh keyboards for live geometry">orthography</span>
      </div>
      ${senseHtml}
      <p class="word-ortho-note">Spelling index · click card or use <strong>Refresh keyboards</strong> for layout geometry / flow / strip.</p>
    </article>
  `;
  }

  const layouts = (e.primaryLayouts || [])
    .map(
      (row) =>
        `<span class="layout-chip" title="${escapeHtml(row.name)} · ${escapeHtml(row.text)} · Eff ${row.efficiency ?? "—"}">
          <em>${escapeHtml(row.name)}</em>
          <b>${escapeHtml(truncateDisplay(row.text, 28))}</b>
        </span>`
    )
    .join("");

  // Full ring only when user asked (Refresh keyboards / Show all) — avoids painting 15 boards on every hit
  const allLayoutMini =
    showAllKeyboards || focused
      ? (e.allLayouts || [])
          .map(
            (row) =>
              `<span class="layout-mini" title="${escapeHtml(row.name)}: ${escapeHtml(row.text)}">${escapeHtml(row.id.slice(0, 3))}<i>${escapeHtml(truncateDisplay(String(row.text), 12))}</i></span>`
          )
          .join("")
      : "";

  const m = e.metrics || {};
  let desc;
  try {
    desc = describeWord(wordFull, uiId);
  } catch {
    desc = null;
  }
  const activeShadow =
    (e.allLayouts || []).find((x) => x.id === globalLayoutId)?.text ||
    (e.primaryLayouts || []).find((x) => x.id === globalLayoutId)?.text ||
    e.layouts?.[globalLayoutId] ||
    desc?.geometricDialect ||
    wordFull;
  const descBlock = desc
    ? `<div class="word-desc" dir="${escapeHtml(desc.dir || "ltr")}" data-desc-lang="${escapeHtml(uiId)}">
        <p class="word-desc-title"><span class="sense-k">${escapeHtml(desc.title)}</span> · ${escapeHtml(desc.layoutName || "")}</p>
        <p class="word-desc-body">${escapeHtml(desc.description)}</p>
        <p class="word-desc-shadow" title="${escapeHtml(desc.dialectNote || "")}"><span class="sense-k">shadow</span> <b>${escapeHtml(truncateDisplay(activeShadow, 48))}</b> · ${escapeHtml(L.layouts || "layouts")}</p>
        <p class="word-desc-meta">${escapeHtml(L.strip || "")} · ${escapeHtml(L.metrics || "")}</p>
      </div>`
    : "";

  const kbRing =
    showAllKeyboards || focused
      ? `<div class="word-row word-row--layouts-all" title="All layout shadows">${allLayoutMini || `<span class="word-kb-hint">No layout ring yet — Refresh keyboards</span>`}</div>`
      : `<div class="word-row word-row--layouts-all is-collapsed">
          <button type="button" class="btn btn-ghost btn-kb-expand" data-kb-expand="${escapeHtml(e.word)}" title="Load all language layout shadows for this word">Show all keyboards</button>
        </div>`;

  return `
    <article class="word-card ${focused}" data-word="${escapeHtml(e.word)}" data-letter="${escapeHtml(e.letter)}" tabindex="0" data-ui-lang="${escapeHtml(uiId)}">
      <div class="word-row word-row--primary">
        <h3 class="word-label" title="${escapeHtml(wordFull)}">${escapeHtml(wordShow)}</h3>
        <div class="layout-scroll" role="list">${layouts}</div>
      </div>
      ${senseHtml}
      ${descBlock}
      ${kbRing}
      ${stripHtml(e)}
      <div class="word-row word-row--secondary">
        <div class="meta-cell meta-ddr"><span class="meta-k">DDR</span><span class="meta-v ddr-flow" title="${escapeHtml(e.flow?.ddr || "")}">${escapeHtml(truncateDisplay(e.flow?.ddr || "·", 40))}</span></div>
        <div class="meta-cell meta-braille"><span class="meta-k">${escapeHtml(L.braille || "Braille")}</span><span class="meta-v braille" title="${escapeHtml(e.braille)}">${escapeHtml(truncateDisplay(e.braille, 36))}</span></div>
        <div class="meta-cell meta-ascii"><span class="meta-k">ASCII</span><span class="meta-v mono" title="${escapeHtml(e.ascii || "")}">${escapeHtml(truncateDisplay(e.ascii || "—", 40))}</span></div>
        <div class="meta-cell meta-binary"><span class="meta-k">Binary</span><span class="meta-v mono" title="${escapeHtml(e.binary || "")}">${escapeHtml(truncateDisplay(e.binary || "—", 48))}</span></div>
        <div class="meta-cell meta-dance"><span class="meta-k">${escapeHtml(L.dance || "Dance")}</span><span class="meta-v" title="${escapeHtml(e.notation?.dance || "")}">${escapeHtml(truncateDisplay(e.notation?.dance || "—", 48))}</span></div>
        <div class="meta-cell meta-music"><span class="meta-k">Notes</span><span class="meta-v mono" title="${escapeHtml(e.notation?.music || "")}">${escapeHtml(truncateDisplay(e.notation?.music || "—", 36))}</span></div>
        <div class="meta-cell meta-flow"><span class="meta-k">Flow</span><span class="meta-v flow-arrows" title="${escapeHtml(e.flow?.arrows || "")} ${escapeHtml(e.flow?.pattern || "")}">${escapeHtml(truncateDisplay(e.flow?.arrows || "·", 32))} <small>${escapeHtml(truncateDisplay(e.flow?.pattern || "", 24))}</small></span></div>
        <div class="meta-cell meta-metrics">
          <span class="meta-k">${escapeHtml(L.metrics || "Metrics")}</span>
          <span class="meta-v metrics-pills">
            <span class="pill ${metricClass(m.efficiency, "efficiency")}">E ${m.efficiency ?? "—"}</span>
            <span class="pill ${metricClass(m.complexity, "complexity")}">C ${m.complexity ?? "—"}</span>
            <span class="pill ${metricClass(m.strain, "strain")}">S ${m.strain ?? "—"}</span>
            <span class="pill ${metricClass(m.rsiRisk, "rsi")}">RSI ${m.rsiRisk ?? "—"}</span>
            <span class="pill mid">${m.travelMM ?? "—"}mm</span>
            <span class="pill mid">${(m.calories ?? 0).toFixed?.(6) ?? "—"} cal</span>
            <span class="pill mid">${m.bpm ?? "—"} ${escapeHtml(m.timeSig || "")}</span>
          </span>
        </div>
      </div>
    </article>
  `;
}

/**
 * After rendering visible cards, fetch meanings for those words and patch DOM.
 * @param {object[]} entries
 */
async function hydrateMeanings(entries) {
  const need = entries.filter((e) => e && !e.sense?.definition && !e.sense?.loading);
  if (!need.length) {
    // still patch loading ones that finished
    const loading = entries.filter((e) => e?.sense?.definition);
    for (const e of loading) patchSenseDom(e);
    return;
  }
  for (const e of need) {
    e.sense = { ...(e.sense || {}), loading: true };
  }
  // show loading state
  for (const e of need) patchSenseDom(e);

  await enrichEntries(need, 3);
  for (const e of need) {
    analysisCache.set(e.word.toLowerCase(), e);
    patchSenseDom(e);
  }
  if (focusedEntry) {
    const fe = analysisCache.get(focusedEntry.word.toLowerCase());
    if (fe) {
      focusedEntry = fe;
      updateFocusSense(fe);
    }
  }
}

function patchSenseDom(e) {
  if (!e?.word) return;
  const card = document.querySelector(
    `.word-card[data-word="${CSS.escape(e.word)}"]`
  );
  if (!card) return;
  const existing = card.querySelector(".sense-block");
  const html = senseBlockHtml(e);
  if (existing) {
    existing.outerHTML = html;
  } else {
    const label = card.querySelector(".word-row--primary");
    if (label) label.insertAdjacentHTML("afterend", html);
  }
}

function updateFocusSense(e) {
  const el = $("#focus-sense");
  if (!el || !e) return;
  const s = e.sense;
  const p = ensurePhonation(e);
  // refresh phonetic into phonation when sense arrives
  if (p && s?.phonetic && p.phonetic !== s.phonetic) {
    e.phonation = analyzePhonation(e.word, { phonetic: s.phonetic });
  }
  const ph = phonationCardLines(e.phonation || p);
  const phonoHtml = e.phonation
    ? `<div class="focus-phono">
        <div><span class="sense-k">Mouth</span> ${escapeHtml(ph.mouth)}</div>
        <div><span class="sense-k">Tone</span> ${escapeHtml(ph.tone)}</div>
        <div><span class="sense-k">Place</span> ${escapeHtml(ph.place)}</div>
        <div class="focus-regs">${escapeHtml(ph.registers)}</div>
        <div class="phono-coach">${escapeHtml(ph.coach)}</div>
      </div>`
    : "";
  const sc = ensureScholar(e);
  const scholarMini = sc
    ? `<div class="focus-scholar">
        <div><span class="sense-k">Gloss</span> <span class="mono">${escapeHtml(truncateDisplay(sc.leipzig?.gloss || "", 80))}</span></div>
        <div><span class="sense-k">Typology</span> ${escapeHtml(sc.morphosyntax?.typology?.wordOrder || "")}</div>
        <div><span class="sense-k">Sound law</span> ${escapeHtml(truncateDisplay(sc.historical?.soundChange?.hypothesizedPath || "", 90))}</div>
      </div>`
    : "";

  const lex = s && !s.loading ? senseLexHtml(s, { compact: false }) : "";
  if (s?.definition) {
    el.innerHTML = `
      <div class="focus-meaning"><span class="sense-pos">${escapeHtml(s.partOfSpeech || "")}</span> ${escapeHtml(s.definition)}</div>
      <div class="focus-etym"><span class="sense-k">Etymology</span> ${escapeHtml(s.etymologyText || s.etymology?.primary?.family || "—")}</div>
      ${s.phonetic ? `<div class="focus-phonetic">${escapeHtml(s.phonetic)}</div>` : ""}
      ${lex}
      ${phonoHtml}
      ${scholarMini}
    `;
  } else {
    const etym = guessEtymology(e.word);
    const era = guessEra(e.word);
    el.innerHTML = `
      <div class="focus-meaning"><em>${s?.loading ? "Loading meaning · relations…" : "Meaning unavailable offline"}</em></div>
      <div class="focus-etym"><span class="sense-k">Etymology</span> ${escapeHtml(etym.primary?.family || "—")} (${escapeHtml(etym.primary?.via || "")}) · ${escapeHtml(era?.label || "")}</div>
      ${lex}
      ${phonoHtml}
      ${scholarMini}
    `;
  }
}

/**
 * Apply aa/ab/ac prefix subsection filter when active.
 * @param {string[]} words
 * @param {string} L
 */
function applyPrefixFilter(words, L) {
  if (!activePrefix) return words;
  const letter = String(L || "").toLowerCase().slice(0, 1);
  if (letter && activePrefix[0] !== letter) return words;
  // Prefer loaded sliver list (exact catalog bucket)
  const fromSliver = wordsForPrefix(activePrefix);
  if (fromSliver.length) {
    const set = new Set(fromSliver);
    return words.filter((w) => set.has(String(w).toLowerCase()) || set.has(w));
  }
  return words.filter((w) => wordMatchesPrefix(w, activePrefix));
}

/**
 * Words to show for a letter (search mode or browse).
 * Register filter (slang / shorthand / off) uses data/registers packs.
 * Active prefix (aa/ab/ac…) narrows the open letter section.
 * @param {string} L A-Z
 */
function wordsForSection(L) {
  if (searchHits) {
    const key = String(L || "");
    const hits = searchHits.filter((w) => {
      const w0 = String(w || "");
      if (/^[A-Z]$/.test(key) || /^[a-z]$/.test(key)) {
        return w0[0]?.toUpperCase() === key.toUpperCase();
      }
      // unicode / hash bucket: match loaded list membership
      return (wordsForLetter(key) || []).includes(w0);
    });
    return applyPrefixFilter(applyRegisterAndCapsuleFilters(hits, L), L);
  }
  if (activeRegisterId && activeRegisterId !== "standard") {
    const key = `${activeRegisterId}:${L.toLowerCase()}`;
    const set = registerLetterCache[key];
    if (set) {
      return applyPrefixFilter(
        applyCapsuleFilterOnly([...set].sort((a, b) => a.localeCompare(b))),
        L
      );
    }
    return [];
  }
  // Capsule-only browse: show capsule words for this letter
  if (hasActiveCapsuleFilter()) {
    const pool = collectCapsuleWordsForLetter(L);
    return applyPrefixFilter(pool.sort((a, b) => a.localeCompare(b)), L);
  }
  // When a prefix subsection is active, prefer the sliver pack (fast, paged)
  if (
    activePrefix &&
    String(L || "").toLowerCase().slice(0, 1) === activePrefix[0]
  ) {
    const sliver = wordsForPrefix(activePrefix);
    if (sliver.length) {
      return applyRegisterAndCapsuleFilters(sliver.slice(), L);
    }
  }
  // bucket id may be a-z, unicode, or s00 hash
  const base =
    wordsForLetter(String(L).toLowerCase()) || wordsForLetter(String(L)) || [];
  return applyPrefixFilter(base, L);
}

function hasActiveCapsuleFilter() {
  return (
    (activeAgeCapsule && activeAgeCapsule !== "all") ||
    (activeRegionCapsule && activeRegionCapsule !== "all") ||
    (activeThemeCapsule && activeThemeCapsule !== "all")
  );
}

/** @param {string[]} words */
function applyCapsuleFilterOnly(words) {
  if (!hasActiveCapsuleFilter()) return words;
  return words.filter((w) => wordMatchesCapsules(String(w).toLowerCase()));
}

function wordMatchesCapsules(w) {
  if (activeAgeCapsule && activeAgeCapsule !== "all") {
    const set = capsuleWordCache[`age:${activeAgeCapsule}`];
    if (set && !set.has(w)) return false;
  }
  if (activeRegionCapsule && activeRegionCapsule !== "all") {
    const set = capsuleWordCache[`region:${activeRegionCapsule}`];
    if (set && !set.has(w)) return false;
  }
  if (activeThemeCapsule && activeThemeCapsule !== "all") {
    const set = capsuleWordCache[`theme:${activeThemeCapsule}`];
    if (set && !set.has(w)) return false;
  }
  return true;
}

function collectCapsuleWordsForLetter(L) {
  const letter = String(L || "").toLowerCase();
  /** @type {Set<string>|null} */
  let acc = null;
  const intersect = (set) => {
    if (!set) return;
    if (!acc) acc = new Set(set);
    else {
      for (const w of [...acc]) if (!set.has(w)) acc.delete(w);
    }
  };
  if (activeAgeCapsule && activeAgeCapsule !== "all") {
    intersect(capsuleWordCache[`age:${activeAgeCapsule}`]);
  }
  if (activeRegionCapsule && activeRegionCapsule !== "all") {
    intersect(capsuleWordCache[`region:${activeRegionCapsule}`]);
  }
  if (activeThemeCapsule && activeThemeCapsule !== "all") {
    intersect(capsuleWordCache[`theme:${activeThemeCapsule}`]);
  }
  if (!acc) return [];
  return [...acc].filter((w) => w[0] === letter);
}

/**
 * @param {string[]} words
 * @param {string} L
 */
function applyRegisterAndCapsuleFilters(words, L) {
  let out = words;
  if (activeRegisterId && activeRegisterId !== "standard") {
    const key = `${activeRegisterId}:${String(L || "").toLowerCase()}`;
    const set = registerLetterCache[key];
    if (!set || !set.size) return [];
    out = out.filter((w) => set.has(String(w).toLowerCase()));
  }
  return applyCapsuleFilterOnly(out);
}

/**
 * Preload register letter packs for open / active sections.
 * @param {string} [register]
 */
async function preloadRegisterLetters(register = activeRegisterId) {
  const reg = String(register || "standard").toLowerCase();
  if (reg === "standard") return;
  const letters = new Set(
    [...openSections].map((L) => L.toLowerCase()).concat(activeLetter.toLowerCase())
  );
  for (const ch of "abcdefghijklmnopqrstuvwxyz") letters.add(ch);
  await Promise.all(
    [...letters].map(async (L) => {
      const key = `${reg}:${L}`;
      if (registerLetterCache[key]) return;
      const set = await loadRegisterLetter(reg, L);
      registerLetterCache[key] = set || new Set();
    })
  );
}

async function preloadActiveCapsules() {
  const jobs = [];
  if (activeAgeCapsule && activeAgeCapsule !== "all") {
    jobs.push(
      loadCapsule("age", activeAgeCapsule).then((s) => {
        capsuleWordCache[`age:${activeAgeCapsule}`] = s;
      })
    );
  }
  if (activeRegionCapsule && activeRegionCapsule !== "all") {
    jobs.push(
      loadCapsule("region", activeRegionCapsule).then((s) => {
        capsuleWordCache[`region:${activeRegionCapsule}`] = s;
      })
    );
  }
  if (activeThemeCapsule && activeThemeCapsule !== "all") {
    jobs.push(
      loadCapsule("theme", activeThemeCapsule).then((s) => {
        capsuleWordCache[`theme:${activeThemeCapsule}`] = s;
      })
    );
  }
  await Promise.all(jobs);
}

/**
 * Render Standard / Slang / Shorthand / Off chips (dict + shadow).
 * @param {string} selector
 */
function renderRegisterFilterBar(selector) {
  const el = $(selector);
  if (!el) return;
  const idx = getRegisterIndex();
  const counts = idx?.registers || {};
  el.innerHTML = REGISTER_IDS.map((id) => {
    const meta = REGISTER_META[id];
    const n =
      id === "standard"
        ? totalCount() || counts.standard || 0
        : counts[id] || 0;
    const on = id === activeRegisterId ? "is-on" : "";
    return `<button type="button" class="reg-filter-chip ${on}" data-dict-register="${escapeHtml(id)}" title="${escapeHtml(meta?.desc || id)}" aria-pressed="${id === activeRegisterId}">${escapeHtml(meta?.label || id)} <small>${Number(n).toLocaleString()}</small></button>`;
  }).join("");
}

/**
 * Age / region / theme capsule chip rows.
 */
function renderCapsuleFilterBars() {
  const capIdx = getCapsuleIndex() || {};
  const ageEl = $("#capsule-age-filters");
  const regEl = $("#capsule-region-filters");
  const themeEl = $("#capsule-theme-filters");
  if (ageEl) {
    ageEl.innerHTML =
      `<button type="button" class="reg-filter-chip ${activeAgeCapsule === "all" ? "is-on" : ""}" data-capsule-age="all">All ages</button>` +
      AGE_CAPSULES.map((c) => {
        const n = capIdx.ages?.[c.id] || 0;
        const on = activeAgeCapsule === c.id ? "is-on" : "";
        return `<button type="button" class="reg-filter-chip is-age ${on}" data-capsule-age="${escapeHtml(c.id)}" title="${escapeHtml(c.years)}">${escapeHtml(c.label)} <small>${Number(n).toLocaleString()}</small></button>`;
      }).join("");
  }
  if (regEl) {
    regEl.innerHTML =
      `<button type="button" class="reg-filter-chip ${activeRegionCapsule === "all" ? "is-on" : ""}" data-capsule-region="all">All regions</button>` +
      REGION_CAPSULES.map((c) => {
        const n = capIdx.regions?.[c.id] || 0;
        const on = activeRegionCapsule === c.id ? "is-on" : "";
        return `<button type="button" class="reg-filter-chip is-region ${on}" data-capsule-region="${escapeHtml(c.id)}">${escapeHtml(c.label)} <small>${Number(n).toLocaleString()}</small></button>`;
      }).join("");
  }
  if (themeEl) {
    themeEl.innerHTML =
      `<button type="button" class="reg-filter-chip ${activeThemeCapsule === "all" ? "is-on" : ""}" data-capsule-theme="all">All themes</button>` +
      THEME_CAPSULES.map((c) => {
        const n = capIdx.themes?.[c.id] || 0;
        const on = activeThemeCapsule === c.id ? "is-on" : "";
        return `<button type="button" class="reg-filter-chip is-theme ${on}" data-capsule-theme="${escapeHtml(c.id)}">${escapeHtml(c.label)} <small>${Number(n).toLocaleString()}</small></button>`;
      }).join("");
  }
}

/**
 * Apply register layer (dict filter + shadow tags + re-render).
 * @param {string} regId
 */

function renderPersonaBar() {
  const el = $("#persona-filters");
  if (!el) return;
  const active = getActivePersona();
  el.innerHTML = PERSONA_PRESETS.map((p) => {
    const on = p.id === active.id ? "is-on" : "";
    return `<button type="button" class="reg-filter-chip ${on}" data-persona="${escapeHtml(p.id)}" title="${escapeHtml(p.tone)} · ${escapeHtml(p.formality)}">${escapeHtml(p.label)}</button>`;
  }).join("");
}

async function setActiveDictRegister(regId) {
  const id = String(regId || "standard").toLowerCase();
  if (!REGISTER_IDS.includes(id)) return;
  activeRegisterId = id;
  renderRegisterFilterBar("#dict-register-filters");
  renderRegisterFilterBar("#shadow-register-filters");
  renderLangSection();
  if (id !== "standard") {
    $("#status-line").textContent = `Loading register · ${REGISTER_META[id]?.label || id}…`;
    await preloadRegisterLetters(id);
  }
  await preloadActiveCapsules();
  render();
  const meta = REGISTER_META[id];
  const n = id === "standard" ? totalCount() : getRegisterIndex()?.registers?.[id] || 0;
  $("#status-line").textContent = `Register · ${meta?.label || id} · ${Number(n).toLocaleString()} · ${meta?.desc || ""}`;
  if (lastShadowLive?.trimmed) runShadowLive();
}

/**
 * @param {"age"|"region"|"theme"} kind
 * @param {string} id
 */
async function setActiveCapsule(kind, id) {
  const v = String(id || "all");
  if (kind === "age") activeAgeCapsule = v;
  if (kind === "region") activeRegionCapsule = v;
  if (kind === "theme") activeThemeCapsule = v;
  renderCapsuleFilterBars();
  $("#status-line").textContent = `Loading capsule · ${kind} · ${v}…`;
  await preloadActiveCapsules();
  // When filtering capsules alone, switch dict to slang if still on standard
  if (hasActiveCapsuleFilter() && activeRegisterId === "standard") {
    activeRegisterId = "slang";
    renderRegisterFilterBar("#dict-register-filters");
    renderRegisterFilterBar("#shadow-register-filters");
    await preloadRegisterLetters("slang");
  }
  render();
  $("#status-line").textContent = `Capsule · age ${activeAgeCapsule} · region ${activeRegionCapsule} · theme ${activeThemeCapsule}`;
  if (lastShadowLive?.trimmed) runShadowLive();
}

/**
 * When rendering an open letter, prefer pre-analyzed pack if in cache;
 * otherwise analyzeWordSlim for visible page only.
 */
function entryForWord(w) {
  const key = w.toLowerCase();
  if (analysisCache.has(key)) return analysisCache.get(key);
  return ensureAnalyzed(w);
}

function currentLang() {
  const d = DESC_LANGS.find((l) => l.id === activeLangId);
  if (d) return d;
  const mt = motherTongueById(activeLangId);
  return {
    id: mt.id,
    label: mt.label,
    layout: mt.layout,
    dir: mt.dir || "ltr",
  };
}

/**
 * Alphabet scrubber for the *active keyboard* (globalLayoutId).
 * Labels swap into that layout's script; corpus sections stay A–Z via latin map.
 */
function activeAlphabetGlyphs() {
  return alphabetForLayout(globalLayoutId);
}

/**
 * Language bar alphabet — traditional script order when non-Latin keyboard,
 * otherwise A–Z with layout glyphs.
 */
function activeScriptAlphabet() {
  return scriptAlphabetForLayout(globalLayoutId);
}

/**
 * Render origin / register / path rows (shared by Language section + Writer).
 * @param {string} originSel
 * @param {string} regSel
 * @param {string} pathSel
 * @param {ReturnType<typeof analyzeLanguageStepping> | null} step
 * @param {string} [pathId]
 */
function renderSteppingRows(originSel, regSel, pathSel, step, pathId) {
  const path = pathId
    ? steppingPathById(pathId)
    : step?.pathway
      ? STEPPING_PATHS.find((p) => p.id === step.pathway.id) || steppingPathById(activePathId)
      : steppingPathById(activePathId);

  const originRow = $(originSel);
  if (originRow) {
    const pipeline = step?.origin?.pipeline || COMM_SOUND_ORIGINS.map((o) => ({
      ...o,
      active: false,
      reached: true,
    }));
    originRow.innerHTML = pipeline
      .map((o) => {
        const cls = [
          "step-origin-chip",
          o.reached ? "is-reached" : "",
          o.active ? "is-active" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<span class="${cls}" title="${escapeHtml(o.desc)}" style="border-color: color-mix(in srgb, ${escapeHtml(o.color)} 35%, var(--line-soft))">
          ${escapeHtml(o.label)}
          <small>L${o.stage} · ${escapeHtml(o.era)}</small>
        </span>`;
      })
      .join("");
  }

  const regRow = $(regSel);
  if (regRow) {
    const spectrum =
      step?.register?.spectrum ||
      SPEECH_REGISTERS.map((r) => ({
        ...r,
        hit: r.id === activeRegisterId,
        active: r.id === activeRegisterId,
        score: 0,
      }));
    regRow.innerHTML = spectrum
      .map((r) => {
        const cls = [
          "step-reg-chip",
          r.hit ? "is-hit" : "",
          r.active || r.id === activeRegisterId ? "is-active" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button type="button" class="${cls}" data-register="${escapeHtml(r.id)}" title="${escapeHtml(r.desc)}" style="--chip-c: ${escapeHtml(r.color)}" role="tab" aria-selected="${r.active || r.id === activeRegisterId}">${escapeHtml(r.label)}</button>`;
      })
      .join("");
  }

  const pathRow = $(pathSel);
  if (pathRow && path) {
    pathRow.innerHTML = path.steps
      .map((s, i) => {
        const isLast = i === path.steps.length - 1;
        const active = isLast ? "is-active" : "";
        return `<div class="step-path-node">
          <div class="step-path-card ${active}" title="${escapeHtml(s.role)}">
            <strong>${escapeHtml(s.label)}</strong>
            <span>${escapeHtml(s.years)}</span>
            <em>${escapeHtml(s.role)}</em>
          </div>
          ${isLast ? "" : '<span class="step-path-arrow" aria-hidden="true">→</span>'}
        </div>`;
      })
      .join("");
  }
}

function renderLangSection() {
  const row = $("#lang-chip-row");
  const meta = $("#lang-section-meta");
  const alpha = $("#lang-alpha-bar");
  const title = $("#list-toolbar-title");
  if (!row) return;

  const lang = currentLang();
  const layout = KEYBOARD_LAYOUTS[lang.layout];
  const mt = motherTongueById(activeLangId);
  const path = steppingPathById(activePathId);

  // Tier filter chips (Core · First Nations · Classical · World · All)
  const tierRow = $("#lang-tier-row");
  const stats = languageCatalogStats();
  if (tierRow) {
    const tiers = [
      { id: "mother", n: stats.byTier?.mother || 0 },
      { id: "first-nations", n: stats.byTier?.["first-nations"] || ANCESTORY_FIRST_NATIONS.length },
      { id: "classical", n: stats.byTier?.classical || 0 },
      { id: "world", n: stats.byTier?.world || 0 },
      { id: "all", n: stats.total || MOTHER_TONGUES.length },
    ];
    tierRow.innerHTML = tiers
      .map((t) => {
        const on = t.id === activeLangTier ? "is-on" : "";
        const label = LANG_TIER_META[t.id]?.short || t.id;
        return `<button type="button" class="lang-tier-chip ${on}" data-lang-tier="${escapeHtml(t.id)}" title="${escapeHtml(LANG_TIER_META[t.id]?.label || t.id)}">${escapeHtml(label)} <b>${t.n}</b></button>`;
      })
      .join("");
  }

  // Languages for active tier (default: core mother tongues)
  const pool =
    activeLangTier === "all"
      ? MOTHER_TONGUES
      : languagesByTier(activeLangTier);
  const catById = new Map(
    (getLangCatalog()?.languages || []).map((l) => [l.id, l])
  );
  const langs = pool.map((m) => {
    const d = DESC_LANGS.find((x) => x.id === m.id && !x.placeholder);
    const cat = catById.get(m.id);
    return {
      id: m.id,
      label: m.label,
      nativeName: m.nativeName,
      family: m.family,
      region: m.region,
      layout: m.layout,
      dir: m.dir,
      script: m.script,
      status: cat?.status || m.status,
      tier: cat?.tier || m.tier,
      hasUiPack: !!d,
      packPresent: !!(cat?.packPresent || (cat?.total || 0) > 0),
      total: cat?.total || 0,
      note: m.note || cat?.note || "",
    };
  });

  row.innerHTML = langs
    .map((l) => {
      const lay = KEYBOARD_LAYOUTS[l.layout];
      const active = l.id === activeLangId ? "is-active" : "";
      const soft = l.hasUiPack ? "" : "is-soft";
      const isFn = l.tier === "first-nations" || l.status === "honor" || l.status === "honor-seed";
      const hasPack = hasWordPack(l.id) || l.packPresent || (l.total || 0) > 0;
      const honorSeed = isFn && hasPack;
      const honor =
        isFn ? (honorSeed ? "is-honor is-honor-seed" : "is-honor") : "";
      const ph =
        !hasPack &&
        (l.status === "placeholder" || l.status === "honor")
          ? "is-placeholder"
          : "";
      const tip = [
        l.nativeName,
        l.family,
        l.region,
        hasPack
          ? isFn
            ? "FN educational seed · opt-in · community-first (not a full open corpus)"
            : "orthography pack ready"
          : isFn
            ? "FN reserved · community pack not yet authorized"
            : l.hasUiPack
              ? "UI pack"
              : "placeholder · soft UI",
        l.seedNote || l.note,
      ]
        .filter(Boolean)
        .join(" · ");
      const fnBadge = isFn
        ? honorSeed
          ? " · FN seed"
          : " · FN gate"
        : "";
      return `<button type="button" class="lang-chip ${active} ${soft} ${honor} ${ph}" data-lang="${escapeHtml(l.id)}" role="tab" aria-selected="${l.id === activeLangId}" title="${escapeHtml(tip)}">
      ${escapeHtml(l.nativeName || l.label)}
      <small>${escapeHtml(l.family || lay?.script || "")}${fnBadge}${!isFn && hasPack ? " · pack" : ""} · ${escapeHtml(lay?.name || l.layout)}</small>
    </button>`;
    })
    .join("");

  const dir = mt.dir || lang.dir || "ltr";
  if (meta) {
    const packOn = hasWordPack(mt.id) || mt.packPresent || (mt.total || 0) > 0;
    const packNote =
      mt.status === "honor-seed" ||
      ((mt.status === "honor" || mt.tier === "first-nations") && packOn)
        ? " · FN educational seed ready (opt-in · community-first)"
        : mt.status === "honor" || mt.tier === "first-nations"
          ? " · FN reserved (community gate)"
          : mt.status === "placeholder"
            ? " · pack placeholder"
            : packOn
              ? " · pack ready"
              : "";
    meta.textContent = `${mt.nativeName} · ${mt.family} · ${layout?.name || globalLayoutId} · ${mt.script} · ${String(dir).toUpperCase()} · ${mt.region} · UI ${uiLangIdFor(activeLangId)} · ${stats.total} langs · ${stats.firstNations} First Nations · ${DESC_LANGS_CORE_COUNT()} UI core${packNote}`;
    meta.dir = dir;
  }

  const U = uiPack(uiLangIdFor(activeLangId));
  const lead = $("#lang-section-lead");
  if (lead && !lead.hasAttribute("data-i18n-locked")) {
    // Keep i18n base string from applyUiLanguage; append live path
    lead.textContent = `${U.langLead || lead.textContent} · ${mt.nativeName} · ${path.label}`;
  }

  if (title) {
    title.textContent = `${U.listTitle || "A–Z"} · ${mt.nativeName}`;
  }
  const dictMeta = $("#dict-section-meta");
  if (dictMeta) {
    dictMeta.textContent = `${totalCount().toLocaleString()} spellings · ${mt.nativeName} · ${layout?.name || globalLayoutId} · geometric shadows`;
  }

  // Pathway selector
  const pathSel = $("#lang-path-select");
  if (pathSel) {
    pathSel.innerHTML = STEPPING_PATHS.map(
      (p) =>
        `<option value="${escapeHtml(p.id)}" ${p.id === activePathId ? "selected" : ""}>${escapeHtml(p.label)}</option>`
    ).join("");
  }
  // Origin Rubik cubes track mother tongue + pathway
  try {
    if ($("#rubik-map-body") || $("#rubik-all-map-body")) {
      renderRubikPanels($("#shadow-input")?.value || "", lastPatternLab, null);
    }
  } catch {
    /* early boot */
  }
  const pathTitle = $("#lang-path-title");
  if (pathTitle) pathTitle.textContent = path.label;
  const pathNote = $("#lang-path-note");
  if (pathNote) {
    const sib = MOTHER_TONGUES.filter((m) => m.family === mt.family && m.id !== mt.id)
      .map((m) => m.label)
      .slice(0, 6)
      .join(", ");
    pathNote.textContent = lastStepping?.pathway?.contactNote
      ? lastStepping.pathway.contactNote
      : `${mt.nativeName} (${mt.family})${sib ? ` · siblings: ${sib}` : ""} · register: ${SPEECH_REGISTERS.find((r) => r.id === activeRegisterId)?.label || "standard"} · pick Writer text to score slang/shorthand/off-sound.`;
  }

  // Origin / register / path rows from last analysis or defaults
  const step =
    lastStepping ||
    analyzeLanguageStepping("", { langId: activeLangId, family: mt.family });
  renderSteppingRows("#lang-origin-row", "#lang-register-row", "#lang-path-row", step, activePathId);

  // Alphabet list swaps to the chosen keyboard's script
  const glyphs = activeScriptAlphabet();
  const lay = KEYBOARD_LAYOUTS[globalLayoutId];
  if (alpha) {
    alpha.dir = lay?.dir || lang.dir;
    alpha.dataset.layout = globalLayoutId;
    alpha.dataset.script = lay?.script || "Latin";
    alpha.innerHTML = glyphs
      .map((g) => {
        const section = g.latin || "A";
        const active = section === activeLetter ? "is-active" : "";
        const off = g.onKeyboard === false ? "is-offkb" : "";
        const n = searchHits
          ? wordsForSection(section).length
          : letterCount(section.toLowerCase());
        const title = g.isSwapped
          ? `${g.display} · ${lay?.name || globalLayoutId} → section ${section} (${n})`
          : `${section} → ${g.glyph} · ${lay?.name || globalLayoutId} (${n})`;
        return `<button type="button" class="lang-alpha-glyph ${active} ${off}" data-letter="${escapeHtml(section)}" data-glyph="${escapeHtml(g.display)}" title="${escapeHtml(title)}" aria-label="Alphabet ${g.display}, section ${section}">${escapeHtml(g.display)}</button>`;
      })
      .join("");
  }
}

/** Count of ready UI description packs (not placeholders) */
function DESC_LANGS_CORE_COUNT() {
  return DESC_LANGS.filter((l) => l.status === "ready" || (!l.placeholder && !l.status)).length || 22;
}

/**
 * Resolve UI/description pack id for any catalog language.
 * First Nations / world placeholders soft-map to nearest chrome pack.
 * @param {string} langId
 */
function uiLangIdFor(langId) {
  const core = DESC_LANGS.find((l) => l.id === langId && l.status === "ready");
  if (core) return langId;
  if (SOFT_UI_LANG_MAP[langId]) return SOFT_UI_LANG_MAP[langId];
  const mt = motherTongueById(langId);
  // soft via layout for unlisted ids
  const byLayout = DESC_LANGS.find(
    (l) => l.layout === mt.layout && (l.status === "ready" || !l.placeholder)
  );
  return byLayout?.id || "en";
}

/**
 * Header load progress (0–100) + status text.
 * @param {number} pct
 * @param {string} msg
 */
function setLangLoadProgress(pct, msg) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const bar = $("#lang-load-bar");
  const fill = $("#lang-load-fill");
  const pctEl = $("#lang-load-pct");
  const line = $("#status-line");
  if (fill) fill.style.width = `${p}%`;
  if (pctEl) pctEl.textContent = `${p}%`;
  if (bar) {
    bar.hidden = false;
    bar.setAttribute("aria-valuenow", String(p));
    bar.dataset.pct = String(p);
    if (p >= 100) {
      // leave visible briefly; callers may hide
      bar.dataset.done = "1";
    } else {
      bar.dataset.done = "0";
    }
  }
  if (line && msg) {
    line.textContent = /\d%\s*$/.test(msg) ? msg : `${msg} · ${p}%`;
  }
  document.documentElement.dataset.langLoadPct = String(p);
}

function collapseAllLetterSections() {
  openSections.clear();
  for (const L of LETTERS) letterShown[L] = PAGE_SIZE;
  searchHits = null;
  searchQuery = "";
  activePrefix = null;
}

/**
 * Full page language swap: chrome i18n + keyboard + alphabet + dict cards + Shadow Live matrix.
 * Collapses A–Z sections, shows load %, and never mass-loads geometry for non-en packs.
 * @param {string} langId mother tongue or DESC_LANG id
 * @param {{ fromLayout?: boolean, layoutId?: string }} [opts]
 */
async function setActiveLanguage(langId, opts = {}) {
  const gen = ++langLoadGeneration;
  const mt = motherTongueById(langId);
  const desc = DESC_LANGS.find((l) => l.id === langId);
  const layoutId =
    opts.layoutId ||
    (opts.fromLayout ? globalLayoutId : null) ||
    desc?.layout ||
    mt.layout ||
    "qwerty";
  const dir = desc?.dir || mt.dir || "ltr";
  activePrefix = null;

  setLangLoadProgress(2, `Switching · ${mt.nativeName}…`);

  // Always collapse dictionary sections on language swap
  collapseAllLetterSections();
  setLangLoadProgress(8, `Collapsed sections · ${mt.nativeName}`);

  activeLangId = langId;
  globalLayoutId = layoutId;

  // Switch word-pack tree (en flat; others data/words/{lang}/…)
  let packInfo = { hasPack: false, hasGeometry: false, precomputedAnalyzed: false };
  try {
    packInfo = setWordLang(langId === "en" ? "en" : langId);
  } catch {
    /* */
  }
  // Drop precomputed-en analysis cache when leaving English
  if (!packInfo.precomputedAnalyzed) {
    analysisCache.clear();
    analyzedLetterLoaded.clear();
    focusedEntry = null;
  }
  setLangLoadProgress(18, `Language pack · ${mt.nativeName}`);

  // Load per-lang word-index for accurate Spellings totals
  try {
    await loadLangCatalog();
    const lidx = await loadLangWordIndex(langId === "en" ? "en" : langId);
    packInfo.hasPack = hasWordPack();
    packInfo.hasGeometry = hasGeometryPack();
    reportCorpusHealth({
      ok: (lidx?.total || 0) > 0 || langId === "en",
      total: totalCount(),
      count: totalCount(),
      error:
        (lidx?.total || 0) > 0
          ? null
          : `No orthography pack for ${mt.nativeName} yet — run npm run grow-multilang -- --core`,
      phase: (lidx?.total || 0) > 0 ? "lang-pack" : "warn",
    });
  } catch (e) {
    reportCorpusHealth({
      ok: false,
      total: 0,
      count: 0,
      error: `Lang pack load: ${e?.message || e}`,
      phase: "warn",
    });
  }

  if (gen !== langLoadGeneration) return;

  const picked = pickSteppingPath(mt.family, langId);
  if (picked?.id) activePathId = picked.id;

  const layoutSel = $("#layout-select");
  if (layoutSel && layoutSel.value !== globalLayoutId) {
    layoutSel.value = globalLayoutId;
  }

  const uiId = uiLangIdFor(langId);
  applyUiLanguage(uiId);
  document.documentElement.dir = dir;
  document.documentElement.dataset.motherTongue = langId;
  document.documentElement.dataset.uiLang = uiId;
  document.documentElement.dataset.wordPack = packInfo.hasPack ? "1" : "0";
  document.documentElement.dataset.geometryPack = packInfo.hasGeometry ? "1" : "0";
  setLangLoadProgress(32, `UI chrome · ${uiId}`);

  lastStepping = analyzeLanguageStepping("", {
    langId: activeLangId,
    family: mt.family,
  });

  rebindAllLayouts();
  renderLangSection();
  render(); // collapsed sections + banner
  setLangLoadProgress(48, `Rendered · sections collapsed`);

  if (gen !== langLoadGeneration) return;

  // Warm first bucket when pack exists; keep sections collapsed
  if (packInfo.hasPack && totalCount() > 0) {
    const buckets = activeBuckets();
    const firstB =
      buckets.find((b) => /^[a-z]$/.test(b)) ||
      buckets.find((b) => /^s\d+$/.test(b)) ||
      buckets[0] ||
      "a";
    setLangLoadProgress(55, `Loading spellings · ${firstB}…`);
    try {
      await loadLetter(firstB);
      if (gen !== langLoadGeneration) return;
      setLangLoadProgress(
        72,
        `Bucket ${firstB} · ${letterCount(firstB).toLocaleString()} · total ${totalCount().toLocaleString()}`
      );
    } catch (e) {
      console.warn("lang pack warm:", e);
    }
    // Progressive a–z warm only when latin buckets exist
    const latinBuckets = buckets.filter((b) => /^[a-z]$/.test(b));
    if (latinBuckets.length >= 10) {
      progressiveLoadLetters(
        {
          loadLetter,
          shouldContinue: () => gen === langLoadGeneration && hasWordPack(),
          onProgress: (n, total, pct) => {
            if (gen !== langLoadGeneration) return;
            const p = 72 + Math.round((pct / 100) * 25);
            setLangLoadProgress(
              Math.min(97, p),
              `Warming ${mt.nativeName} · ${n}/${total} · ${pct}%`
            );
            if (n >= total) {
              setLangLoadProgress(
                100,
                `Ready · ${mt.nativeName} · ${totalCount().toLocaleString()} spellings`
              );
              setTimeout(() => {
                const bar = $("#lang-load-bar");
                if (bar) bar.hidden = true;
              }, 600);
            }
          },
        },
        "a"
      );
    } else {
      setLangLoadProgress(
        100,
        `Ready · ${mt.nativeName} · ${totalCount().toLocaleString()} spellings · ${buckets.length} buckets`
      );
      setTimeout(() => {
        const bar = $("#lang-load-bar");
        if (bar) bar.hidden = true;
      }, 600);
    }
  } else {
    setLangLoadProgress(
      100,
      `Ready · ${mt.nativeName} · pack not built yet (npm run grow-multilang -- --core)`
    );
    setTimeout(() => {
      const bar = $("#lang-load-bar");
      if (bar) bar.hidden = true;
    }, 700);
  }

  if (gen !== langLoadGeneration) return;

  // Shadow Live still runs on *typed* text (geometry of input path) — not full dictionary
  const shadowText = $("#shadow-input")?.value?.trim();
  if (shadowText) runShadowLive(shadowText);
  else fillLangComparePanel("");

  updateFocusViz();
  updateAnalyzedStats();
  const L = KEYBOARD_LAYOUTS[globalLayoutId];
  const via = opts.fromLayout ? "keyboard" : "mother tongue";
  const packBit = !packInfo.hasGeometry
    ? packInfo.hasPack
      ? " · orthography only"
      : mt.tier === "first-nations" ||
          mt.status === "honor" ||
          mt.status === "honor-seed"
        ? " · First Nations pack reserved"
        : " · pack placeholder"
    : "";
  const line = $("#status-line");
  if (line && (packInfo.hasGeometry ? false : true)) {
    // keep 100% message for placeholders; en finishes via progressive callback
    line.textContent = `${via} · ${mt.nativeName} · ${mt.family} · ${L?.name || layoutId} · UI ${uiId}${packBit}`;
  } else if (line && packInfo.hasGeometry) {
    /* progressive onProgress owns the line until complete */
  }
}

/** @type {"grid"|"origin"|"timeline"} */
let langCompareView = "grid";
/** @type {ReturnType<typeof languageDescriptionMatrix> | null} */
let lastLangMatrix = null;

/**
 * Fill Shadow Live “Language descriptions · evolution” matrix.
 * @param {string} [text]
 */
function fillLangComparePanel(text) {
  const body = $("#lang-compare-body");
  if (!body) return;
  const raw =
    text != null
      ? String(text)
      : $("#shadow-input")?.value || focusedEntry?.word || "";
  const matrix = languageDescriptionMatrix(raw, globalLayoutId);
  lastLangMatrix = matrix;
  body.innerHTML = renderLanguageCompareHtml(
    matrix,
    uiLangIdFor(activeLangId),
    langCompareView
  );
  // Click card / chip → jump language (swaps UI chrome + description packs)
  body.querySelectorAll("[data-lang-card]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-lang-card");
      if (id) void setActiveLanguage(id);
    });
  });
}

function setLangCompareView(view) {
  if (!["grid", "origin", "timeline"].includes(view)) return;
  langCompareView = view;
  document.querySelectorAll("[data-lang-view]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.getAttribute("data-lang-view") === view);
  });
  if (lastLangMatrix) {
    const body = $("#lang-compare-body");
    if (body) {
      body.innerHTML = renderLanguageCompareHtml(
        lastLangMatrix,
        uiLangIdFor(activeLangId),
        langCompareView
      );
      body.querySelectorAll("[data-lang-card]").forEach((card) => {
        card.addEventListener("click", () => {
          const id = card.getAttribute("data-lang-card");
          if (id) void setActiveLanguage(id);
        });
      });
    }
  } else {
    fillLangComparePanel();
  }
}

/**
 * Build nested aa/ab/ac… fold markup for one letter (inserted between A–Z).
 * @param {string} letterUp
 * @returns {string}
 */
function renderPrefixFoldHtml(letterUp) {
  const L = String(letterUp || "").toLowerCase();
  // Collapsed stems (ba, bb…) — not every 3-letter shard (baa…baz)
  const prefixes = displayPrefixesForLetter(L);
  if (!prefixes.length || !hasWordPack()) return "";
  const letterTotal = letterCount(L);
  const allActive = !activePrefix ? "is-active" : "";
  const rows = [
    `<button type="button" class="alpha-prefix is-all ${allActive}" data-prefix="" data-letter="${escapeHtml(letterUp)}" title="All ${letterUp} · ${letterTotal.toLocaleString()} words" aria-label="Show all words in ${letterUp}">all<span class="alpha-count">${letterTotal || ""}</span></button>`,
  ];
  // Which 2-letter stem is expanded (active prefix or its parent)
  const activeStem =
    activePrefix && /^[a-z]{2,}/.test(activePrefix) && !activePrefix.endsWith("_")
      ? activePrefix.slice(0, 2)
      : activePrefix && activePrefix.endsWith("_") && activePrefix.length >= 3
        ? activePrefix
        : null;

  for (const p of prefixes) {
    const n = prefixCount(p);
    const label = prefixDisplayLabel(p);
    const depth3 = p.length >= 3 && !p.endsWith("_") ? "is-depth3" : "";
    const isStem = /^[a-z]{2}$/.test(p);
    const active =
      activePrefix === p ||
      (isStem &&
        activePrefix &&
        !activePrefix.endsWith("_") &&
        activePrefix.startsWith(p))
        ? "is-active"
        : "";
    const empty = n === 0 ? "is-empty" : "";
    const stem = prefixMatchStem(p);
    const kids = isStem ? childPrefixesForStem(p).length : 0;
    const kidNote = kids > 1 ? ` · ${kids} shards` : "";
    rows.push(
      `<button type="button" class="alpha-prefix ${depth3} ${active} ${empty}" data-prefix="${escapeHtml(p)}" data-letter="${escapeHtml(letterUp)}" title="${escapeHtml(stem)}… · ${n.toLocaleString()} words${kidNote}" aria-label="Prefix ${label}, ${n} words">${escapeHtml(label)}<span class="alpha-count">${n || ""}</span></button>`
    );
    // Expand 3-letter children under the active stem (optional deep dive)
    if (isStem && activeStem === p) {
      const children = childPrefixesForStem(p);
      // Cap so UI stays light; full stem load already covers all words
      const showKids = children.slice(0, 32);
      for (const ch of showKids) {
        const cn = prefixCount(ch);
        const clabel = prefixDisplayLabel(ch);
        const cactive = activePrefix === ch ? "is-active" : "";
        rows.push(
          `<button type="button" class="alpha-prefix is-depth3 ${cactive}" data-prefix="${escapeHtml(ch)}" data-letter="${escapeHtml(letterUp)}" title="${escapeHtml(clabel)}… · ${cn.toLocaleString()} words" aria-label="Prefix ${clabel}, ${cn} words">${escapeHtml(clabel)}<span class="alpha-count">${cn || ""}</span></button>`
        );
      }
      if (children.length > showKids.length) {
        rows.push(
          `<span class="alpha-prefix-more" title="${children.length - showKids.length} more shards under ${p}">+${children.length - showKids.length}</span>`
        );
      }
    }
  }
  return `<div class="alpha-fold is-sub-rail" role="group" aria-label="Prefixes for ${escapeHtml(letterUp)}">${rows.join("")}</div>`;
}

/** 0–25 hue for A–Z (subtle section tints). */
function letterHueIndex(letter) {
  const ch = String(letter || "A")
    .toUpperCase()
    .charCodeAt(0);
  if (ch < 65 || ch > 90) return 0;
  return ch - 65;
}

function renderAlphabetRail() {
  const rail = $("#alpha-rail");
  if (!rail) return;
  const glyphs = activeAlphabetGlyphs();
  const lay = KEYBOARD_LAYOUTS[globalLayoutId];
  rail.dir = lay?.dir || "ltr";
  rail.dataset.layout = globalLayoutId;
  rail.dataset.script = lay?.script || "Latin";
  const wrap = $("#alpha-rails");
  const shell = document.querySelector(".app-shell");
  const side = $("#side-rail");
  const sub = $("#alpha-sub-rail");

  // Active open letter → show prefix sub-rail (ba/bb… stems, not 400 shards)
  const openL = openSections.has(activeLetter) ? activeLetter : null;
  const prefs =
    openL && hasWordPack()
      ? displayPrefixesForLetter(String(openL).toLowerCase())
      : [];
  const showSub = !!(openL && prefs.length);

  wrap?.classList.toggle("has-sub-rail", showSub);
  wrap?.classList.toggle("has-inline-fold", !showSub);
  side?.classList.toggle("has-sub-rail", showSub);
  shell?.classList.toggle("has-sub-rail", showSub);
  if (openL) {
    wrap?.style.setProperty("--letter-hue", String(letterHueIndex(openL) * 14));
    side?.style.setProperty("--letter-hue", String(letterHueIndex(openL) * 14));
  }

  // Hide legacy flyout (main-col was painting over it)
  const fly = wrap?.querySelector(".alpha-prefix-flyout");
  if (fly) {
    fly.hidden = true;
    fly.innerHTML = "";
  }

  rail.innerHTML = glyphs
    .map((g) => {
      const L = g.latin;
      const n = searchHits
        ? wordsForSection(L).length
        : letterCount(L.toLowerCase());
      const isActive = L === activeLetter;
      const isOpen = openSections.has(L);
      const active = isActive ? "is-active" : "";
      const empty = n === 0 ? "is-empty" : "";
      const swapped = g.isSwapped ? "is-swapped" : "";
      const expandedCls = isOpen && isActive ? "is-expanded" : "";
      const show = g.display || g.glyph || L;
      const hue = letterHueIndex(L) * 14;
      const title = g.isSwapped
        ? `${show} · ${lay?.name || globalLayoutId} → ${L} (${n}) · click to ${isOpen ? "close" : "open"}`
        : `${L} · ${n} words · click to ${isOpen && isActive ? "close" : "open cards"}`;
      const letterBtn = `<button type="button" class="alpha-letter ${active} ${empty} ${swapped} ${expandedCls}" data-letter="${L}" data-glyph="${escapeHtml(show)}" data-hue="${hue}" style="--letter-hue:${hue}" aria-expanded="${isOpen && isActive ? "true" : "false"}" title="${escapeHtml(title)}" aria-label="Letter ${L}, ${n} words"><span class="alpha-letter-label">${escapeHtml(show)}</span></button>`;
      return `<div class="alpha-group ${isOpen && isActive ? "is-open" : ""}" data-letter-group="${L}" style="--letter-hue:${hue}">${letterBtn}</div>`;
    })
    .join("");

  if (sub) {
    if (showSub) {
      sub.hidden = false;
      sub.setAttribute("aria-label", `Prefixes for ${openL}`);
      sub.innerHTML = renderPrefixFoldHtml(openL);
      // Ensure alpha-fold is visible inside sub-rail
      const fold = sub.querySelector(".alpha-fold");
      if (fold) fold.classList.add("is-sub-rail");
    } else {
      sub.hidden = true;
      sub.innerHTML = "";
    }
  }

  requestAnimationFrame(() => {
    const focus = rail.querySelector(".alpha-letter.is-active");
    focus?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    // Keep active prefix chip in view
    const pref = sub?.querySelector(".alpha-prefix.is-active");
    pref?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

/**
 * @deprecated Prefixes now fold inline under each letter (renderAlphabetRail).
 * Kept as alias so boot/warm paths still refresh the rail.
 */
function renderPrefixSubRail() {
  renderAlphabetRail();
}

function renderSections() {
  const root = $("#word-list");
  const parts = [];
  let visibleAnalyzed = 0;
  const total = totalCount();
  /** @type {object[]} */
  const pendingSense = [];
  const alphaMap = Object.fromEntries(
    activeAlphabetGlyphs().map((g) => [g.latin, g])
  );
  const layName = KEYBOARD_LAYOUTS[globalLayoutId]?.name || globalLayoutId;
  const mt = motherTongueById(activeLangId);
  const geo = hasGeometryPack();
  const pack = hasWordPack();
  const pre = hasPrecomputedAnalyzed();
  const sectionKeys =
    pack && activeBuckets().length
      ? activeBuckets()
      : LETTERS.slice();

  // Banner for non-en packs or missing packs
  if (!pre || !pack) {
    parts.push(`
      <div class="lang-pack-banner ${pack ? "is-ortho" : "is-placeholder"}" role="status">
        <strong>${escapeHtml(mt.nativeName || mt.label)}</strong>
        ${
          pack
            ? pre
              ? ""
              : ` · ${totalCount().toLocaleString()} spellings · live keyboard geometry on focus (precomputed multi-layout packs are English-only)`
            : " · language pack not built yet — run <code>npm run grow-multilang:core</code>"
        }
        <span class="lang-pack-banner-meta">${escapeHtml(getWordLang())} · ${sectionKeys.length} buckets · catalog ${getLangCatalog()?.packsReady ?? "?"} packs ready</span>
      </div>
    `);
  }

  for (const L of sectionKeys) {
    const all = wordsForSection(L);
    if (searchQuery && all.length === 0) continue;
    // Placeholder langs: keep section chrome collapsed & empty (no fake 1.69M en counts)
    if (!pack && !searchQuery) {
      /* still render letter heads with 0 so rail stays consistent */
    }

    const open = openSections.has(L);
    const shown = Math.min(letterShown[L] || PAGE_SIZE, all.length);
    const slice = open ? all.slice(0, shown) : [];
    const cards = [];

    /** @type {object[]} */
    const visibleEntriesForSense = [];
    if (open) {
      for (const w of slice) {
        const e = entryForWord(w);
        if (e) {
          cards.push(renderWordCard(e));
          visibleEntriesForSense.push(e);
          visibleAnalyzed++;
        }
      }
    }

    const remaining = all.length - shown;
    const moreBtn =
      open && remaining > 0
        ? `<button type="button" class="btn show-more-btn" data-more="${L}">Show more (${remaining.toLocaleString()} left · +${PAGE_SIZE})</button>`
        : open && all.length > PAGE_SIZE
          ? `<p class="letter-page-meta">Showing all ${all.length.toLocaleString()} in ${L}</p>`
          : "";

    const gEntry = alphaMap[L];
    const glyph = gEntry?.display || gEntry?.glyph || L;
    const swapped = gEntry?.isSwapped;
    const prefTag =
      activePrefix &&
      String(L).toLowerCase().slice(0, 1) === activePrefix[0]
        ? `<span class="letter-lang-tag is-prefix" title="Prefix subsection">${escapeHtml(prefixDisplayLabel(activePrefix))}</span>`
        : "";
    // When keyboard is non-Latin / variant: show that glyph as the section mark
    const mark = swapped
      ? `<span class="letter-glyph" title="${escapeHtml(layName)}">${escapeHtml(glyph)}</span><span class="letter-lang-tag" title="Corpus section">${escapeHtml(L)}</span>${prefTag}`
      : `<span class="letter-glyph">${escapeHtml(L)}</span>${
          glyph && glyph !== L && glyph !== L.toLowerCase()
            ? `<span class="letter-lang-tag" title="Same key on ${escapeHtml(layName)}">${escapeHtml(glyph)}</span>`
            : ""
        }${prefTag}`;

    const scopeNote = activePrefix && String(L).toLowerCase().slice(0, 1) === activePrefix[0]
      ? ` · ${prefixDisplayLabel(activePrefix)}`
      : "";
    const hue = letterHueIndex(L) * 14;
    // Inline prefix strip inside open letter body (mirrors left sub-rail)
    const prefixStrip =
      open && hasWordPack() && displayPrefixesForLetter(L.toLowerCase()).length
        ? `<div class="letter-prefix-strip" role="group" aria-label="Sub-search prefixes for ${escapeHtml(L)}">${renderPrefixFoldHtml(L)}</div>`
        : "";
    parts.push(`
      <section class="letter-section ${open ? "is-open" : ""}" id="letter-${L}" data-letter="${L}" data-prefix="${escapeHtml(activePrefix || "")}" data-hue="${hue}" style="--letter-hue:${hue}">
        <button type="button" class="letter-head" data-toggle="${L}" aria-expanded="${open}">
          <span class="letter-chevron" aria-hidden="true"></span>
          <span class="letter-mark">${mark}</span>
          <span class="letter-count">${all.length.toLocaleString()} word${all.length === 1 ? "" : "s"}${scopeNote}${open && shown < all.length ? ` · showing ${shown}` : ""} · ${escapeHtml(layName)} · ${escapeHtml(currentLang().label)}</span>
        </button>
        <div class="letter-body" ${open ? "" : "hidden"}>
          ${prefixStrip}
          ${cards.join("") || (open ? `<p class="letter-empty">No words</p>` : "")}
          ${moreBtn}
        </div>
      </section>
    `);

    if (visibleEntriesForSense.length) {
      pendingSense.push(...visibleEntriesForSense);
    }
  }

  if (!parts.length) {
    root.innerHTML = `<p class="empty-state">No matches for “${escapeHtml(searchQuery)}”. Press Enter to analyze &amp; add a custom word.</p>`;
  } else {
    root.innerHTML = parts.join("");
    // Live dictionary meanings under each visible word
    if (pendingSense.length) {
      hydrateMeanings(pendingSense);
    }
  }

  updateAnalyzedStats();
  if (searchHits) {
    $("#stat-count").textContent = `${searchHits.length.toLocaleString()} match`;
  }
}

function render() {
  renderLangSection();
  renderAlphabetRail();
  renderSections();
  updateFocusViz();
}

const DICT_SECTION_OPEN_KEY = "kbatch-dict-section-open";

/**
 * Keep Dictionary fold badge / aria in sync with <details open>.
 * @param {HTMLDetailsElement | null} [dict]
 */
function syncDictSectionChrome(dict) {
  const el = dict || /** @type {HTMLDetailsElement | null} */ ($("#dict-section"));
  if (!el) return;
  const badge = $("#dict-sum-badge");
  if (badge) badge.textContent = el.open ? "open" : "folded";
  el.setAttribute("aria-expanded", el.open ? "true" : "false");
  const foldBtn = $("#btn-collapse-dict");
  if (foldBtn) {
    foldBtn.textContent = el.open ? "Fold dictionary" : "Open dictionary";
    foldBtn.title = el.open
      ? "Collapse the whole Dictionary section"
      : "Expand the Dictionary section";
  }
}

/**
 * Open or fold the Dictionary section (letter list).
 * @param {boolean} open
 * @param {{ persist?: boolean }} [opts]
 */
function setDictSectionOpen(open, opts = {}) {
  const dict = /** @type {HTMLDetailsElement | null} */ ($("#dict-section"));
  if (!dict) return;
  dict.open = !!open;
  syncDictSectionChrome(dict);
  if (opts.persist !== false) {
    try {
      localStorage.setItem(DICT_SECTION_OPEN_KEY, open ? "1" : "0");
    } catch {
      /* */
    }
  }
}

/**
 * Ensure dictionary section is open so letter cards are visible.
 * (Letter / prefix / search navigation — not a permanent force-open.)
 */
function ensureDictSectionOpen() {
  setDictSectionOpen(true, { persist: true });
  // Side rail: mark A–Z mode active
  document.querySelectorAll("#section-rail .section-rail-btn").forEach((b) => {
    b.classList.toggle("is-active", b.getAttribute("data-goto") === "dict-section");
  });
  const rails = $("#alpha-rails");
  rails?.classList.remove("is-collapsed");
  $("#alpha-rail-toggle")?.setAttribute("aria-expanded", "true");
}

/**
 * Open/close a letter from the side rail.
 * Re-click same open letter → closes (toggle). Otherwise loads cards + scrolls.
 * @param {string} L
 * @param {{ forceOpen?: boolean }} [opts]
 */
function jumpToLetter(L, opts = {}) {
  const letter = String(L || "A").toUpperCase();
  const same =
    letter === String(activeLetter || "").toUpperCase() && !activePrefix;
  const alreadyOpen = openSections.has(letter);

  // Toggle close on second click of the same open letter
  if (!opts.forceOpen && same && alreadyOpen) {
    openSections.delete(letter);
    activePrefix = null;
    render();
    $("#status-line").textContent = `Closed letter ${letter}`;
    return;
  }

  // Changing letter clears prefix subsection
  if (letter !== String(activeLetter || "").toUpperCase()) {
    activePrefix = null;
  }
  activeLetter = letter;
  openSections.add(letter);
  letterShown[letter] = letterShown[letter] || PAGE_SIZE;
  ensureDictSectionOpen();

  // Immediate chrome so A-rail / open state never waits on network
  render();
  renderAlphabetRail();

  (async () => {
    if (!hasWordPack()) {
      render();
      $("#status-line").textContent = `No word pack for ${motherTongueById(activeLangId).nativeName} · sections empty`;
      return;
    }
    try {
      await loadSliverIndex().catch(() => {});
      renderAlphabetRail(); // prefixes (aa/ab/…) once catalog is ready
      setLangLoadProgress(20, `Loading letter ${letter}…`);
      // Prefer progressive first-prefix if available (snappy first paint)
      const prefs = displayPrefixesForLetter(letter.toLowerCase());
      if (prefs.length && !wordsForLetter(letter.toLowerCase())?.length) {
        const first = prefs.find((p) => !p.endsWith("_")) || prefs[0];
        setLangLoadProgress(35, `Warming ${prefixDisplayLabel(first)}…`);
        await loadPrefixCoverage(first).catch(() => {});
        render(); // cards for first stem before full monoletter
      }
      await loadLetter(letter.toLowerCase());
      setLangLoadProgress(60, `Letter ${letter} · ${letterCount(letter).toLocaleString()} words`);
      // NEVER pull monoletter analyzed/{L}.json (50–175MB) on browse.
      if (hasGeometryPack() && hasAnalyzedChunk(letter.toLowerCase())) {
        setLangLoadProgress(75, `Warming geometry ${letter}…`);
        idle(() => {
          ingestAnalyzedLetter(letter, { light: true }).catch(() => {});
        }, { timeout: 400 });
      }
      setLangLoadProgress(100, `Browsing ${letter}${activePrefix ? ` · ${activePrefix}` : ""}`);
      render();
      renderAlphabetRail();
      updateAnalyzedStats();
    } catch (e) {
      console.warn("jumpToLetter", letter, e?.message || e);
      setLangLoadProgress(100, `Browsing ${letter} (partial)`);
      render();
      renderAlphabetRail();
    }

    // Scroll letter section into view and flash first cards
    requestAnimationFrame(() => {
      const sec = document.getElementById(`letter-${letter}`);
      sec?.scrollIntoView({ behavior: "smooth", block: "start" });
      sec?.classList.add("is-just-opened");
      setTimeout(() => sec?.classList.remove("is-just-opened"), 900);
      // Focus first word card for keyboard users
      const firstCard = sec?.querySelector(".word-card");
      if (firstCard instanceof HTMLElement) {
        try {
          firstCard.focus({ preventScroll: true });
        } catch {
          /* */
        }
      }
    });

    const prefNote = activePrefix
      ? ` · ${prefixDisplayLabel(activePrefix)} (${prefixCount(activePrefix).toLocaleString()})`
      : ` · cards open · click ${letter} again to close`;
    $("#status-line").textContent =
      hasGeometryPack() && isFullyAnalyzedOnDisk()
        ? `All ${totalCount().toLocaleString()} analyzed · browsing ${letter}${prefNote}`
        : hasGeometryPack()
          ? `Browsing ${letter}${prefNote}`
          : `Browsing ${letter}${prefNote} · orthography only`;
    setTimeout(() => {
      const bar = $("#lang-load-bar");
      if (bar) bar.hidden = true;
    }, 400);
  })();
}

/**
 * Side rail: jump to a main page section (Lang / Viz / Live / A–Z / Skills).
 * Re-click A (dictionary) while already active → toggle fold.
 * @param {string} sectionId
 */
function jumpToSection(sectionId) {
  const id = String(sectionId || "").replace(/^#/, "");
  if (!id) return;
  const el = document.getElementById(id);
  const isDict = id === "dict-section";
  const wasActive = document
    .querySelector(`#section-rail .section-rail-btn.is-active[data-goto="${id}"]`);

  // Second click on Dictionary (A) while focused → fold/unfold
  if (
    isDict &&
    wasActive &&
    el &&
    "open" in el &&
    /** @type {HTMLDetailsElement} */ (el).open
  ) {
    setDictSectionOpen(false);
    $("#status-line").textContent = "Dictionary folded · click A or header to reopen";
    return;
  }

  document.querySelectorAll("#section-rail .section-rail-btn").forEach((b) => {
    b.classList.toggle("is-active", b.getAttribute("data-goto") === id);
  });
  if (el && "open" in el) {
    if (isDict) setDictSectionOpen(true);
    else /** @type {HTMLDetailsElement} */ (el).open = true;
  }
  // Show alphabet only for dictionary; collapse for other sections to free space
  const rails = $("#alpha-rails");
  if (rails) {
    rails.classList.toggle("is-collapsed", !isDict);
    $("#alpha-rail-toggle")?.setAttribute(
      "aria-expanded",
      isDict ? "true" : "false"
    );
  }
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
  $("#status-line").textContent = `Section · ${id.replace(/-section|-panel|-live/g, "")}`;
}

/**
 * Jump to a 2/3-letter prefix subsection (aa, ab, ac…, baa…).
 * Loads only that sliver for fast paged browse.
 * @param {string} prefix
 * @param {string} [letter]
 */
function jumpToPrefix(prefix, letter) {
  const p = String(prefix || "").toLowerCase();
  const L = String(letter || p[0] || activeLetter || "A").toUpperCase();
  activeLetter = L;
  openSections.add(L);
  ensureDictSectionOpen();
  if (!p) {
    activePrefix = null;
    letterShown[L] = PAGE_SIZE;
    jumpToLetter(L, { forceOpen: true });
    return;
  }
  activePrefix = p;
  letterShown[L] = PAGE_SIZE;
  // Immediate chrome — never leave B–Z sub-rail blank while network runs
  render();
  renderAlphabetRail();
  (async () => {
    if (!hasWordPack()) {
      render();
      return;
    }
    try {
      await loadSliverIndex().catch(() => {});
      setLangLoadProgress(25, `Loading ${prefixDisplayLabel(p)}…`);
      // Fat-split stems (ba → baa+bab…) + monoletter fallback
      await loadPrefixCoverage(p);
      setLangLoadProgress(70, `${prefixDisplayLabel(p)} · ${prefixCount(p).toLocaleString()}`);
      // Warm full letter in background for "all" and counts
      idle(() => {
        loadLetter(L.toLowerCase()).catch(() => {});
      }, { timeout: 800 });
      // Prefix-scoped analyzed only — never full letter pack; never block cards
      if (hasGeometryPack() && hasAnalyzedChunk(L.toLowerCase())) {
        idle(() => {
          ingestAnalyzedPrefix(p).catch(() => {});
        }, { timeout: 300 });
      }
      setLangLoadProgress(100, `${prefixDisplayLabel(p)} · ${prefixCount(p).toLocaleString()}`);
      render();
      renderAlphabetRail();
      updateAnalyzedStats();
    } catch (e) {
      console.warn("jumpToPrefix", p, e?.message || e);
      setLangLoadProgress(100, `${prefixDisplayLabel(p)} (partial)`);
      render();
      renderAlphabetRail();
    }
    requestAnimationFrame(() => {
      const sec = document.getElementById(`letter-${L}`);
      sec?.scrollIntoView({ behavior: "smooth", block: "start" });
      sec?.classList.add("is-just-opened");
      setTimeout(() => sec?.classList.remove("is-just-opened"), 900);
      const firstCard = sec?.querySelector(".word-card");
      if (firstCard instanceof HTMLElement) {
        try {
          firstCard.focus({ preventScroll: true });
        } catch {
          /* */
        }
      }
    });
    const n = wordsForSection(L).length;
    $("#status-line").textContent = `Prefix ${prefixDisplayLabel(p)} · ${n.toLocaleString()} cards · letter ${L}`;
    setTimeout(() => {
      const bar = $("#lang-load-bar");
      if (bar) bar.hidden = true;
    }, 350);
  })();
}

function focusWord(word) {
  // Typed / selected word: allow geometry only when en pack active;
  // Shadow Live path analysis still works separately on free text.
  const key = String(word || "").toLowerCase();
  // Upgrade orthography stubs so the list card gets sense + primary layouts
  const cached = analysisCache.get(key);
  if (cached?.orthographyOnly && hasGeometryPack()) {
    analysisCache.delete(key);
  }
  const entry = ensureAnalyzed(word, {
    full: true,
    forceGeometry: hasGeometryPack(),
  });
  if (!entry) return;
  focusedEntry = entry;
  const letterKey = entry.letter || key[0]?.toUpperCase() || "A";
  openSections.add(letterKey);
  // ensure enough page to include word
  const list = wordsForSection(letterKey);
  const idx = list.findIndex((w) => String(w).toLowerCase() === key);
  if (idx >= 0 && idx >= (letterShown[letterKey] || PAGE_SIZE)) {
    letterShown[letterKey] = idx + PAGE_SIZE;
  }
  render();
  updateFocusViz();
  updateFocusSense(entry);
  // Immediate heuristic sense if meaning not yet loaded
  patchSenseDom(entry);
  enrichEntryWithMeaning(entry).then((e) => {
    attachScholarToEntry(e);
    analysisCache.set(e.word.toLowerCase(), e);
    focusedEntry = e;
    patchSenseDom(e);
    updateFocusSense(e);
  });
  requestAnimationFrame(() => {
    const card =
      document.querySelector(`.word-card[data-word="${CSS.escape(entry.word)}"]`) ||
      document.querySelector(`.word-card[data-word="${CSS.escape(key)}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    card?.classList.add("is-flash");
    setTimeout(() => card?.classList.remove("is-flash"), 900);
    // Dictionary section may be far below geo — open it if collapsed
    const dict = $("#dict-section");
    if (dict && !dict.open) dict.open = true;
  });
}

function updateFocusViz() {
  let entry =
    focusedEntry ||
    ensureAnalyzed("quantum", { full: true }) ||
    ensureAnalyzed("the", { full: true }) ||
    ensureAnalyzed("a", { full: true });

  if (!entry) return;
  // Ensure canvas has hits/trails
  entry = ensureAnalyzed(entry.word, { full: true });
  focusedEntry = entry;
  let a = entry;
  if (a.activeLayout !== globalLayoutId && a.byLayout?.[globalLayoutId]) {
    a = setActiveLayout(a, globalLayoutId);
    focusedEntry = a;
    analysisCache.set(a.word.toLowerCase(), a);
  } else if (a.activeLayout !== globalLayoutId || !a.analysis) {
    a = analyzeWordSlim(a.word, globalLayoutId) || a;
    focusedEntry = a;
    analysisCache.set(a.word.toLowerCase(), a);
  }
  const analysis = a.analysis || a.byLayout?.[globalLayoutId];
  if (!analysis) return;

  const stripEl = $("#ct-stats");
  if (stripEl) stripEl.textContent = analysis.strip?.label || "—";
  $("#geo-label").textContent = `${a.word} · ${analysis.layoutName}`;
  $("#focus-word").textContent = a.word;

  const ergo = analysis.modes?.ergonomic;
  const finger = analysis.modes?.finger;
  if (ergo && $("#ergo-grid")) {
    const items = [
      ["Travel", `${ergo.travelMM}mm`, "#58a6ff"],
      ["Energy", `${ergo.energyUJ}µJ`, "#a78bfa"],
      ["Calories", ergo.calories.toFixed(6), "#f472b6"],
      ["Heat", `${ergo.heat}°C`, "#fb923c"],
      ["Home", `${ergo.homeRowPct}%`, "#3fb950"],
      ["RSI", `${ergo.rsiRisk}%`, ergo.rsiRisk > 60 ? "#f85149" : "#d4a017"],
      ["Comfort", `${ergo.comfort}%`, "#3fb950"],
      ["Force", String(analysis.metrics.avgForce), "#22d3ee"],
      ["F-bal", String(finger?.balance ?? 0), "#58a6ff"],
      ["L/R", `${finger?.leftKeys ?? 0}/${finger?.rightKeys ?? 0}`, "#8b949e"],
    ];
    $("#ergo-grid").innerHTML = items
      .map(
        ([l, v, c]) =>
          `<div class="ergo-cell"><div class="ergo-l">${escapeHtml(l)}</div><div class="ergo-v" style="color:${c}">${escapeHtml(String(v))}</div></div>`
      )
      .join("");
  }
  if (finger && $("#finger-grid")) {
    const maxK = Math.max(1, ...finger.ordered.map((f) => f.keys));
    $("#finger-grid").innerHTML = finger.ordered
      .map((f) => {
        const pct = Math.round((f.keys / maxK) * 100);
        const color =
          f.strain > 60 ? "#f85149" : f.strain > 30 ? "#d4a017" : "#3fb950";
        const short = f.name.replace("L-", "").replace("R-", "");
        return `<div class="finger-cell"><div class="finger-name">${escapeHtml(short)}</div><div class="finger-n" style="color:${color}">${f.keys}</div><div class="finger-bar"><i style="width:${pct}%;background:${color}"></i></div></div>`;
      })
      .join("");
  }
  const risks = analysis.metrics?.risks || [];
  const risksEl = $("#health-risks");
  if (risksEl) {
    risksEl.innerHTML = risks.length
      ? risks.map((r) => `<span class="risk-chip">${escapeHtml(r)}</span>`).join("")
      : `<span class="risk-chip risk-ok">No flags</span>`;
  }
  drawCanvas(analysis);
  updateFocusSense(a);
}

function drawCanvas(analysis) {
  const canvas = $("#geo-canvas");
  if (!canvas || !analysis) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 640;
  const H = canvas.clientHeight || 180;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderVizMode(ctx, W, H, analysis, vizMode);
}

function rebindAllLayouts() {
  for (const [k, e] of analysisCache) {
    if (e.byLayout) analysisCache.set(k, setActiveLayout(e, globalLayoutId));
  }
  if (focusedEntry) {
    focusedEntry =
      analysisCache.get(focusedEntry.word.toLowerCase()) || focusedEntry;
  }
  render();
}

let writerLive = false;
let writerLiveTimer = null;
/** @type {number|object|null} */
let shadowHeavyHandle = null;
/** Last tool stack envelope */
let lastToolStack = null;
/** Last multi-runtime export pack */
let lastRuntimeExport = null;
/** Last persona suggest pack */
let lastPersonaSuggest = null;

/**
 * Shadow Live — default surface: type once → 15 shadows + strain + a11y.
 * Fast path (L0–L3) every keystroke; heavy stack deferred to idle (cortical 3–5s).
 * @param {string} [text]
 * @param {{ rank?: boolean, heavy?: boolean }} [opts]
 */
function runShadowLive(text, opts = {}) {
  const input = $("#shadow-input");
  const raw = text != null ? String(text) : input?.value || "";
  if (input && text != null && input.value !== raw) input.value = raw;

  const wantHeavy = opts.heavy === true;
  // Fast: ring + strip only. Rank/pattern/lang-compare are expensive.
  const live = analyzeShadowLive(raw, {
    baseLayout: globalLayoutId,
    rank: wantHeavy && opts.rank !== false,
    maxRank: wantHeavy ? 10 : 0,
  });
  lastShadowLive = live;

  // Cortical fast tick
  const tick = corticalFast({
    text: raw,
    layout: globalLayoutId,
    live,
    budgetMs: DEFAULT_LOOP_BUDGET_MS,
  });
  const cortEl = $("#cortical-status");
  if (cortEl) {
    cortEl.textContent = `cortical ${tick.path} · ${tick.elapsedMs}ms · budget ${tick.budgetMs}ms · L3 ring ${live.ring?.length || 0}`;
  }

  // Strip
  const stripEl = $("#shadow-strip");
  if (stripEl) stripEl.textContent = live.strip?.label || "—";

  // Metric pills
  const metricsEl = $("#shadow-metrics");
  if (metricsEl) {
    const m = live.metrics;
    if (!m) {
      metricsEl.innerHTML = "";
    } else {
      const items = [
        ["Eff", m.efficiency, "efficiency"],
        ["Cpx", m.complexity, "complexity"],
        ["Strain", m.strain, "strain"],
        ["RSI", m.rsiRisk, "rsi"],
        ["Home", m.homeRowPct != null ? `${m.homeRowPct}%` : "—", "home"],
        ["mm", m.travelMM, null],
        ["cal", m.calories != null ? Number(m.calories).toFixed(6) : "—", null],
        ["Keys", m.keys, null],
        ["F-bal", m.fingerBalance, null],
        ["BPM", m.bpm, null],
      ];
      metricsEl.innerHTML = items
        .map(([lab, val, kind]) => {
          const cls = kind ? metricClass(Number(val) || 0, kind) : "mid";
          return `<span class="pill ${cls}">${escapeHtml(String(lab))} ${escapeHtml(String(val ?? "—"))}</span>`;
        })
        .join("");
    }
  }

  // Copilot tips
  const copilotEl = $("#shadow-copilot");
  if (copilotEl) {
    if (!live.trimmed) {
      copilotEl.innerHTML =
        '<p class="shadow-copilot-idle">Accessible Input Copilot waits for text — strain spikes, layout switches, home-row tips.</p>';
    } else {
      copilotEl.innerHTML = (live.copilot || [])
        .map(
          (t) =>
            `<p class="shadow-tip is-${escapeHtml(t.level)}">${escapeHtml(t.text)}</p>`
        )
        .join("");
    }
  }

  // 15-layout shadow ring — multi-script fonts + mini keyboard face
  const ringEl = $("#shadow-ring");
  if (ringEl) {
    ringEl.style.fontFamily = SCRIPT_FONT_STACK;
    ringEl.innerHTML = (live.ring || [])
      .map((r) => {
        const base = r.isBase ? "is-base" : "";
        const shadow = r.shadow || "·";
        const empty = !shadow || shadow === "·" ? "is-empty" : "";
        return `<div class="shadow-card ${base} ${empty}" role="listitem" data-layout-id="${escapeHtml(r.id)}" title="${escapeHtml(r.name)} · ${escapeHtml(r.script)} · ${escapeHtml(r.region)} · ${escapeHtml(r.readability?.label || "")}" dir="${escapeHtml(r.dir || "ltr")}" style="font-family:${SCRIPT_FONT_STACK}">
          <em>${escapeHtml(r.name)}</em>
          ${miniKeyboardHtml(r.id)}
          <b lang="${escapeHtml(r.script)}" dir="${escapeHtml(r.dir || "ltr")}">${escapeHtml(truncateDisplay(shadow, 36))}</b>
          <small>${escapeHtml(r.script)} · ${escapeHtml(r.region)} · ${escapeHtml(r.readability?.label || "")}</small>
        </div>`;
      })
      .join("");
  }
  const ringMeta = $("#shadow-ring-meta");
  if (ringMeta) {
    ringMeta.textContent = live.trimmed
      ? `${live.ring?.length || 0} boards · path ${live.pathLen} keys · base ${live.baseName}${wantHeavy ? " · full" : " · fast"}`
      : "15 boards · same physical path · lazy heavy stack";
  }

  // A11y (cheap)
  setText("#sl-braille", live.a11y?.braille || "—", live.a11y?.braille || "");
  setText("#sl-morse", live.a11y?.morse || "—", live.a11y?.morse || "");
  setText("#sl-nato", live.a11y?.nato || "—", live.a11y?.nato || "");
  const flowLine = live.a11y?.flow
    ? `${live.a11y.flow.ddr || "·"}  ${live.a11y.flow.arrows || ""}`
    : "—";
  setText("#sl-flow", flowLine, flowLine);

  if (live.analysis) {
    drawCanvas(live.analysis);
    const stripMain = $("#ct-stats");
    if (stripMain) stripMain.textContent = live.strip?.label || "—";
    $("#geo-label").textContent = `Shadow Live · ${live.baseName}`;
    $("#focus-word").textContent = truncateDisplay(live.trimmed, 48) || "—";
  }

  $("#status-line").textContent =
    shadowLiveStatus(live) + (wantHeavy ? "" : " · heavy idle…");

  // Defer expensive rank / pattern / stack / persona work
  if (shadowHeavyHandle != null) cancelIdle(shadowHeavyHandle);
  if (live.trimmed && !wantHeavy) {
    shadowHeavyHandle = idle(
      () => runShadowLive(raw, { heavy: true, rank: true }),
      { timeout: 450 }
    );
  } else if (wantHeavy) {
    runShadowHeavy(live, raw);
  } else {
    fillStenoSpacePanel("");
  }

  return live;
}

/**
 * Heavy Shadow path — rank, pattern, stack, persona, multi-runtime, publish.
 * @param {object} liveFast
 * @param {string} raw
 */
function runShadowHeavy(liveFast, raw) {
  const filters = {
    register: activeRegisterId || "standard",
    age: activeAgeCapsule || "all",
    region: activeRegionCapsule || "all",
    theme: activeThemeCapsule || "all",
  };
  const full = analyzeShadowLive(raw, {
    baseLayout: globalLayoutId,
    rank: true,
    maxRank: 10,
  });
  full.filters = filters;
  lastShadowLive = full;

  const rankEl = $("#shadow-rank");
  if (rankEl) {
    const ranked = full.ranked || [];
    rankEl.innerHTML = ranked.length
      ? ranked
          .map((r, i) => {
            const best = i === 0 ? "is-best" : "";
            const base = r.id === globalLayoutId ? "is-base" : "";
            return `<button type="button" class="shadow-rank-chip ${best} ${base}" data-shadow-layout="${escapeHtml(r.id)}" title="RSI ${r.metrics?.rsiRisk}% · Eff ${r.metrics?.efficiency}% · home ${r.metrics?.homeRowPct}%">${escapeHtml(r.name)} · ${escapeHtml(String(r.score))}</button>`;
          })
          .join("")
      : `<span class="shadow-rank-chip">—</span>`;
  }

  const lab = full.trimmed
    ? analyzeKeyboardPatterns(full.trimmed, {
        baseLayout: globalLayoutId,
        filters,
      })
    : analyzeKeyboardPatterns("", { baseLayout: globalLayoutId, filters });
  lastPatternLab = lab;
  const patternEl = $("#pattern-lab-body");
  if (patternEl) patternEl.innerHTML = patternLabHtml(lab);

  let quantum = null;
  if (full.trimmed) {
    try {
      quantum = bridgeToQuantum(full.trimmed, {
        layout: full.pathBase || globalLayoutId,
        target: "local-simulator",
      });
    } catch {
      quantum = null;
    }
  }
  const qasmEl = $("#shadow-qasm");
  if (qasmEl) qasmEl.textContent = quantum?.circuit?.qasm || "// type to build circuit";
  const qVerdict = $("#shadow-q-verdict");
  if (qVerdict) {
    const v = quantum?.preflight?.verdict || "—";
    qVerdict.textContent = quantum
      ? `preflight: ${v} · score ${quantum.preflight?.scorePct ?? "—"} · gates ${quantum.circuit?.gates ?? 0}`
      : "preflight: —";
    qVerdict.className =
      "shadow-q-verdict" +
      (v === "GO" ? " is-go" : v === "WARN" ? " is-warn" : v === "ABORT" ? " is-abort" : "");
  }

  const spatial = spatialFromShadowLive(full);
  if (full.trimmed) publishSpatial(spatial);
  const spatialCanvas = $("#spatial-canvas");
  if (spatialCanvas) {
    const theme =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    renderSpatialCanvas(spatialCanvas, spatial, { theme });
  }

  const glue = getGluelamStatus();
  const chipG = $("#chip-gluelam");
  if (chipG) {
    chipG.textContent = glue.stubs
      ? "GlueLam · stubs"
      : `GlueLam · ${[glue.has.prefixes && "P", glue.has.dac && "D", glue.has.steno && "S", glue.has.preflight && "F"].filter(Boolean).join("") || "ok"}`;
    chipG.className = "stack-chip " + (glue.stubs ? "is-stub" : "is-ok");
  }
  const chipQ = $("#chip-q");
  if (chipQ) {
    const v = quantum?.preflight?.verdict || "—";
    chipQ.textContent = `Q · ${v}`;
    chipQ.className =
      "stack-chip " +
      (v === "GO" ? "is-ok" : v === "WARN" || v === "ABORT" ? "is-warn" : "is-stub");
  }
  const chipS = $("#chip-spatial");
  if (chipS) {
    chipS.textContent = spatial.active
      ? `Spatial · bpm ${spatial.channels?.musicBpm ?? "—"}`
      : "Spatial · idle";
    chipS.className = "stack-chip " + (spatial.active ? "is-ok" : "is-stub");
  }
  const chipI = $("#chip-iron");
  if (chipI) {
    chipI.textContent = "IronLine L4 · cortical";
    chipI.className = "stack-chip is-ok";
  }

  fillLangComparePanel(full.trimmed || raw);
  fillStenoSpacePanel(full.trimmed || raw);

  const headWord = (full.trimmed || "").split(/\s+/)[0] || "";
  const tickBase = corticalFast({
    text: raw,
    layout: globalLayoutId,
    live: full,
    budgetMs: DEFAULT_LOOP_BUDGET_MS,
  });

  corticalScheduleHeavy(tickBase, {
    buildStack: async () => {
      const meta = headWord ? await metaForWord(headWord) : null;
      const regs =
        meta?.registers ||
        (activeRegisterId !== "standard" ? [activeRegisterId] : ["standard"]);
      const tagEl = $("#shadow-register-tags");
      if (tagEl) {
        tagEl.innerHTML = meta
          ? registerMetaHtml(meta)
          : regs
              .map((r) => {
                const m = REGISTER_META[r] || { label: r };
                return `<span class="reg-tag">${escapeHtml(m.label || r)}</span>`;
              })
              .join("");
      }
      const rubik = buildRubikLanguageState(full.trimmed || "", {
        lab,
        registers: regs,
        langId: activeLangId,
        pathId: activePathId,
        family: motherTongueById(activeLangId).family,
        forceOrigin: true,
      });
      lastRubikState = rubik;
      renderRubikPanels(full.trimmed || "", lab, regs);

      const stack = buildToolStack(full.trimmed || raw, {
        layout: globalLayoutId,
        live: full,
        quantum,
        spatial,
        registers: regs,
        persona: getActivePersona(),
        level: "word",
      });
      lastToolStack = stack;
      const stackEl = $("#tool-stack-body");
      if (stackEl) stackEl.innerHTML = toolStackHtml(stack);
      lastRuntimeExport = exportMultiRuntime(stack, full, {
        registers: regs,
        speechPack: getActivePersona(),
      });
      window.__KBATCH_TOOL_STACK__ = stack;
      window.__KBATCH_RUNTIME_EXPORT__ = lastRuntimeExport;
      window.__KBATCH_PATTERN_LAB__ = lab;
      window.__KBATCH_RUBIK__ = rubik;
      window.__KBATCH_WORD_META__ = meta;

      // Quantum gutter fold-through (every heavy tick)
      try {
        const g = gutterPrefixContent(full.trimmed || raw, { mode: "auto" });
        const gEl = $("#quantum-gutter-body");
        if (gEl) gEl.innerHTML = gutterHtml(g);
        broadcastGutter("ugrad.kbatch.shadow", {
          strip: g.strip,
          counts: g.counts,
          text: (full.trimmed || "").slice(0, 120),
        });
        window.__KBATCH_GUTTER__ = g;
        stack.gutter = g;
      } catch (e) {
        console.warn("gutter:", e);
      }

      return stack;
    },
    crossref: async () => {
      if (headWord) {
        // progressive sliver pull (aa/ab/… or 3-letter fat split) before full letter
        const hits = await searchPrefixLazy(headWord.slice(0, 4), 24);
        return { hits, source: "local-slivers" };
      }
      return { hits: [], source: "idle" };
    },
    suggest: async () => {
      const sug = await suggestFromPersona(full.trimmed || raw, {
        layout: globalLayoutId,
        live: full,
        limit: 14,
      });
      lastPersonaSuggest = sug;
      const el = $("#persona-suggest-body");
      if (el) el.innerHTML = personaSuggestHtml(sug);
      window.__KBATCH_PERSONA_SUGGEST__ = sug;
      return sug;
    },
    publish: () => {
      publishShadowLive(full, {
        qasm: quantum?.circuit?.qasm,
        preflight: quantum?.preflight,
        spatial,
      });
      publishKbatchToLive(full);
      publishKbatchPresence(
        document.body.classList.contains("shadow-solo") ? "shadow" : "dictionary"
      );
      // Multi-device mesh: any peer can gain this knowledge envelope
      meshPublishKnowledge(
        {
          ...full,
          gutter: window.__KBATCH_GUTTER__?.strip,
          cortical: getLastCorticalTick()?.elapsedMs,
        },
        { kind: "shadow-live" }
      );
      window.__KBATCH_SHADOW_LIVE__ = shadowLiveEnvelope(full, {
        quantum,
        spatial,
        gluelam: glue,
      });
    },
    onDone: (tick) => {
      const cortEl = $("#cortical-status");
      if (cortEl) {
        cortEl.textContent = `cortical full · ${tick.elapsedMs}ms${tick.timedOut ? " · TIMEOUT" : ""} · stack ${tick.stack ? "✓" : "–"} · suggest ${tick.suggest?.suggestions?.length ?? 0}`;
      }
      $("#status-line").textContent = shadowLiveStatus(full);
    },
  });
}

/**
 * @param {ReturnType<typeof buildToolStack>} stack
 */
function toolStackHtml(stack) {
  if (!stack?.layers) return `<p class="writer-muted">Tool stack idle.</p>`;
  const layers = stack.layers
    .map(
      (l) =>
        `<span class="stack-layer is-${escapeHtml(l.status)}" title="${escapeHtml(l.label)}">${escapeHtml(l.id)} <b>${escapeHtml(l.status)}</b></span>`
    )
    .join("");
  const runtimes = (stack.runtimes || [])
    .map(
      (r) =>
        `<span class="runtime-chip" title="${escapeHtml(r.mime)}">${escapeHtml(r.label)} · ${escapeHtml(String(r.ready))}</span>`
    )
    .join("");
  return `<div class="tool-stack-panel">
    <p class="coin-strip">${escapeHtml(stack.strip)}</p>
    <div class="stack-layers">${layers}</div>
    <div class="runtime-row">${runtimes}</div>
  </div>`;
}

/** @type {ReturnType<typeof analyzeStenoSpace> | null} */
let lastStenoSpace = null;
/** @type {object | null} */
let lastPcapImage = null;

/**
 * Blank-space coins + hex/bin/ascii tool totals for Shadow Live text.
 * @param {string} [text]
 * @param {string} [payload]
 */
function fillStenoSpacePanel(text, payload) {
  const body = $("#steno-space-body");
  if (!body) return;
  const raw =
    text != null
      ? String(text)
      : $("#shadow-input")?.value || focusedEntry?.word || "";
  const pay =
    payload != null
      ? String(payload)
      : $("#steno-payload")?.value?.trim() || "";
  const pack = analyzeStenoSpace(raw, { payload: pay });
  lastStenoSpace = pack;
  body.innerHTML = stenoSpaceHtml(pack);
  window.__KBATCH_STENO_SPACE__ = pack;

  // Update stack chip if present
  const chip = $("#chip-steno-coins");
  if (chip) {
    const c = pack.blank.coins;
    chip.textContent = `Coins · w${c.spentWriting} · b${c.allotable}`;
    chip.className = "stack-chip " + (c.allotable > 0 ? "is-ok" : "is-stub");
  }
  return pack;
}

/**
 * Mint GrokYtalkY-compatible pcap/image path from current Shadow text.
 * @param {string} [text]
 */
async function runPcapImagePath(text) {
  const raw =
    text != null
      ? String(text)
      : $("#shadow-input")?.value?.trim() ||
        lastShadowLive?.trimmed ||
        focusedEntry?.word ||
        "";
  const payload =
    $("#steno-payload")?.value?.trim() ||
    `kbatch:${raw.slice(0, 64)}`;
  if (!raw) {
    $("#status-line").textContent = "Type text first for pcap/image path";
    return null;
  }
  fillStenoSpacePanel(raw, payload);
  const env = await buildPcapImagePath(raw, {
    payload,
    slot: 1,
    room: "dojo",
  });
  lastPcapImage = env;
  const body = $("#pcap-image-body");
  if (body) {
    body.innerHTML = pcapImageHtml(env);
    const canvas = $("#pcap-hexlum-canvas");
    if (canvas) renderHexLumCanvas(canvas, env);
  }
  $("#status-line").textContent = `pcap/image · ${env.mark?.id || "forge"} · ${env.stream?.packets || 0} pkts · blank ${env.steno?.coins?.allotable ?? 0} coins`;
  return env;
}

/**
 * Geometry-first search across media (words · phrases · lyrics · captions · code).
 * @param {string} [q]
 */
function runShadowSearch(q) {
  const input = $("#shadow-search-input");
  const query =
    q != null ? String(q) : input?.value || $("#shadow-input")?.value || "";
  if (input && q != null) input.value = query;

  const liveText = $("#shadow-input")?.value || "";
  const mediaIndex = buildMediaIndex({
    cache: analysisCache,
    liveText,
    texts: [
      liveText,
      lastShadowLive?.caption_out || "",
      window.__KBATCH_LAST_WRITER__
        ? JSON.stringify(window.__KBATCH_LAST_WRITER__).slice(0, 500)
        : "",
    ].filter(Boolean),
    // Pull a slice of open letter words if available
    words: (() => {
      try {
        const L = activeLetter?.toLowerCase?.() || "a";
        return (typeof wordsForLetter === "function"
          ? wordsForLetter(L)
          : []
        ).slice(0, 400);
      } catch {
        return [];
      }
    })(),
  });

  const kinds = [...shadowSearchKinds];
  const result = enrichShadowHits(
    shadowSearchAcrossMedia(query, {
      layout: globalLayoutId,
      cache: analysisCache,
      mediaIndex,
      kinds,
      limit: 28,
      minScore: 0.25,
    }),
    globalLayoutId
  );

  const hitsEl = $("#shadow-search-hits");
  if (hitsEl) {
    if (!result.hits.length) {
      hitsEl.innerHTML = query.trim()
        ? `<span class="shadow-copilot-idle">No geometric neighbors ≥0.25 · paste lyrics/captions into Shadow Live to index media · open A–Z letters for word pool</span>`
        : "";
    } else {
      hitsEl.innerHTML = result.hits
        .map((h) => {
          const label = truncateDisplay(h.text || h.word, 36);
          return `<button type="button" class="shadow-hit" role="listitem" data-shadow-hit="${escapeHtml(h.text || h.word)}" data-kind="${escapeHtml(h.kind)}" title="${escapeHtml(h.kind)} · score ${h.score} · ${escapeHtml(h.shadow || "")}">${escapeHtml(label)}<small>${h.score}${h.rsiRisk != null ? ` · RSI ${h.rsiRisk}` : ""}</small></button>`;
        })
        .join("");
    }
  }

  const kindSummary = Object.entries(result.media?.byKind || {})
    .map(([k, n]) => `${k}:${n}`)
    .join(" ");
  $("#status-line").textContent = `Shadow Search · media · “${truncateDisplay(query, 20)}” · ${result.hits.length} hits · ${kindSummary || "—"}`;
  window.__KBATCH_SHADOW_SEARCH__ = result;
  return result;
}

function clearShadowLive() {
  const input = $("#shadow-input");
  if (input) input.value = "";
  lastShadowLive = null;
  window.__KBATCH_SHADOW_LIVE__ = null;
  runShadowLive("", { rank: false });
}

function openWriter(seed = "") {
  const panel = $("#writer-panel");
  if (!panel) return;
  panel.hidden = false;
  panel.open = true;
  document.body.classList.add("writer-open");
  if (seed) $("#writer-input").value = seed;
  // Keep writer in document flow — only nudge into view under sticky header
  requestAnimationFrame(() => {
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    $("#writer-input")?.focus({ preventScroll: true });
  });
  // Auto-analyze if seed provided
  if (seed?.trim()) {
    runWriterAnalysis();
  }
}

function closeWriter() {
  const panel = $("#writer-panel");
  if (panel) {
    panel.hidden = true;
    panel.open = false;
  }
  document.body.classList.remove("writer-open");
  writerLive = false;
  panel?.classList.remove("is-live");
}

function setText(id, text, title) {
  const el = $(id);
  if (!el) return;
  el.textContent = text ?? "—";
  if (title != null) el.title = title;
}

/**
 * SMART Writer — full keyboard + linguistics stack under the textarea.
 */
function runWriterAnalysis() {
  const text = $("#writer-input")?.value?.trim() || "";
  if (!text) return;
  const layout = globalLayoutId;
  const results = $("#writer-results");
  if (results) results.hidden = false;

  // Core multi-level + geometric analysis of the whole text
  const env = analyzeLevel(text, {
    layout,
    source: "writer",
    caption_in: text,
  });
  const kb = analyzeWordSlim(text, layout) || analyzeWordSlim(text.replace(/\s+/g, ""), layout);
  const order = env.meta?.order || analyzeOrder(text);
  const hist = env.meta?.historical || analyzeHistorical(text, layout);
  const pos = analyzeSentenceUse(text);
  const scholar = analyzeScholarLinguistics(text, { layout });
  const first = (text.match(/[\p{L}']+/u) || [""])[0];
  const phono = first
    ? analyzePhonation(first, {})
    : analyzePhonation(text.slice(0, 24), {});
  const flow = toKeyboardFlow(text);
  const cross = crossLayoutTransliterations(text, "qwerty");
  const fam =
    hist.etymology?.primary?.family ||
    motherTongueById(activeLangId).family;
  const stepping = analyzeLanguageStepping(text, {
    langId: activeLangId,
    family: fam,
    layout,
  });
  lastStepping = stepping;
  if (stepping.pathway?.id) activePathId = stepping.pathway.id;
  if (stepping.register?.primary?.id) activeRegisterId = stepping.register.primary.id;

  // ── Strip ──
  const stripLabel =
    kb?.strip?.label ||
    env.strip?.label ||
    "Keys: 0 | Eff: 0% | Cpx: 0% | Trails: 0 | 0mm | 0.000000 cal";
  setText("#writer-strip", stripLabel, stripLabel);
  setText("#writer-level", `level: ${env.level} · ${layout} · ${currentLang().label}`);

  // ── DDR / Braille / Dance / Notes / Flow ──
  const ddr = kb?.flow?.ddr || flow.ddr || "·";
  const braille = kb?.braille || toBraille(text);
  const dance = kb?.notation?.dance || toDanceMoves(text) || "—";
  const notes = kb?.notation?.music || toMusicNotation(text) || "—";
  const arrows = kb?.flow?.arrows || flow.arrows || "·";
  const pattern = kb?.flow?.pattern || flow.pattern || "";
  setText("#w-ddr", ddr, ddr);
  setText("#w-braille", braille, braille);
  setText("#w-dance", dance, dance);
  setText("#w-notes", notes, notes);
  const flowEl = $("#w-flow");
  if (flowEl) {
    flowEl.innerHTML = `${escapeHtml(arrows)} <small>${escapeHtml(pattern)}</small>`;
    flowEl.title = `${arrows} ${pattern}`;
  }

  // ── Metrics pills ──
  const m = kb?.metrics || env.metrics || {};
  const pills = $("#w-metrics-pills");
  if (pills) {
    const items = [
      ["E", m.efficiency, "efficiency"],
      ["C", m.complexity, "complexity"],
      ["S", m.strain, "strain"],
      ["RSI", m.rsiRisk, "rsi"],
      ["H", m.homeRowPct != null ? `${m.homeRowPct}%` : "—", "home"],
      ["mm", m.travelMM, null],
      ["cal", m.calories != null ? Number(m.calories).toFixed(6) : "—", null],
      ["BPM", m.bpm != null ? `${m.bpm} ${m.timeSig || ""}` : "—", null],
      ["Keys", m.keys ?? env.metrics?.keys, null],
      ["Trails", m.trails ?? env.metrics?.trails, null],
      ["F-bal", m.fingerBalance, null],
      ["Force", m.avgForce, null],
    ];
    pills.innerHTML = items
      .map(([lab, val, kind]) => {
        const cls = kind ? metricClass(Number(val) || 0, kind) : "mid";
        return `<span class="pill ${cls}" title="${escapeHtml(String(lab))}">${escapeHtml(String(lab))} ${escapeHtml(String(val ?? "—"))}</span>`;
      })
      .join("");
  }

  // ── Encodings ──
  const enc = $("#w-encodings");
  if (enc) {
    const morse = toMorse(text).slice(0, 120);
    const nato = toNATO(text).slice(0, 80);
    const asl = (() => {
      try {
        return toASL(text).slice(0, 100);
      } catch {
        return "—";
      }
    })();
    enc.innerHTML = `
      <div><span class="sense-k">Morse</span> ${escapeHtml(morse)}</div>
      <div><span class="sense-k">NATO</span> ${escapeHtml(nato)}</div>
      <div><span class="sense-k">ASL</span> ${escapeHtml(asl)}</div>
      <div><span class="sense-k">caption_out</span> ${escapeHtml(env.streams?.caption_out || stripLabel)}</div>
    `;
  }

  // ── Layout chips ──
  const layEl = $("#w-layouts");
  if (layEl && cross?.layouts) {
    const orderIds = [
      ...PRIMARY_LAYOUTS,
      ...LAYOUT_RING_ORDER.filter((id) => !PRIMARY_LAYOUTS.includes(id)),
    ];
    layEl.innerHTML = orderIds
      .map((id) => {
        const L = KEYBOARD_LAYOUTS[id];
        const shadow = cross.layouts[id]?.text || "·";
        return `<span class="layout-chip" title="${escapeHtml(L.name)}: ${escapeHtml(shadow)}">
          <em>${escapeHtml(L.name)}</em>
          <b>${escapeHtml(truncateDisplay(shadow, 24))}</b>
        </span>`;
      })
      .join("");
  }

  // ── Order ──
  const soFull = `${order.compressed || order.so || "—"}  ·  open ${order.openRatio}%`;
  setText("#writer-so", soFull, soFull);
  const patFull = order.topPatterns?.length
    ? order.topPatterns.map((p) => `${p.pattern}×${p.count}`).join(" · ")
    : "no multi-letter SO patterns";
  setText("#writer-patterns", patFull, patFull);

  // ── Historical ──
  setText(
    "#writer-era",
    `${hist.era?.label || "—"} (${hist.era?.years || ""})`
  );
  setText(
    "#writer-etym",
    hist.etymology?.primary
      ? `${hist.etymology.primary.family} · ${hist.etymology.primary.via} (${Math.round(hist.etymology.primary.confidence * 100)}%)`
      : "—"
  );
  setText(
    "#writer-scribe",
    hist.scribe
      ? `${hist.scribe.ductus} · ${hist.scribe.tempo} · ${hist.scribe.pressure} pressure`
      : "—"
  );
  setText(
    "#writer-chant",
    hist.chant ? `${hist.chant.label} — ${hist.chant.desc}` : "—"
  );

  // ── Phonation ──
  const pl = phonationCardLines(phono);
  setText("#w-mouth", pl.mouth, pl.mouth);
  setText("#w-tone", pl.tone, pl.tone);
  setText("#w-registers", pl.registers, pl.registers);
  setText("#w-place", pl.place, pl.place);
  setText("#w-coach", pl.coach, pl.coach);

  // ── Language stepping: origins → mother tongue → slang spectrum ──
  const sc = languageSteppingCardLines(stepping);
  setText("#w-origin", `${sc.origin} — ${stepping.origin?.narrative || ""}`, sc.origin);
  setText("#w-pathway", sc.pathway, sc.pathway);
  setText("#w-register", sc.register + (stepping.register?.narrative ? ` — ${stepping.register.narrative}` : ""), sc.register);
  setText("#w-derivatives", sc.derivatives, sc.derivatives);
  setText(
    "#w-mother",
    `${sc.mother} · ${stepping.support?.script || ""} · siblings: ${(stepping.support?.siblingTongues || []).join(", ") || "—"}`,
    sc.mother
  );
  renderSteppingRows("#w-origin-row", "#w-register-row", "#w-path-row", stepping, activePathId);
  // Keep Language section in sync with writer analysis
  renderLangSection();

  // ── POS / meaning ──
  setText("#w-pos-gloss", pos.gloss || "—", pos.gloss || "");
  setText(
    "#w-typology",
    scholar.morphosyntax?.typology
      ? `${scholar.morphosyntax.typology.wordOrder} · ${scholar.morphosyntax.typology.alignment} · ${scholar.morphosyntax.typology.mood}`
      : "—"
  );
  setText("#w-gloss", scholar.leipzig?.formatted || "—");
  setText(
    "#w-sound",
    scholar.historical?.soundChange?.hypothesizedPath || "—",
    scholar.historical?.soundChange?.hypothesizedPath || ""
  );
  setText("#w-apa", scholar.citations?.apa || "—");
  setText("#w-bibtex", scholar.citations?.bibtex || "—");
  setText("#w-tei", scholar.citations?.tei || "—");

  // ── Token stream (first 40) ──
  const tokEl = $("#w-tokens");
  if (tokEl) {
    const tokens = pos.tokens?.slice(0, 40) || [];
    tokEl.innerHTML = tokens
      .map((t) => {
        const so = analyzeOrder(t.word).so;
        const br = toBraille(t.word);
        return `<div class="writer-token" title="${escapeHtml(t.word)} / ${escapeHtml(t.pos)}">
          <b>${escapeHtml(t.word)}</b>
          <i>${escapeHtml(t.pos)}</i>
          <span>SO ${escapeHtml(so)} · ${escapeHtml(br)}</span>
        </div>`;
      })
      .join("");
  }

  // ── Live meaning + lexical graph + adoption for first content word ──
  setText("#w-meaning", first ? "Looking up meaning · relations · etymology…" : "—");
  setText("#w-etym-full", "—");
  const wLex = $("#w-lex-graph");
  if (wLex) wLex.innerHTML = first ? `<p class="writer-muted">Loading synonyms / antonyms / adoption…</p>` : "";
  if (first) {
    lookupMeaning(first).then((sense) => {
      setText(
        "#w-meaning",
        sense.definition
          ? `${sense.partOfSpeech ? sense.partOfSpeech + " · " : ""}${sense.definition}`
          : "No definition found",
        sense.definition || ""
      );
      const firstRec = sense.firstRecorded
        ? ` · first recorded ${sense.firstRecorded}${sense.firstRecordedSource === "heuristic" ? " (est.)" : ""}`
        : "";
      const adopt = sense.adoption?.pathLabel
        ? ` · adoption ${sense.adoption.pathLabel}`
        : "";
      const agency = sense.agency?.label ? ` · agency ${sense.agency.label}` : "";
      setText(
        "#w-etym-full",
        `${sense.etymologyText || `${sense.etymology?.primary?.family || "—"} · ${sense.era?.label || ""}`}${firstRec}${adopt}${agency}`,
        sense.etymologyText || ""
      );
      if (wLex) wLex.innerHTML = senseLexHtml(sense, { compact: false }) || `<p class="writer-muted">No relation graph for this form.</p>`;
    });
  }

  // ── JSON envelope ──
  const pack = {
    level: env.level,
    strip: stripLabel,
    layout,
    language: currentLang(),
    ddr,
    braille,
    dance,
    notes,
    flow: { arrows, pattern, ddr },
    metrics: m,
    order: {
      so: order.so,
      compressed: order.compressed,
      topPatterns: order.topPatterns,
    },
    pos: { gloss: pos.gloss, counts: pos.counts, syntax: pos.syntax },
    historical: {
      era: hist.era,
      etymology: hist.etymology?.primary,
      scribe: hist.scribe,
      chant: hist.chant,
    },
    phonation: pl,
    languageStepping: {
      origin: stepping.origin?.active,
      pathway: stepping.pathway,
      register: stepping.register?.primary,
      derivatives: stepping.derivatives,
      motherTongue: stepping.motherTongue,
      support: stepping.support,
    },
    scholar: {
      gloss: scholar.leipzig?.formatted,
      typology: scholar.morphosyntax?.typology,
      soundChange: scholar.historical?.soundChange,
      citations: {
        apa: scholar.citations?.apa,
        bibtex: scholar.citations?.bibtex,
      },
    },
    layouts: Object.fromEntries(
      LAYOUT_RING_ORDER.map((id) => [id, cross.layouts[id]?.text])
    ),
    streams: env.streams,
    caption_out: env.streams?.caption_out || stripLabel,
  };
  const jsonEl = $("#writer-json");
  if (jsonEl) {
    jsonEl.hidden = false;
    jsonEl.textContent = JSON.stringify(pack, null, 2);
  }

  // Drive main viz from full-text analysis when possible
  if (kb?.analysis) {
    drawCanvas(kb.analysis);
    const stripMain = $("#ct-stats");
    if (stripMain) stripMain.textContent = stripLabel;
    $("#geo-label").textContent = `writer · ${layout}`;
    $("#focus-word").textContent = truncateDisplay(text, 48);
  }

  // Also focus first token in dictionary
  if (first) {
    try {
      const entry = ensureAnalyzed(first.toLowerCase(), { full: true });
      if (entry) {
        focusedEntry = entry;
        updateFocusSense(entry);
      }
    } catch {
      /* */
    }
  }

  $("#status-line").textContent = `SMART Writer · ${env.level} · ${stepping.register?.primary?.label || ""} · ${stepping.pathway?.label || ""} · ${hist.era?.label || ""}`;
  window.__KBATCH_LAST_WRITER__ = {
    env,
    order,
    hist,
    pos,
    scholar,
    phono,
    kb,
    pack,
  };
}

/**
 * Pick best search hit to open description card for (exact > prefix > first).
 * @param {string} q
 * @param {string[]} hits
 */
function pickSearchFocus(q, hits) {
  const low = String(q || "")
    .trim()
    .toLowerCase();
  if (!low || !hits?.length) return null;
  if (hits.includes(low)) return low;
  const pref = hits.find((w) => String(w).toLowerCase() === low);
  if (pref) return pref;
  const starts = hits.find((w) => String(w).toLowerCase().startsWith(low));
  if (starts) return starts;
  return hits[0];
}

async function runSearch(q) {
  searchQuery = q;
  // Multi-word / long paste → open writer instead of pure word search
  if (q.includes(" ") || q.includes("\n") || q.length > 48) {
    openWriter(q);
    return;
  }
  if (!q.trim()) {
    searchHits = null;
    render();
    return;
  }
  // Lazy: pull only matching prefix slivers (aa/ab/ac…) then widen
  $("#status-line").textContent = `Search · loading slivers…`;
  const qTrim = q.trim();
  let hits;
  if (qTrim.includes(" ") || qTrim.length > 12) {
    await searchWordsLazy(q, 20);
    hits = searchWords(q, 800);
  } else {
    // typeahead path — one or few small JSON pulls first
    const prefixHits = await searchPrefixLazy(qTrim, 400);
    if (prefixHits.length) {
      const more = (await searchWordsLazy(q, 400)).filter(
        (w) => !w.startsWith(qTrim.toLowerCase())
      );
      hits = [...prefixHits, ...more].slice(0, 800);
    } else {
      await searchWordsLazy(q, 20);
      hits = searchWords(q, 800);
    }
  }
  // dedupe
  searchHits = [...new Set(hits)];
  // open letters that have hits
  openSections.clear();
  for (const w of searchHits.slice(0, 200)) {
    const ch = String(w || "")[0] || "";
    if (ch) openSections.add(ch.toUpperCase());
  }
  // Ensure open letter shards present
  await Promise.all(
    [...openSections].map((L) => loadLetter(String(L).toLowerCase()))
  );
  for (const L of openSections) {
    letterShown[L] = Math.max(letterShown[L] || PAGE_SIZE, PAGE_SIZE);
  }

  // Open description card under the best hit (exact "mom" → mom), not only keyboard focus panel
  const focusTarget = pickSearchFocus(qTrim, searchHits);
  if (focusTarget) {
    // focusWord: full geometry + sense under list card + #focus-sense + scroll
    focusWord(focusTarget);
  } else {
    render();
  }

  $("#status-line").textContent = focusTarget
    ? `${searchHits.length.toLocaleString()} matches · open “${focusTarget}”`
    : `${searchHits.length.toLocaleString()} matches in ${totalCount().toLocaleString()} words`;
}

/**
 * Re-analyze focused / searched word with live geometry and expand full keyboard ring.
 * Does NOT load every language letter pack — only the current word.
 */
function refreshKeyboards(wordOpt) {
  const raw =
    wordOpt ||
    focusedEntry?.word ||
    $("#search-input")?.value?.trim() ||
    $("#shadow-input")?.value?.trim()?.split(/\s+/)[0] ||
    "";
  const w = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}'’-]/gu, "");
  if (!w) {
    $("#status-line").textContent =
      "Refresh keyboards · search or select a word first";
    return;
  }
  showAllKeyboards = true;
  // Drop stub so ensureAnalyzed rebuilds full slim geometry
  analysisCache.delete(w);
  const entry = ensureAnalyzed(w, { full: true, forceGeometry: true });
  if (!entry) {
    $("#status-line").textContent = `Refresh keyboards · could not analyze “${w}”`;
    return;
  }
  // Clear orthography flag if present
  if (entry.orthographyOnly) {
    const full = analyzeWordSlim(w, globalLayoutId);
    if (full) {
      analysisCache.set(w, full);
      focusedEntry = full;
    } else {
      focusedEntry = entry;
    }
  } else {
    focusedEntry = entry;
  }
  openSections.add(
    (focusedEntry.letter || w[0] || "A").toString().toUpperCase()
  );
  render();
  updateFocusViz();
  updateFocusSense(focusedEntry);
  enrichEntryWithMeaning(focusedEntry).then((e) => {
    attachScholarToEntry(e);
    analysisCache.set(e.word.toLowerCase(), e);
    focusedEntry = e;
    patchSenseDom(e);
    updateFocusSense(e);
  });
  requestAnimationFrame(() => {
    const card = document.querySelector(
      `.word-card[data-word="${CSS.escape(focusedEntry.word)}"]`
    );
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    card?.classList.add("is-flash");
    setTimeout(() => card?.classList.remove("is-flash"), 900);
  });
  $("#status-line").textContent = `Keyboards refreshed · “${focusedEntry.word}” · ${KEYBOARD_LAYOUTS[globalLayoutId]?.name || globalLayoutId} · full ring`;
}

function addOrSelectWord(raw) {
  const w = raw.trim().toLowerCase();
  if (!w) return;
  // if in corpus or not — analyze either way
  const entry = ensureAnalyzed(w);
  if (!entry) return;
  searchQuery = "";
  searchHits = null;
  $("#search-input").value = "";
  focusWord(entry.word);
  $("#status-line").textContent = `Analyzed “${entry.word}” · ${entry.strip?.label || ""}`;
}

function cachedEntriesList() {
  return [...analysisCache.values()].sort((a, b) => {
    if (a.letter !== b.letter) return a.letter.localeCompare(b.letter);
    return a.word.localeCompare(b.word);
  });
}

function bindControls() {
  const modeBar = $("#mode-bar");
  if (modeBar) {
    modeBar.innerHTML = VIZ_MODES.map(
      (m) =>
        `<button type="button" class="mode-btn ${m.id === vizMode ? "is-active" : ""}" data-mode="${m.id}">${escapeHtml(m.label)}</button>`
    ).join("");
    modeBar.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-mode]");
      if (!btn) return;
      vizMode = btn.dataset.mode;
      modeBar.querySelectorAll(".mode-btn").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.mode === vizMode);
      });
      updateFocusViz();
    });
  }

  const layoutSel = $("#layout-select");
  if (layoutSel) {
    layoutSel.innerHTML = LAYOUT_RING_ORDER.map((id) => {
      const L = KEYBOARD_LAYOUTS[id];
      return `<option value="${id}">${escapeHtml(L.name)} · ${escapeHtml(L.region)}</option>`;
    }).join("");
    layoutSel.value = globalLayoutId;
    layoutSel.addEventListener("change", () => {
      const layoutId = layoutSel.value;
      const preferred = langForLayout(layoutId);
      const mtMatch = MOTHER_TONGUES.find((m) => m.layout === layoutId);
      const descMatch = DESC_LANGS.find((l) => l.layout === layoutId);
      const curMt = motherTongueById(activeLangId);
      let nextLang = preferred;
      if (curMt.layout === layoutId || KEYBOARD_LAYOUTS[layoutId]?.script === curMt.script) {
        nextLang = activeLangId;
      } else if (mtMatch) {
        nextLang = mtMatch.id;
      } else if (descMatch) {
        nextLang = descMatch.id;
      }
      void setActiveLanguage(nextLang, { fromLayout: true, layoutId });
    });
  }
}

function bindEvents() {
  try {
    bindControls();
  } catch (e) {
    console.warn("bindControls:", e);
  }

  const input = $("#search-input");
  let searchTimer = null;
  input?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(input.value), 120);
  });
  input?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      // exact hit?
      const low = q.toLowerCase();
      const list = wordsForLetter(low[0]);
      if (list.includes(low) || analysisCache.has(low)) {
        addOrSelectWord(low);
      } else if (searchHits?.length === 1) {
        addOrSelectWord(searchHits[0]);
      } else {
        addOrSelectWord(q);
      }
    }
  });

  function syncSearchClearBtn() {
    const clearBtn = $("#btn-clear-search");
    if (!clearBtn) return;
    clearBtn.hidden = !input.value.trim();
  }

  function clearSearchOnly() {
    input.value = "";
    searchQuery = "";
    searchHits = null;
    syncSearchClearBtn();
    render();
    input.focus();
    $("#status-line").textContent = "Search cleared";
  }

  function clearWriterOnly() {
    const wi = $("#writer-input");
    if (wi) wi.value = "";
    const res = $("#writer-results");
    if (res) res.hidden = true;
    [
      "#writer-strip",
      "#writer-so",
      "#writer-patterns",
      "#writer-era",
      "#writer-etym",
      "#writer-scribe",
      "#writer-chant",
      "#writer-level",
      "#w-ddr",
      "#w-braille",
      "#w-dance",
      "#w-notes",
      "#w-flow",
      "#w-meaning",
      "#w-etym-full",
      "#w-pos-gloss",
      "#w-mouth",
      "#w-tone",
      "#w-registers",
      "#w-place",
      "#w-coach",
      "#w-gloss",
      "#w-typology",
      "#w-sound",
      "#w-apa",
      "#w-bibtex",
      "#w-tei",
      "#w-origin",
      "#w-pathway",
      "#w-register",
      "#w-derivatives",
      "#w-mother",
      "#writer-json",
    ].forEach((sel) => {
      const el = $(sel);
      if (el) el.textContent = sel === "#writer-level" ? "level: —" : "—";
    });
    const pills = $("#w-metrics-pills");
    if (pills) pills.innerHTML = "";
    const enc = $("#w-encodings");
    if (enc) enc.innerHTML = "";
    const lays = $("#w-layouts");
    if (lays) lays.innerHTML = "";
    const toks = $("#w-tokens");
    if (toks) toks.innerHTML = "";
    for (const id of ["#w-origin-row", "#w-register-row", "#w-path-row"]) {
      const el = $(id);
      if (el) el.innerHTML = "";
    }
    lastStepping = null;
    writerLive = false;
    $("#writer-panel")?.classList.remove("is-live");
    window.__KBATCH_LAST_WRITER__ = null;
  }

  function clearAllUi() {
    clearSearchOnly();
    clearWriterOnly();
    closeWriter();
    clearShadowLive();
    lastPresentation = null;
    const ps = $("#pres-source");
    if (ps) ps.value = "";
    const pp = $("#pres-preview");
    if (pp) pp.textContent = "";
    closePresentationComposer();
    $("#status-line").textContent = "Cleared search, writer, Shadow Live, and presentation";
  }

  // Shadow Live — default type-once surface
  const shadowInput = $("#shadow-input");
  shadowInput?.addEventListener("input", () => {
    clearTimeout(shadowLiveTimer);
    shadowLiveTimer = setTimeout(() => runShadowLive(), 160);
  });
  $("#btn-shadow-run")?.addEventListener("click", () => runShadowLive());
  $("#btn-shadow-clear")?.addEventListener("click", () => clearShadowLive());
  $("#btn-shadow-copy")?.addEventListener("click", async () => {
    const t =
      lastShadowLive?.caption_out ||
      $("#shadow-strip")?.textContent ||
      "";
    try {
      await navigator.clipboard.writeText(t);
      $("#status-line").textContent = "Shadow Live caption_out copied";
    } catch {
      $("#status-line").textContent = "Copy failed — select strip manually";
    }
  });
  $("#btn-shadow-writer")?.addEventListener("click", () => {
    const t = $("#shadow-input")?.value?.trim() || "";
    openWriter(t);
  });
  $("#shadow-rank")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-shadow-layout]");
    if (!btn) return;
    const id = btn.dataset.shadowLayout;
    if (!id || !KEYBOARD_LAYOUTS[id]) return;
    globalLayoutId = id;
    const layoutSel = $("#layout-select");
    if (layoutSel) layoutSel.value = id;
    const match = DESC_LANGS.find((l) => l.layout === id);
    if (match) activeLangId = match.id;
    rebindAllLayouts();
    renderLangSection();
    render();
    runShadowLive();
    updateFocusViz();
    $("#status-line").textContent = `Shadow Live base → ${KEYBOARD_LAYOUTS[id].name}`;
  });

  $("#btn-shadow-search")?.addEventListener("click", () => runShadowSearch());
  $("#shadow-search-input")?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      runShadowSearch();
    }
  });
  $("#shadow-search-hits")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-shadow-hit]");
    if (!btn) return;
    const w = btn.dataset.shadowHit;
    if (!w) return;
    const si = $("#shadow-input");
    if (si) si.value = w;
    runShadowLive(w);
    if (!w.includes(" ")) {
      try {
        addOrSelectWord(w);
      } catch {
        /* shadow-solo page may lack list */
      }
    }
  });
  $("#shadow-kind-filters")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-kind]");
    if (!btn) return;
    const k = btn.dataset.kind;
    if (!k) return;
    if (shadowSearchKinds.has(k)) shadowSearchKinds.delete(k);
    else shadowSearchKinds.add(k);
    btn.classList.toggle("is-on", shadowSearchKinds.has(k));
    runShadowSearch();
  });
  $("#btn-shadow-blank")?.addEventListener("click", () => {
    const live = lastShadowLive || runShadowLive();
    const spatial = spatialFromShadowLive(live);
    bridgeToBlank(live, spatial, { open: true });
    $("#status-line").textContent = "Bridged → blank geometric keyboard";
  });

  // Language compare views: grid · by origin · evolution timeline
  document.querySelector(".lang-compare-views")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-lang-view]");
    if (!btn) return;
    setLangCompareView(btn.getAttribute("data-lang-view") || "grid");
  });

  // stenoSTRIP · blank coins · pcap/image path (GrokYtalkY forge/hexlum)
  $("#btn-steno-analyze")?.addEventListener("click", () => {
    const t = $("#shadow-input")?.value || "";
    const p = $("#steno-payload")?.value || "";
    const pack = fillStenoSpacePanel(t, p);
    $("#status-line").textContent = pack?.strip || "steno space analyzed";
  });
  $("#btn-pcap-path")?.addEventListener("click", () => {
    runPcapImagePath().catch((e) => {
      $("#status-line").textContent = `pcap path failed: ${e?.message || e}`;
    });
  });
  $("#btn-steno-embed")?.addEventListener("click", () => {
    const t = $("#shadow-input")?.value || "";
    const p = $("#steno-payload")?.value?.trim();
    if (!p) {
      $("#status-line").textContent =
        "Set payload to embed in blank/steno spaces";
      return;
    }
    const pack = analyzeStenoSpace(t, { payload: p });
    const encoded = stenoEncode(t, p);
    if ($("#shadow-input")) $("#shadow-input").value = encoded;
    fillStenoSpacePanel(encoded, p);
    runShadowLive(encoded);
    const mode = pack.allotment.fitsByAppend
      ? "append-trailer"
      : "blank-allot";
    $("#status-line").textContent = `Embedded ${pack.allotment.neededCoins} coins (${mode}) · +${encoded.length - t.length} stego · free blank was ${pack.allotment.freeCoins}`;
  });
  $("#btn-steno-copy")?.addEventListener("click", async () => {
    const strip =
      lastStenoSpace?.strip ||
      formatStrip(
        analyzeBlankSpace($("#shadow-input")?.value || ""),
        toolAnalysisTotal($("#shadow-input")?.value || ""),
        { remainingCoins: 0, uses: [] }
      );
    try {
      await navigator.clipboard.writeText(strip);
      $("#status-line").textContent = "Coin strip copied";
    } catch {
      $("#status-line").textContent = strip;
    }
  });
  $("#steno-payload")?.addEventListener("change", () => {
    fillStenoSpacePanel(
      $("#shadow-input")?.value || "",
      $("#steno-payload")?.value || ""
    );
  });

  // GrokYtalkY glyph pixels → stenoSTRIP whitespace + mesh broadcast
  const glyphN = () => {
    const v = parseInt($("#glyph-n")?.value || "13", 10);
    return [13, 25, 37, 49].includes(v) ? v : DEFAULT_GLYPH_N;
  };
  const runGlyphSteno = (broadcast) => {
    const t = $("#shadow-input")?.value || "kbatch";
    const n = glyphN();
    const bits = glyphFromText(t, n);
    const prev = $("#glyph-steno-preview");
    if (prev) prev.innerHTML = glyphGridHtml(bits, n);
    if (broadcast) {
      const { pack, envelope } = broadcastGlyphSteno(t, bits, { n });
      if ($("#shadow-input")) $("#shadow-input").value = pack.encoded;
      fillStenoSpacePanel(pack.encoded, `glyph${n}x${n}`);
      runShadowLive(pack.encoded);
      $("#status-line").textContent = `GY glyph ${n}² → steno + mesh · ones ${envelope.ones}/${envelope.bits}`;
      return envelope;
    }
    const pack = encodeGlyphInSteno(t, bits, { n });
    if ($("#shadow-input")) $("#shadow-input").value = pack.encoded;
    fillStenoSpacePanel(pack.encoded, `glyph${n}x${n}`);
    runShadowLive(pack.encoded);
    $("#status-line").textContent = `GY glyph ${n}² embedded in whitespace · ${pack.payloadBytes}B · ones ${pack.ones}`;
    return pack;
  };
  $("#btn-glyph-steno")?.addEventListener("click", () => runGlyphSteno(false));
  $("#btn-glyph-broadcast")?.addEventListener("click", () => runGlyphSteno(true));
  $("#glyph-n")?.addEventListener("change", () => {
    const t = $("#shadow-input")?.value || "kbatch";
    const n = glyphN();
    const prev = $("#glyph-steno-preview");
    if (prev) prev.innerHTML = glyphGridHtml(glyphFromText(t, n), n);
  });

  // ugrad-live: Overview workspace peers + pin to documents
  const liveStatusEl = $("#ugrad-live-status");
  const liveMetaEl = $("#ugrad-live-meta");
  subscribeUgradLive((msg) => {
    if (!liveStatusEl) return;
    if (msg.type === "workspace" && msg.source === "overview") {
      liveStatusEl.textContent = `Overview live · ${msg.headline || msg.roomId} · ${new Date(msg.ts).toLocaleTimeString()}`;
      if (liveMetaEl) liveMetaEl.textContent = `room ${msg.roomId} · free LLM on Overview (Ollama)`;
      const chip = $("#chip-ugrad-live");
      if (chip) {
        chip.textContent = "ugrad-live · Overview ✓";
        chip.className = "stack-chip is-ok";
      }
    } else if (msg.type === "presence" && msg.source === "overview") {
      liveStatusEl.textContent = `Overview peer online · ${msg.page || ""}`;
    }
  });
  publishKbatchPresence();
  setInterval(() => publishKbatchPresence(), 10000);

  $("#btn-pin-overview")?.addEventListener("click", () => {
    const text =
      $("#shadow-input")?.value?.trim() ||
      lastShadowLive?.trimmed ||
      lastShadowLive?.caption_out ||
      "";
    if (!text) {
      $("#status-line").textContent = "Nothing to pin — type in Shadow Live first";
      return;
    }
    pinToOverview(text, "geometry");
    publishKbatchToLive(lastShadowLive || { trimmed: text });
    if (liveStatusEl) {
      liveStatusEl.textContent = `Pinned to Overview drawer · open Overview tab to see notes`;
    }
    $("#status-line").textContent = "Pinned → Overview (ugrad-live)";
  });

  syncSearchClearBtn();
  input?.addEventListener("input", () => syncSearchClearBtn());

  $("#btn-clear-search")?.addEventListener("click", () => clearSearchOnly());
  $("#btn-clear-all")?.addEventListener("click", () => clearAllUi());

  $("#btn-analyze")?.addEventListener("click", () => {
    const v = (input?.value || "").trim();
    if (v.includes(" ") || v.length > 48) {
      // Long paste → Shadow Live first (daily surface), Writer optional
      runShadowLive(v);
      $("#shadow-live")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (v) {
      runShadowLive(v);
      addOrSelectWord(v);
      return;
    }
    runShadowLive();
  });

  $("#btn-toggle-writer")?.addEventListener("click", () => {
    const panel = $("#writer-panel");
    if (panel?.hidden) openWriter(input.value);
    else closeWriter();
  });
  $("#btn-writer-close")?.addEventListener("click", () => closeWriter());
  $("#btn-writer-clear")?.addEventListener("click", () => {
    clearWriterOnly();
    $("#status-line").textContent = "Writer cleared";
    $("#writer-input")?.focus();
  });
  $("#btn-writer-analyze")?.addEventListener("click", () => runWriterAnalysis());
  $("#btn-writer-live")?.addEventListener("click", () => {
    writerLive = !writerLive;
    $("#writer-panel")?.classList.toggle("is-live", writerLive);
    $("#status-line").textContent = writerLive
      ? "SMART Writer live · typing re-analyzes"
      : "SMART Writer live off";
    if (writerLive) runWriterAnalysis();
  });
  $("#writer-input")?.addEventListener("input", () => {
    if (!writerLive) return;
    clearTimeout(writerLiveTimer);
    writerLiveTimer = setTimeout(() => runWriterAnalysis(), 280);
  });
  $("#btn-writer-x")?.addEventListener("click", () => {
    const t = $("#writer-input")?.value?.trim();
    if (t) {
      openPresentationComposer();
      const src = $("#pres-source");
      if (src) src.value = t;
      runPresentationCompose();
    }
  });
  $("#btn-writer-overview")?.addEventListener("click", () => {
    const text =
      $("#writer-input")?.value?.trim() ||
      window.__KBATCH_LAST_WRITER__?.env?.text ||
      "";
    if (!text) {
      $("#status-line").textContent = "Writer empty — paste text first";
      return;
    }
    const pack = pipeToOverview(text, {
      layout: globalLayoutId,
      title: `KBatch · ${text.slice(0, 40)}`,
    });
    $("#status-line").textContent =
      "Overview workspace JSON downloaded — import in Overview (fornevercollective.github.io/overview)";
    console.info("[kbatch] overview pack", pack.overview);
  });
  $("#btn-writer-copy-caption")?.addEventListener("click", async () => {
    const cap =
      window.__KBATCH_LAST_WRITER__?.env?.streams?.caption_out ||
      $("#writer-strip")?.textContent ||
      "";
    try {
      await navigator.clipboard.writeText(cap);
      $("#status-line").textContent = "caption_out copied";
    } catch {
      $("#status-line").textContent = cap;
    }
  });

  $("#btn-expand-all")?.addEventListener("click", async () => {
    setDictSectionOpen(true);
    LETTERS.forEach((L) => openSections.add(L));
    $("#status-line").textContent = "Expanding all letters (paginated)…";
    await loadAllLetters();
    render();
    $("#status-line").textContent = `${totalCount().toLocaleString()} words · sections expanded (paged)`;
  });
  $("#btn-collapse-all")?.addEventListener("click", () => {
    openSections.clear();
    activePrefix = null;
    render();
    $("#status-line").textContent = "Letter cards collapsed · Dictionary section still open";
  });
  // Fold the whole Dictionary block (not just letter cards)
  $("#btn-collapse-dict")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const dict = /** @type {HTMLDetailsElement | null} */ ($("#dict-section"));
    const next = !(dict?.open);
    setDictSectionOpen(next);
    $("#status-line").textContent = next
      ? "Dictionary open"
      : "Dictionary folded · click header or A on the side rail";
    if (next) {
      dict?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  // Native <details> toggle (header click) — persist + badge
  $("#dict-section")?.addEventListener("toggle", () => {
    const dict = /** @type {HTMLDetailsElement | null} */ ($("#dict-section"));
    if (!dict) return;
    syncDictSectionChrome(dict);
    try {
      localStorage.setItem(DICT_SECTION_OPEN_KEY, dict.open ? "1" : "0");
    } catch {
      /* */
    }
    if (!dict.open) {
      $("#status-line").textContent =
        "Dictionary folded · click header, Fold button, or side-rail A to reopen";
    }
  });

  const btnAnalyzeAll = $("#btn-analyze-all");
  if (btnAnalyzeAll) {
    btnAnalyzeAll.addEventListener("click", async () => {
      if (chunkJob?.running) {
        chunkJob.abort();
        btnAnalyzeAll.textContent = "Analyze all letters";
        $("#status-line").textContent = "Chunk analyze stopped";
        return;
      }
      btnAnalyzeAll.textContent = "Stop analyze…";
      $("#status-line").textContent = "Analyzing corpus by letter chunks…";
      await analyzeAllByLetterChunks({
        onProgress: ({ letter, letterDone, letterTotal, done, total, source }) => {
          $("#status-line").textContent = `${letter} ${letterDone}/${letterTotal} (${source}) · analyzed ${done.toLocaleString()} / ${total.toLocaleString()}`;
          updateAnalyzedStats();
        },
      });
      btnAnalyzeAll.textContent = "Analyze all letters";
      updateAnalyzedStats();
      render();
      $("#status-line").textContent =
        analysisCache.size >= totalCount()
          ? `All ${totalCount().toLocaleString()} words analyzed`
          : `Analyzed ${analysisCache.size.toLocaleString()} / ${totalCount().toLocaleString()}`;
    });
  }

  // Section rail (Lang / Viz / Live / A–Z / Skills) — aligns with main-col sections
  $("#section-rail")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-goto]");
    if (!btn) return;
    jumpToSection(btn.getAttribute("data-goto") || "");
  });

  // A–Z + prefix flyout (clicks on rail or flyout; flyout is outside #alpha-rail)
  $("#alpha-rails")?.addEventListener("click", (ev) => {
    const prefBtn = ev.target.closest("[data-prefix]");
    if (prefBtn && $("#alpha-rails")?.contains(prefBtn)) {
      const pref = prefBtn.getAttribute("data-prefix") || "";
      const L = prefBtn.getAttribute("data-letter") || activeLetter;
      if (pref === "" || pref == null) {
        activePrefix = null;
        jumpToLetter(L, { forceOpen: true });
        return;
      }
      jumpToPrefix(pref, L);
      return;
    }
    const btn = ev.target.closest(".alpha-letter[data-letter]");
    if (!btn || !$("#alpha-rail")?.contains(btn)) return;
    if (btn.dataset.letter === activeLetter && activePrefix) {
      activePrefix = null;
      jumpToLetter(btn.dataset.letter, { forceOpen: true });
      return;
    }
    jumpToLetter(btn.dataset.letter);
  });

  // Language section chips + script alphabet bar + stepping controls
  $("#lang-tier-row")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-lang-tier]");
    if (!btn) return;
    activeLangTier = btn.getAttribute("data-lang-tier") || "mother";
    renderLangSection();
  });
  $("#lang-chip-row")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-lang]");
    if (!btn) return;
    void setActiveLanguage(btn.dataset.lang);
  });
  // All-origin Rubik atlas: focus a tree → bind pathway + re-render cubes
  const onRubikFocus = (ev) => {
    const btn = ev.target.closest?.("[data-rubik-path]");
    if (!btn) return;
    const pathId = btn.getAttribute("data-rubik-path");
    if (!pathId) return;
    activePathId = pathId;
    const path = steppingPathById(pathId);
    if (path?.family) {
      // Prefer a mother tongue in that family if current is unrelated
      const mt = motherTongueById(activeLangId);
      if (mt.family !== path.family) {
        const hit = MOTHER_TONGUES.find((m) => m.family === path.family);
        if (hit) activeLangId = hit.id;
      }
    }
    renderLangSection();
    renderRubikPanels($("#shadow-input")?.value || "", lastPatternLab, null);
    $("#status-line").textContent = `Rubik tree · ${path?.label || pathId}`;
  };
  $("#rubik-all-map-body")?.addEventListener("click", onRubikFocus);
  $("#rubik-map-body")?.addEventListener("click", onRubikFocus);
  $("#lang-alpha-bar")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-letter]");
    if (!btn) return;
    jumpToLetter(btn.dataset.letter);
  });
  $("#lang-path-select")?.addEventListener("change", (ev) => {
    const id = ev.target?.value;
    if (!id || !steppingPathById(id)) return;
    activePathId = id;
    const p = steppingPathById(id);
    if (lastStepping) {
      lastStepping = {
        ...lastStepping,
        pathway: {
          ...lastStepping.pathway,
          id: p.id,
          label: p.label,
          family: p.family,
          breadcrumb: p.steps.map((s) => s.label).join(" → "),
          steps: p.steps,
        },
      };
    }
    renderLangSection();
    renderRubikPanels($("#shadow-input")?.value || "", lastPatternLab, null);
    // Keep Writer pathway strip in sync when open
    if (!$("#writer-panel")?.hidden) {
      renderSteppingRows("#w-origin-row", "#w-register-row", "#w-path-row", lastStepping, activePathId);
      setText("#w-pathway", p.steps.map((s) => s.label).join(" → "), p.label);
    }
    $("#status-line").textContent = `Pathway · ${p.label}`;
  });
  $("#lang-register-row")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-register]");
    if (!btn) return;
    const id = btn.dataset.register;
    if (REGISTER_IDS.includes(id)) {
      setActiveDictRegister(id);
    } else {
      activeRegisterId = id;
      renderLangSection();
      const reg = SPEECH_REGISTERS.find((r) => r.id === activeRegisterId);
      $("#status-line").textContent = `Register · ${reg?.label || activeRegisterId} — ${reg?.desc || ""}`;
    }
  });

  // Dict + Shadow register layer filters (slang / shorthand / off)
  const onDictRegister = (ev) => {
    const btn = ev.target.closest("[data-dict-register]");
    if (!btn) return;
    setActiveDictRegister(btn.dataset.dictRegister);
  };
  $("#dict-register-filters")?.addEventListener("click", onDictRegister);
  $("#shadow-register-filters")?.addEventListener("click", onDictRegister);

  // Age / region / theme capsules + persona + suggest chips
  document.addEventListener("click", (ev) => {
    const age = ev.target.closest?.("[data-capsule-age]");
    if (age) {
      setActiveCapsule("age", age.getAttribute("data-capsule-age") || "all");
      return;
    }
    const region = ev.target.closest?.("[data-capsule-region]");
    if (region) {
      setActiveCapsule(
        "region",
        region.getAttribute("data-capsule-region") || "all"
      );
      return;
    }
    const theme = ev.target.closest?.("[data-capsule-theme]");
    if (theme) {
      setActiveCapsule(
        "theme",
        theme.getAttribute("data-capsule-theme") || "all"
      );
      return;
    }
    const persona = ev.target.closest?.("[data-persona]");
    if (persona) {
      setActivePersona(persona.getAttribute("data-persona") || "neutral");
      renderPersonaBar();
      if (lastShadowLive?.trimmed) {
        runShadowLive(lastShadowLive.trimmed, { heavy: true, rank: true });
      }
      $("#status-line").textContent = `Persona · ${getActivePersona().label}`;
      return;
    }
    const sug = ev.target.closest?.("[data-suggest]");
    if (sug) {
      const w = sug.getAttribute("data-suggest");
      if (!w) return;
      const si = $("#shadow-input");
      if (si) {
        const cur = si.value.trim();
        si.value = cur ? `${cur} ${w}` : w;
      }
      runShadowLive();
      $("#status-line").textContent = `Suggest · ${w}`;
    }
  });

  $("#btn-export-runtimes")?.addEventListener("click", () => {
    const pack =
      lastRuntimeExport ||
      exportMultiRuntime(
        lastToolStack || buildToolStack($("#shadow-input")?.value || "", {
          layout: globalLayoutId,
          live: lastShadowLive,
        }),
        lastShadowLive
      );
    downloadText(
      "kbatch-multi-runtime.json",
      JSON.stringify(pack, null, 2),
      "application/json"
    );
    $("#status-line").textContent =
      "Multi-runtime pack downloaded (JSON/JAX/Python/C++26/Tokio/…)";
  });
  $("#btn-copy-python")?.addEventListener("click", async () => {
    const pack =
      lastRuntimeExport ||
      exportMultiRuntime(
        lastToolStack || buildToolStack($("#shadow-input")?.value || ""),
        lastShadowLive
      );
    try {
      await navigator.clipboard.writeText(pack.python || "");
      $("#status-line").textContent = "Python adapter copied";
    } catch {
      downloadText("kbatch_crossref.py", pack.python || "", "text/x-python");
      $("#status-line").textContent = "Python downloaded (clipboard blocked)";
    }
  });
  $("#btn-cortical-force")?.addEventListener("click", () => {
    runShadowLive($("#shadow-input")?.value, { heavy: true, rank: true });
    $("#status-line").textContent = "Cortical full loop forced";
  });
  $("#btn-mesh-join")?.addEventListener("click", () => {
    const p = meshJoin({});
    const ms = $("#mesh-status");
    if (ms) ms.textContent = `mesh · joined ${p.room} · ${p.id}`;
    $("#status-line").textContent = `Mesh joined · room ${p.room}`;
  });
  $("#btn-mesh-pub")?.addEventListener("click", () => {
    if (lastShadowLive) meshPublishKnowledge(lastShadowLive, { kind: "manual" });
    $("#status-line").textContent = "Knowledge published to mesh (all peers)";
  });
  $("#btn-nfc-share")?.addEventListener("click", async () => {
    const r = await nfcShare({
      text: ($("#shadow-input")?.value || "").slice(0, 120),
    });
    $("#status-line").textContent = r.ok
      ? `NFC share · room ${r.room}`
      : `NFC · ${r.error}`;
  });
  $("#btn-nfc-scan")?.addEventListener("click", async () => {
    const r = await nfcListen((d) => {
      $("#status-line").textContent = `NFC read · room ${d.room || "?"}`;
    });
    $("#status-line").textContent = r.ok ? "NFC scanning…" : `NFC · ${r.error}`;
  });


  // Pattern lab chip → switch base layout
  $("#pattern-lab-body")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-pattern-layout]");
    if (!btn) return;
    const id = btn.dataset.patternLayout;
    if (!id || !KEYBOARD_LAYOUTS[id]) return;
    globalLayoutId = id;
    const layoutSel = $("#layout-select");
    if (layoutSel) layoutSel.value = id;
    const match = DESC_LANGS.find((l) => l.layout === id);
    if (match) activeLangId = match.id;
    rebindAllLayouts();
    renderLangSection();
    render();
    runShadowLive();
    $("#status-line").textContent = `Pattern lab base → ${KEYBOARD_LAYOUTS[id].name}`;
  });
  $("#lang-origin-row")?.addEventListener("click", (ev) => {
    const chip = ev.target.closest(".step-origin-chip");
    if (!chip) return;
    $("#status-line").textContent = chip.getAttribute("title") || "Origin stage";
  });

  // Lexical relation chips → jump / analyze that spelling
  const onLexChip = (ev) => {
    const chip = ev.target.closest("[data-lex-word]");
    if (!chip) return;
    ev.preventDefault();
    ev.stopPropagation();
    const w = chip.getAttribute("data-lex-word");
    if (!w) return;
    const input = $("#search-input");
    if (input) input.value = w;
    runSearch(w);
    focusWord(w);
    runShadowLive(w);
    $("#status-line").textContent = `Lexical jump · ${w}`;
  };
  $("#word-list")?.addEventListener("click", onLexChip);
  $("#focus-sense")?.addEventListener("click", onLexChip);
  $("#w-lex-graph")?.addEventListener("click", onLexChip);
  $("#writer-results")?.addEventListener("click", onLexChip);

  $("#btn-kb-refresh")?.addEventListener("click", () => refreshKeyboards());
  $("#btn-kb-refresh-geo")?.addEventListener("click", () => refreshKeyboards());

  $("#word-list")?.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-lex-word]")) return;
    // Inline letter-prefix-strip (same chips as left sub-rail)
    const prefBtn = ev.target.closest("[data-prefix]");
    if (prefBtn && $("#word-list")?.contains(prefBtn)) {
      const pref = prefBtn.getAttribute("data-prefix") || "";
      const L = prefBtn.getAttribute("data-letter") || activeLetter;
      if (pref === "" || pref == null) {
        activePrefix = null;
        jumpToLetter(L, { forceOpen: true });
        return;
      }
      jumpToPrefix(pref, L);
      return;
    }
    const kbExp = ev.target.closest("[data-kb-expand]");
    if (kbExp) {
      ev.preventDefault();
      ev.stopPropagation();
      showAllKeyboards = true;
      refreshKeyboards(kbExp.getAttribute("data-kb-expand") || "");
      return;
    }
    const more = ev.target.closest("[data-more]");
    if (more) {
      const L = more.dataset.more;
      letterShown[L] = (letterShown[L] || PAGE_SIZE) + PAGE_SIZE;
      render();
      return;
    }
    const toggle = ev.target.closest("[data-toggle]");
    if (toggle) {
      const L = toggle.dataset.toggle;
      if (openSections.has(L)) openSections.delete(L);
      else {
        openSections.add(L);
        activeLetter = L;
        letterShown[L] = letterShown[L] || PAGE_SIZE;
        // Paint open chrome immediately; never block cards on fat analyzed/* packs
        render();
        (async () => {
          if (!hasWordPack()) {
            render();
            return;
          }
          try {
            await loadSliverIndex().catch(() => {});
            setLangLoadProgress(30, `Opening ${L}…`);
            // Prefer progressive first prefixes so A-rail + cards paint fast
            const prefs = displayPrefixesForLetter(L.toLowerCase());
            if (prefs.length && !wordsForLetter(L.toLowerCase())?.length) {
              const first = prefs.find((p) => !p.endsWith("_")) || prefs[0];
              setLangLoadProgress(45, `Warming ${prefixDisplayLabel(first)}…`);
              await loadPrefixCoverage(first).catch(() => {});
              render(); // first stem cards as soon as coverage lands
            }
            setLangLoadProgress(55, `Loading letter ${L}…`);
            await loadLetter(L.toLowerCase());
            setLangLoadProgress(80, `Letter ${L} · ${letterCount(L).toLocaleString()} words`);
            // NEVER await monoletter analyzed/{L}.json (50–175MB). Light only, idle.
            if (hasGeometryPack() && hasAnalyzedChunk(L.toLowerCase())) {
              setLangLoadProgress(90, `Geometry warm ${L}…`);
              idle(() => {
                ingestAnalyzedLetter(L, { light: true }).catch(() => {});
              }, { timeout: 400 });
            }
            setLangLoadProgress(100, `Open · ${L}`);
            render();
            renderAlphabetRail();
            updateAnalyzedStats();
          } catch (e) {
            console.warn("open letter", L, e?.message || e);
            setLangLoadProgress(100, `Open · ${L} (partial)`);
            render();
          }
          setTimeout(() => {
            const bar = $("#lang-load-bar");
            if (bar) bar.hidden = true;
          }, 400);
        })();
        return;
      }
      activeLetter = L;
      render();
      return;
    }
    const card = ev.target.closest(".word-card");
    if (card?.dataset.word) focusWord(card.dataset.word);
  });

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((x) => x.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) {
        const L = visible[0].target.dataset.letter;
        if (L && L !== activeLetter) {
          activeLetter = L;
          renderAlphabetRail();
        }
      }
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
  );
  const mo = new MutationObserver(() => {
    document
      .querySelectorAll(".letter-section")
      .forEach((sec) => io.observe(sec));
  });
  mo.observe($("#word-list"), { childList: true });

  const exportNote = () => {
    const list = cachedEntriesList();
    if (!list.length) {
      $("#status-line").textContent =
        "Export needs analyzed words — open sections or search first";
      return null;
    }
    return list;
  };

  $("#export-json")?.addEventListener("click", () => {
    const list = exportNote();
    if (!list) return;
    downloadText(
      "kbatch-dictionary-analyzed.json",
      toJSON(list),
      "application/json"
    );
  });
  $("#export-jax")?.addEventListener("click", () => {
    const list = exportNote();
    if (!list) return;
    downloadText(
      "kbatch-dictionary.jax.json",
      toJAX(list),
      "application/json"
    );
  });
  $("#export-csv")?.addEventListener("click", () => {
    const list = exportNote();
    if (!list) return;
    downloadText("kbatch-dictionary.csv", toCSV(list), "text/csv");
  });
  $("#export-md")?.addEventListener("click", () => {
    const list = exportNote();
    if (!list) return;
    downloadText("kbatch-dictionary.md", toMarkdown(list), "text/markdown");
  });
  $("#export-x")?.addEventListener("click", () => openPresentationComposer());
  $("#export-overview")?.addEventListener("click", () => {
    const text =
      $("#shadow-input")?.value?.trim() ||
      $("#search-input")?.value?.trim() ||
      $("#writer-input")?.value?.trim() ||
      lastShadowLive?.trimmed ||
      lastShadowLive?.caption_out ||
      focusedEntry?.word ||
      "";
    if (!text) {
      $("#status-line").textContent =
        "Nothing for Overview — type in Shadow Live / search first";
      return;
    }
    pinToOverview(text, "geometry");
    publishKbatchToLive(lastShadowLive || { trimmed: text });
    $("#status-line").textContent =
      "Pinned → Overview · opening Overview tab…";
    // Open Overview in a new tab so pin is visible immediately
    const href =
      $("#link-overview")?.href || "https://ugrad-overview.pages.dev/";
    window.open(href, "_blank", "noopener");
  });

  bindPresentationComposer();

  window.addEventListener("resize", () => updateFocusViz());
}

/** @type {ReturnType<typeof composePresentation> | null} */
let lastPresentation = null;
let presTab = "article";
/** @type {Set<string>} */
const presBlocksOn = new Set(BLOCK_TYPES.map((b) => b.id));

function openPresentationComposer() {
  const overlay = $("#pres-overlay");
  if (!overlay) return;
  overlay.hidden = false;

  const langSel = $("#pres-lang");
  if (langSel && !langSel.options.length) {
    langSel.innerHTML = DESC_LANGS.map(
      (l) =>
        `<option value="${l.id}">${escapeHtml(l.label)} · ${escapeHtml(l.layout)}</option>`
    ).join("");
  }

  const blocksEl = $("#pres-blocks");
  if (blocksEl && !blocksEl.childElementCount) {
    blocksEl.innerHTML = BLOCK_TYPES.map(
      (b) =>
        `<button type="button" class="pres-block-chip is-on" data-block="${b.id}">${escapeHtml(b.icon)} ${escapeHtml(b.label)}</button>`
    ).join("");
    blocksEl.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-block]");
      if (!btn) return;
      const id = btn.dataset.block;
      if (presBlocksOn.has(id)) {
        presBlocksOn.delete(id);
        btn.classList.remove("is-on");
      } else {
        presBlocksOn.add(id);
        btn.classList.add("is-on");
      }
    });
  }

  // Seed from writer, focus, or sample of analyzed cache
  let seed =
    $("#writer-input")?.value?.trim() ||
    focusedEntry?.word ||
    "";
  if (!seed) {
    const cached = cachedEntriesList()
      .slice(0, 12)
      .map((e) => e.word)
      .join(" ");
    seed =
      cached ||
      "The quantum keyboard maps every English word through geometric layouts, order patterns, and scribal history.";
  }
  $("#pres-source").value = seed;
  runPresentationCompose();
}

function closePresentationComposer() {
  const overlay = $("#pres-overlay");
  if (overlay) overlay.hidden = true;
}

function runPresentationCompose() {
  const text = $("#pres-source")?.value?.trim() || "";
  const lang = $("#pres-lang")?.value || "en";
  if (!text) return;
  lastPresentation = composePresentation(text, {
    lang,
    layout: globalLayoutId,
    blocks: [...presBlocksOn],
    title: `KBatch · ${text.slice(0, 48)}`,
  });
  renderPresentationPreview();
  $("#status-line").textContent = `Presentation composed · ${lastPresentation.blocks.length} blocks · ${lang}`;
}

function renderPresentationPreview() {
  if (!lastPresentation) return;
  const pre = $("#pres-preview");
  if (!pre) return;
  if (presTab === "article") {
    pre.textContent = lastPresentation.article;
  } else if (presTab === "hub") {
    const h = lastPresentation.hub;
    pre.textContent = JSON.stringify(
      {
        level: h.level,
        strip: h.strip,
        pos: h.pos,
        order: {
          so: h.order?.so,
          compressed: h.order?.compressed,
          topPatterns: h.order?.topPatterns,
        },
        historical: {
          era: h.historical?.era,
          etymology: h.historical?.etymology,
          scribe: h.historical?.scribe,
          chant: h.historical?.chant,
        },
        tokens: h.tokens?.slice(0, 30),
        metrics: h.metrics,
        i18n: h.i18n,
      },
      null,
      2
    );
  } else {
    pre.textContent = (lastPresentation.hub.allLangs || [])
      .map(
        (d) =>
          `【${d.label}】 ${d.dir}\n${d.description}\n${d.dialectNote}\n`
      )
      .join("\n");
  }
}

function bindPresentationComposer() {
  $("#pres-close")?.addEventListener("click", () => closePresentationComposer());
  $("#pres-overlay")?.addEventListener("click", (ev) => {
    if (ev.target === $("#pres-overlay")) closePresentationComposer();
  });
  $("#pres-compose")?.addEventListener("click", () => runPresentationCompose());
  $("#pres-lang")?.addEventListener("change", () => runPresentationCompose());

  document.querySelectorAll(".pres-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      presTab = tab.dataset.presTab || "article";
      document.querySelectorAll(".pres-tab").forEach((t) => {
        t.classList.toggle("is-active", t === tab);
      });
      renderPresentationPreview();
    });
  });

  const copy = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      $("#status-line").textContent = msg;
    } catch {
      downloadText("kbatch-x-article.md", text, "text/markdown");
      $("#status-line").textContent = "Downloaded (clipboard blocked)";
    }
  };

  $("#pres-copy")?.addEventListener("click", () => {
    if (lastPresentation) copy(lastPresentation.article, "X article copied");
  });
  $("#pres-copy-md")?.addEventListener("click", () => {
    if (lastPresentation)
      copy(lastPresentation.formats.markdown, "Markdown copied");
  });
  $("#pres-copy-latex")?.addEventListener("click", () => {
    if (lastPresentation)
      copy(lastPresentation.formats.latex, "LaTeX block copied");
  });
  $("#pres-download")?.addEventListener("click", () => {
    if (!lastPresentation) return;
    downloadText(
      "kbatch-x-article.md",
      lastPresentation.article,
      "text/markdown"
    );
  });
  $("#pres-overview")?.addEventListener("click", () => {
    const text = $("#pres-source")?.value?.trim();
    if (!text) return;
    pipeToOverview(text, {
      layout: globalLayoutId,
      title: lastPresentation?.title,
    });
    $("#status-line").textContent =
      "Overview workspace downloaded — import in Overview";
  });
  $("#pres-clear")?.addEventListener("click", () => {
    lastPresentation = null;
    const ps = $("#pres-source");
    if (ps) ps.value = "";
    const pp = $("#pres-preview");
    if (pp) pp.textContent = "";
    $("#status-line").textContent = "Presentation cleared";
    ps?.focus();
  });
}

function initThemeToggle() {
  const btn = $("#theme-toggle");
  if (!btn) return;
  const apply = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("kbatch-dict-theme", theme);
    } catch {
      /* */
    }
    btn.setAttribute(
      "aria-label",
      theme === "light" ? "Switch to dark mode" : "Switch to light mode"
    );
    btn.title = theme === "light" ? "Dark mode" : "Light mode";
    updateFocusViz();
  };
  btn.addEventListener("click", () => {
    const cur =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    apply(cur === "light" ? "dark" : "light");
  });
}

/**
 * Render active origin-tree cube + large all-origin Rubik atlas.
 * @param {string} [text]
 * @param {object} [lab]
 * @param {string[]} [regs]
 */
function renderRubikPanels(text = "", lab = null, regs = null) {
  const registers =
    regs ||
    (activeRegisterId !== "standard" ? [activeRegisterId] : ["standard"]);
  const mt = motherTongueById(activeLangId);
  const pathId = activePathId || pickSteppingPath(mt.family, activeLangId)?.id;

  const focusCube = buildOriginTreeRubik(pathId || STEPPING_PATHS[0]?.id, {
    text,
    lab: lab || undefined,
    registers,
    activeStep: activeLangId,
  });
  lastRubikState = focusCube;

  const focusEl = $("#rubik-map-body");
  if (focusEl) {
    focusEl.innerHTML =
      rubikNetHtml(focusCube, { compact: false, showMoves: true }) +
      `<p class="rubik-focus-meta">Bound to pathway <strong>${escapeHtml(focusCube.label)}</strong> · ${escapeHtml(focusCube.family)} · ${(focusCube.steps || []).length} steps</p>`;
  }

  const atlasEl = $("#rubik-all-map-body");
  if (atlasEl) {
    const atlas = buildAllOriginRubiksMap({
      text,
      lab: lab || undefined,
      registers,
      activePathId: pathId,
      activeLangId,
    });
    atlasEl.innerHTML = rubikAllMapHtml(atlas, { activePathId: pathId });
    window.__KBATCH_RUBIK_ATLAS__ = atlas;
  }
  window.__KBATCH_RUBIK__ = focusCube;
}

async function init() {
  // 0) Immediate handshake so the HTML watchdog never sees a silent shell
  try {
    window.__KBATCH_BOOT__ = { ok: false, phase: "init-start", at: Date.now() };
  } catch {
    /* */
  }
  reportCorpusHealth({ phase: "init-start", total: 0, count: 0 });
  setLangLoadProgress(3, "Boot starting…");

  try {
    installGlobalAPI();
  } catch (e) {
    console.warn("installGlobalAPI:", e);
  }
  // D3 dual-pane open senses + names/mythology glance (geometry | cited gloss)
  try {
    Promise.all([
      import("./open-senses.js"),
      import("./names-glance.js"),
    ])
      .then(
        ([
          { loadOpenSenses, dualPaneSenseHtml, dualPaneFullHtml },
          { loadNamesGlance, dualPaneWithNames },
        ]) => {
          return Promise.all([
            loadOpenSenses().catch(() => null),
            loadNamesGlance().catch(() => null),
            import("./concept-solve.js")
              .then((m) => m.loadConceptMesh().catch(() => null))
              .catch(() => null),
          ]).then(() => {
            window.__KBATCH_DUAL_PANE__ = (entry) =>
              dualPaneWithNames(entry, {
                escapeHtml,
                dualPaneSenseHtml,
              });
            // Prefer async concept world-forms when available
            window.__KBATCH_DUAL_PANE_ASYNC__ = async (entry) => {
              try {
                if (typeof dualPaneFullHtml === "function") {
                  return await dualPaneFullHtml(entry, { escapeHtml }, { from: "en", mode: "ready" });
                }
              } catch {
                /* fall through */
              }
              return dualPaneWithNames(entry, { escapeHtml, dualPaneSenseHtml });
            };
            window.kbatchDict = window.kbatchDict || {};
            window.kbatchDict.conceptSolve = (args) =>
              import("./concept-solve.js").then((m) => m.conceptSolve(args || {}));
            window.kbatchDict.conceptStairWalk = (args) =>
              import("./concept-solve.js").then((m) => m.conceptStairWalk(args || {}));
          });
        }
      )
      .catch(() => {
        import("./open-senses.js")
          .then(({ loadOpenSenses, dualPaneSenseHtml, dualPaneFullHtml }) => {
            loadOpenSenses()
              .then(() => {
                window.__KBATCH_DUAL_PANE__ = (entry) =>
                  dualPaneSenseHtml(entry, { escapeHtml });
                if (dualPaneFullHtml) {
                  window.__KBATCH_DUAL_PANE_ASYNC__ = (entry) =>
                    dualPaneFullHtml(entry, { escapeHtml }, { from: "en" });
                }
              })
              .catch(() => {});
          })
          .catch(() => {});
      });
  } catch {
    /* */
  }
  try {
    initThemeToggle();
  } catch (e) {
    console.warn("initThemeToggle:", e);
  }

  // Corpus FIRST — never blocked by UI binding failures
  try {
    setWordLang("en");
    activeLangId = "en";
  } catch {
    /* */
  }

  const statusEl = $("#status-line");
  if (statusEl) statusEl.textContent = "Loading index (lazy corpus)…";
  setLangLoadProgress(10, "Loading word-index…");
  let bootTotal = 0;
  try {
    // Index first (critical path) — paint totals ASAP
    const idx = await loadWordIndex();
    bootTotal = idx?.total || 0;
    reportCorpusHealth({
      ok: bootTotal > 0,
      total: bootTotal,
      count: bootTotal,
      error: bootTotal > 0 ? null : "word-index.json loaded but total=0",
      detail: bootTotal > 0 ? null : JSON.stringify(idx || {}).slice(0, 200),
      phase: bootTotal > 0 ? "index" : "error",
    });
    updateVocabHurdle(bootTotal);
    setLangLoadProgress(
      30,
      bootTotal
        ? `Index · ${bootTotal.toLocaleString()} spellings`
        : "Index empty"
    );

    // Non-critical catalog (do not block totals) — also paint World · all-langs sum
    loadLangCatalog()
      .then((cat) => {
        paintWorldSpellingsChip(cat);
      })
      .catch(() => {});
    loadLangWordIndex("en").catch(() => {});
    if (statusEl) {
      statusEl.textContent = bootTotal
        ? `Index · ${bootTotal.toLocaleString()} spellings · warming letter A…`
        : "Index empty — check data/word-index.json";
    }

    if (!bootTotal) {
      throw new Error("word-index total is 0 — corpus not available");
    }

    // Mark READY as soon as index is up — do NOT await letter A or fat analyzed packs
    // (analyzed/a.json can be ~100MB and freezes the main thread / network for minutes)
    reportCorpusHealth({
      ok: true,
      total: bootTotal,
      count: bootTotal,
      phase: "ready",
    });
    setLangLoadProgress(100, `Ready · ${bootTotal.toLocaleString()} spellings`);
    if (statusEl) {
      statusEl.textContent = `Ready · ${bootTotal.toLocaleString()} spellings · warming in background…`;
    }
    openSections.clear();
    // sections stay collapsed until user opens one

    // Background warm only (never blocks first paint)
    loadSliverIndex()
      .then(() => {
        // Rebuild rail with aa/ab/ac folds once catalog is ready
        try {
          renderAlphabetRail();
        } catch {
          /* */
        }
      })
      .catch((e) => console.warn("sliver-index:", e?.message || e));
    loadAnalyzedIndex().catch((e) => console.warn("analyzed-index:", e?.message || e));
    idle(() => {
      loadLetter("a")
        .then((aWords) => {
          if (aWords?.length && statusEl?.textContent?.includes("warming")) {
            statusEl.textContent = `Ready · ${bootTotal.toLocaleString()} spellings · A warm (${aWords.length.toLocaleString()})`;
          }
        })
        .catch((e) => console.warn("letter A warm:", e));
    }, { timeout: 800 });
  } catch (err) {
    console.error(err);
    const detail = [
      err?.message || String(err),
      err?.tried ? `tried: ${(err.tried || []).join(" | ")}` : "",
      err?.rel ? `rel: ${err.rel}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    reportCorpusHealth({
      ok: false,
      total: 0,
      count: 0,
      error: `Corpus load failed: ${err?.message || err}`,
      detail,
      phase: "error",
    });
    setLangLoadProgress(100, "Corpus load failed");
    $("#status-line").textContent =
      "Corpus missing — hard-refresh, unregister SW, or run: npm run grow-corpus";
    const wl = $("#word-list");
    if (wl) {
      wl.innerHTML = `<p class="empty-state is-error">Corpus failed to load (Spellings 0/0).<br>
        <strong>${escapeHtml(err?.message || String(err))}</strong><br>
        <small>${escapeHtml(detail)}</small><br><br>
        Try: hard refresh · DevTools → Application → Service Workers → Unregister · then reload.<br>
        Or local: <code>npm run grow-corpus</code> / check <code>data/word-index.json</code> + <code>data/words/a.json</code>.</p>`;
    }
    updateAnalyzedStats();
    // Still paint language + Rubik atlas so UI is not a dead shell
    try {
      bindEvents();
    } catch (e) {
      console.warn("bindEvents after corpus fail:", e);
    }
    try {
      renderLangSection();
      renderRubikPanels("");
    } catch {
      /* */
    }
    return;
  }

  // UI bindings AFTER corpus (must not undo totals if they throw)
  try {
    bindEvents();
  } catch (e) {
    console.warn("bindEvents:", e);
    reportCorpusHealth({
      ok: true,
      total: bootTotal || totalCount(),
      count: bootTotal || totalCount(),
      error: `UI bind warning: ${e?.message || e}`,
      phase: "warn",
    });
  }

  // Restore Dictionary fold preference (user can collapse the whole A–Z block)
  try {
    const pref = localStorage.getItem(DICT_SECTION_OPEN_KEY);
    if (pref === "0") setDictSectionOpen(false, { persist: false });
    else syncDictSectionChrome();
  } catch {
    syncDictSectionChrome();
  }

  // Cache bust + PWA SW after corpus (so a SW glitch can't block 1.69M paint)
  try {
    await initCacheAndPwa();
  } catch (e) {
    console.warn("cache/pwa:", e);
  }
  try {
    meshJoinFromUrl();
    meshSubscribe((msg) => {
      if (msg?.type === "knowledge-request" && lastShadowLive?.trimmed) {
        meshPublishKnowledge(lastShadowLive, { kind: "reply" });
      }
      const ms = $("#mesh-status");
      if (ms && msg?.type) {
        ms.textContent = `mesh · ${msg.type} from ${msg.nick || msg.from || "?"} · room ${meshPeer().room}`;
      }
    });
  } catch (e) {
    console.warn("mesh:", e);
  }

  const vb = vocabBenchmarks(totalCount());
  const hurdleNote = vb.next
    ? ` · next hurdle ${vb.next.short}: +${vb.next.gap.toLocaleString()}`
    : " · open benchmarks cleared";
  if (statusEl) {
    statusEl.textContent = `Lazy corpus · ${totalCount().toLocaleString()} indexed · letter A ready${hurdleNote}`;
  }
  updateVocabHurdle();
  updateAnalyzedStats();
  reportCorpusHealth({
    ok: true,
    total: totalCount() || bootTotal,
    count: totalCount() || bootTotal,
    phase: "ready",
  });
  setLangLoadProgress(90, "Ready · painting UI…");

  try {
    ensureAnalyzed("quantum", { full: true });
    ensureAnalyzed("the", { full: true });
    ensureAnalyzed("a", { full: true });
    focusedEntry = ensureAnalyzed("quantum", { full: true });
  } catch (e) {
    console.warn("seed analyze:", e);
  }

  try {
    render();
    renderRubikPanels($("#shadow-input")?.value || "type once");
    updateFocusViz();
    updateAnalyzedStats();
  } catch (e) {
    console.warn("render:", e);
  }
  setLangLoadProgress(100, `Ready · ${(totalCount() || bootTotal).toLocaleString()} spellings`);
  setTimeout(() => {
    const bar = $("#lang-load-bar");
    if (bar) bar.hidden = true;
  }, 800);

  // Deep link from Language tree / external: /?lang=es
  try {
    const want = new URLSearchParams(location.search).get("lang");
    if (want && want !== "en" && want !== activeLangId) {
      void setActiveLanguage(want).catch((e) =>
        console.warn("?lang= deep link:", e?.message || e)
      );
    }
  } catch {
    /* */
  }

  // Progressive letter warm (en geometry pack only; abortable via langLoadGeneration)
  const bootGen = langLoadGeneration;
  if (hasGeometryPack()) {
    progressiveLoadLetters(
      {
        loadLetter,
        shouldContinue: () =>
          langLoadGeneration === bootGen && hasGeometryPack(),
        onProgress: (n, total, pct) => {
          if (langLoadGeneration !== bootGen) return;
          if (n % 5 === 0 || n === total) {
            const line = $("#status-line");
            if (line && (line.textContent.includes("Lazy") || line.textContent.includes("Warming"))) {
              line.textContent = `Lazy corpus · ${n}/${total} letters (${pct}%) · ${totalCount().toLocaleString()} indexed`;
              setLangLoadProgress(
                Math.min(99, 50 + Math.round(pct / 2)),
                `Warming · ${n}/${total}`
              );
            }
          }
          if (n >= total) {
            setLangLoadProgress(100, `Ready · ${totalCount().toLocaleString()} spellings`);
            setTimeout(() => {
              const bar = $("#lang-load-bar");
              if (bar) bar.hidden = true;
            }, 500);
          }
        },
      },
      "a"
    );
  }

  // Product identity · region · version stamp
  const ver = await loadVersion();
  applyRegionMeta(ver);
  const idChip = $("#chip-lives");
  if (idChip) {
    idChip.textContent = `${ver.productSlug} · v${ver.version} · ${ver.region}`;
    idChip.title = ver.fullName || ver.productId;
  }
  const sub = document.querySelector(".brand-sub");
  if (sub && !document.body.classList.contains("shadow-solo")) {
    sub.textContent = `${ver.productId} · v${ver.version} · ${ver.region} · cortical 3–5s · lazy · stack`;
  }

  // GlueLam + quantum gutter (local vendor first → quantum-speed path)
  await ensureGluelam();
  try {
    await ensureQuantumGutter();
  } catch (e) {
    console.warn("quantum gutter:", e);
  }

  // Terminal lane (Freya/GY style)
  try {
    mountTerminal($("#term-mount"), {
      liveText: () => $("#shadow-input")?.value || "",
      runShadowLive: (t, o) => runShadowLive(t, o),
      toolStack: () =>
        buildToolStack($("#shadow-input")?.value || "", {
          layout: globalLayoutId,
          live: lastShadowLive,
        }),
      lastToolStack: () => lastToolStack,
      exportRuntimes: () =>
        lastRuntimeExport ||
        exportMultiRuntime(lastToolStack || buildToolStack(""), lastShadowLive),
      suggest: (t) =>
        suggestFromPersona(t, { layout: globalLayoutId, live: lastShadowLive }),
      setPersona: (id) => setActivePersona(id),
      persona: () => getActivePersona(),
      setRegister: (id) => setActiveDictRegister(id),
      activeRegister: () => activeRegisterId,
    });
  } catch (e) {
    console.warn("terminal:", e);
  }
  const ms0 = $("#mesh-status");
  if (ms0) {
    const st = meshStatus();
    ms0.textContent = `mesh · room ${st.peer.room} · peer ${st.peer.id} · nfc ${st.nfc ? "yes" : "no"} · build ${buildStamp()}`;
  }

  // Register index only on boot — meta-map lazy (large)
  try {
    await Promise.all([loadRegisterIndex(), loadCapsuleIndex()]);
    // tag-map small enough; meta-map on demand in metaForWord
    idle(() => {
      loadTagMap().catch(() => {});
    }, { timeout: 2000 });
  } catch (e) {
    console.warn("registers:", e);
  }
  renderRegisterFilterBar("#dict-register-filters");
  renderRegisterFilterBar("#shadow-register-filters");
  renderCapsuleFilterBars();
  renderPersonaBar();

  // School skills · knowledge capsules (curriculum graph → site hooks)
  idle(async () => {
    try {
      await mountSchoolConcepts($("#school-concepts-mount"), {
        onSkill: (topic, hooks) => {
          const h = hooks?.length ? hooks : topic?.kbatchHooks || [];
          $("#status-line").textContent = topic?.name
            ? `Skill · ${topic.name}`
            : `Skill hooks · ${h.join(" · ")}`;
          runSkillHooks(h, {
            openShadow: () => {
              const el = $("#shadow-live");
              if (el) el.open = true;
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
              const si = $("#shadow-input");
              if (si && !si.value.trim()) {
                si.value = "type once understand everywhere";
              }
              runShadowLive(si?.value || "type once understand everywhere", {
                rank: true,
              });
            },
            openDict: () => {
              const el = $("#dict-section");
              if (el) el.open = true;
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            },
            setSchoolCapsule: () => {
              // site-wide school knowledge capsule (register theme)
              try {
                setActiveCapsule("theme", "school");
              } catch {
                activeThemeCapsule = "school";
              }
              const el = $("#dict-section");
              if (el) el.open = true;
              // open shadow register filters too if present
              const sh = $("#shadow-live");
              if (sh) sh.open = true;
              $("#status-line").textContent =
                "School capsule · theme filter on · browse A–Z for school register spellings";
            },
            jumpLetter: (L) => {
              try {
                jumpToLetter(String(L || "A").toUpperCase());
              } catch {
                /* */
              }
            },
          });
        },
      });
    } catch (e) {
      console.warn("school skills:", e);
    }
  }, { timeout: 1200 });

  // Alphabet rail open/close (sticky; multi-lang scroll allotment)
  const railToggle = $("#alpha-rail-toggle");
  const rails = $("#alpha-rails");
  if (railToggle && rails) {
    try {
      if (localStorage.getItem("kbatch-alpha-rail") === "closed") {
        rails.classList.add("is-collapsed");
        railToggle.setAttribute("aria-expanded", "false");
      }
    } catch {
      /* */
    }
    railToggle.addEventListener("click", () => {
      const closed = rails.classList.toggle("is-collapsed");
      railToggle.setAttribute("aria-expanded", closed ? "false" : "true");
      try {
        localStorage.setItem("kbatch-alpha-rail", closed ? "closed" : "open");
      } catch {
        /* */
      }
    });
  }

  // Apply initial UI language chrome
  applyUiLanguage(uiLangIdFor(activeLangId));
  renderLangSection();

  // Shadow Live stays collapsed on load — seed text only, no auto-expand / heavy run
  const si = $("#shadow-input");
  if (si && !si.value.trim()) si.value = "type once understand everywhere";
  // Light seed for search neighbors (does not open Shadow Live)
  const ssi = $("#shadow-search-input");
  if (ssi && !ssi.value.trim()) ssi.value = "type";

  if (window.kbatchDict) {
    window.kbatchDict.corpus = {
      total: () => totalCount(),
      letterCount,
      search: searchWords,
      analyzed: () => Math.max(analyzedTotal(), analysisCache.size),
      analyzedIndex: getAnalyzedIndex,
      analyzeAll: () => analyzeAllByLetterChunks(),
      cacheSize: () => analysisCache.size,
      coverage: () => coverageReport(totalCount()),
      vocabBenchmarks: () => vocabBenchmarks(totalCount()),
      nextHurdle: () => vocabBenchmarks(totalCount()).next,
      lookupMeaning: (w) => lookupMeaning(w),
      lexicalRelations: (w) => fetchLexicalRelations(w),
      buildAdoption: (w, sense) => buildAdoption(w, sense),
      stenoSpace: (text, payload) =>
        analyzeStenoSpace(text ?? $("#shadow-input")?.value, {
          payload: payload ?? $("#steno-payload")?.value,
        }),
      blankSpace: (text) => analyzeBlankSpace(text ?? $("#shadow-input")?.value),
      toolTotals: (text, payload) =>
        toolAnalysisTotal(text ?? $("#shadow-input")?.value, payload),
      stenoEncode: (text, payload) => stenoEncode(text, payload),
      stenoDecode: (text) => stenoDecode(text),
      stripSteno: (text) => stripSteno(text),
      pcapImagePath: (text, opts) =>
        buildPcapImagePath(text ?? $("#shadow-input")?.value, opts),
      forgeMark: (opts) => createForgeMark(opts),
      chunkPackets: (payload, opts) => chunkToPackets(payload, opts),
      lastStenoSpace: () => lastStenoSpace,
      lastPcapImage: () => lastPcapImage,
      language: () => activeLangId,
      uiLanguage: () => uiLangIdFor(activeLangId),
      setLanguage: (id) => setActiveLanguage(id),
      describeWord: (w, lang) => describeWord(w, lang || uiLangIdFor(activeLangId)),
      languageMatrix: (text) =>
        languageDescriptionMatrix(text || $("#shadow-input")?.value, globalLayoutId),
      descLangs: () => DESC_LANGS,
      uiLangCount: () => DESC_LANGS_CORE_COUNT(),
      motherTongueCount: () => MOTHER_TONGUES.length,
      languageCatalog: () => languageCatalogStats(),
      firstNations: () => ANCESTORY_FIRST_NATIONS,
      langTier: () => activeLangTier,
      motherTongues: () => MOTHER_TONGUES,
      steppingPaths: () => STEPPING_PATHS,
      speechRegisters: () => SPEECH_REGISTERS,
      soundOrigins: () => COMM_SOUND_ORIGINS,
      analyzeStepping: (text, opts) =>
        analyzeLanguageStepping(text, { langId: activeLangId, ...opts }),
      lastStepping: () => lastStepping,
      shadowLive: (text, opts) =>
        analyzeShadowLive(text ?? $("#shadow-input")?.value, {
          baseLayout: globalLayoutId,
          ...opts,
        }),
      lastShadowLive: () => lastShadowLive,
      runShadowLive: (text, opts) => runShadowLive(text, opts),
      keyboardPatterns: (text, opts) =>
        analyzeKeyboardPatterns(text ?? $("#shadow-input")?.value, {
          baseLayout: globalLayoutId,
          ...opts,
        }),
      lastPatternLab: () => lastPatternLab,
      rubikState: (text, opts) =>
        buildRubikLanguageState(text ?? $("#shadow-input")?.value, {
          lab: lastPatternLab,
          registers: [activeRegisterId],
          langId: activeLangId,
          ...opts,
        }),
      lastRubik: () => lastRubikState,
      cubeFaces: () => CUBE_FACES,
      registers: () => REGISTER_META,
      registerIds: () => REGISTER_IDS,
      setRegister: (id) => setActiveDictRegister(id),
      activeRegister: () => activeRegisterId,
      registerIndex: () => getRegisterIndex(),
      registersForWord: (w) => registersForWord(w),
      metaForWord: (w) => metaForWord(w),
      capsules: () => getCapsuleIndex(),
      /** Canonical ladder 0–7 catalog (Phase A1) · data/capsules/index.json */
      capsuleCanon: capsuleCanonApi(),
      loadCapsuleCanon: () => loadCapsuleCanon(),
      listCanonCapsules: (opts) => listCanonCapsules(opts),
      openCanonCapsule: (id) => openCanonCapsule(id),
      getCanonCapsule: (id) => getCanonCapsule(id),
      getCapsuleCanon: () => getCapsuleCanon(),
      ageCapsules: () => AGE_CAPSULES,
      regionCapsules: () => REGION_CAPSULES,
      themeCapsules: () => THEME_CAPSULES,
      setCapsule: (kind, id) => setActiveCapsule(kind, id),
      activeCapsules: () => ({
        age: activeAgeCapsule,
        region: activeRegionCapsule,
        theme: activeThemeCapsule,
      }),
      // Alphabet · aa/ab/ac prefix subsections
      activeLetter: () => activeLetter,
      activePrefix: () => activePrefix,
      jumpToLetter: (L) => jumpToLetter(L),
      jumpToPrefix: (p, L) => jumpToPrefix(p, L),
      prefixesForLetter: (L) => prefixesForLetter(L),
      prefixCount: (p) => prefixCount(p),
      sliverIndex: () => getSliverIndex(),
      // Open education · school concepts · githubawesome overview
      schoolConcepts: () => loadSchoolConcepts(),
      openEducationTools: () => loadOpenEducationTools(),
      githubAwesomeOverview: () => loadGithubAwesomeOverview(),
      pipeEducationOverview: async () => {
        const [concepts, tools, awesome] = await Promise.all([
          loadSchoolConcepts(),
          loadOpenEducationTools(),
          loadGithubAwesomeOverview(),
        ]);
        return pipeEducationToOverview({ concepts, tools, awesome });
      },
      // Cortical · tool stack · multi-runtime · persona
      cortical: () => getLastCorticalTick(),
      toolStack: (text) =>
        buildToolStack(text ?? $("#shadow-input")?.value, {
          layout: globalLayoutId,
          live: lastShadowLive,
          registers: [activeRegisterId],
          persona: getActivePersona(),
        }),
      lastToolStack: () => lastToolStack,
      exportRuntimes: () =>
        lastRuntimeExport ||
        exportMultiRuntime(lastToolStack || buildToolStack(""), lastShadowLive),
      runtimeTargets: () => RUNTIME_TARGETS,
      personas: () => PERSONA_PRESETS,
      setPersona: (id) => {
        setActivePersona(id);
        renderPersonaBar();
        return getActivePersona();
      },
      persona: () => getActivePersona(),
      suggest: (text) =>
        suggestFromPersona(text ?? $("#shadow-input")?.value, {
          layout: globalLayoutId,
          live: lastShadowLive,
        }),
      lastSuggest: () => lastPersonaSuggest,
      loadedLetters: () => loadedLetterCount(),
      lazy: true,
      build: () => buildStamp(),
      mesh: () => meshStatus(),
      meshJoin: (room) => meshJoin(room ? { room } : {}),
      meshPublish: (k) => meshPublishKnowledge(k || lastShadowLive),
      nfcShare: (t) => nfcShare({ text: t }),
      gutter: (t) => gutterPrefixContent(t ?? $("#shadow-input")?.value, { mode: "auto" }),
      ensureGutter: () => ensureQuantumGutter(),
      pwa: () => ({ sw: !!navigator.serviceWorker?.controller, build: buildStamp() }),
      glyphSteno: (text, opts) =>
        encodeGlyphInSteno(text ?? $("#shadow-input")?.value, null, opts),
      glyphBroadcast: (text, opts) =>
        broadcastGlyphSteno(text ?? $("#shadow-input")?.value, null, opts),
      glyphDecode: (text) =>
        decodeGlyphFromSteno(text ?? $("#shadow-input")?.value),
      repl: {
        help: () =>
          "analyze · stack · cortical · suggest · export jax|python|cpp26 · setPersona · setRegister",
        analyze: (t) => runShadowLive(t, { heavy: true }),
        stack: () => lastToolStack || buildToolStack($("#shadow-input")?.value),
        cortical: () => getLastCorticalTick(),
        suggest: () => lastPersonaSuggest,
        export: (kind) => {
          const pack =
            lastRuntimeExport ||
            exportMultiRuntime(lastToolStack || buildToolStack(""), lastShadowLive);
          return pack?.[kind] ?? pack;
        },
      },
      shadowSearch: (q, opts) =>
        shadowSearchAcrossMedia(q, {
          layout: globalLayoutId,
          cache: analysisCache,
          liveText: $("#shadow-input")?.value,
          ...opts,
        }),
      runShadowSearch: (q) => runShadowSearch(q),
      buildMediaIndex: (s) => buildMediaIndex(s),
      extractMediaUnits: (t) => extractMediaUnits(t),
      bridgeToBlank: (open = true) =>
        bridgeToBlank(
          lastShadowLive,
          window.__KBATCH_SPATIAL__,
          { open }
        ),
      gsplat: () => window.__KBATCH_GSPLAT__ || null,
      ugradLive: () => ugradLiveStatus(),
      pinToOverview: (text) => pinToOverview(text || $("#shadow-input")?.value, "geometry"),
      gluelam: () => getGluelamStatus(),
      ensureGluelam: (opts) => ensureGluelam(opts),
      iron: () => ironChannels(),
      quantumBridge: (text) =>
        bridgeToQuantum(text || $("#shadow-input")?.value, {
          layout: globalLayoutId,
        }),
      spatial: () => window.__KBATCH_SPATIAL__ || null,
      identity: () => productIdentity(getVersionSync()),
      version: () => getVersionSync(),
      livesAt: () => {
        const v = getVersionSync();
        const id = productIdentity(v);
        return {
          principle: v.designPrinciple,
          identity: id,
          dns: {
            set: {
              type: "CNAME",
              name: "kbatch",
              target: "ugrad-kbatch.pages.dev",
              proxy: true,
            },
            remove: { target: "qbitos.github.io" },
            doc: "docs/DNS.md",
          },
          cloudflare: {
            pagesProject: "ugrad-kbatch",
            pagesProduction: "https://ugrad-kbatch.pages.dev",
            domain: "kbatch.ugrad.ai",
            shadowRoute: "https://kbatch.ugrad.ai/shadow",
            regions: Object.keys(v.regions || {}),
            dataR2: "data.ugrad.ai/kbatch (analyzed packs)",
          },
          blank: v.hosts?.blank,
          github: {
            org: "https://github.com/qbitOS",
            product: "ugrad-kbatch / KBatch-dictionary",
            gluelam: "https://github.com/qbitOS/qbitos-gluelam",
            ironLine: "https://github.com/qbitOS/qbitos-iron-line",
            ugrad: "https://github.com/qbitOS/ugrad",
            uvspeed: "https://github.com/qbitOS/uvspeed",
          },
          xGrok: {
            surface: "X Article composer + exports/",
            notRuntime: true,
          },
          mueee: v.hosts?.mueee,
          local: "python3 -m http.server · this checkout",
        };
      },
    };
  }
}

init().catch((err) => {
  console.error("init failed:", err);
  reportCorpusHealth({
    ok: false,
    total: totalCount() || 0,
    count: totalCount() || 0,
    error: `Boot failed: ${err?.message || err}`,
    detail: String(err?.stack || err).slice(0, 500),
    phase: "error",
  });
  const line = document.getElementById("status-line");
  if (line) {
    line.textContent = `Boot failed: ${err?.message || err}`;
  }
});
