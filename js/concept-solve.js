/**
 * Multilingual concept solve — one meaning → many language forms
 * Instant: path geometry per form + pure C transfer rank (DOJO-true).
 * Gloss stays separate from geometry / SO / phon.
 *
 * Data: data/concepts/mesh.json · form-index.json · stair-instant.json
 * MCP: kbatch_concept_solve (mode ready|all|honor|stair)
 *      kbatch_concept_stair_walk
 */

import { languageById } from "./language-catalog.js";
import { langTransferCost } from "./world-path.js";
import { keyPathForText, BASE_LAYOUT_ID } from "./layouts.js";
import { flowSignature } from "./keyboard-pattern-lab.js";

export const CONCEPT_SOLVE_SCHEMA = "kbatch-concept-solve-v1";
export const CONCEPT_STAIR_WALK_SCHEMA = "kbatch-concept-stair-walk-v1";

/** Rubik all-13 tour order (pure C Σc 83.5) — dictionary iteration axis */
export const RUBIK_STAIR_ORDER = Object.freeze([
  "en",
  "is",
  "de",
  "fr",
  "it",
  "es",
  "nav",
  "oj",
  "ar",
  "hi",
  "el",
  "zh",
  "chr",
]);

const HONOR_STAIR = new Set(["nav", "oj", "chr"]);

const MESH_URLS = [
  "/data/concepts/mesh.json",
  "https://kbatch.ugrad.ai/data/concepts/mesh.json",
  "https://data.ugrad.ai/kbatch/concepts/mesh.json",
];

const STAIR_INSTANT_URLS = [
  "/data/concepts/stair-instant.json",
  "https://kbatch.ugrad.ai/data/concepts/stair-instant.json",
];

/** @type {object|null} */
let _mesh = null;
/** @type {Map<string, object>} */
let _byId = new Map();
/** @type {Map<string, Array<{conceptId:string,lang:string,form:string,primary?:boolean}>>} */
let _byForm = new Map();
let _loadPromise = null;
/** @type {object|null} */
let _stairInstant = null;
let _stairLoadPromise = null;

/**
 * @param {typeof fetch} [fetchImpl]
 */
export async function loadConceptMesh(fetchImpl) {
  if (_mesh?.concepts?.length) return _mesh;
  if (_loadPromise) return _loadPromise;
  const f = fetchImpl || fetch;
  _loadPromise = (async () => {
    let lastErr = null;
    for (const url of MESH_URLS) {
      try {
        const res = await f(url, { cache: "default" });
        if (!res.ok) continue;
        const mesh = await res.json();
        _mesh = mesh;
        _byId = new Map((mesh.concepts || []).map((c) => [c.id, c]));
        _byForm = new Map();
        for (const c of mesh.concepts || []) {
          for (const fr of c.forms || []) {
            const k = String(fr.form || "").toLowerCase();
            if (!k) continue;
            if (!_byForm.has(k)) _byForm.set(k, []);
            _byForm.get(k).push({
              conceptId: c.id,
              lang: fr.lang,
              form: fr.form,
              primary: !!fr.primary,
            });
          }
        }
        return _mesh;
      } catch (e) {
        lastErr = e;
      }
    }
    _mesh = {
      schema: "kbatch-concept-mesh-v1",
      concepts: [],
      error: String(lastErr || "mesh load failed"),
    };
    return _mesh;
  })();
  return _loadPromise;
}

/**
 * Optional prebuilt demos + stairFill metrics (does not block solve).
 * @param {typeof fetch} [fetchImpl]
 */
export async function loadStairInstant(fetchImpl) {
  if (_stairInstant?.stairOrder) return _stairInstant;
  if (_stairLoadPromise) return _stairLoadPromise;
  const f = fetchImpl || fetch;
  _stairLoadPromise = (async () => {
    for (const url of STAIR_INSTANT_URLS) {
      try {
        const res = await f(url, { cache: "default" });
        if (!res.ok) continue;
        _stairInstant = await res.json();
        return _stairInstant;
      } catch {
        /* try next */
      }
    }
    _stairInstant = {
      schema: "kbatch-concept-stair-instant-v1",
      stairOrder: [...RUBIK_STAIR_ORDER],
      demos: [],
    };
    return _stairInstant;
  })();
  return _stairLoadPromise;
}

function normQ(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

/**
 * Build 13-step Rubik stair rows for one concept (missing = gap, not error).
 * @param {object} concept
 * @param {{ from?: string, includePaths?: boolean }} [opts]
 */
export function buildStairRows(concept, opts = {}) {
  const from = String(opts.from || "en").toLowerCase();
  const includePaths = opts.includePaths !== false;
  const origin = languageById(from) || { id: from, layout: "qwerty", status: "ready" };
  const byLang = new Map();
  for (const fr of concept?.forms || []) {
    const lang = fr.lang;
    if (!byLang.has(lang)) byLang.set(lang, []);
    byLang.get(lang).push(fr);
  }
  const stair = [];
  for (let i = 0; i < RUBIK_STAIR_ORDER.length; i++) {
    const lang = RUBIK_STAIR_ORDER[i];
    const L = languageById(lang) || {
      id: lang,
      label: lang,
      layout: "qwerty",
      status: HONOR_STAIR.has(lang) ? "honor" : "ready",
      script: null,
      family: null,
    };
    const candidates = byLang.get(lang) || [];
    const primary =
      candidates.find((f) => f.primary) || candidates[0] || null;
    const cost = langTransferCost(origin, { ...L, id: lang });
    const row = {
      n: i + 1,
      lang,
      label: L.label || lang,
      form: primary?.form ?? null,
      primary: !!primary?.primary,
      layout: primary?.layout || L.layout || BASE_LAYOUT_ID,
      script: L.script || null,
      family: L.family || null,
      status:
        primary?.status ||
        (HONOR_STAIR.has(lang) ? "honor-seed" : L.status || "open"),
      missing: !primary,
      cFromSource: Math.round(cost * 10) / 10,
      dictionaryUrl: primary
        ? `/?lang=${encodeURIComponent(lang)}&q=${encodeURIComponent(primary.form)}`
        : `/?lang=${encodeURIComponent(lang)}`,
      shadowUrl: primary
        ? `/shadow.html?q=${encodeURIComponent(primary.form)}`
        : null,
    };
    if (includePaths && primary?.form) {
      row.path = formPathSnap(primary.form, row.layout);
    } else if (includePaths) {
      row.path = null;
    }
    stair.push(row);
  }
  const filled = stair.filter((s) => !s.missing).length;
  return {
    stair,
    filled,
    of: RUBIK_STAIR_ORDER.length,
    fillPct: Math.round((filled / RUBIK_STAIR_ORDER.length) * 1000) / 10,
    transferOrder: stair.filter((s) => !s.missing).map((s) => s.lang),
  };
}

/**
 * Path snapshot for one orthography form.
 * @param {string} form
 * @param {string} [layoutId]
 */
export function formPathSnap(form, layoutId = BASE_LAYOUT_ID) {
  const text = String(form || "");
  // Non-Latin scripts may not map onto Latin boards — still return length/meta
  try {
    const path = keyPathForText(text, layoutId);
    const flow = flowSignature(path);
    return {
      layout: layoutId,
      pathLen: path?.length ?? 0,
      flow: flow?.dirs || null,
      ok: true,
    };
  } catch {
    return {
      layout: layoutId,
      pathLen: [...text].length,
      flow: null,
      ok: false,
      note: "path fallback (script may not map to layout keys)",
    };
  }
}

/**
 * Resolve concept ids for a query string.
 * @param {string} q
 */
export function findConceptsForQuery(q) {
  const k = normQ(q);
  if (!k) return [];
  // direct concept id
  if (k.startsWith("concept:") && _byId.has(k)) return [_byId.get(k)];
  if (_byId.has(`concept:${k}`)) return [_byId.get(`concept:${k}`)];
  // form lookup
  const hits = _byForm.get(k) || [];
  const ids = [...new Set(hits.map((h) => h.conceptId))];
  const out = ids.map((id) => _byId.get(id)).filter(Boolean);
  // slug match
  if (!out.length) {
    for (const c of _mesh?.concepts || []) {
      if (c.slug === k || c.id === `concept:${k}`) out.push(c);
    }
  }
  // gloss substring soft match (limited)
  if (!out.length && k.length >= 3) {
    for (const c of _mesh?.concepts || []) {
      if (String(c.gloss_en || "").toLowerCase().includes(k)) {
        out.push(c);
        if (out.length >= 5) break;
      }
    }
  }
  return out;
}

/**
 * Multilingual concept solve.
 * @param {{ q?: string, conceptId?: string, from?: string, mode?: string, includeHonor?: boolean, includePaths?: boolean, limit?: number }} opts
 * @param {typeof fetch} [fetchImpl]
 */
export async function conceptSolve(opts = {}, fetchImpl) {
  await loadConceptMesh(fetchImpl);
  const q = opts.q || opts.text || opts.word || "";
  const from = String(opts.from || opts.lang || "en").toLowerCase();
  const mode = String(opts.mode || "ready").toLowerCase(); // ready | all | honor | stair
  const isStair = mode === "stair";
  const includeHonor =
    opts.includeHonor === true ||
    mode === "honor" ||
    mode === "all" ||
    isStair;
  const includePaths = opts.includePaths !== false;
  const limit = Math.min(80, Math.max(1, Number(opts.limit) || (isStair ? 40 : 40)));

  let concepts = [];
  if (opts.conceptId && _byId.has(opts.conceptId)) {
    concepts = [_byId.get(opts.conceptId)];
  } else if (opts.conceptId && _byId.has(`concept:${opts.conceptId}`)) {
    concepts = [_byId.get(`concept:${opts.conceptId}`)];
  } else {
    concepts = findConceptsForQuery(q);
  }

  if (!concepts.length) {
    return {
      schema: CONCEPT_SOLVE_SCHEMA,
      ok: false,
      q,
      from,
      mode,
      concept: null,
      concepts: [],
      forms: [],
      stair: isStair ? [] : undefined,
      note: "No concept mesh hit — try a core noun/verb or concept:water",
      meshCount: _mesh?.count || _mesh?.concepts?.length || 0,
      doctrine: _mesh?.doctrine || null,
    };
  }

  // Primary concept = best form-lang match to `from`, else first
  let primary = concepts[0];
  for (const c of concepts) {
    if ((c.forms || []).some((f) => f.lang === from && normQ(f.form) === normQ(q))) {
      primary = c;
      break;
    }
  }

  const origin = languageById(from) || { id: from, layout: "qwerty", status: "ready" };

  // --- mode=stair: full Rubik 13-step order, honor included, missing flagged ---
  if (isStair) {
    const pack = buildStairRows(primary, { from, includePaths });
    const formsPresent = pack.stair.filter((s) => !s.missing);
    const sliced = formsPresent.slice(0, limit);
    let sourceForm =
      sliced.find((f) => f.lang === from && normQ(f.form) === normQ(q)) ||
      sliced.find((f) => f.lang === from) ||
      sliced[0] ||
      null;
    return {
      schema: CONCEPT_SOLVE_SCHEMA,
      ok: true,
      instant: true,
      allLanguage: true,
      q,
      from,
      mode: "stair",
      includeHonor: true,
      stairOrder: [...RUBIK_STAIR_ORDER],
      stair: pack.stair,
      filled: pack.filled,
      of: pack.of,
      fillPct: pack.fillPct,
      concept: {
        id: primary.id,
        slug: primary.slug,
        gloss_en: primary.gloss_en,
        pos: primary.pos,
        langCount: primary.langCount,
        formCount: primary.formCount,
        license: primary.license,
        source: primary.source,
      },
      source: sourceForm,
      forms: sliced,
      formCount: sliced.length,
      transferOrder: pack.transferOrder,
      alts: concepts.slice(0, 5).map((c) => ({
        id: c.id,
        slug: c.slug,
        gloss_en: c.gloss_en,
        langCount: c.langCount,
      })),
      metrics: {
        meshConcepts: _mesh?.count || _mesh?.concepts?.length || 0,
        langsInResult: pack.filled,
        stairFilled: pack.filled,
        stairOf: pack.of,
        minC: sliced.length ? Math.min(...sliced.map((f) => f.cFromSource)) : null,
        maxC: sliced.length ? Math.max(...sliced.map((f) => f.cFromSource)) : null,
      },
      doctrine: {
        purity: "path geometry ≠ gloss ≠ SO ≠ phon",
        cost: "pure langTransferCost / C — DOJO-true; no tilde_c",
        honor: "mode=stair always includes honor-seed langs (nav/oj/chr)",
        stair: "forms ordered en→is→de→fr→it→es→nav→oj→ar→hi→el→zh→chr; missing=gap",
        license: primary.license || "kbatch-curated-open-seed",
      },
      urls: {
        mesh: "/data/concepts/mesh.json",
        formIndex: "/data/concepts/form-index.json",
        stairInstant: "/data/concepts/stair-instant.json",
        doc: "/docs/CONCEPT-MESH-SOLVE.md",
        stair: "/data/world-path/rubik-stair-next.json",
        tour: "/data/declaration/rubik-all-language-path.json",
      },
    };
  }

  function langAllowed(lang, status) {
    if (mode === "all") return true;
    const L = languageById(lang);
    const st = status || L?.status || "ready";
    if (st === "honor" || st === "honor-seed" || L?.status === "honor") {
      return includeHonor;
    }
    if (mode === "ready") {
      // allow if catalog ready OR form is open educational (not honor)
      if (L?.status === "placeholder") return true; // still show form; cost reflects bias
      return L?.status !== "honor";
    }
    return true;
  }

  const formsOut = [];
  for (const fr of primary.forms || []) {
    if (!langAllowed(fr.lang, fr.status)) continue;
    const L = languageById(fr.lang) || {
      id: fr.lang,
      label: fr.lang,
      layout: fr.layout || "qwerty",
      status: fr.status || "ready",
      script: null,
      family: null,
    };
    const layout = fr.layout || L.layout || BASE_LAYOUT_ID;
    const cost = langTransferCost(origin, { ...L, id: fr.lang });
    const row = {
      lang: fr.lang,
      label: L.label || fr.lang,
      form: fr.form,
      primary: !!fr.primary,
      layout,
      script: L.script || null,
      family: L.family || null,
      status: fr.status || L.status || "open",
      cFromSource: Math.round(cost * 10) / 10,
      dictionaryUrl: `/?lang=${encodeURIComponent(fr.lang)}&q=${encodeURIComponent(fr.form)}`,
      shadowUrl: `/shadow.html?q=${encodeURIComponent(fr.form)}`,
    };
    if (includePaths) {
      row.path = formPathSnap(fr.form, layout);
    }
    formsOut.push(row);
  }

  formsOut.sort((a, b) => {
    if (a.lang === from && b.lang !== from) return -1;
    if (b.lang === from && a.lang !== from) return 1;
    if (a.cFromSource !== b.cFromSource) return a.cFromSource - b.cFromSource;
    return String(a.lang).localeCompare(String(b.lang));
  });

  const sliced = formsOut.slice(0, limit);
  const transferOrder = [...new Set(sliced.map((f) => f.lang))];

  // Source form: prefer query lang match
  let sourceForm = sliced.find((f) => f.lang === from && normQ(f.form) === normQ(q));
  if (!sourceForm) sourceForm = sliced.find((f) => f.lang === from);
  if (!sourceForm) sourceForm = sliced[0] || null;

  return {
    schema: CONCEPT_SOLVE_SCHEMA,
    ok: true,
    instant: true,
    q,
    from,
    mode,
    includeHonor,
    concept: {
      id: primary.id,
      slug: primary.slug,
      gloss_en: primary.gloss_en,
      pos: primary.pos,
      langCount: primary.langCount,
      formCount: primary.formCount,
      license: primary.license,
      source: primary.source,
    },
    source: sourceForm,
    forms: sliced,
    formCount: sliced.length,
    transferOrder,
    alts: concepts.slice(0, 5).map((c) => ({
      id: c.id,
      slug: c.slug,
      gloss_en: c.gloss_en,
      langCount: c.langCount,
    })),
    metrics: {
      meshConcepts: _mesh?.count || _mesh?.concepts?.length || 0,
      langsInResult: transferOrder.length,
      minC: sliced.length ? Math.min(...sliced.map((f) => f.cFromSource)) : null,
      maxC: sliced.length ? Math.max(...sliced.map((f) => f.cFromSource)) : null,
    },
    doctrine: {
      purity: "path geometry ≠ gloss ≠ SO ≠ phon",
      cost: "pure langTransferCost / C — DOJO-true; no tilde_c",
      honor: "honor forms only when includeHonor or mode=honor|all|stair",
      license: primary.license || "kbatch-curated-open-seed",
    },
    urls: {
      mesh: "/data/concepts/mesh.json",
      formIndex: "/data/concepts/form-index.json",
      stairInstant: "/data/concepts/stair-instant.json",
      doc: "/docs/CONCEPT-MESH-SOLVE.md",
      stair: "/data/world-path/rubik-stair-next.json",
    },
  };
}

/**
 * Walk several concepts along Rubik stair — instant multi-lang pack.
 * @param {{ concepts?: string[], q?: string|string[], from?: string, includePaths?: boolean, limit?: number }} opts
 * @param {typeof fetch} [fetchImpl]
 */
export async function conceptStairWalk(opts = {}, fetchImpl) {
  await loadConceptMesh(fetchImpl);
  const from = String(opts.from || "en").toLowerCase();
  const includePaths = opts.includePaths !== false;
  let keys = opts.concepts || opts.q || opts.words || [];
  if (typeof keys === "string") keys = keys.split(/[\s,]+/).filter(Boolean);
  if (!Array.isArray(keys) || !keys.length) {
    keys = ["liberty", "water", "path", "language", "sun", "earth"];
  }
  const limit = Math.min(40, Math.max(1, Number(opts.limit) || keys.length));
  keys = keys.slice(0, limit);

  const rows = [];
  for (const key of keys) {
    const concepts = findConceptsForQuery(String(key));
    if (!concepts.length) {
      rows.push({
        q: key,
        ok: false,
        note: "no mesh hit",
        stair: null,
        filled: 0,
        of: RUBIK_STAIR_ORDER.length,
      });
      continue;
    }
    const primary = concepts[0];
    const pack = buildStairRows(primary, { from, includePaths });
    rows.push({
      q: key,
      ok: true,
      concept: {
        id: primary.id,
        slug: primary.slug,
        gloss_en: primary.gloss_en,
        pos: primary.pos,
      },
      stair: pack.stair,
      filled: pack.filled,
      of: pack.of,
      fillPct: pack.fillPct,
      transferOrder: pack.transferOrder,
    });
  }

  const okRows = rows.filter((r) => r.ok);
  const avgFill =
    okRows.length > 0
      ? Math.round(
          (okRows.reduce((s, r) => s + r.filled, 0) / okRows.length) * 10
        ) / 10
      : 0;

  let stairFill = null;
  try {
    const si = await loadStairInstant(fetchImpl);
    stairFill = si?.stairFill || null;
  } catch {
    /* optional */
  }

  return {
    schema: CONCEPT_STAIR_WALK_SCHEMA,
    ok: true,
    instant: true,
    allLanguage: true,
    from,
    stairOrder: [...RUBIK_STAIR_ORDER],
    conceptCount: rows.length,
    hits: okRows.length,
    avgFilled: avgFill,
    of: RUBIK_STAIR_ORDER.length,
    rows,
    stairFill,
    doctrine: {
      purity: "path geometry ≠ gloss ≠ SO ≠ phon",
      cost: "pure C / langTransferCost — DOJO-true",
      honor: "stair always surfaces honor-seed forms when present",
      missing: "missing step = educational gap to fill, not error",
    },
    urls: {
      mesh: "/data/concepts/mesh.json",
      stairInstant: "/data/concepts/stair-instant.json",
      stair: "/data/world-path/rubik-stair-next.json",
      tour: "/data/declaration/rubik-all-language-path.json",
      doc: "/docs/CONCEPT-MESH-SOLVE.md",
    },
    browser:
      'await kbatchDict.mcp("kbatch_concept_stair_walk", { concepts: ["liberty","water","path"] })',
  };
}

/**
 * Compact HTML strip for dual-pane / cards.
 * @param {Awaited<ReturnType<typeof conceptSolve>>} solve
 * @param {(s: string) => string} esc
 */
export function conceptSolveHtml(solve, esc) {
  if (!solve?.ok) {
    return `<div class="dual-pane dual-world is-empty"><h4 class="dual-h">World forms</h4><p class="dual-meaning muted">No concept mesh hit yet</p></div>`;
  }
  const isStair = solve.mode === "stair" && Array.isArray(solve.stair);
  if (isStair) {
    const chips = solve.stair
      .map((f) => {
        if (f.missing) {
          return `<span class="sense-lang-chip is-missing" title="${esc(f.label)} · gap">${esc(f.lang)}:·</span>`;
        }
        const title = `${f.n}. ${f.label} · c=${f.cFromSource} · ${f.layout}`;
        return `<a class="sense-lang-chip" href="${esc(f.dictionaryUrl)}" title="${esc(title)}">${esc(String(f.n))}.${esc(f.lang)}:${esc(f.form)}</a>`;
      })
      .join(" ");
    return `
    <div class="dual-pane dual-world dual-stair">
      <h4 class="dual-h">Rubik stair · all-language</h4>
      <p class="dual-meaning"><span class="sense-pos">${esc(solve.concept?.pos || "")}</span> ${esc(solve.concept?.gloss_en || "")}</p>
      <p class="dual-line"><span class="sense-k">Concept</span> <code>${esc(solve.concept?.id || "")}</code> · filled <strong>${esc(String(solve.filled))}/${esc(String(solve.of))}</strong> · ${esc(String(solve.fillPct))}%</p>
      <p class="dual-line sense-world"><span class="sense-k">Stair</span> ${chips}</p>
      <p class="dual-attr"><span class="sense-badge">pure C</span> en→…→chr · honor opt-in seeds · missing=gap</p>
    </div>`;
  }
  if (!solve.forms?.length) {
    return `<div class="dual-pane dual-world is-empty"><h4 class="dual-h">World forms</h4><p class="dual-meaning muted">No concept mesh hit yet</p></div>`;
  }
  const chips = solve.forms
    .slice(0, 16)
    .map((f) => {
      const title = `${f.label} · c=${f.cFromSource} · ${f.layout}`;
      return `<a class="sense-lang-chip" href="${esc(f.dictionaryUrl)}" title="${esc(title)}">${esc(f.lang)}:${esc(f.form)}</a>`;
    })
    .join(" ");
  return `
    <div class="dual-pane dual-world">
      <h4 class="dual-h">World forms · concept</h4>
      <p class="dual-meaning"><span class="sense-pos">${esc(solve.concept?.pos || "")}</span> ${esc(solve.concept?.gloss_en || "")}</p>
      <p class="dual-line"><span class="sense-k">Concept</span> <code>${esc(solve.concept?.id || "")}</code> · ${esc(String(solve.formCount))} forms · from <code>${esc(solve.from)}</code></p>
      <p class="dual-line sense-world"><span class="sense-k">Instant forms</span> ${chips}</p>
      <p class="dual-attr"><span class="sense-badge">pure C</span> transfer rank · geometry separate · ${esc(solve.doctrine?.honor || "")}</p>
    </div>`;
}

if (typeof window !== "undefined") {
  window.__kbatchConceptSolve = {
    load: loadConceptMesh,
    loadStair: loadStairInstant,
    solve: conceptSolve,
    stairWalk: conceptStairWalk,
    stairOrder: RUBIK_STAIR_ORDER,
    html: conceptSolveHtml,
    formPath: formPathSnap,
    buildStair: buildStairRows,
  };
}
