# Concept mesh · instant multilingual solve

**Status:** live  
**Mesh:** [`/data/concepts/mesh.json`](../data/concepts/mesh.json)  
**MCP:** `kbatch_concept_solve`  
**Runtime:** [`js/concept-solve.js`](../js/concept-solve.js)

## Claim

One **meaning atom** (concept) expands to **many language forms** with:

1. **Instant path geometry** per form (keyboard layout)  
2. **Instant transfer rank** via pure `C` / `langTransferCost` (DOJO-true)  
3. **English gloss** (open curated seed — not OED)  
4. **Honor forms opt-in** (nav / oj / chr educational only)

Geometry · gloss · SO · phon stay **separate streams**.

## Instant agent call

```js
await kbatchDict.mcp("kbatch_concept_solve", {
  q: "liberty",
  from: "en",
  mode: "ready",       // ready | honor | all
  includePaths: true,
})

// HTTP
// POST /api/mcp  tools/call  kbatch_concept_solve
```

### Return (sketch)

```json
{
  "ok": true,
  "instant": true,
  "concept": { "id": "concept:liberty", "gloss_en": "freedom from restraint", "pos": "noun" },
  "forms": [
    { "lang": "en", "form": "liberty", "cFromSource": 0, "path": { "pathLen": 7 } },
    { "lang": "es", "form": "libertad", "cFromSource": 1.8 },
    { "lang": "fr", "form": "liberté", "cFromSource": 3.0 }
  ],
  "transferOrder": ["en", "es", "it", "fr", "de", "…"]
}
```

## Coverage (seed v1)

| Metric | Value |
|--------|------:|
| Concepts | ~170 |
| Form index keys | ~2.8k |
| Languages | 25 (ready + classical + honor seeds) |
| Rubik stair langs | all 13 stand-ins present on core concepts |

Grow with more concepts / Wikidata form links — not bulk commercial dumps.

## UI

- Dual-pane: geometry | open gloss | **world forms** (`dualPaneFullHtml`)  
- `window.__KBATCH_DUAL_PANE_ASYNC__(entry)`  
- `kbatchDict.conceptSolve({ q })`

## Doctrine

| Rule | Meaning |
|------|---------|
| Purity | Never fold gloss into JAX / pure `c` |
| Honor | `mode: "ready"` skips FN seeds unless `includeHonor` |
| License | Curated open educational forms + cite-out |
| Cage | “Universal translator” claims without mesh hit → FICTION |

## Related

- [RUBIK-STAIR-NEXT.md](./RUBIK-STAIR-NEXT.md)  
- [WORLD-PATH-COST-MODEL.md](./WORLD-PATH-COST-MODEL.md)  
- [RESEARCH-LAYER.md](./RESEARCH-LAYER.md)  
