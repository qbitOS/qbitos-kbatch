/**
 * Multilingual concept solve — one meaning → many language forms
 * Instant: path geometry per form + pure C transfer rank (DOJO-true).
 * Gloss stays separate from geometry / SO / phon.
 *
 * Data: data/concepts/mesh.json · form-index.json
 * MCP: kbatch_concept_solve
 */

import { languageById } from "./language-catalog.js";
import { langTransferCost } from "./world-path.js";
import { keyPathForText, BASE_LAYOUT_ID } from "./layouts.js";
import { flowSignature } from "./keyboard-pattern-lab.js";

export const CONCEPT_SOLVE_SCHEMA = "kbatch-concept-solve-v1";

const MESH_URLS = [
  "/data/concepts/mesh.json",
  "https://kbatch.ugrad.ai/data/concepts/mesh.json",
  "https://data.ugrad.ai/kbatch/concepts/mesh.json",
];

/** @type {object|null} */
let _mesh = null;
/** @type {Map<string, object>} */
let _byId = new Map();
/** @type {Map<string, Array<{conceptId:string,lang:string,form:string,primary?:boolean}>>} */
let _byForm = new Map();
let _loadPromise = null;

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

function normQ(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
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
  const mode = String(opts.mode || "ready"); // ready | all | honor
  const includeHonor =
    opts.includeHonor === true || mode === "honor" || mode === "all";
  const includePaths = opts.includePaths !== false;
  const limit = Math.min(80, Math.max(1, Number(opts.limit) || 40));

  let concepts = [];
  if (opts.conceptId && _byId.has(opts.conceptId)) {
    concepts = [_byId.get(opts.conceptId)];
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
      honor: "honor forms only when includeHonor or mode=honor|all",
      license: primary.license || "kbatch-curated-open-seed",
    },
    urls: {
      mesh: "/data/concepts/mesh.json",
      formIndex: "/data/concepts/form-index.json",
      doc: "/docs/CONCEPT-MESH-SOLVE.md",
      stair: "/data/world-path/rubik-stair-next.json",
    },
  };
}

/**
 * Compact HTML strip for dual-pane / cards.
 * @param {Awaited<ReturnType<typeof conceptSolve>>} solve
 * @param {(s: string) => string} esc
 */
export function conceptSolveHtml(solve, esc) {
  if (!solve?.ok || !solve.forms?.length) {
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
    solve: conceptSolve,
    html: conceptSolveHtml,
    formPath: formPathSnap,
  };
}
