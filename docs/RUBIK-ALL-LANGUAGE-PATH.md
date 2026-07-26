# Path through all language Rubiks

**Status:** shipped · DOJO-true pure `C` (no SO/phon tilde_c)  
**At:** 2026-07-26T01:20:24.798Z  
**Pack:** [`/data/declaration/rubik-all-language-path.json`](../data/declaration/rubik-all-language-path.json)  
**Cost matrix:** n=88 · `cost(a→b)=1 + layout{0|1.2|3.5} + script{0|1.5|4} + family{0|0.8|2.2} + statusBias(b) − parentBonus; ≥0.1`  
**Cubes:** 13 · all have pack stand-ins: true  
**MG session:** `~/.panda/mg-session/rubik-all-path-2026-07-26T0120/`

```js
await kbatchDict.mcp("kbatch_lettergrid_rubik")  // includes tour.summary
const tour = await fetch("/data/declaration/rubik-all-language-path.json").then(r => r.json())
// tour.summary.visitOrderStr · metrics.directHopSumC === 83.5
await kbatchDict.mcp("kbatch_world_path", { from: "en", mode: "ready" })  // 121.6
```

## 1 · Rubik cube cover (primary)

Method: nearest-neighbor from **en**, **2-opt** on direct costs, expand with Dijkstra.

| Metric | Value |
|--------|------:|
| Cube reps visited | 13 |
| Direct hop Σ c | **83.5** |
| Expanded path Σ c | **83.5** |
| MST lower bound (reps) | 76 |
| Expanded steps | 13 |

### Cube → language stand-in

| # | Cube | Family | Lang | Script | Layout | Status |
|---|------|--------|------|--------|--------|--------|
| 1 | pie-germanic-en | Germanic | **en** | Latin | qwerty | ready |
| 2 | latin-romance-es | Romance | **es** | Latin | qwerty | ready |
| 3 | latin-romance-fr | Romance | **fr** | Latin | azerty | ready |
| 4 | latin-romance-it | Romance | **it** | Latin | qwerty | ready |
| 5 | latin-de-contact | Germanic | **de** | Latin | qwertz | ready |
| 6 | norse-en | Germanic | **is** | Latin | qwerty | placeholder |
| 7 | greek-learned | Hellenic | **el** | Greek | greek | ready |
| 8 | arabic-loans | Semitic | **ar** | Arabic | arabic | ready |
| 9 | sanskrit-ia | Indo-Aryan | **hi** | Devanagari | hindi | ready |
| 10 | sinitic | Sinitic | **zh** | Han | qwerty | ready |
| 11 | algic-anishinaabe | Algic | **oj** | Latin | qwerty | honor |
| 12 | iroquoian-tsalagi | Iroquoian | **chr** | Cherokee | qwerty | honor |
| 13 | nadene-dine | Na-Dené | **nav** | Latin | qwerty | honor |

### Visit order (cube reps)

```
en → is → de → fr → it → es → nav → oj → ar → hi → el → zh → chr
```

### Expanded transfer path (shortest paths between hops)

```
en → is → de → fr → it → es → nav → oj → ar → hi → el → zh → chr
```

### Hop table

| From | To | Dijkstra path | Cost |
|------|-----|---------------|-----:|
| en | is | en→is | 3.5 |
| is | de | is→de | 2.2 |
| de | fr | de→fr | 3 |
| fr | it | fr→it | 2.2 |
| it | es | it→es | 1 |
| es | nav | es→nav | 9.2 |
| nav | oj | nav→oj | 7.8 |
| oj | ar | oj→ar | 10.7 |
| ar | hi | ar→hi | 10.7 |
| hi | el | hi→el | 9.3 |
| el | zh | el→zh | 10.7 |
| zh | chr | zh→chr | 13.2 |

## 2 · Family cover (all families in C)

Families: **34** · direct Σ **286.6** · expanded Σ **286.6**

```
en → nl → la → pl → fr → sw → ha → ga → ku → tr → vi → zh → ko → ar → el → hi → ja → th → my → hy → ka → ta → eus → chy → lkt → lut → mus → nav → mri → sme → zul → chr → iku → mn → ain
```

## 3 · All ready packs (greedy NN)

Ready langs: **24** · direct Σ **121.6** · steps **24**

Head: `en → nl → sv → it → pt → ro → es → la → pl → fr → de → sw …`

Tail: `… ar → he → el → hi → sa → ru → ja → th`

## 4 · Precomputed DOJO paths (unchanged engine)
- readyFromEn: steps=23 total=121.6
- portalsFromEn: steps=14

## Math note

- Edge costs = live DOJO `langTransferCost` / matrix C (no SO/phon tilde_c).
- Cube tour ≈ metric TSP on 13 stand-ins; 2-opt improves NN; MST is lower bound.
- Historical stages (pie, ang, la…) map to modern packs when not in C.

## Agent / MG

```js
await kbatchDict.mcp("kbatch_lettergrid_rubik")  // 13 cubes
await kbatchDict.mcp("kbatch_world_path", { from: "en", mode: "ready" })
// full tour JSON: this pack rubik-all-language-path.json
```

**Pack:** /Users/tref/.panda/mg-session/rubik-all-path-2026-07-26T0120