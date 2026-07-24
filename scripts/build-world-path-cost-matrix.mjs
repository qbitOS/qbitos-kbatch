#!/usr/bin/env node
/**
 * Precompute world-path cost matrix + portal subgraph for agent calibration.
 *
 *   node scripts/build-world-path-cost-matrix.mjs
 *
 * Output:
 *   data/world-path/cost-matrix.json
 *   data/world-path/portal-subgraph.json
 *
 * Schema: docs/WORLD-PATH-COST-MATRIX.md
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "data/world-path");

const wp = await import(pathToFileURL(join(root, "js/world-path.js")).href);
const cat = await import(pathToFileURL(join(root, "js/language-catalog.js")).href);

const {
  langTransferCost,
  listScriptPortals,
  computeWorldPath,
  SCRIPT_PORTALS,
  WORLD_PATH_SCHEMA,
} = wp;
const { languageCatalog, languageCatalogStats } = cat;

const langs = languageCatalog();
const ids = langs.map((l) => l.id);
const byId = Object.fromEntries(langs.map((l) => [l.id, l]));
const n = ids.length;

/** Dense row-major matrix: cost[i][j] = langTransferCost(ids[i] → ids[j]) */
const matrix = [];
for (let i = 0; i < n; i++) {
  const row = new Array(n);
  const a = byId[ids[i]];
  for (let j = 0; j < n; j++) {
    row[j] = Math.round(langTransferCost(a, byId[ids[j]]) * 1000) / 1000;
  }
  matrix.push(row);
}

/** Sparse edges under threshold (useful for Dijkstra expand) */
const EDGE_MAX = 6.5;
const edges = [];
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    if (i === j) continue;
    const c = matrix[i][j];
    if (c <= EDGE_MAX) {
      edges.push({ from: ids[i], to: ids[j], cost: c });
    }
  }
}

const portals = listScriptPortals();
const portalEdges = [];
for (const p of portals) {
  for (const q of portals) {
    if (p.langId === q.langId) continue;
    const a = byId[p.langId];
    const b = byId[q.langId];
    if (!a || !b) continue;
    portalEdges.push({
      from: p.langId,
      to: q.langId,
      fromScript: p.script,
      toScript: q.script,
      cost: Math.round(langTransferCost(a, b) * 1000) / 1000,
    });
  }
}

const readyPath = computeWorldPath({ from: "en", mode: "ready" });
const portalPath = computeWorldPath({ from: "en", mode: "portals" });

const costDoc = {
  schema: "kbatch-world-path-cost-matrix-v1",
  generated: new Date().toISOString(),
  engine: WORLD_PATH_SCHEMA,
  formula:
    "cost(a→b)=1 + layout{0|1.2|3.5} + script{0|1.5|4} + family{0|0.8|2.2} + statusBias(b) − parentBonus; ≥0.1",
  doctrine:
    "Minimize layout+script+family transfer; ready first; honor opt-in only (statusBias honor=6).",
  n,
  ids,
  index: Object.fromEntries(ids.map((id, i) => [id, i])),
  langs: langs.map((l) => ({
    id: l.id,
    label: l.label,
    script: l.script,
    family: l.family,
    layout: l.layout,
    status: l.status,
    tier: l.tier,
    parent: l.parent || null,
    dir: l.dir || "ltr",
  })),
  matrix,
  sparse: {
    edgeMax: EDGE_MAX,
    edgeCount: edges.length,
    note: `Edges with cost ≤ ${EDGE_MAX} for Dijkstra / portal expand`,
    edges,
  },
  catalogStats: languageCatalogStats(),
  examples: {
    "en→fr": matrix[ids.indexOf("en")]?.[ids.indexOf("fr")],
    "en→ru": matrix[ids.indexOf("en")]?.[ids.indexOf("ru")],
    "en→ar": matrix[ids.indexOf("en")]?.[ids.indexOf("ar")],
    "en→ko": matrix[ids.indexOf("en")]?.[ids.indexOf("ko")],
    "ru→uk": matrix[ids.indexOf("ru")]?.[ids.indexOf("uk")],
  },
  paths: {
    readyFromEn: {
      stepCount: readyPath.stepCount,
      totalTransferCost: readyPath.totalTransferCost,
      steps: readyPath.steps.map((s) => ({
        n: s.n,
        id: s.id,
        cost: s.transferCost,
        role: s.role,
        script: s.script,
        layout: s.layout,
      })),
    },
    portalsFromEn: {
      stepCount: portalPath.stepCount,
      steps: portalPath.steps.map((s) => ({
        n: s.n,
        id: s.id,
        cost: s.transferCost,
        script: s.script,
      })),
    },
  },
  urls: {
    mcp: "kbatch_world_path",
    docs: "docs/WORLD-PATH-COST-MODEL.md",
    matrixDoc: "docs/WORLD-PATH-COST-MATRIX.md",
  },
};

const portalDoc = {
  schema: "kbatch-world-path-portal-subgraph-v1",
  generated: costDoc.generated,
  scriptPortals: SCRIPT_PORTALS,
  portals,
  edges: portalEdges,
  note: "Script hub languages + pairwise transfer costs. Use before full matrix Dijkstra.",
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "cost-matrix.json"), JSON.stringify(costDoc));
writeFileSync(join(outDir, "portal-subgraph.json"), JSON.stringify(portalDoc, null, 2));

const bytes = Buffer.byteLength(JSON.stringify(costDoc));
console.log(
  `✓ world-path cost matrix ${n}×${n} · sparse edges ${edges.length} · ${(bytes / 1024).toFixed(1)} KB → data/world-path/`
);
console.log(`  examples`, costDoc.examples);
console.log(`  ready path en: ${readyPath.stepCount} steps · total ${readyPath.totalTransferCost}`);
