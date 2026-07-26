# Asset map · Living books · Gutenberg · Ants

**Product spine:** KBatch orthography geometry · https://kbatch.ugrad.ai  
**Instant grasp JSON:** `data/education/grasp-map.json`  
**Lab UI (SPA seed):** [`labs/living-books.html`](../labs/living-books.html) — overview-style layout + contrail→beats paste

## Memory Glass × KBatch

Full terminal / DOJO handoff (P0–P6, contrail recovery, APIs):

- **Canonical:** [MEMORY-GLASS-KBATCH.md](./MEMORY-GLASS-KBATCH.md)
- **Ledger pointer:** [fornever-ledger/MEMORY-GLASS-HANDOFF.md](./fornever-ledger/MEMORY-GLASS-HANDOFF.md)
- **MG source:** `/Volumes/qbitOS/00.dev/projects/grok-build/experiments/memory-glass/`
- **MG app:** `~/Applications/Memory Glass.app` · hotpipe in `Contents/Resources/hotpipe/`

## Living kids-book creation center (on this machine)

| Path | What |
|------|------|
| `/Users/tref/dev/projects/ugrad-ant/kids-book-creator.html` | Kids book creator surface (antny motion; not fully merged into kbatch SPA yet) |
| `/Users/tref/dev/projects/ugrad-ant/loc-classic-childrens-books/` | LOC classic children’s books (~879MB, 26 titles) |
| `/Users/tref/dev/projects/ugrad/ants/` | Ants multimodal workspace (Grok / voice / interactive loops) |
| `/Users/tref/.cursor/projects/Users-tref-dev-projects-ugrad-ants` | Cursor project shell for ugrad-ants |
| `labs/living-books.html` | KBatch lab page: asset table + contrail story-beat importer |
| `data/living-books/unsolved-manuscripts.json` | Hi-res unsolved/hard manuscripts + MG batch jobs (Voynich, Phaistos, Indus, …) |
| [UNSOLVED-MANUSCRIPTS-MG.md](./UNSOLVED-MANUSCRIPTS-MG.md) | Memory Glass independent study + batch pipeline |
| Memory Glass `hotpipe/webgrid-contrail.js` | Path phrasing → `exportStoryBeats()` for overnight sessions |

**Doctrine:** Ants = interaction agents (Imagine / TTS / STT / user turns). KBatch supplies path geometry + educational capsules. PD / LOC / cited only — never pirate commercial books.

## Overnight session → live book pipeline

```
WebGrid play (MG) → contrail strokes (success/stress/slow colors)
                 → storyBeat{mood,glyph,hint}
                 → labs/living-books.html paste
                 → kids-book-creator / Ants Imagine+TTS pages
                 → PD footer (LOC title | gutenberg_id)
```

### Contrail color language (v2)

| Color | Trajectory | Story mood |
|-------|------------|------------|
| Green | success / hit | triumph |
| Coral | stress / thrash / miss | tension |
| Violet | slowdown | wonder |
| Blue | dwell | wonder |
| Gold | acceleration | rush |
| Ice | cruise | journey |

### Neuralink pattern metaphor (demo talk, not clinical)

Open-loop intent map · spike→pixel · **circles unwound in time** (intent vs execution variance) · flat channel density · velocity+momentum UI. MG mirrors as: unwind strip · flat N×N heat · composer phrase stack. Source: [Neuralink demo talk](https://www.youtube.com/watch?v=FASMejN_5gs).

## Gutenberg / public-domain book analysis

| Location | Status |
|----------|--------|
| `data/capsules/packs/mueee-live.json` | Research capsules; **few** entries carry `gutenberg_id` (e.g. 14591, 2814, 1004, 829, 2000) |
| Full PG dump on disk | **Not found** under shallow search of `/Volumes/qbitOS/00.dev`, `/Users/tref/dev/projects` as `*gutenberg*` dirs — continue search when wiring `lit_gutenberg_index` bulk |

```bash
# Re-hunt when ready
find /Volumes/qbitOS /Users/tref/dev -maxdepth 6 -type d -iname '*gutenberg*' 2>/dev/null
find /Volumes/qbitOS /Users/tref/dev -maxdepth 5 -iname '*pg-*.txt' 2>/dev/null | head
```

## Curriculum hooks (KBatch)

- **Subject:** Living Books · Systems & World Literacy  
- **Capsules:** `data/capsules/packs/systems-literacy.json` (`lit.*`, `sys.*`)  
- **Skills:** `data/education/school-concepts.json` (`lit_*`, `sys_*`)  
- **Learn UI:** stair-step CEFR ladder on `/learn`

## World spelling scale (site header)

| Chip | Meaning |
|------|---------|
| **Spellings X / Y** | Active atlas (default EN fold ≈ 16.5M) |
| **World · N** | `totalSpellingsAllLangs` ≈ 54.6M (sum of packs, not cross-lang deduped) |
