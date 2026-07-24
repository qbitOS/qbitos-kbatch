# Precomputed world-path cost matrix

**Schema:** `kbatch-world-path-cost-matrix-v1`  
**File:** `/data/world-path/cost-matrix.json`  
**Generator:** `node scripts/build-world-path-cost-matrix.mjs`  
**Live cost fn:** `js/world-path.js` → `langTransferCost`

Companion: `/data/world-path/portal-subgraph.json` (`kbatch-world-path-portal-subgraph-v1`)

---

## Schema

```json
{
  "schema": "kbatch-world-path-cost-matrix-v1",
  "generated": "ISO-8601",
  "engine": "kbatch-world-path-v1",
  "formula": "cost(a→b)=1 + layout + script + family + statusBias − parentBonus; ≥0.1",
  "n": 88,
  "ids": ["en", "fr", "…"],
  "index": { "en": 0, "fr": 1 },
  "langs": [
    {
      "id": "en",
      "label": "English",
      "script": "Latin",
      "family": "Germanic",
      "layout": "qwerty",
      "status": "ready",
      "tier": "mother",
      "parent": null,
      "dir": "ltr"
    }
  ],
  "matrix": [[0, 3.0, 9.3, "…"]],
  "sparse": {
    "edgeMax": 6.5,
    "edgeCount": N,
    "edges": [{ "from": "en", "to": "fr", "cost": 3.0 }]
  },
  "examples": { "en→fr": 3.0, "en→ru": 9.3 },
  "paths": {
    "readyFromEn": { "stepCount": 23, "totalTransferCost": 121.6, "steps": [] },
    "portalsFromEn": { "stepCount": 14, "steps": [] }
  }
}
```

### Indexing

```text
cost(a → b) = matrix[ index[a] ][ index[b] ]
```

### Sparse edges

All pairs with `cost ≤ edgeMax` (default **6.5**) for Dijkstra when a direct jump is expensive.

### Portal subgraph

```json
{
  "schema": "kbatch-world-path-portal-subgraph-v1",
  "scriptPortals": { "Latin": "en", "Cyrillic": "ru", "…" },
  "portals": [{ "script": "Cyrillic", "langId": "ru", "status": "ready", "role": "portal" }],
  "edges": [{ "from": "en", "to": "ru", "fromScript": "Latin", "toScript": "Cyrillic", "cost": 9.3 }]
}
```

---

## Agent pipeline (sped-up)

```text
1. Load cost-matrix.json + portal-subgraph.json     (static)
2. Load calibration/probe-set.json                 (static)
3. On jump a→b:
     c ← matrix[i_a][i_b]
     if c large: Dijkstra on sparse/portal edges
4. Optional SO prefilter (probe-set soDistance)
5. Live: kbatch_shadows / path_rank only when needed
6. calibrate_check → recalibrate on drift
```

```js
// Browser still has live recompute:
await kbatchDict.mcp("kbatch_world_path", { from: "en", mode: "ready" })
// Static matrix (fetch):
const C = await fetch("/data/world-path/cost-matrix.json").then((r) => r.json())
const i = C.index["en"], j = C.index["ru"]
console.log(C.matrix[i][j]) // ~9.3
```

---

## Formula reference

See [WORLD-PATH-COST-MODEL.md](./WORLD-PATH-COST-MODEL.md).

| Component | Values |
|-----------|--------|
| layout | same 0 · latin_family 1.2 · different 3.5 |
| script | same 0 · cluster 1.5 · else 4 |
| family | same 0 · cluster 0.8 · else 2.2 |
| statusBias(b) | ready 0 · placeholder 2.5 · honor 6 |
| parent | −0.5 |

---

## Rebuild

```bash
node scripts/build-world-path-cost-matrix.mjs
node scripts/build-calibration-probes.mjs
```
