# Declaration glyph stream → 15-layout cadence projection

**Sources:**  
- Master stream: `/data/declaration/master-glyphs.json` (6235 letters, no spaces)  
- Slot shadows: `js/letter-atom.js` → `geometricGlyphs` / `patternMatrix`  
- Metrics: `analyzeWordOnLayout` / `kbatch_shadows` / `kbatch_path_rank`  
- Helper: `js/declaration-cadence.js`  
- Letter-Grid play: `/labs/declaration-digital-edition/letter-grid.html`

---

## 1. What the master stream is

| Field | Value |
|-------|--------|
| Total glyphs | **6235** |
| Content | A–Z / a–z only (spaces stripped) |
| Order | Engrossed reading order (title → body → close → signatures) |
| Starts | `INCONGRESSJuly…` |
| Grid layers @12×12 | **44** |
| Document lines | L01–L79 (orthogonal to grid layers) |

Compact tuple: `[gi, ch, lineId, kind, wordStart, sentenceStart]`

This is a **linguistic letter stream**, not a stroke path. Cadence treats it as a **typing path** on geometric keyboards.

---

## 2. Two projection modes

### A. Slot-shadow projection (identity remap)

1. Take each Latin letter `ch` in the stream.  
2. Find its **base layout** physical slot (usually QWERTY `patternSlot`).  
3. Read the glyph at that `(r,c)` on every layout in the ring.

```text
stream "T"  →  qwerty slot r0c4
            →  geometricGlyphs:
                 qwerty: t · dvorak: y · colemak: t · azerty: t
                 jcuken: е · korean: ㅅ · … 
```

Implemented as `letterAtom(ch).geometricGlyphs` (see letter-atom doc).

**Use when:** comparing “same fingers, different glyphs” across the 15 boards.

### B. Cadence / metrics projection (path physics)

1. Keep the stream as Latin typing input (or shadow string as a new path).  
2. Run the capsule analyzer on a chosen **base layout**.  
3. Collect efficiency · strain · travel · home-row % · finger balance · BPM-like cadence.  
4. Optionally rank all 15 layouts for that same path (`kbatch_path_rank` / `kbatch_shadows`).

**Use when:** scoring how hard the Declaration is to type on QWERTY vs Colemak vs JCUken, etc.

---

## 3. End-to-end pipeline

```text
master-glyphs.json (6235)
        │
        ▼
letter-only string  "INCONGRESSJulyTheunanimous…"
        │
        ├──────────────► Letter-Grid WebGrid (N×N layers, BPS/NTPM)
        │
        ├──────────────► Slot shadows × 15  (geometricGlyphs)
        │
        └──────────────► Path metrics × 15  (analyze / shadows / path_rank)
                                │
                                ▼
                     Colossus / JAX / training packs
```

### Agent chain

```js
// 1. Pull stream (HTTP or browser)
const g = await kbatchDict.mcp("kbatch_lettergrid_glyphs", {
  range: "0-199",
  format: "string",
});
const text = g.data; // or join array

// 2. Slot shadows + ranked cadence (browser analyzer)
const shadows = await kbatchDict.mcp("kbatch_shadows", {
  text,
  baseLayout: "qwerty",
  limit: 15,
});

// 3. Rank layouts by cost of the same path
const ranked = await kbatchDict.mcp("kbatch_path_rank", {
  text,
  baseLayout: "qwerty",
  limit: 6,
});

// 4. Optional: helper (browser)
import { projectDeclarationCadence } from "/js/declaration-cadence.js";
const pack = await projectDeclarationCadence({
  range: "L01",           // or "0-143" first layer
  baseLayout: "qwerty",
});
// pack.shadows · pack.ranked · pack.metrics · pack.sample
```

### Letter-Grid MCP (stream + play)

```js
await kbatchDict.mcp("kbatch_lettergrid_glyphs", { range: "all", format: "string" })
await kbatchDict.mcp("kbatch_lettergrid_colossus", { depth: "light" })
// Live play still needs letterGrid on the page
```

---

## 4. Helper return shape (`projectDeclarationCadence`)

```json
{
  "schema": "kbatch-declaration-cadence-v1",
  "docId": "declaration-of-independence",
  "range": "0-143",
  "glyphCount": 144,
  "sample": "INCONGRESSJuly…",
  "baseLayout": "qwerty",
  "layouts": ["qwerty", "dvorak", "…"],
  "shadows": {
    "qwerty": "incongressjuly…",
    "dvorak": "cbjrbip.ooh…",
    "jcuken": "штсщтпкуыы…",
    "korean": "ㅑㅜㅊㅐ…"
  },
  "metrics": {
    "efficiency": 3.6,
    "strain": 72.3,
    "keys": 40,
    "…": "…"
  },
  "ranked": [
    { "id": "colemak", "score": "…", "shadow": "…" }
  ],
  "layerHint": {
    "N": 12,
    "layer": 1,
    "cells": 144,
    "note": "First N×N chunk of master stream"
  },
  "urls": {
    "master": "/data/declaration/master-glyphs.json",
    "play": "/labs/declaration-digital-edition/letter-grid.html",
    "pipe": "/labs/declaration-digital-edition/letter-grid-pipe.html"
  }
}
```

---

## 5. What not to confuse

| Thing | Not the same as |
|-------|-----------------|
| Master glyph stream | Stroke / ductus path (use stroke player / paleography for that) |
| Slot shadow of `T` | The letter T existing in Hangul orthography |
| Letter-Grid BPS | Layout efficiency score (different game metric) |
| Document line L01 | Grid layer 1 (line map vs N×N chunk) |

---

## 6. Layer slices for cadence sampling

| Slice | Glyphs (approx) | Good for |
|-------|----------------:|----------|
| `L01` | title letters | tiny smoke |
| `0-143` | first 12×12 layer | one layer cadence |
| `0-1151` | first 8 layers | short bench |
| `all` | 6235 | full-codex (heavy) |

Prefer **layer-sized** samples for interactive agents; full stream for offline training JSONL (`kbatch_lettergrid_export_training`).

---

## 7. Related

- [LETTER-ATOM-AND-LANGUAGE-MATRIX.md](./LETTER-ATOM-AND-LANGUAGE-MATRIX.md) — atom / matrix shapes  
- [WORLD-PATH-COST-MODEL.md](./WORLD-PATH-COST-MODEL.md) — language transfer order  
- [LETTER-GRID-MCP-SHAPES.md](./LETTER-GRID-MCP-SHAPES.md) — Letter-Grid tools  
- [CHART-LOOKUP-RETURN-SHAPE.md](./CHART-LOOKUP-RETURN-SHAPE.md) — music axis twin (title-path packs)  
