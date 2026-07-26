#!/usr/bin/env node
/**
 * Rebuild concept mesh seed (Python generator is source of truth in-repo).
 * Prefer: python3 scripts/build-concept-mesh.py if present.
 * This node stub validates existing mesh + form-index.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const meshPath = join(root, "data/concepts/mesh.json");
const idxPath = join(root, "data/concepts/form-index.json");

if (!existsSync(meshPath)) {
  console.error("Missing data/concepts/mesh.json — run seed generator first");
  process.exit(1);
}
const mesh = JSON.parse(readFileSync(meshPath, "utf8"));
const idx = existsSync(idxPath)
  ? JSON.parse(readFileSync(idxPath, "utf8"))
  : null;
console.log(
  `concept mesh · ${mesh.count || mesh.concepts?.length || 0} concepts · form keys ${idx?.count ?? "—"}`
);
console.log(`langs: ${Object.keys(mesh.langCoverage || {}).join(", ")}`);
console.log("ok");
