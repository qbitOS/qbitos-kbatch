/**
 * World-path · fastest route through all catalog languages
 *
 * Geometry-first curriculum order: minimize transfer cost by
 *   1) same keyboard layout  2) same script  3) same family
 *   4) ready packs before placeholders  5) honor langs after living packs
 *      (honor stay optional — never force community packs)
 *
 * Script "portals" are hub languages with ready packs that unlock a script family.
 * Agents / DOJO / Colossus pipe this for "zero → world" laddering.
 *
 * @see js/language-catalog.js · docs/WORLD-LANGUAGE-LEARNING.md
 */

import {
  languageCatalog,
  languageById,
  languageCatalogStats,
} from "./language-catalog.js";

export const WORLD_PATH_SCHEMA = "kbatch-world-path-v1";

/** Script portals: first ready lang that opens a script for geometry practice */
export const SCRIPT_PORTALS = {
  Latin: "en",
  Cyrillic: "ru",
  Arabic: "ar",
  Han: "zh",
  Hangul: "ko",
  Hiragana: "ja",
  Katakana: "ja",
  Greek: "el",
  Hebrew: "he",
  Devanagari: "hi",
  Thai: "th",
  Georgian: "ka",
  Armenian: "hy",
  Cherokee: "chr",
  Bengali: "bn",
  Tamil: "ta",
};

/** Layout transfer cost (same layout = free geometry muscle memory) */
const LAYOUT_COST = {
  same: 0,
  latin_family: 1.2, // qwerty ↔ colemak-ish still Latin board
  different: 3.5,
};

const LATIN_LAYOUTS = new Set([
  "qwerty",
  "dvorak",
  "colemak",
  "workman",
  "azerty",
  "qwertz",
  "norman",
  "halmak",
]);

/**
 * Status weight: lower = prefer earlier in path for practice.
 * honor is never zero — learner must opt-in.
 */
const STATUS_BIAS = {
  ready: 0,
  placeholder: 2.5,
  honor: 6,
};

/**
 * Transfer cost between two lang entries (lower = closer).
 * @param {import('./language-catalog.js').LangEntry|object} a
 * @param {import('./language-catalog.js').LangEntry|object} b
 */
export function langTransferCost(a, b) {
  if (!a || !b) return 99;
  if (a.id === b.id) return 0;
  let c = 1;
  // layout
  if (a.layout === b.layout) c += LAYOUT_COST.same;
  else if (LATIN_LAYOUTS.has(a.layout) && LATIN_LAYOUTS.has(b.layout)) {
    c += LAYOUT_COST.latin_family;
  } else {
    c += LAYOUT_COST.different;
  }
  // script
  if (a.script === b.script) c += 0;
  else if (scriptCluster(a.script) === scriptCluster(b.script)) c += 1.5;
  else c += 4;
  // family
  if (a.family === b.family) c += 0;
  else if (familyCluster(a.family) === familyCluster(b.family)) c += 0.8;
  else c += 2.2;
  // status
  c += STATUS_BIAS[b.status] ?? 2;
  // parent link
  if (a.parent && a.parent === b.id) c -= 0.5;
  if (b.parent && b.parent === a.id) c -= 0.5;
  return Math.max(0.1, c);
}

function scriptCluster(script) {
  const s = String(script || "");
  if (/Hiragana|Katakana|Kanji|Japanese/i.test(s)) return "japanese";
  if (/Han|Chinese|CJK/i.test(s)) return "cjk";
  if (/Cyrillic/i.test(s)) return "cyrillic";
  if (/Arabic|Persian|Urdu/i.test(s)) return "arabic";
  if (/Latin|Roman/i.test(s)) return "latin";
  if (/Devanagari|Bengali|Tamil|Gujarati|Gurmukhi|Telugu|Kannada|Malayalam|Sinhala/i.test(s))
    return "indic";
  if (/Thai|Khmer|Lao|Myanmar|Burmese/i.test(s)) return "sea";
  return s.toLowerCase() || "other";
}

function familyCluster(family) {
  const f = String(family || "").toLowerCase();
  if (/germanic|romance|celtic|baltic|slavic|indo-european|hellenic|italic|iranian|indo-aryan/.test(f))
    return "ie";
  if (/semitic|afro/.test(f)) return "afroasiatic";
  if (/turkic|uralic|mongolic|tungus/.test(f)) return "altaic-ish";
  if (/sinitic|tibeto|hmong|tai|austroasiatic|austronesian/.test(f)) return "east-seasia";
  if (/algic|iroquoian|siouan|na-dené|athabaskan|salish|muskogean|eskimo/.test(f))
    return "turtle-island";
  if (/dravidian/.test(f)) return "dravidian";
  if (/niger|bantu|atlantic/.test(f)) return "niger-congo";
  return f || "other";
}

/**
 * Script portals present in catalog (ready preferred).
 */
export function listScriptPortals() {
  const portals = [];
  const seen = new Set();
  for (const [script, preferId] of Object.entries(SCRIPT_PORTALS)) {
    const pref = languageById(preferId);
    if (pref && !seen.has(pref.id)) {
      portals.push({
        script,
        langId: pref.id,
        label: pref.label,
        status: pref.status,
        layout: pref.layout,
        role: "portal",
      });
      seen.add(pref.id);
      continue;
    }
    // fallback: first ready of that script
    const hit = languageCatalog().find(
      (l) => l.script === script && l.status === "ready" && !seen.has(l.id)
    );
    if (hit) {
      portals.push({
        script,
        langId: hit.id,
        label: hit.label,
        status: hit.status,
        layout: hit.layout,
        role: "portal-fallback",
      });
      seen.add(hit.id);
    }
  }
  return portals;
}

/**
 * Compute fastest multi-lang path.
 *
 * @param {{
 *   from?: string,
 *   includeHonor?: boolean,
 *   includePlaceholder?: boolean,
 *   readyOnly?: boolean,
 *   max?: number,
 *   mode?: "full"|"ready"|"portals"|"ladder",
 * }} [opts]
 */
export function computeWorldPath(opts = {}) {
  const mode = opts.mode || "full";
  const includeHonor = opts.includeHonor === true; // default off for "fastest living path"
  const includePlaceholder =
    opts.includePlaceholder !== false && mode !== "ready";
  const readyOnly = opts.readyOnly === true || mode === "ready";
  const max = Math.max(1, Number(opts.max) || 999);

  const fromId = String(opts.from || "en").toLowerCase();
  let origin = languageById(fromId) || languageById("en");
  if (!origin) {
    origin = {
      id: "en",
      label: "English",
      script: "Latin",
      family: "Germanic",
      layout: "qwerty",
      status: "ready",
      tier: "mother",
    };
  }

  let pool = languageCatalog().filter((l) => l.id !== origin.id);
  if (readyOnly) pool = pool.filter((l) => l.status === "ready");
  else {
    if (!includePlaceholder) pool = pool.filter((l) => l.status !== "placeholder");
    if (!includeHonor)
      pool = pool.filter(
        (l) => l.status !== "honor" && l.status !== "honor-seed"
      );
  }

  if (mode === "portals") {
    const portals = listScriptPortals().filter((p) => p.langId !== origin.id);
    const steps = portals.map((p, i) => {
      const lang = languageById(p.langId);
      return stepRow(i + 1, lang || p, origin, "portal", p.script);
    });
    return packagePath(origin, steps, {
      mode,
      includeHonor,
      includePlaceholder,
      readyOnly: true,
      note: "Script portals only — unlock each writing system with one hub language.",
    });
  }

  // Greedy nearest-neighbor with portal bias early
  const remaining = new Map(pool.map((l) => [l.id, l]));
  const path = [];
  let cursor = origin;
  const portals = listScriptPortals();
  const portalIds = new Set(portals.map((p) => p.langId));

  // Phase A: hit unread portals close to origin first (script unlock)
  if (mode === "full" || mode === "ladder") {
    const portalOrder = portals
      .filter((p) => remaining.has(p.langId))
      .map((p) => remaining.get(p.langId))
      .sort((a, b) => langTransferCost(origin, a) - langTransferCost(origin, b));
    for (const p of portalOrder) {
      if (path.length >= max) break;
      path.push(stepRow(path.length + 1, p, cursor, "portal", p.script));
      remaining.delete(p.id);
      cursor = p;
    }
  }

  // Phase B: greedy fill remaining by transfer cost (ready before placeholder)
  while (remaining.size && path.length < max) {
    let best = null;
    let bestCost = Infinity;
    for (const l of remaining.values()) {
      let cost = langTransferCost(cursor, l);
      // slight preference to stay in same script cluster after portal
      if (cursor.script === l.script) cost *= 0.85;
      // ready packs first when costs close
      if (l.status === "ready") cost *= 0.9;
      if (cost < bestCost) {
        bestCost = cost;
        best = l;
      }
    }
    if (!best) break;
    const role =
      best.status === "honor" || best.status === "honor-seed"
        ? "honor-opt-in"
        : best.status === "placeholder"
          ? "placeholder"
          : portalIds.has(best.id)
            ? "portal"
            : "transfer";
    path.push(stepRow(path.length + 1, best, cursor, role, best.script));
    remaining.delete(best.id);
    cursor = best;
  }

  // Ladder mode: compress to CEFR-style rungs (zero → living → register → dead → access)
  if (mode === "ladder") {
    return packagePath(origin, path, {
      mode,
      includeHonor,
      includePlaceholder,
      readyOnly,
      rungs: buildLadderRungs(origin, path),
      note: "Compressed ladder rungs for school UI; full order still in steps[].",
    });
  }

  return packagePath(origin, path, {
    mode,
    includeHonor,
    includePlaceholder,
    readyOnly,
    remaining: [...remaining.keys()],
  });
}

function stepRow(n, lang, from, role, script) {
  const cost = langTransferCost(from, lang);
  return {
    n,
    id: lang.id,
    label: lang.label || lang.id,
    nativeName: lang.nativeName || lang.label,
    script: lang.script || script,
    family: lang.family || "—",
    layout: lang.layout || "qwerty",
    status: lang.status || "placeholder",
    tier: lang.tier || "world",
    dir: lang.dir || "ltr",
    role,
    transferCost: Math.round(cost * 100) / 100,
    fromId: from?.id || null,
    learnUrl: `https://kbatch.ugrad.ai/learn.html?lang=${encodeURIComponent(lang.id)}`,
    dictUrl: `https://kbatch.ugrad.ai/?lang=${encodeURIComponent(lang.id)}`,
    honor: lang.status === "honor" || lang.status === "honor-seed",
    note:
      lang.status === "honor-seed"
        ? "FN educational seed on disk — opt-in · community-first bulk growth."
        : lang.status === "honor"
          ? "Honor language — community gate; path lists it last / opt-in only."
          : lang.status === "placeholder"
            ? "Placeholder pack — geometry + layout ready; orthography slivers pending."
            : role === "portal"
              ? `Script portal · unlocks ${lang.script}`
              : `Transfer from ${from?.id || "—"}`,
  };
}

function buildLadderRungs(origin, path) {
  const ready = path.filter((s) => s.status === "ready");
  const placeholders = path.filter((s) => s.status === "placeholder");
  const honor = path.filter(
    (s) => s.status === "honor" || s.status === "honor-seed"
  );
  const byScript = {};
  for (const s of path) {
    byScript[s.script] = byScript[s.script] || [];
    byScript[s.script].push(s.id);
  }
  return [
    {
      rung: 0,
      name: "Zero · home board",
      langs: [origin.id],
      claim: "Letter atoms + home row on mother layout",
    },
    {
      rung: 1,
      name: "Living L2 · ready packs",
      langs: ready.map((s) => s.id),
      claim: "Type real orthography with path metrics",
    },
    {
      rung: 2,
      name: "Script portals",
      langs: path.filter((s) => s.role === "portal").map((s) => s.id),
      claim: "One hub language per writing system",
      scripts: Object.keys(byScript),
    },
    {
      rung: 3,
      name: "World placeholders",
      langs: placeholders.map((s) => s.id),
      claim: "Geometry reserved; grow packs without reordering spine",
    },
    {
      rung: 4,
      name: "Honor / Indigenous (opt-in)",
      langs: honor.map((s) => s.id),
      claim: "Never auto-force; community agreement first",
    },
  ];
}

function packagePath(origin, steps, meta) {
  const stats = languageCatalogStats();
  const totalCost = steps.reduce((a, s) => a + (s.transferCost || 0), 0);
  const portals = listScriptPortals();
  return {
    schema: WORLD_PATH_SCHEMA,
    ts: new Date().toISOString(),
    doctrine:
      "Fastest path = minimize layout+script+family transfer; ready packs first; honor langs opt-in only.",
    origin: {
      id: origin.id,
      label: origin.label,
      script: origin.script,
      family: origin.family,
      layout: origin.layout,
      status: origin.status,
    },
    mode: meta.mode,
    includeHonor: meta.includeHonor,
    includePlaceholder: meta.includePlaceholder,
    readyOnly: meta.readyOnly,
    stepCount: steps.length,
    totalTransferCost: Math.round(totalCost * 100) / 100,
    avgStepCost:
      steps.length > 0
        ? Math.round((totalCost / steps.length) * 100) / 100
        : 0,
    catalogStats: stats,
    portals,
    steps,
    rungs: meta.rungs || null,
    remaining: meta.remaining || [],
    note: meta.note || null,
    mcp: {
      tool: "kbatch_world_path",
      browser: "window.kbatchDict.worldPath({ from: 'en', mode: 'full' })",
    },
    surfaces: {
      learn: "https://kbatch.ugrad.ai/learn.html",
      dojo: "https://kbatch.ugrad.ai/dojo/",
      ranking: "https://kbatch.ugrad.ai/world-ranking.html",
    },
  };
}

/**
 * HTML summary for DOJO panel.
 * @param {ReturnType<typeof computeWorldPath>} path
 * @param {{ limit?: number }} [opts]
 */
export function worldPathHtml(path, opts = {}) {
  const limit = Math.max(5, Number(opts.limit) || 24);
  const steps = (path.steps || []).slice(0, limit);
  const rows = steps
    .map(
      (s) =>
        `<tr class="wp-row status-${esc(s.status)} role-${esc(s.role)}" data-lang="${esc(s.id)}">
          <td class="mono">${s.n}</td>
          <td><b>${esc(s.id)}</b> ${esc(s.label)}</td>
          <td>${esc(s.script)}</td>
          <td>${esc(s.layout)}</td>
          <td class="mono">${s.transferCost}</td>
          <td><span class="wp-chip">${esc(s.role)}</span></td>
          <td>${esc(s.status)}</td>
        </tr>`
    )
    .join("");
  const more =
    (path.steps || []).length > limit
      ? `<p class="dojo-muted">Showing ${limit} of ${path.steps.length} · export JSON for full path</p>`
      : "";
  const rungs = (path.rungs || [])
    .map(
      (r) =>
        `<div class="wp-rung"><b>R${r.rung}</b> ${esc(r.name)} · <code>${(r.langs || []).slice(0, 12).map(esc).join(" ")}</code>${
          (r.langs || []).length > 12 ? "…" : ""
        }</div>`
    )
    .join("");
  return `
    <div class="wp-summary">
      <p><b>From</b> ${esc(path.origin?.label || path.origin?.id)} ·
        <b>${path.stepCount}</b> steps · total cost <b class="mono">${path.totalTransferCost}</b> ·
        mode <code>${esc(path.mode)}</code></p>
      <p class="dojo-muted">${esc(path.doctrine)}</p>
      ${rungs ? `<div class="wp-rungs">${rungs}</div>` : ""}
    </div>
    <div class="matrix-scroll">
      <table class="matrix-table wp-table">
        <thead><tr>
          <th>#</th><th>Lang</th><th>Script</th><th>Layout</th><th>Cost</th><th>Role</th><th>Status</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="7">No steps</td></tr>`}</tbody>
      </table>
    </div>
    ${more}
  `;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Precomputed snapshot for Colossus / static data (no fetch).
 */
export function worldPathSnapshot(opts = {}) {
  const full = computeWorldPath({ from: opts.from || "en", mode: "full", includeHonor: true });
  const ready = computeWorldPath({ from: opts.from || "en", mode: "ready" });
  const portals = computeWorldPath({ from: opts.from || "en", mode: "portals" });
  const ladder = computeWorldPath({ from: opts.from || "en", mode: "ladder", includeHonor: true });
  return {
    schema: WORLD_PATH_SCHEMA,
    ts: new Date().toISOString(),
    from: opts.from || "en",
    ready: {
      stepCount: ready.stepCount,
      totalTransferCost: ready.totalTransferCost,
      steps: ready.steps,
    },
    portals: {
      stepCount: portals.stepCount,
      steps: portals.steps,
      list: portals.portals,
    },
    ladder: {
      rungs: ladder.rungs,
      stepCount: ladder.stepCount,
    },
    full: {
      stepCount: full.stepCount,
      totalTransferCost: full.totalTransferCost,
      // keep full steps available but agents can request mode=full for detail
      head: full.steps.slice(0, 20),
      tail: full.steps.slice(-8),
    },
    doctrine: full.doctrine,
  };
}
