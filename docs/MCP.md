# MCP · LLM / agent surface

**Positioning:** the geometric input layer for the MCP/LLM era — path-first analysis across 15 layouts, with ergonomics metrics agents can call directly.

Live demos: [DOJO](https://kbatch.ugrad.ai/dojo/) · [For AI page](https://kbatch.ugrad.ai/for-ai.html) · [Dictionary](https://kbatch.ugrad.ai/)

## Browser MCP (ships today)

Open the SPA (Dictionary or DOJO). `installGlobalAPI()` registers:

```js
// List tools
kbatchDict.tools

// Analyze any level
kbatchDict.mcp("kbatch_analyze", {
  text: "type once understand everywhere",
  level: "sentence", // letter | word | bigram | sentence | paragraph | caption | blob | document
  layout: "qwerty",
})

// Dictionary word
kbatchDict.mcp("kbatch_lookup", { word: "quantum", layout: "colemak" })

// Live pipe (caption / llm_prompt / jax_tensor …)
kbatchDict.mcp("kbatch_pipe", {
  channel: "llm_prompt",
  payload: "Rewrite with lower strain on QWERTY",
  layout: "qwerty",
})

// JAX feature vectors
kbatchDict.mcp("kbatch_export_jax", { text: "hello world" })

// Letter atom (all layouts)
kbatchDict.mcp("kbatch_letter_atom", { letter: "q" })

// Steno path unit (geometry + flow + optional blank-coin allotment)
kbatchDict.mcp("kbatch_steno_path", { text: "steno path", layout: "qwerty" })

// Pattern matrix × 15 boards
kbatchDict.mcp("kbatch_matrix", {})

// Colossus snapshot
kbatchDict.mcp("kbatch_colossus", { words: ["the", "quantum", "flow"] })

// Shadow ranking across layouts
kbatchDict.mcp("kbatch_shadows", { text: "type once", maxRank: 8 })
kbatchDict.mcp("kbatch_path_rank", { text: "ergonomic", baseLayout: "qwerty", limit: 6 })

// Chart Geometry (async) — 1141 title-path packs 2015–2026
// Full return shape: docs/CHART-LOOKUP-RETURN-SHAPE.md
await kbatchDict.mcp("kbatch_chart_lookup", {
  query: "too sweet hozier",
  matchMode: "exact", // auto | exact | fuzzy
  include: ["path", "musica", "metrics", "rights", "lyricsUpgrade"],
})
// Metadata capsules · flowClass filters
await kbatchDict.chartLookup({ listCapsules: true })
await kbatchDict.chartLookup({ capsule: "chart-flow-dense", limit: 3 })
await kbatchDict.chartLookup({ year: 2024, numberOne: true, limit: 3 })
await kbatchDict.chartLookup({ flowClass: "glide", limit: 3 })
await kbatchDict.chartLookup({ slug: "too-sweet-hozier", exact: true })

// World / Rubik path predict (async) — flow · cadence · divergence
await kbatchDict.mcp("kbatch_world_predict", {
  text: "the qu",
  lang: "en",
  limit: 8,
  // candidates optional — auto-pulls prefix slivers when omitted
})

// GrokYtalkY glyph embeds in steno whitespace (async)
await kbatchDict.mcp("kbatch_glyph_steno", {
  mode: "encode",
  text: "carrier",
  pixels: "10110011…",
  n: 13,
})

// Quantum gutter 0–1 stream from text or pack `bi` binary (async)
await kbatchDict.mcp("kbatch_quantum_binary", {
  text: "print hello",
  binary: "01110001", // optional analyzed pack field bi
})
```

**Data plane (prefer slivers):** catalog `https://data.ugrad.ai/kbatch/funnel.json` · never pull monoletter `analyzed/{a-z}.json` in interactive clients.

Example return shape (abbreviated):

```json
{
  "schema": "kbatch-chart-lookup-v1",
  "tool": "kbatch_chart_lookup",
  "claim": "Chart Geometry Engine — title-path packs…",
  "count": 1,
  "hits": [{
    "slug": "too-sweet-hozier",
    "title": "Too Sweet",
    "artist": "Hozier",
    "year": 2024,
    "peak": 1,
    "flowClass": "balanced",
    "metrics": { "bpm": 149, "key": "C#", "avgStrain": 71, "avgEfficiency": 68 },
    "path": { "text": "Too Sweet\\nHozier\\n…", "source": "title-path" }
  }],
  "contrast": {
    "dense": { "slug": "anxiety-doechii", "bpm": 164 },
    "balanced": { "slug": "too-sweet-hozier", "bpm": 149 },
    "glide": { "slug": "die-with-a-smile-lady-gaga", "bpm": 135 }
  }
}
```

Convenience aliases (same stack):

```js
kbatchDict.analyze(text, { level, layout })
kbatchDict.pipe(channel, payload, { layout })
kbatchDict.letter("q")
kbatchDict.breakdown("quantum")
kbatchDict.matrix()
kbatchDict.colossus(["the", "quantum"])
kbatchDict.chartLookup({ query: "too sweet" }) // async
```

## Tool catalog

| Tool | Purpose |
|------|---------|
| `kbatch_analyze` | Multi-level geometric analysis envelope |
| `kbatch_lookup` | Word / dict card + placements |
| `kbatch_pipe` | Stream channels for LLM caption/prompt loops |
| `kbatch_export_jax` | Training vectors from path metrics |
| `kbatch_letter_atom` | Per-letter multi-layout atom |
| `kbatch_steno_path` | StenoSTRIP / path unit + flow |
| `kbatch_matrix` | Pattern matrix (slots × layouts) |
| `kbatch_colossus` | Full DOJO dump |
| `kbatch_shadows` | 15-layout shadow strings + scores |
| `kbatch_path_rank` | Ranked ergonomic layout alternatives |
| `kbatch_chart_lookup` | World chart geometry packs (title-path · BPM · metrics · async) |

Descriptors: `js/schema.js` → `MCP_TOOLS` · machine manifest: `mcp/manifest.json`

## Claude Desktop / Cursor (integration sketch)

**Today:** open DOJO in a browser tool / computer-use step and evaluate `kbatchDict.mcp(...)`.

**Next (planned Worker host):** remote MCP over HTTPS so Claude Desktop / Cursor can register:

```json
{
  "mcpServers": {
    "kbatch": {
      "url": "https://kbatch.ugrad.ai/mcp",
      "transport": "sse"
    }
  }
}
```

Until the remote host ships, use:

1. `kb serve` → `http://127.0.0.1:8765/dojo/`
2. Agent browser tool or injected script calling `window.kbatchDict`
3. Or import exported JSON/JAX matrices as RAG context

## Why agents care

- **Structured, computable** — not freeform prose; metrics are numbers agents can rank/sort
- **Layout-universal** — one physical path → 15 shadows (a11y + i18n)
- **Ergonomics as a first-class signal** — strain / RSI / travel for suggestion ranking
- **Capsules** — versioned slang/age/region filters over the spelling index
- **Steno path** — compression / blank-coin allotment / rhythm as extra embedding dimensions

## Related

- [ROADMAP-STENO-CAPSULES.md](./ROADMAP-STENO-CAPSULES.md) — next path + capsule work
- [ECOSYSTEM-MAP.md](./ECOSYSTEM-MAP.md) — GlueLam / mesh / Overview
- DOJO: copy MCP tools JSON button
