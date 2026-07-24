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
| **`cage-games.html`** | **Cage tensor games hub** — Letter-Grid + Cage litmus + dual-surface stair · agent hooks · persona L5 |
| **`cage-litmus.html`** | **Cage-grade litmus** — RAW+STONE pair · National Treasure fiction labeled · FACT/FICTION/STONE_TRAP verify |
| **`letter-grid.html`** | **Full-codex Letter-Grid v2** — master glyphs in order · N×N layer passes · finale wandering path · cross-ref → archive gateway · MG tensor loop |
| **`saint-tumble.html`** | **Saint crypto tumble** — Vals · Human Fly · Boris · two talks → live DAC/Steno/Gutter/Rubik 3×3 mixer · Letter-Grid seed |
| **`steno-space-grid.html`** | **Steno-space letter-grid** — all whitespace slots from the document · GrokYtalkY bust glyph chat · video qbit frames · Rubik origin-tree QR + solve numbers |
| **`world.html`** | Multilingual plane · world instruments · through-lines · readiness |
| `scribe-glyphs.html` | Calligraphy + clean numbered tiles |
| `paleography-hub.html` | Codicology notes |
| `versions.html` | Layer gallery |
| `/dojo/` · `/research` · `/museum` | Site-wide access points |

## Letter-Grid litmus v2 (full codex layer passes)

- **Engine:** `/js/declaration-letter-grid.js` (`declaration-letter-grid-v2-codex`) · styles `/css/declaration-letter-grid.css`
- **Data:** dense `/data/declaration/line-sections/` (L01–L79) with fallback `/data/declaration/full-transcript-lines.json`
- **Master stream:** every A–Z letter glyph in document reading order (~6.2k on dense lines)
- **Layer pass:** N×N window of the master stream · blue target = next master glyph · layer rail L1…Ln
- **Glyph rail:** small chips of the ordered master (done / next)
- **Finale:** after codex complete → **wandering path** (center-out spiral) with SVG trail; click path head in order
- **Grammar:** WebGrid-like — blue target · BPS ≈ log₂(N²−1)×NTPM/60 · 8/12/16 boards
- **Cross-ref:** every line containing the target letter (gateway into archive / strokes / glyphs)
- **Trials:** `localStorage kbatch.declaration.letterGrid.trials` · optional POST `:9880` · events `kbatch-declaration-codex-complete` / `kbatch-declaration-finale`
- **Persona scaffold:** Memory Glass `persona-tensor` L5 · hub `/labs/declaration-digital-edition/cage-games`
- **Agent API:** `window.__letterGridApi` · `snapshot()` · `clickCell(i)` · `startCodex()` · `startFinale()`
- **Pack:** `/data/declaration/cage-tensor-games.json`

## Cage tensor games (main AI test suite)

| Game | Role | Grade |
|------|------|-------|
| **Letter-Grid** | Motor / path tensor · ordered codex + finale | dojo = codex · cage = + finale |
| **Cage litmus** | Epistemic FACT / FICTION / STONE_TRAP | hard-fail if 0 stone-traps |
| **Dual-surface** | RAW vs STONE doctrine (in litmus hero) | never confuse plate with object |
| **Workspace** | Deep archive after stair | unlock after litmus |

Agent: `__letterGridApi` + `__cageLitmusApi.verify` · trials in localStorage · optional POST `:9880`.

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
- **Lineage gitgraph:** `data/declaration/document-lineage.json` v2 — 11 trees · shortTitle at every dot · English Bible · world substrates · Atlantic + global rights · classical Mediterranean · East/South Asia · Abrahamic comparative · literature epic→print · song/chant/anthem · law codex reception
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
