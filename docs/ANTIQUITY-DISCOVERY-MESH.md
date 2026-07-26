# Antiquity discovery mesh

**Status:** live catalog · scaffolds ready · 2026-07-24  
**Data root:** [`data/antiquity/`](../data/antiquity/)  
**Pattern siblings:** Declaration engrossed parchment · Codex Regius digital edition

## Claim

KBatch is not a museum. It is a **geometry + research mesh** for *Declaration-class* objects:

parchment · codex · wall microtext · tablet · stele · spectral scroll · CT papyrus

Each project can grow: imaging layers → token/glyph stream → path geometry → open names → Cage RAW+STONE.

## Headline 2026 discoveries (seeded)

| Project | Why it matters | Status |
|---------|----------------|--------|
| **Sak Tahn Waax** (Xultun 10K-2) | First *named* Classic Maya astronomer-mathematician (“White-chested Fox”); Venus–Mars calendar formula · *Antiquity* 2026 | **scaffold** |
| **Herculaneum / Vesuvius Challenge** | End-to-end virtual unwrapping · new Philodemus texts | **scaffold** |

Citations (cite-out, do not scrape):

- DOI: https://doi.org/10.15184/aqy.2026.10378  
- Nat Geo: https://www.nationalgeographic.com/history/article/first-maya-astronomer-mathematician-name  
- Vesuvius Challenge: https://scrollprize.org/

## Packs

| File | Role |
|------|------|
| [`discovery-projects.json`](../data/antiquity/discovery-projects.json) | Master mesh (~40 projects: live / scaffold / open) |
| [`scholar-names.json`](../data/antiquity/scholar-names.json) | Thin scholar/scribe names (Sak Tahn Waax, Philodemus, Matlack, …) |
| [`lexicon-seed.json`](../data/antiquity/lexicon-seed.json) | Orthography tokens + sample phrases for path geometry |
| [`index.json`](../data/antiquity/index.json) | Pack index |

## Wired surfaces

| Surface | Path |
|---------|------|
| Living Books restoration | `data/living-books/restoration-projects.json` |
| Living Books visual | `data/living-books/visual-projects.json` |
| AnCEstory antiquity | `data/ancestory/antiquity-open.json` |
| Open names (events + history) | `data/open-names/history-event.json`, `history.json` |
| Capsules | `data/capsules/packs/antiquity-discovery.json` + canon index |
| Museum kits | `kit-maya-romanized-scaffold`, `kit-antiquity-mesh` |
| Live siblings | `/labs/declaration-digital-edition/`, Codex Regius external hub |

## Compose path (default)

```
source object
  → imaging layers (photo | UV | multi-spectral | CT)
  → token / glyph / line stream
  → path geometry (+ optional Letter-Grid)
  → open names + scholar attribution
  → Cage RAW + STONE gate
```

## Doctrine

- **Rights:** PD / project-open / museum-permitted only — never pirate  
- **Honor:** living languages & Indigenous knowledge stay opt-in  
- **Cage:** sensational decipherment / doomsday → FACT / FICTION / STONE_TRAP  
- **Purity:** geometry / SO / phon stay separate when calibration is applied  

## Status legend

| Status | Meaning |
|--------|---------|
| `live` | Shipped KBatch surface (Declaration, Codex Regius) |
| `scaffold` | Catalog + restoration/visual hooks; next build cut |
| `open` | Watchlist / potential project; thin seed |
| `blocked` | Do not ship (rights or doctrine) |

## Next cuts (optional)

1. **Xultun:** licensed/open glyph drawings + Text 19 line-section pack (Declaration-class)  
2. **Herculaneum:** ingest Vesuvius Challenge open passages as living-book pages  
3. **Dresden Codex:** IIIF / open folio deep-zoom pack  
4. **Rosetta:** tighter dual with `labs/rosetta.html` + world-path  
5. **Honor:** full Maya hieroglyph kit only with community/museum partnership (romanized seed only today)

## Related

- [RESEARCH-LAYER.md](./RESEARCH-LAYER.md)  
- [LETTER-GRID-NARA-GLOSSARY.md](./LETTER-GRID-NARA-GLOSSARY.md)  
- [CAGE-LITMUS-MCP.md](./CAGE-LITMUS-MCP.md)  
- [ASSET-MAP-LIVING-BOOKS.md](./ASSET-MAP-LIVING-BOOKS.md)  
