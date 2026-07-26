# KBatch research layer — independent data source

## Goal

Stop treating **Wiktionary / OED / Etymonline** as runtime dependencies.  
They remain **citations**. KBatch becomes a **first-class research data source** for:

- spelling geometry (1.69M+ open orthographies × 15 keyboards)
- independent etymology / first-recorded *estimates*
- adoption paths + word agency
- paleography / antiquity document search & restoration  
  ([Codex Regius paleography hub](https://fornevercollective.github.io/codex-regius-digital/paleography-hub.html#scribe) · [repo](https://github.com/fornevercollective/codex-regius-digital))
- **antiquity discovery mesh** — Declaration-class projects (live + scaffold + open watchlist), including 2026 **Sak Tahn Waax** (Maya astronomer) and Herculaneum unwraps · see [ANTIQUITY-DISCOVERY-MESH.md](./ANTIQUITY-DISCOVERY-MESH.md) · `data/antiquity/`
- multi-modal language coverage (see roadmap below)

## What is independent today

| Layer | Independent? | Notes |
|-------|----------------|-------|
| Spellings index | **yes** | open lists only — never OED dump |
| Geometry + 15 layout shadows | **yes** | baked in `data/analyzed` pack v3 |
| ASCII + binary encodings | **yes** | `ac` / `bi` on every pack |
| Braille / Morse / DDR / flow | **yes** | local encoders |
| stenoSTRIP / blank coins | **yes** | local |
| Register layer (slang / shorthand / off) | **yes** | `npm run grow-registers` · `data/registers/` |
| Keyboard pattern / flow lab | **yes** | `js/keyboard-pattern-lab.js` · path = unit of work |
| Rubik language map | **foundation** | `js/rubik-language-map.js` · 6 modalities · net render |
| Research sense / etymology | **yes (heuristic + local packs)** | `js/research-corpus.js` |
| Live Free Dict / Datamuse | optional enrich | offline falls back to research |
| OED exact first-use years | **citation / licensed API later** | never required |

See also: [NEXT-HURDLE.md](./NEXT-HURDLE.md) (registers → patterns → universal-language cube).

## Runtime order (senses)

1. **KBatch research** (`researchWord`) — always available  
2. Optional live enrich (Free Dict / Datamuse / Wiki) — never blocks UI  
3. Citations row links out for human verification  

## Local research packs

```
data/research/{a-z}.json
```

Each row (minimal):

```json
{
  "w": "quantum",
  "pos": "noun",
  "definition": "…",
  "etymologyText": "…",
  "firstRecorded": { "label": "c. 1610", "method": "kbatch-curated", "confidence": 0.7 },
  "adoptionPath": ["Latin", "Early Modern English", "physics (20c)"],
  "agency": [{ "id": "scientific", "label": "Scientific / technical" }],
  "synonyms": ["quantity"],
  "antonyms": []
}
```

Grow these packs over time (curation, OCR of public-domain texts, community research) — **that** is how KBatch becomes the source others cite.

## Multi-modal language roadmap

| Modality | Status | KBatch surface |
|----------|--------|----------------|
| **Written** | active | orthography · 15 keyboards · shadows |
| **Spoken** | partial | phonation · registers · mouth/tone |
| **Movement** | partial | DDR · dance · flow · wand |
| **Digital** | active | ASCII · binary · braille · morse · steno · QASM |
| **Analog** | planned | [Freya units / signal](https://freya.qbitos.ai/freya-units.html) |
| **Thought / neural** | research | animal · human · cell · neuron map (Neuralink-class future) |
| **Quantum math** | partial | path → circuit · preflight |
| **Signal languages** | planned | freya-units · radio / optic / tactile |

## Hosting (CF independence)

| Asset | Host |
|-------|------|
| SPA (`index.html`, `js/`, `css/`) | **Cloudflare Pages** `ugrad-kbatch` |
| `data/words/*` (~20MB) | Pages and/or **R2** |
| `data/analyzed/*` (~1.4GB+) | **R2 only** → `data.ugrad.ai/kbatch/` |
| `data/research/*` | **R2** + Pages stub |

```bash
# 1) Enrich packs with ascii+binary
npm run enrich:codes

# 2) Upload corpus to R2
./scripts/upload-r2.sh

# 3) Deploy SPA without analyzed/
./scripts/deploy-pages.sh
```

Set in HTML:

```html
<meta name="kbatch-data-base" content="https://data.ugrad.ai/kbatch/" />
```

## Antiquity / restoration research leg

Align with Codex Regius paleography:

- **Scribe / ductus** metaphors already in SMART Writer historical cards  
- Research packs can attach **manuscript era**, **hand type**, **restoration notes**  
- Future: join KBatch spellings ↔ digitized folio lines ↔ geometric keyboard strain of *transcription*

That is the path from “dictionary SPA” → **world data source for written/spoken/signal language research**.
