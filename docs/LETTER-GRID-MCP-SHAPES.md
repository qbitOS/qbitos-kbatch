# Letter-Grid MCP shapes · v8-pipe + paleography + finale

**Status:** implemented (browser MCP + HTTP static) · engine `declaration-letter-grid-v8-pipe`  
**Registration order:** state → glyphs → step → play_round → layer → **colossus** → next_glyph → export_training → **finale**

## Alignment matrix

| Tool | Engine | HTTP MCP | Browser MCP | Notes |
|------|--------|----------|-------------|-------|
| `kbatch_lettergrid_state` | `mcpState` / `getState` | Static lobby | Live | timer, BPS, layer, nextGlyph |
| `kbatch_lettergrid_step` | `nextGlyph` / burst / skip / reset | live_session_required | Live | `action`: next \| play \| reset \| skip-layer |
| `kbatch_lettergrid_play_round` | `playRound` | dryRun | Live 70s | gridSize · speedMs |
| `kbatch_lettergrid_glyphs` | `masterGlyphs` + static JSON | Full 6235 | Live/static | range: `0-99` \| `L01` \| kind \| `all` |
| `kbatch_lettergrid_layer` | jump / skip / gridLayerMap | get only | get \| jump \| clear | **Grid** layers 1–44 @12×12 |
| `kbatch_lettergrid_colossus` | `exportColossusDraft` | light/full/training | Live + static | + paleography capsule + `paleographyDoc` |
| `kbatch_lettergrid_next_glyph` | peek next | Static master[0] | Live | Does **not** advance |
| `kbatch_lettergrid_export_training` | `exportTraining` | Full static | Live/static | `json` \| **`jsonl`** \| `jax` · `include` fields |
| `kbatch_lettergrid_finale` | `exportFinale` | Static spiral path | Live path + scores | After layers clear |

## Two “layer” concepts

1. **Grid layer** 1–44 — N×N chunks of the 6235 master stream (`kbatch_lettergrid_layer`, `gridLayerMap`).
2. **Document line** L01–L79 — engrossed lines (`layerMap` in Colossus).

## Master stream

- **Letters only** (no spaces): 6235 glyphs, starts `INCONGRESSJuly…`.
- Schema: `kbatch-letter-grid-master-v1` · file `/data/declaration/master-glyphs.json`.

## Paleography (NARA-aware)

Static file: **`/data/declaration/paleography.json`** (`kbatch-declaration-paleography-v1`).

`kbatch_lettergrid_colossus` returns:

- `paleography` — compact capsule (scribe, ink, support, notes, …)
- `paleographyDoc` — full NARA doc when file is deployed
- `paleographyUrl` — `/data/declaration/paleography.json`

Agents can pull paleography without a live session.

## Training JSONL

```js
await kbatchDict.mcp("kbatch_lettergrid_export_training", {
  format: "jsonl",
  include: ["gi", "ch", "lineId", "kind", "wordStart", "sentenceStart", "layer"],
});
```

Example lines:

```json
{"gi":0,"ch":"I","lineId":"L01","kind":"title","wordStart":1,"sentenceStart":1,"layer":1}
{"gi":1,"ch":"N","lineId":"L01","kind":"title","wordStart":0,"sentenceStart":0,"layer":1}
```

## Finale

```js
await kbatchDict.mcp("kbatch_lettergrid_finale", { includePath: true, includeScores: true })
// or letterGrid.exportFinale()
```

Static HTTP returns the deterministic spiral path for N (same algorithm as the board). Live scores require a session after codex clear.

## TypeScript

See **`js/letter-grid-mcp.d.ts`** (`KBatch.LetterGridState`, `ColossusPack`, `PaleographyDoc`, `FinaleReport`, …).

## Agent prompt

See **`docs/LETTER-GRID-AGENT-PROMPT.md`**.

## Formal glossary

| Term | Definition |
|------|------------|
| **Master glyph** | Single letter from the Declaration stream (spaces removed). 6235 total, `gi` 0…6234. |
| **Grid layer** | One N×N chunk of the master stream (44 @ 12×12, 98 @ 8×8, 25 @ 16×16). |
| **Document line (L01–L79)** | Engrossed text lines; orthogonal to grid layers. |
| **Letter-Grid** | Interactive N×N WebGrid under 70s timer with BPS / NTPM. |
| **Dojo mode** | Agent stepping (`setDojoMode(true)` / `action:"next"`). |
| **Colossus pack** | One-shot snapshot `kbatch-letter-grid-colossus-v1`. |
| **Finale path** | Wandering path + peak report after all grid layers cleared. |
| **Paleography capsule** | NARA-aware physical object metadata. |
| **Pipe (v8-pipe)** | Agent API: `getState`, `nextGlyph`, `playRound`, `exportColossus`, `exportFinale`, `masterGlyphs` + MCP tools. |

## NARA methods (digital edition)

| Method | Description | Digital edition use |
|--------|-------------|---------------------|
| Engrossed copy | Official signed parchment (Timothy Matlack) | Source of master glyph stream + visual restorations |
| Public-domain imaging | NARA high-res scans + Stone 1823 | Base images for treatments |
| Official transcript | NARA authoritative text | Ground truth for OCR / reconstruction |
| Conservation housing | Argon-filled case | Context for heavy fading |
| Light-damage documentation | Iron-gall fading reports | Why digital restoration + letter-only stream |
| Multi-spectral potential | Advanced imaging | Future higher-fidelity glyph recovery |

## Files

| Path | Role |
|------|------|
| `js/letter-grid-mcp.js` | Browser tool dispatcher |
| `js/letter-grid-mcp.d.ts` | TypeScript surfaces |
| `js/schema.js` | MCP_TOOLS registration |
| `js/pipeline.js` | `mcpCall` routes |
| `functions/api/mcp.js` | HTTP tools + static handlers |
| `mcp/manifest.json` | Tool list + resources |
| `js/declaration-letter-grid.js` | Engine pipe |
| `data/declaration/master-glyphs.json` | 6235 glyphs |
| `data/declaration/paleography.json` | NARA paleography capsule |
| `docs/LETTER-GRID-AGENT-PROMPT.md` | System prompt fragment |
| `docs/LETTER-GRID-PIPE.md` | Pipe surface |

## Minimal agent usage

```js
await kbatchDict.mcp("kbatch_lettergrid_state")
await kbatchDict.mcp("kbatch_lettergrid_step", { action: "next" })
await kbatchDict.mcp("kbatch_lettergrid_colossus", { depth: "full" })
await kbatchDict.mcp("kbatch_lettergrid_export_training", { format: "jsonl" })
await kbatchDict.mcp("kbatch_lettergrid_finale", { includePath: true })
await kbatchDict.mcp("kbatch_lettergrid_play_round", { gridSize: "12x12", speedMs: 60, dryRun: true })
```

```bash
curl -s https://kbatch.ugrad.ai/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kbatch_lettergrid_colossus","arguments":{"depth":"light"}}}'
```
