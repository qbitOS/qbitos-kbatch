# Next hurdle — registers → patterns → Rubik universal language

Honest scope expansion after the 1.69M fully analyzed packs + lexical layer.

**2026-07-26 forward path:** iterate the dictionary along the all-13 Rubik pure-`C` tour — see [RUBIK-STAIR-NEXT.md](./RUBIK-STAIR-NEXT.md) · pack `/data/world-path/rubik-stair-next.json` (phases A–E).

## Shipped (this slice)

| Layer | Status | How |
|-------|--------|-----|
| **grow-registers** | **live** | `npm run grow-registers` · optional `--fetch` / `npm run grow-registers:fetch` |
| Register tags | **live** | `data/registers/{slang,shorthand,off}/{a-z}.json` + `tag-map.json` |
| Dict filter | **live** | Standard / Slang / Shorthand / Off chips on A–Z toolbar |
| Pattern lab | **live** | Path as unit of work · flow signatures · density · strain rank · readable vs cipher · pairwise flow similarity across 15 boards |
| Rubik map | **foundation** | 6 modality faces (Written · Spoken · Movement · Digital · Analog · Thought) · 2D net · predicted turns · state schema for future WebGL/gsplat |
| Overview pin | **live** | unchanged priority · first pin before quantum lab |

## Commands

```bash
# Merge slang / shorthand / off lists → research seeds + tags
npm run grow-registers

# + open short-list fetch + frequency-tail slang candidates
npm run grow-registers:fetch

# Max mine (deeper frequency tails · larger meta-map)
npm run grow-registers:deep

# After registers grow, optional R2 / Pages
npm run upload:r2
npm run deploy:pages   # or deploy:prod
```

## Register v2 · capsules · extension

| Layer | What |
|-------|------|
| **Primary** | standard · slang · shorthand · off |
| **Age capsules** | gen_alpha · gen_z · millennial · gen_x · boomer · all_ages |
| **Regions** | us_* · uk · au · nz · ca · indian_en · sg · caribbean · **zh_city** · **zh_formal** · global_net |
| **Themes** | internet · gaming · hiphop · school · work · dating · music · tech · city … |
| **Extension** | UD-style gloss rows in `data/registers/extension/` + cite link for human verify |

**Urban Dictionary policy:** citation / verify link only — **never bulk scrape**. Seeds are open/curated; heuristics expand from frequency lists.

**City Mandarin vs formal:** romanized pairs (`nihao`/`ninhao`, `zao`/`zaoshanghao`, `meiguanxi`/`meishi`, net codes `yyds`/`xswl`/`666`) under `zh_city` · `zh_formal` capsules — geometric Latin layer for path analysis.

Mueee align: https://mueee.qbitos.ai/kbatch.html?mueee=1

## Console API

```js
kbatchDict.corpus.setRegister("slang")
kbatchDict.corpus.activeRegister()
kbatchDict.corpus.registerIndex()
kbatchDict.corpus.registersForWord("rizz")
kbatchDict.corpus.keyboardPatterns("type once")
kbatchDict.corpus.lastPatternLab()
kbatchDict.corpus.rubikState("universal language")
kbatchDict.corpus.lastRubik()
```

## Why this order

1. **Registers** — production a11y/i18n needs slang & shorthand as first-class orthographies, not afterthoughts. Caption/paste QA ritual benefits immediately.
2. **Pattern lab** — cross-language keyboard patterns, flow, and similarities; readable vs cipher by density + strain flips optimal boards. Path = unit of work.
3. **Rubik map** — only after patterns exist as data. Cube faces are modalities; stickers = families × layouts. Decipher / analyze / predict / evolve / aid creation of a universal language layer.
4. **Quantum** — remains optional lab branch (QASM preflight already on Shadow Live).

## Next next (not this PR)

- Grow slang lists continuously (community + open corpora); keep geometric analysis on new forms
- Cross-script flow clustering (group layouts by flow bigram affinity matrix export)
- WebGL / gsplat Rubik host consuming `kbatch-rubik-language-v1` state
- Predict register drift + layout preference from path statistics
- Universal-language “solver” that proposes turn sequences toward lower strain / higher shared readability

## Data note

- Full **standard** register = `data/words` (1.69M) — not duplicated under `registers/standard`
- Register packs are **tags**, not a second corpus
- Research stubs for slang/shorthand seed into `data/research/{a-z}.json`
