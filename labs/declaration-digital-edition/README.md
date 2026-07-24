# Declaration of Independence — Archival Restoration Edition

**Tone: archival.** Lift historical writing from past media to present analysis speed — not entertainment chrome.

## Museum / codex readiness

**Verdict: partial-codex · not full museum-ready** · score **62/100**  
Machine scorecard: [`/data/declaration/readiness.json`](/data/declaration/readiness.json)

| Ready | Not yet |
|-------|---------|
| US engrossed NARA calligraphy + clean dual | Full Declaration text in all 88 languages |
| Line/word/letter UV multi-layer zoom | Pixel-perfect CV ink forensics |
| Scribe sectioning + physical bands | Turnkey museum loan package |
| World through-lines research scaffold | Complete national-charter full-text corpus |

## Surfaces

| URL | Role |
|-----|------|
| **`/labs/declaration-digital-edition/`** | Archive workspace — 4-layer UV zoom · folio lines · lattice · scribe dual |
| **`cage-litmus.html`** | **Cage-grade litmus** — RAW+STONE pair · National Treasure fiction labeled · FACT/FICTION/STONE_TRAP verify |
| **`letter-grid.html`** | **WebGrid-style letter litmus** — square chunks · letter cross-ref · growth stair → document gateway · MG tensor loop |
| **`world.html`** | Multilingual plane · world instruments · through-lines · readiness |
| `scribe-glyphs.html` | Calligraphy + clean numbered tiles |
| `paleography-hub.html` | Codicology notes |
| `versions.html` | Layer gallery |
| `/dojo/` · `/research` · `/museum` | Site-wide access points |

## Letter-Grid litmus (iteration / growth stair)

- **Engine:** `/js/declaration-letter-grid.js` · styles `/css/declaration-letter-grid.css`
- **Data:** `/data/declaration/full-transcript-lines.json` (NARA L01–L35)
- **Grammar:** Neuralink WebGrid-like — blue target · BPS ≈ log₂(N²−1)×NTPM/60 · 8/12/16 square boards
- **Cross-ref:** every line containing the target letter (gateway into archive / strokes / glyphs)
- **Stair S0→S7:** title → preamble → self-evident → grievances bands → full codex unlock
- **Trials:** `localStorage kbatch.declaration.letterGrid.trials` · optional POST `:9880` for soak bus
- **Persona scaffold:** link out to Memory Glass `persona-tensor` L5 tensor loop

## Multilingual Declaration

- **Canonical full:** `data/declaration/multilingual/en.json` (NARA L01–L35)
- **Index (88 catalog langs):** `data/declaration/multilingual/index.json`
- **1 full · 87 planned slots** — do **not** invent full-document translations
- Fill-in: verified public-domain / open source as `multilingual/{langId}.json` aligned to L01–L35

## Writing path · blank substrate · ink lift · stroke player

- **Build:** `build-writing-path-layers.py --all` (or `--full` / `--lines`)
- **Blank substrate:** under page with writing removed (`images/writing-path/full/*-blank-substrate.jpg`)
- **Ink lifted PNG:** writing only, transparent background (`*-ink-lifted.png`)
- **Under-marks TEST:** residual after primary ink (hypothesis plate, not forensic claim)
- **Stroke passes:** pen-down→lift path layers per line + live draw at `stroke-player.html`
- **Data:** `data/declaration/writing-path-index.json` · `data/declaration/stroke-paths/Lxx.json`

## World through-lines · theme matrix · lineage

- **Instruments:** `data/declaration/world-declarations.json` (~39 political + sacred-text + substrate instruments)
- **Themes:** `data/declaration/through-lines.json` (political hopes + sacred transmission + layered lines + catechism circles)
- **Lineage gitgraph:** `data/declaration/document-lineage.json` (English Bible branches · Matthew/Rogers node · Atlantic political · stone substrates)
- **UI:** `world.html` — theme matrix filters · ancestry-style branch paths · concept overlap/divergence
- Goal: shared **hopes for government** + **divergence** of rule-based outlines over time

## Raw vs Stone (symbology)

| Pass | Layer | Use |
|------|--------|-----|
| **RAW** | `nara-parchment` | Material truth · iron-gall relief · grain · signatures · fade map |
| **STONE** | `nara-stone` | Legibility · ink-cut dual geometry · high-res reading |
| **Contrast** | `nara-stone-contrast` | Study plate |
| **Clean** | `hires-scholarly` | Exact NARA transcript |

Stone is a **1823 facsimile plate** — excellent for reading, weak for material symbology.
Default four panes: **Raw · Stone · Contrast · Clean**. Modes in the archive rail switch packs.
Pack: `data/declaration/symbology-raw-vs-stone.json` (includes labeled National Treasure fiction lane).

## Primary sources

- NARA engrossed parchment + Stone engraving (on disk under `images/sources/`)
- Transcript: https://www.archives.gov/founding-docs/declaration-transcript
- Downloads: https://www.archives.gov/founding-docs/downloads

## Doctrine

- Public-domain / open scans only · no sacred-texts scrape · no living PII dump
- Geometric keyboard dialect ≠ semantic translation
- Educational comparative model — verify primary national archives for critical work
