#!/usr/bin/env node
/**
 * Post a Cage-litmus trial to local soak bus (:9880) and optionally print grade.
 * Usage:
 *   node scripts/cage-litmus-soak-post.mjs
 *   node scripts/cage-litmus-soak-post.mjs path/to/trial.json
 *   SOAK=http://127.0.0.1:9880 node scripts/cage-litmus-soak-post.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const trialPath =
  process.argv[2] ||
  path.join(root, "data/declaration/cage-litmus-grok-trial.json");
const soak = process.env.SOAK || "http://127.0.0.1:9880/";

const trial = JSON.parse(fs.readFileSync(trialPath, "utf8"));
const body = {
  kind: "cage_litmus_trial",
  ver: "kbatch-cage-litmus-trial-v1",
  source: trial?.trial?.source || "local",
  grade: trial?.trial?.grade,
  score: trial?.trial?.score,
  correct: trial?.trial?.correct,
  total: trial?.trial?.total,
  stoneTrapCaught: trial?.trial?.stoneTrapCaught,
  fictionCaught: trial?.trial?.fictionCaught,
  agent: trial?.trial?.agent,
  t: Date.now(),
  trial,
};

console.log(
  "cage-litmus soak →",
  body.grade,
  (body.score * 100).toFixed(0) + "%",
  "·",
  soak
);

try {
  const r = await fetch(soak, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log("POST", r.status, r.statusText);
} catch (e) {
  console.error("soak bus not reachable (ok if offline):", String(e.message || e));
  process.exitCode = 0;
}
