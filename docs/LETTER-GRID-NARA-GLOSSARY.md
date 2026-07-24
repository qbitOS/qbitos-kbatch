# Letter-Grid · NARA methods + formal definitions

## NARA methods (digital edition ↔ physical object)

| Method | Description | Digital edition use |
|--------|-------------|---------------------|
| **Engrossed copy** | Official signed parchment produced by Timothy Matlack | Source of the master glyph stream and visual restorations |
| **Public-domain imaging** | NARA high-resolution scans + Stone 1823 engraving | Base images for faithful / scholarly / inverse / illuminated treatments |
| **Official transcript** | Authoritative text maintained by NARA | Ground truth for OCR / reconstruction disputes |
| **Conservation housing** | Argon-filled titanium/aluminum case, light & humidity control | Context for severe fading of the original |
| **Light-damage documentation** | NARA conservation on iron-gall fading | Why digital restoration + letter-only stream were required |
| **Multi-spectral potential** | Advanced imaging by NARA and partners | Future: higher-fidelity glyph recovery |

**Static capsule:** `/data/declaration/paleography.json` (`kbatch-declaration-paleography-v1`)  
**Transcript:** https://www.archives.gov/founding-docs/declaration-transcript

## Formal draft definitions

| Term | Definition |
|------|------------|
| **Master glyph** | A single letter from the Declaration text stream (spaces removed). Total fixed at **6235**. Indexed by `gi` 0…6234. |
| **Grid layer** | One N×N chunk of the master stream used for scoring (**44** @ 12×12, **98** @ 8×8, **25** @ 16×16). |
| **Document line (L01–L79)** | Engrossed text lines (title, subtitle, body, signatures). Orthogonal to grid layers. |
| **Letter-Grid** | Interactive N×N WebGrid scoring surface: master stream, 70s timer, BPS / NTPM. |
| **Dojo mode** | Agent stepping mode (`setDojoMode(true)` / `action: "next"`) — no live timer, full state after every glyph. |
| **Colossus pack** | One-shot snapshot (`kbatch-letter-grid-colossus-v1`): state, glyphs, layer maps, paleography, optional scores. |
| **Finale path** | Wandering path + peak-score report after all grid layers are cleared (`kbatch_lettergrid_finale`). |
| **Paleography capsule** | NARA-aware metadata: physical object, scribe, ink, layout, conservation. |
| **Pipe (v8-pipe)** | Agent API: `getState`, `nextGlyph`, `playRound`, `exportColossus`, `masterGlyphs`, plus MCP tools. |

## MCP tools (9)

1. `kbatch_lettergrid_state`
2. `kbatch_lettergrid_glyphs`
3. `kbatch_lettergrid_step`
4. `kbatch_lettergrid_play_round`
5. `kbatch_lettergrid_layer`
6. `kbatch_lettergrid_colossus`
7. `kbatch_lettergrid_next_glyph`
8. `kbatch_lettergrid_export_training` (default **jsonl**)
9. `kbatch_lettergrid_finale`

## Training JSONL example

```json
{"gi":0,"ch":"I","lineId":"L01","kind":"title","wordStart":1,"sentenceStart":1,"layer":1}
{"gi":1,"ch":"N","lineId":"L01","kind":"title","wordStart":0,"sentenceStart":0,"layer":1}
```

## Agent prompt fragment

```
You are operating the KBatch Declaration Letter-Grid (v8-pipe).
Primary tools: kbatch_lettergrid_state, _glyphs, _step, _colossus, _export_training, _finale.
Master stream = 6235 letters only (no spaces). Starts "INCONGRE…".
Grid layers 1–44 are N×N chunks; document lines L01–L79 are the engrossed text lines.
Always prefer exportColossus / kbatch_lettergrid_colossus for one-shot snapshots.
When asked for paleography, pull the capsule from Colossus or /data/declaration/paleography.json.
Source of truth for the underlying document is the National Archives engrossed parchment + official transcript.
```
