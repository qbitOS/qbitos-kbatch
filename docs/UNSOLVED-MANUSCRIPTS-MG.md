# Unsolved manuscripts · Living Books · Memory Glass

**Status:** live pack · 2026-07-26  
**Lab:** [`labs/living-books.html`](../labs/living-books.html) → fold **Unsolved manuscripts · hi-res · MG batch**  
**Pack:** [`data/living-books/unsolved-manuscripts.json`](../data/living-books/unsolved-manuscripts.json)

## Claim

Give Memory Glass (and any agent) a **batch-ready library** of high-res documentation for unsolved and hard manuscripts: deep-zoom pages, study docs, path phrases, Cage rules, and independent-study jobs — **not** an auto-decipher engine.

## What’s in the pack

| Group | Examples | Role for MG |
|-------|----------|-------------|
| **Unsolved** | Voynich · Phaistos · Rongorongo · Indus · Linear A · Cascajal | Survey + Cage + path on labels only |
| **Partial / in progress** | Dresden · Xultun Sak Tahn Waax · Herculaneum · DSS · Archimedes · Antikythera · Oxyrhynchus | Docs + open images + research notes |
| **Solved controls** | Rosetta · Linear B | Contrast batches (what “solved” looks like) |

Counts (see pack `counts`): manuscripts · batch jobs · sample hi-res pages.

## Memory Glass pipeline

```
Load pack → pick manuscript
  → Deep zoom hi-res pages (wheel/pinch · max ~64×)
  → Path geometry on samplePhrase / job phrases
  → Cage FACT / FICTION / STONE_TRAP on decipherment hype
  → Independent study note (known vs unsolved)
  → exportStoryBeats() → living-books paste
```

### Agent API (browser)

```js
await __kbatchLivingBooks.loadUnsolved()
__kbatchLivingBooks.listUnsolved()
__kbatchLivingBooks.getUnsolved("ms-voynich")
__kbatchLivingBooks.batchManifest({ priority: 1 })
__kbatchLivingBooks.batchManifest({ manuscriptId: "ms-voynich" })
__kbatchLivingBooks.path("voynich manuscript unknown script")
```

### Static JSON

- Full pack: `/data/living-books/unsolved-manuscripts.json`
- Embedded in catalogue: `entries.json` kind `unsolved-manuscript`
- Visual deep-zoom: `visual-projects.json` ids `unsolved-ms-*`
- Antiquity mesh link: `/data/antiquity/discovery-projects.json`

### Export batch from UI

Lab button **Export MG batch JSON** → priority≤1 jobs (or current manuscript) · clipboard + panel.

## Job types

| Type | What MG / agent does |
|------|----------------------|
| `deep-zoom-survey` | Open pages · max zoom · note structure · **no translate** |
| `path-geometry` | KBatch path on romanized labels / sample phrases |
| `cage-litmus` | Grade viral “solved” claims · STONE_TRAP discipline |
| `independent-study` | Short written note: known vs unsolved · cites only |
| `story-beats` | `exportStoryBeats` after zoom session → paste living-books |

## Doctrine

- **Rights:** museum/library open digital · Commons · challenge open data — never pirate commercial facsimiles  
- **Cage:** unsolved ≠ free to invent STONE readings  
- **Honor:** Rongorongo / living cultures educational seed only  
- **Controls:** always run Rosetta or Linear B once per session for calibration  

## Hi-res sources (examples)

| Manuscript | Primary hi-res |
|------------|----------------|
| Voynich | [Beinecke digital library](https://collections.library.yale.edu/catalog/2002046) |
| Dead Sea Scrolls | [Leon Levy DSS library](https://www.deadseascrolls.org.il/) |
| Herculaneum | [Vesuvius Challenge](https://scrollprize.org/) |
| Dresden / others | Wikimedia Commons + museum catalogs (see pack `hiResSources`) |

Sample pages in the pack use Commons `Special:FilePath` at width 2400 where available; full corpora stay on library viewers.

## Related

- [MEMORY-GLASS-KBATCH.md](./MEMORY-GLASS-KBATCH.md)  
- [ASSET-MAP-LIVING-BOOKS.md](./ASSET-MAP-LIVING-BOOKS.md)  
- [ANTIQUITY-DISCOVERY-MESH.md](./ANTIQUITY-DISCOVERY-MESH.md)  
- [CAGE-LITMUS-MCP.md](./CAGE-LITMUS-MCP.md)  
