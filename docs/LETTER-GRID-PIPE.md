# Letter-Grid · Grok / Dojo / Colossus pipe

**Live play:** https://kbatch.ugrad.ai/labs/declaration-digital-edition/letter-grid  
**Pipe harness:** `/labs/declaration-digital-edition/letter-grid-pipe.html`  
**Master glyphs JSON:** `/data/declaration/master-glyphs.json` (6235 glyphs · 44 layers @ 12×12)  
**Engine:** `declaration-letter-grid-v8-pipe` · globals `__letterGridApi` · `letterGrid` · `__mgLetterGridApi`

## Rating (after v8-pipe)

| Aspect | Before | After v8 |
|--------|--------|----------|
| Discoverability | 8 | **9** — named surface + pipe page |
| Agent surface | 7 | **9** — getState / nextGlyph / playRound |
| Colossus snapshot | 6.5 | **9** — `exportColossus()` one shot |
| Grok friction | 7 | **8.5** — headless pipe HTML + static JSON |
| Data richness | 8.5 | **9** — master JSON + layer clears |
| Observability | 7 | **8.5** — layer-clear events + pipeLog |
| **Overall** | **7.5** | **~9 / 10** |

## Browser console (Colossus-friendly)

```js
/* after letter-grid.html loads */
const G = letterGrid; // or __letterGridApi

G.getState();
// → { ver, N, timer, bps, ntpm, masterPos, layer, layers, next: { ch, gi, cell }, … }

G.setDojoMode(true);           // no 70s timer
G.nextGlyph();                 // step one correct target · returns { ok, glyph, state }
G.playRound({ size: 12, speed: 60 }); // 70s agent (Promise)
G.exportColossus();            // layer + sequence + score + clears
G.masterGlyphs();              // full 6235 compact array
```

### Headless URL modes (pipe harness)

| URL | Behavior |
|-----|----------|
| `letter-grid-pipe.html?mode=smoke` | Dojo + 32 steps + Colossus (no glyph dump) |
| `letter-grid-pipe.html?mode=dojo&steps=100` | Step N glyphs · export |
| `letter-grid-pipe.html?mode=export` | Colossus snapshot only |
| `letter-grid-pipe.html?mode=round&hop=120` | Full 70s agent round |
| `letter-grid.html?autotest=1&hop=120` | Legacy timed agent |

Events: `letter-grid-next-glyph` · `letter-grid-layer-clear` · `letter-grid-colossus-export` · `kbatch-declaration-round-end`

---

## MCP tool shapes (draft for parent KBatch MCP)

Add alongside `kbatch_colossus` / `kbatch_letter_atom`. HTTP MCP can serve static master JSON immediately; live step needs browser MCP or a session bridge.

### `kbatch_letter_grid_state`

```json
{
  "name": "kbatch_letter_grid_state",
  "description": "Snapshot live Letter-Grid session (or static readiness if no browser session).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": { "type": "string", "description": "Optional browser/Dojo session" }
    }
  },
  "output": {
    "schema": "kbatch-letter-grid-colossus-v1 score slice",
    "fields": ["ver", "N", "masterPos", "masterTotal", "layer", "layers", "bps", "ntpm", "next"]
  }
}
```

### `kbatch_letter_grid_step`

```json
{
  "name": "kbatch_letter_grid_step",
  "description": "Dojo step: advance one correct glyph; returns glyph + full state.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": { "type": "string" },
      "count": { "type": "integer", "default": 1, "minimum": 1, "maximum": 512 }
    }
  },
  "mapsTo": "letterGrid.nextGlyph() × count"
}
```

### `kbatch_letter_grid_play`

```json
{
  "name": "kbatch_letter_grid_play",
  "description": "Run a timed or open agent round on Letter-Grid.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "size": { "type": "integer", "enum": [8, 12, 16], "default": 12 },
      "speed": { "type": "integer", "default": 120, "description": "hop ms" },
      "timed": { "type": "boolean", "default": true },
      "roundS": { "type": "integer", "default": 70 },
      "maxHits": { "type": "integer" }
    }
  },
  "mapsTo": "letterGrid.playRound({ size, speed, timed, roundS, maxHits })"
}
```

### `kbatch_letter_grid_export`

```json
{
  "name": "kbatch_letter_grid_export",
  "description": "One-shot Colossus export: layer clears + hit sequence + score (+ optional master glyphs).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "includeGlyphs": { "type": "boolean", "default": false },
      "compact": { "type": "boolean", "default": true },
      "hitLimit": { "type": "integer", "default": 2000 }
    }
  },
  "mapsTo": "letterGrid.exportColossus(opts)",
  "schema": "kbatch-letter-grid-colossus-v1"
}
```

### `kbatch_letter_grid_master`

```json
{
  "name": "kbatch_letter_grid_master",
  "description": "Pull Declaration master glyph stream (6235) for Colossus / letter_atom.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "source": {
        "type": "string",
        "enum": ["static", "live"],
        "default": "static"
      }
    }
  },
  "staticUrl": "https://kbatch.ugrad.ai/data/declaration/master-glyphs.json",
  "schema": "kbatch-letter-grid-master-v1",
  "glyphSchema": ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart"]
}
```

### Resource

```
kbatch://letter-grid/master
kbatch://letter-grid/colossus
```

---

## Colossus pack shape (`exportColossus`)

```json
{
  "schema": "kbatch-letter-grid-colossus-v1",
  "ver": "declaration-letter-grid-v8-pipe",
  "master": { "total": 6235, "pos": 32, "remaining": 6203, "glyphs": null },
  "layer": { "current": 1, "total": 44, "cells": 144, "clears": [/* … */] },
  "stair": [/* S0–S7 unlocks */],
  "score": { "bps": 12.3, "ntpm": 100, "next": { "ch": "T", "gi": 32 } },
  "sequence": [/* recent hits */],
  "pipeLog": [/* nextGlyph + layer-clear events */],
  "report": null
}
```

## Wire-up order

1. **Done in browser (v8-pipe):** API + pipe harness + static master JSON  
2. **HTTP MCP:** proxy `kbatch_letter_grid_master` → `master-glyphs.json`  
3. **Browser MCP / Dojo session:** `step` / `play` / `export` against live `letterGrid`  
4. **Colossus:** ingest `kbatch-letter-grid-colossus-v1` into existing colossus axes

---

See also: [LETTER-GRID-MCP-SHAPES.md](./LETTER-GRID-MCP-SHAPES.md) — draft shapes checked + implemented.

