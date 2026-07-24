# Letter-Grid agent system prompt (v8-pipe)

Minimal fragment for Grok / Dojo / Colossus agents operating the Declaration Letter-Grid.

```text
You are operating the KBatch Declaration Letter-Grid (v8-pipe).
Primary tools: kbatch_lettergrid_state, _glyphs, _step, _colossus, _export_training, _finale.
Master stream = 6235 letters only (no spaces). Starts "INCONGRE…".
Grid layers 1–44 are N×N chunks; document lines L01–L79 are the engrossed text lines.
Always prefer exportColossus / kbatch_lettergrid_colossus for one-shot snapshots.
When asked for paleography, pull the capsule from Colossus or /data/declaration/paleography.json.
Source of truth for the underlying document is the National Archives engrossed parchment + official transcript.
```

## Browser (after letter-grid or pipe loads)

```js
const G = letterGrid; // also __letterGridApi
G.setDojoMode(true);
G.nextGlyph();
await G.playRound({ size: 12, speed: 120 });
G.exportColossus({ includeGlyphs: false });
await kbatchDict.mcp("kbatch_lettergrid_colossus", { depth: "full" });
await kbatchDict.mcp("kbatch_lettergrid_export_training", { format: "jsonl" });
await kbatchDict.mcp("kbatch_lettergrid_finale", { includePath: true });
```

## HTTP (static-capable)

```bash
# state / glyphs / colossus / training / finale-path (static spiral) work without a live board
curl -s https://kbatch.ugrad.ai/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kbatch_lettergrid_colossus","arguments":{"depth":"light"}}}'
```

Live **step / play / jump** need the browser session (`letterGrid` on the page).

## Formal glossary (quick)

| Term | Definition |
|------|------------|
| **Master glyph** | Single letter from the Declaration stream (spaces removed). 6235 total, `gi` 0…6234. |
| **Grid layer** | One N×N chunk of the master stream (44 @ 12×12). |
| **Document line (L01–L79)** | Engrossed text lines; orthogonal to grid layers. |
| **Letter-Grid** | Interactive N×N WebGrid under 70s timer with BPS / NTPM. |
| **Dojo mode** | Agent stepping (`setDojoMode(true)` / `action:"next"`). |
| **Colossus pack** | One-shot snapshot `kbatch-letter-grid-colossus-v1`. |
| **Finale path** | Wandering path + peak report after all grid layers cleared. |
| **Paleography capsule** | NARA-aware physical object metadata. |
| **Pipe (v8-pipe)** | Agent API: `getState`, `nextGlyph`, `playRound`, `exportColossus`, `masterGlyphs` + MCP tools. |

## Types

See `js/letter-grid-mcp.d.ts` (`KBatch.LetterGridState`, `ColossusPack`, `PaleographyDoc`, …).

## Data

| Path | Role |
|------|------|
| `/data/declaration/master-glyphs.json` | 6235 compact glyphs |
| `/data/declaration/paleography.json` | Full NARA paleography capsule |
| `docs/LETTER-GRID-MCP-SHAPES.md` | Tool matrix |
| `docs/LETTER-GRID-PIPE.md` | Pipe surface |
