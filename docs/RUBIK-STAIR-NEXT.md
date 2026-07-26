# Rubik stair · next steps through the dictionary

**Status:** live iteration pack · pure `C` (DOJO-true)  
**Stair JSON:** [`/data/world-path/rubik-stair-next.json`](../data/world-path/rubik-stair-next.json)  
**Tour:** [`/data/declaration/rubik-all-language-path.json`](../data/declaration/rubik-all-language-path.json) · Σc **83.5**  
**Bind:** [`letter-grid-rubik.json`](../data/declaration/letter-grid-rubik.json) pathways now carry `tourStep` · `repLang` · `samplePhrase`

## Claim

Use the **all-13 Rubik mathematical path** as a **dictionary iteration order** — not just a TSP demo. Each stand-in is a cube Focus + word pack + path samples + explicit next cuts.

```
en → is → de → fr → it → es → nav → oj → ar → hi → el → zh → chr
```

## Phases (forward)

| Phase | Focus | Σc (hops) | Doctrine |
|-------|--------|-----------|----------|
| **A** Latin ready cluster | en·is·de·fr·it·es | ~11.9 | Cheap layout hops; full packs |
| **B** Honor opt-in | nav·oj·chr | ~30.2 | Educational seeds only; community gate |
| **C** Script portals | ar·hi·el·zh | ~41.4 | Cost bill; museum + JAX layouts |
| **D** Dictionary depth | all | — | Research, is→ready audit, Colossus EN |
| **E** Agent + MG | — | — | Stair MCP · beats · Cage · DOJO ready 121.6 |

## Per-step snapshot

| # | Lang | Status | Pack forms (approx) | +c | Cube |
|---|------|--------|---------------------|---:|------|
| 1 | en | ready | 1.69M-class | — | pie-germanic-en |
| 2 | is | placeholder* | ~256k | 3.5 | norse-en |
| 3 | de | ready | ~1.16M | 2.2 | latin-de-contact |
| 4 | fr | ready | ~835k | 3.0 | latin-romance-fr |
| 5 | it | ready | ~798k | 2.2 | latin-romance-it |
| 6 | es | ready | ~1.20M | 1.0 | latin-romance-es |
| 7 | nav | honor | **70 seed** | 9.2 | nadene-dine |
| 8 | oj | honor | **70 seed** | 7.8 | algic-anishinaabe |
| 9 | ar | ready | ~2.5M | 10.7 | arabic-loans |
| 10 | hi | ready | ~21k | 10.7 | sanskrit-ia |
| 11 | el | ready | ~1.49M | 9.3 | greek-learned |
| 12 | zh | ready | ~767k | 10.7 | sinitic |
| 13 | chr | honor | **60 seed** | 13.2 | iroquoian-tsalagi |

\*Icelandic has a large open pack on disk; catalog status is still `placeholder` — **promotion candidate** after quality audit.

Honor seeds refreshed: `npm run` / `node scripts/grow-multilang.mjs --lang=nav,oj,chr --offline`.

## Immediate next cuts (concrete)

1. **Phase A drills** — path sample phrases on each Romance/Germanic layout; Codex Regius for `is`  
2. **is status audit** — if pack quality OK, rebuild cost matrix status `placeholder`→`ready` and re-run tour  
3. **Phase B** — honor opt-in UI only; learn skills `acc_fn_*`; never bulk scrape  
4. **Phase C** — museum kits + JAX rank for ar/hi/el/zh boards  
5. **Parallel** — MG unsolved-manuscripts batch (Voynich et al.) does **not** block stair  
6. **Parallel** — Letter-Grid 6235 + Cage stay motor/epistemic rails  
7. **Agents** — `tilde_c` experiments offline only; DOJO Fastest path stays pure `c`

## Agent / MG

```js
const stair = await fetch("/data/world-path/rubik-stair-next.json").then(r => r.json())
// stair.steps[i].samplePhrases · nextCuts · wordPackTotal · dictionary.pathUrl

await kbatchDict.mcp("kbatch_lettergrid_rubik")  // pathways + tour (+ stair urls)
await kbatchDict.mcp("kbatch_world_path", { from: "en", mode: "ready" })

// MG: for each phase → path samples → exportStoryBeats → living-books paste
```

Capsules: `data/capsules/packs/rubik-stair.json` · `caps.rubik.stair.{lang}`

## Related

- [RUBIK-ALL-LANGUAGE-PATH.md](./RUBIK-ALL-LANGUAGE-PATH.md)  
- [SHADOW-RUBIK-LETTER-GRID.md](./SHADOW-RUBIK-LETTER-GRID.md)  
- [WORLD-PATH-COST-MODEL.md](./WORLD-PATH-COST-MODEL.md)  
- [UNSOLVED-MANUSCRIPTS-MG.md](./UNSOLVED-MANUSCRIPTS-MG.md)  
- [NEXT-HURDLE.md](./NEXT-HURDLE.md)  
