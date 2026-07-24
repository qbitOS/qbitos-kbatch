# DOJO geometry deep · 15 layouts · letter atoms · chart packs

Companion to Letter-Grid / Cage. Path stays constant; **shadows** change with layout.

## The 15 layouts (`LAYOUT_RING_ORDER`)

| # | id | Name | Script | Region / note |
|---|-----|------|--------|----------------|
| 1 | `qwerty` | QWERTY | Latin | US/International · base |
| 2 | `dvorak` | Dvorak | Latin | US |
| 3 | `colemak` | Colemak | Latin | US |
| 4 | `azerty` | AZERTY | Latin | France |
| 5 | `qwertz` | QWERTZ | Latin | Germany |
| 6 | `turkish_f` | Turkish-F | Latin | Türkiye |
| 7 | `vietnamese` | Vietnamese | Latin | VN |
| 8 | `japanese` | JIS Romaji | Latin/Kana | Japan |
| 9 | `jcuken` | ЙЦУКЕН | Cyrillic | Russia |
| 10 | `greek` | Greek | Greek | GR |
| 11 | `hebrew` | Hebrew | Hebrew | RTL |
| 12 | `arabic` | Arabic | Arabic | MENA · RTL |
| 13 | `hindi` | Hindi | Devanagari | IN |
| 14 | `thai` | Thai | Thai | TH |
| 15 | `korean` | Hangul 2-set | Hangul | KR |

Source of truth: `js/layouts.js` · `data/layout-ring.json` · MCP `kbatch_matrix`.

### Concepts

| Term | Meaning |
|------|---------|
| **Path** | Layout-agnostic finger trajectory (steno path unit) |
| **Shadow** | That path projected onto one board (glyph string + scores) |
| **Pattern matrix** | Physical slots × 15 layouts |
| **Letter atom** | One grapheme’s multi-layout dossier |

## Letter-atom payload shape

`kbatchDict.letter("q")` · `await kbatchDict.mcp("kbatch_letter_atom", { letter: "q" })`

```ts
interface LetterAtom {
  letter: string;          // lowercase when Latin
  upper: string;
  display: string;
  codepoint: number;
  unicode: string;         // "U+0071"
  presentCount: number;    // how many of 15 boards have this glyph
  layoutCount: 15;
  encodings: {
    braille: string;
    morse: string;
    nato: string;
    asl: string;
    bsl: string;
  };
  placements: Record<LayoutId, {
    layoutId: string;
    present: boolean;
    r: number; c: number;  // row/col on that board
    finger?: string;
    home?: boolean;
    rowName?: string;
    patternSlot?: string;  // "r1c0"
  }>;
  geometricGlyphs: Record<LayoutId, string>; // same physical slot → glyph per layout
  patternSlot: string | null;                // base layout slot
  baseLayout: string;                        // usually "qwerty"
  finger: string | null;
  home: boolean;
  neighbors: Record<"N"|"S"|"E"|"W"|"NE"|"NW"|"SE"|"SW", NeighborCell | null>;
  analysis: { strip; metrics; modes } | null;
  senses: unknown[];
  refs: { oed?: string; /* … */ };
}
```

**Neighbor cell:** `{ r, c, qwerty, patternSlot, glyphs: Record<LayoutId, string> }`

## Chart-geometry packs (reuse path/shadow)

| Surface | Role |
|---------|------|
| **1141 chart packs** | Title-path metrics (BPM, strain, shadows) for chart hits |
| `kbatch_chart_lookup` | Search packs by query/slug; list capsules |
| Capsules | Ladder 0–7 curated sets over chart geometry |
| Doctrine | **Title-path only** unless PD/cited lyrics |

Flow:

```
title string
  → analyze / steno path (same engine as dictionary words)
  → shadows on 15 layouts
  → strain / efficiency / BPM pack fields
  → Colossus / export_jax if training
```

Chart packs do **not** invent commercial lyrics bodies; they store geometric path features of titles (+ optional PD seeds).

### Agent entry

```js
await kbatchDict.mcp("kbatch_chart_lookup", { query: "too sweet hozier", limit: 5 })
await kbatchDict.mcp("kbatch_chart_lookup", { listCapsules: true })
await kbatchDict.mcp("kbatch_steno_path", { text: "quantum" })
await kbatchDict.mcp("kbatch_shadows", { text: "quantum", maxRank: 8 })
await kbatchDict.mcp("kbatch_path_rank", { text: "quantum", baseLayout: "qwerty", limit: 6 })
await kbatchDict.mcp("kbatch_letter_atom", { letter: "q" })
kbatchDict.matrix()  // full pattern matrix (browser)
```

## Compose with Declaration Letter-Grid

1. Pull stream: `kbatch_lettergrid_glyphs` / training JSONL  
2. For a slice of glyphs as text: `kbatch_steno_path` + `kbatch_shadows` + `kbatch_path_rank`  
3. Epistemic claims: `kbatch_cage_litmus_*`  
4. Object facts: `paleography.json` + RAW+STONE doctrine  

That is the full Grok → Dojo geometry → Colossus → archive chain.
