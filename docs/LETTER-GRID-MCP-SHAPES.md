# Draft MCP Tool Shapes · checked against live Letter-Grid v8-pipe

**Status:** implemented (browser MCP + HTTP static) · engine `declaration-letter-grid-v8-pipe`  
**Registration order (manifest / DOJO):** state → glyphs → step → play_round → layer → **colossus** → next_glyph → export_training

## Alignment matrix

| Draft tool | Maps to engine | HTTP MCP | Browser MCP | Gaps / notes |
|------------|----------------|----------|-------------|--------------|
| `kbatch_lettergrid_state` | `mcpState()` / `getState()` | **Static lobby** (timer 01:10, next=I) | **Live** | Example return shape **matched**. `include` slices work live. |
| `kbatch_lettergrid_step` | `nextGlyph` / burst / `skipLayer` / reset Dojo | `live_session_required` | **Live** | `action=play` = up to 50 `nextGlyph` (not full 70s agent). `speedMs` enum honored via `setHop`. |
| `kbatch_lettergrid_play_round` | `playRound({size,speed})` | **dryRun only** | **Live** agent 70s | Default speed draft=60 · engine default hop 120 for humans — both accepted. |
| `kbatch_lettergrid_glyphs` | `masterGlyphs` + static JSON | **Full** 6235 | Live or static | `range`: `0-99`, `L01`, `title`/`body`/…, `all`. `format`: array \| string \| atoms. |
| `kbatch_lettergrid_layer` | `jumpToLayer` / `skipLayer` / `gridLayerMap` | **get only** | get \| jump \| clear | Layers are **N×N grid layers (44 @ 12×12)**, not L01 document lines. |
| `kbatch_lettergrid_colossus` | `exportColossusDraft` | light/full/training static | Live + static | Draft return shape matched (+ `gridLayerMap` + `paleography`). Version field = engine VER (v8-pipe). |
| `kbatch_lettergrid_next_glyph` | `getState().next` | Static master[0] | Live next | Does **not** advance (use `step` for advance). |
| `kbatch_lettergrid_export_training` | `exportTraining` | Full static | Live or static | `json` \| `jsonl` \| `jax` vectors. |

## Naming

| Earlier internal draft | **Their draft (adopted)** |
|------------------------|---------------------------|
| `kbatch_letter_grid_*` | **`kbatch_lettergrid_*`** (no extra underscore) |

## Semantic clarifications (important)

1. **Two “layer” concepts**
   - **Grid layer** 1–44: N×N chunks of the 6235 master stream (`kbatch_lettergrid_layer`).
   - **Document line** L01–L79: engrossed lines (`layerMap` in Colossus = line → glyph range).  
   Draft example `layerMap.L01 = title` = document lines — implemented as `layerMap`, with `gridLayerMap` for N×N.

2. **Glyphs are letters only**  
   Master stream has **no spaces** (6235 A–Z). Example `"I","N"," ","C"` in draft is slightly wrong — actual start is `INCONGRESSJuly…` (title letters).

3. **HTTP vs browser**  
   Pure terminal Grok via `/api/mcp` can pull **glyphs / colossus / training / static state** today.  
   **step / play / layer jump** need browser DOJO session (`letterGrid` global) until a session bridge exists.

4. **Version string**  
   Draft said `letter-grid-v7-classy`. Live pipe VER is **`declaration-letter-grid-v8-pipe`**.

## Minimal agent usage (as drafted)

```js
// Browser / DOJO (after SPA or letter-grid load)
await kbatchDict.mcp("kbatch_lettergrid_state")
await kbatchDict.mcp("kbatch_lettergrid_step", { action: "next" })
await kbatchDict.mcp("kbatch_lettergrid_colossus", { depth: "full" })
await kbatchDict.mcp("kbatch_lettergrid_play_round", {
  gridSize: "12x12",
  speedMs: 60,
})
// or dry structure without running:
await kbatchDict.mcp("kbatch_lettergrid_play_round", { dryRun: true })
```

```bash
# HTTP static (no live board)
curl -s https://kbatch.ugrad.ai/api/mcp \
  -H 'content-type: application/json' \
  -d '{"tool":"kbatch_lettergrid_glyphs","args":{"range":"L01","format":"string"}}'

curl -s https://kbatch.ugrad.ai/api/mcp \
  -H 'content-type: application/json' \
  -d '{"tool":"kbatch_lettergrid_colossus","args":{"depth":"light"}}'
```

## Files

| Path | Role |
|------|------|
| `js/letter-grid-mcp.js` | Tool dispatcher (browser) |
| `js/schema.js` | MCP_TOOLS registration |
| `js/pipeline.js` | `mcpCall` routes |
| `functions/api/mcp.js` | HTTP tools + static handlers |
| `mcp/manifest.json` | Tool list + resources |
| `js/declaration-letter-grid.js` | Engine: mcpState, nextGlyph, jump/skip, export* |
| `data/declaration/master-glyphs.json` | 6235 compact glyphs |
| `labs/.../letter-grid-pipe.html` | Headless/dojo harness |

## Still optional (not blocking 9/10)

- [ ] TypeScript interfaces for tool I/O  
- [ ] Session bridge (HTTP → remote browser / Memory Glass) for step/play  
- [ ] Compose `kbatch_colossus({ letterGrid: true })` to auto-merge lettergrid snapshot  
- [ ] Deploy CF so live `/api/mcp` lists the eight tools

## Verdict on the draft

**Adopt as-is** with the clarifications above. Shapes are consistent with existing `kbatch_*` style, Colossus-friendly, and map cleanly onto the v8-pipe engine. No rename needed — implemented under their exact tool names.
