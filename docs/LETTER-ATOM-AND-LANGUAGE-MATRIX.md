# Letter-atom + language×alphabet matrix — exact shapes

**Sources:**  
- `js/letter-atom.js` — letter atoms + pattern matrix  
- `js/language-alphabet-matrix.js` — 88-language alphabet atlas  
- `data/language-alphabet-matrix.json` — static export  
- MCP: `kbatch_letter_atom` · `kbatch_matrix`

---

## 1. Letter atom (`kbatch_letter_atom`)

```js
await kbatchDict.mcp("kbatch_letter_atom", { letter: "q" })
// or kbatchDict.letter("q")
```

### Return shape

```json
{
  "letter": "q",
  "upper": "Q",
  "display": "q",
  "codepoint": 113,
  "unicode": "U+0071",
  "presentCount": 7,
  "layoutCount": 15,
  "encodings": {
    "braille": "⠟",
    "morse": "--.-",
    "nato": "Quebec",
    "asl": "Q:G-down",
    "bsl": "Q:flat hand down,thumb out"
  },
  "placements": {
    "qwerty": {
      "layoutId": "qwerty",
      "name": "QWERTY",
      "script": "Latin",
      "region": "US/International",
      "present": true,
      "r": 0,
      "c": 0,
      "key": "q",
      "finger": "L-Pinky",
      "fingerShort": "LP",
      "home": false,
      "rowName": "top",
      "patternSlot": "r0c0"
    },
    "jcuken": {
      "layoutId": "jcuken",
      "present": false,
      "r": null,
      "c": null
    }
  },
  "geometricGlyphs": {
    "qwerty": "q",
    "dvorak": "`",
    "colemak": "q",
    "azerty": "a",
    "qwertz": "q",
    "jcuken": "й",
    "korean": "ㅂ",
    "japanese": "q",
    "arabic": "ض",
    "hindi": "ौ",
    "hebrew": "/",
    "greek": ";",
    "thai": "ๆ",
    "turkish_f": "f",
    "vietnamese": "q"
  },
  "patternSlot": "r0c0",
  "baseLayout": "qwerty",
  "finger": "L-Pinky",
  "home": false,
  "neighbors": {
    "N": null,
    "S": { "r": 1, "c": 0, "qwerty": "a", "patternSlot": "r1c0", "glyphs": { "/* 15 */": "…" } },
    "E": { "…": "…" },
    "W": null,
    "NE": null, "NW": null, "SE": null, "SW": null
  },
  "analysis": {
    "strip": "…",
    "metrics": { "efficiency": "…", "strain": "…", "keys": 1 },
    "modes": { "heatmap": "…", "finger": "…" }
  },
  "senses": [],
  "etymology": null,
  "refs": {
    "oed": "https://www.oed.com/search/dictionary/?q=q",
    "wiki": "https://en.wikipedia.org/wiki/Q",
    "wiktionary": "https://en.wiktionary.org/wiki/q",
    "grokipedia": null
  }
}
```

### Two different notions of “where is Q?”

| Field | Meaning |
|-------|---------|
| **`placements[id].present`** | Does this **character** exist as a key label on that layout? (Latin `q` is absent on pure Cyrillic identity maps.) |
| **`geometricGlyphs[id]`** | Glyph sitting on the **same physical slot** as base layout (slot shadow). Typing the QWERTY Q-key fires `й` on JCUken, `ㅂ` on Hangul 2-set, etc. |

Cadence / Declaration projection uses **geometricGlyphs** (slot shadows).  
Linguistic presence uses **placements.present**.

### Pattern matrix (`kbatch_matrix`)

```js
await kbatchDict.mcp("kbatch_matrix", { layout: "qwerty" })
```

```json
{
  "schema": "…",
  "layout": "qwerty",
  "layouts": ["qwerty","dvorak",/* …15 */],
  "matrix": {
    "r0c0": {
      "qwerty": "q",
      "dvorak": "`",
      "jcuken": "й",
      "korean": "ㅂ",
      "_meta": {
        "r": 0, "c": 0,
        "finger": "L-Pinky",
        "fingerShort": "LP",
        "rowName": "top",
        "baseKey": "q",
        "baseLayout": "qwerty",
        "home": false
      }
    }
  }
}
```

Every physical slot `(r,c)` → glyph on each of 15 boards. Home row tinted in DOJO UI.

---

## 2. Language×alphabet matrix row

**88 languages** (catalog) × traditional grapheme lists.  
Not the same as the 15-layout pattern matrix — this is the **linguistic alphabet atlas**.

```js
// Browser DOJO builds live; static export:
// data/language-alphabet-matrix.json
```

### Row shape (`languageAlphabetRow`)

```json
{
  "id": "en",
  "label": "English",
  "nativeName": "English",
  "family": "Germanic",
  "script": "Latin",
  "dir": "ltr",
  "layout": "qwerty",
  "layoutName": "QWERTY",
  "region": "Global / US-UK",
  "tier": "mother",
  "status": "ready",
  "alphabet": ["A","B","C", "…", "Z"],
  "length": 26,
  "sample": "A B C D E F G H I J K L",
  "alphabetStr": "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z"
}
```

### Full matrix package (`buildLanguageAlphabetMatrix`)

```json
{
  "schema": "kbatch-language-alphabet-matrix-v1",
  "totalLanguages": 88,
  "maxAlphabetLength": N,
  "layouts": 15,
  "byScript": { "Latin": 40, "Cyrillic": 6, "…": "…" },
  "byTier": { "mother": 1, "world": "…", "…": "…" },
  "byFamily": { "…": "…" },
  "rows": [ /* languageAlphabetRow[] */ ],
  "grid": [
    {
      "id": "en",
      "nativeName": "English",
      "script": "Latin",
      "dir": "ltr",
      "tier": "mother",
      "family": "Germanic",
      "layout": "qwerty",
      "cells": ["A","B",/* padded to maxLen */]
    }
  ],
  "note": "Master atlas of 88 catalog languages…"
}
```

### Alphabet resolution order

1. `LANG_ALPHABET_OVERRIDES[langId]` (diacritics, FN orthographies, classical, …)  
2. Else `SCRIPT_ALPHABET_ATLAS[script]`  
3. Else Latin A–Z  

**Geometry path mapping** still uses `row.layout` → one of the 15 boards.

### Russian example (head)

```text
alphabet: А Б В Г Д Е Ё Ж З И Й К …  (length 33)
layout: jcuken · script: Cyrillic · status: ready
```

---

## 3. How agents should use both

```js
// 1) Physical identity of a Latin letter
const atom = await kbatchDict.mcp("kbatch_letter_atom", { letter: "t" });
// atom.patternSlot · atom.geometricGlyphs · atom.finger

// 2) Full slot table
const { matrix, layouts } = await kbatchDict.mcp("kbatch_matrix");

// 3) Linguistic alphabet for a pack
// (export from DOJO or static JSON)
// row for "hi" → Devanagari graphemes + layout hindi
```

**Rule of thumb**

- **Type / cadence / shadows** → letter atom + pattern matrix (15 boards)  
- **What letters exist in a language** → language×alphabet row (88 langs)  
- **What order to learn languages** → world-path cost model  

---

## 4. Related

- [WORLD-PATH-COST-MODEL.md](./WORLD-PATH-COST-MODEL.md)  
- [DECLARATION-CADENCE-PROJECTION.md](./DECLARATION-CADENCE-PROJECTION.md)  
- DOJO UI: `#pattern-matrix` · `#lang-alpha-matrix` · letter atom grid  
