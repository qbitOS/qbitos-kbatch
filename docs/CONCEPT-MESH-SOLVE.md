# Concept mesh · instant multilingual solve

**Status:** live  
**Mesh:** [`/data/concepts/mesh.json`](../data/concepts/mesh.json)  
**Stair pack:** [`/data/concepts/stair-instant.json`](../data/concepts/stair-instant.json)  
**MCP:** `kbatch_concept_solve` · `kbatch_concept_stair_walk`  
**Runtime:** [`js/concept-solve.js`](../js/concept-solve.js)

## Claim

One **meaning atom** (concept) expands to **many language forms** with:

1. **Instant path geometry** per form (keyboard layout)  
2. **Instant transfer rank** via pure `C` / `langTransferCost` (DOJO-true)  
3. **English gloss** (open curated seed — not OED)  
4. **Honor forms opt-in** (nav / oj / chr educational only)  
5. **`mode: "stair"`** — full **all-13 Rubik order** with missing steps flagged (instant across all languages on the tour)

Geometry · gloss · SO · phon stay **separate streams**.

## Instant agent call

```js
// Rank by pure C (default ready pack)
await kbatchDict.mcp("kbatch_concept_solve", {
  q: "liberty",
  from: "en",
  mode: "ready",       // ready | honor | all | stair
  includePaths: true,
})

// Instant all-language along Rubik stair (en→…→chr)
await kbatchDict.mcp("kbatch_concept_solve", {
  q: "liberty",
  from: "en",
  mode: "stair",
})
// → { stair: [{n,lang,form,missing,cFromSource}…], filled, of: 13, fillPct }

// Multi-concept walk
await kbatchDict.mcp("kbatch_concept_stair_walk", {
  concepts: ["liberty", "water", "path", "language"],
})

// HTTP
// POST /api/mcp  tools/call  kbatch_concept_solve | kbatch_concept_stair_walk
```

### Return (sketch · mode=stair)

```json
{
  "ok": true,
  "instant": true,
  "allLanguage": true,
  "mode": "stair",
  "concept": { "id": "concept:liberty", "gloss_en": "freedom from restraint" },
  "stair": [
    { "n": 1, "lang": "en", "form": "liberty", "missing": false, "cFromSource": 0 },
    { "n": 7, "lang": "nav", "form": "…", "missing": false, "status": "honor-seed" },
    { "n": 13, "lang": "chr", "form": "uwenvsv", "missing": false }
  ],
  "filled": 13,
  "of": 13,
  "fillPct": 100
}
```

## Coverage

| Metric | Value |
|--------|------:|
| Concepts | ~178 |
| Form index keys | ~3k+ |
| Languages | 25 (ready + classical + honor seeds) |
| Rubik stair | 13 stand-ins; densify with `scripts/densify-stair-concepts.py` |

Core demos (water, path, language, liberty, sun, earth, …) target **13/13** stair fill.  
Honor gaps elsewhere = educational fill remaining — not errors.

## UI

- Dual-pane: geometry | open gloss | **world forms** (`dualPaneFullHtml`)  
- Stair chips when `mode: "stair"` (`conceptSolveHtml`)  
- `kbatchDict.conceptSolve({ q, mode: "stair" })`  
- `kbatchDict.conceptStairWalk({ concepts })`

## Doctrine

| Rule | Meaning |
|------|---------|
| Purity | Never fold gloss into JAX / pure `c` |
| Honor | `mode: "ready"` skips FN seeds unless `includeHonor` |
| Stair | `mode: "stair"` always includes honor langs; missing = gap |
| License | Curated open educational forms + cite-out |
| Cage | “Universal translator” claims without mesh hit → FICTION |

## Related

- [RUBIK-STAIR-NEXT.md](./RUBIK-STAIR-NEXT.md)  
- [WORLD-PATH-COST-MODEL.md](./WORLD-PATH-COST-MODEL.md)  
- [RESEARCH-LAYER.md](./RESEARCH-LAYER.md)  
