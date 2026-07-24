# `kbatch_chart_lookup` — exact return shape + licensed-lyric upgrade

**Schema:** `kbatch-chart-lookup-v1`  
**Engine:** browser `js/billboard-2026.js` · HTTP `functions/api/mcp.js` (aligned)  
**Corpus:** 1141 title-path packs · 0 bulk commercial lyrics by default

---

## 1. Call shapes

```js
// Browser / DOJO
await kbatchDict.mcp("kbatch_chart_lookup", {
  query: "too sweet hozier",   // or slug
  matchMode: "auto",           // auto | exact | fuzzy
  // exact: true,              // alias → matchMode=exact
  year: 2024,
  numberOne: true,
  flowClass: "balanced",       // dense ≥155 · balanced 141–154 · glide ≤140
  capsule: "chart-flow-dense",
  limit: 5,
  include: ["path", "musica", "metrics", "rights", "lyricsUpgrade"],
})

// HTTP
POST /api/mcp
{ "tool": "kbatch_chart_lookup", "args": { "slug": "too-sweet-hozier", "exact": true } }
```

| Arg | Role |
|-----|------|
| `query` / `q` | Free text or slug string |
| `slug` | Exact slug match (ignores fuzzy when alone) |
| `matchMode` | `auto` (default) · `exact` · `fuzzy` |
| `exact` | Boolean alias for `matchMode: "exact"` |
| `year` / `yearMin` / `yearMax` | Chart year filters |
| `numberOne` | Peak #1 only |
| `region` | US \| AU \| KR \| CA \| Global |
| `bpmMin` / `bpmMax` | Geometry-derived BPM |
| `flowClass` | dense \| balanced \| glide (pure BPM bands) |
| `capsule` | Expand filters from capsules.json |
| `listCapsules` | Capsule catalog only |
| `include` | Sections on each hit |
| `limit` | Max hits (1–40, default 8) |

---

## 2. Top-level return (`kbatch-chart-lookup-v1`)

```json
{
  "schema": "kbatch-chart-lookup-v1",
  "tool": "kbatch_chart_lookup",
  "claim": "Chart Geometry Engine — title-path packs…",
  "query": "too sweet hozier",
  "slug": null,
  "matchMode": "auto",
  "capsule": null,
  "filters": {
    "year": null,
    "yearMin": null,
    "yearMax": null,
    "numberOne": null,
    "region": null,
    "bpmMin": null,
    "bpmMax": null,
    "flowClass": null,
    "capsule": null,
    "matchMode": "auto",
    "limit": 8,
    "include": ["path", "musica", "metrics", "rights", "lyricsupgrade"]
  },
  "catalog": { "tracks": 1141, "years": [2015, 2016, "…"], "schema": "…" },
  "corpusStats": null,
  "scored": 1,
  "count": 1,
  "exactCount": 1,
  "hits": [ /* see §3 */ ],
  "tracks": [ /* alias of hits — HTTP backwards-compat */ ],
  "demo": { "slug": "too-sweet-hozier", "title": "Too Sweet", "artist": "Hozier" },
  "contrast": {
    "dense": { "slug": "anxiety-doechii", "bpm": 164 },
    "balanced": { "slug": "too-sweet-hozier", "bpm": 149 },
    "glide": { "slug": "die-with-a-smile-lady-gaga", "bpm": 135 }
  },
  "resources": {
    "catalog": "data/lyrics/charts/index.json",
    "corpus": "data/lyrics/charts/corpus.json",
    "capsules": "data/lyrics/charts/capsules.json",
    "packs": "data/lyrics/analyses/{slug}.json",
    "cited": "data/lyrics/cited/{slug}.txt + .cite.json",
    "docs": "docs/CHART-LOOKUP-RETURN-SHAPE.md",
    "ui": "https://kbatch.ugrad.ai/lyrics.html"
  }
}
```

### Capsule list mode

```js
{ listCapsules: true }
// → schema kbatch-chart-capsules-v1 · capsules[] · corpus aggregates
```

---

## 3. Hit object

```json
{
  "slug": "too-sweet-hozier",
  "title": "Too Sweet",
  "artist": "Hozier",
  "year": 2024,
  "peak": 1,
  "numberOne": true,
  "regions": ["US"],
  "lyricsMode": "title-path",
  "score": 1000,
  "match": "slug-exact",
  "analysisPath": "data/lyrics/analyses/too-sweet-hozier.json",
  "flowClass": "balanced",
  "metrics": {
    "bpm": 149,
    "key": "C#",
    "timeSig": "4/4",
    "avgStrain": 71,
    "avgEfficiency": 68,
    "midiNotes": 48,
    "bestLayout": "colemak"
  },
  "path": {
    "text": "Too Sweet\nHozier\n…",
    "source": "title-path",
    "note": "Copyright-safe title+artist geometry…"
  },
  "musica": { "bpm": 149, "key": "C#", "timeSig": "4/4", "flow": "…" },
  "rights": {
    "BMI": { "label": "BMI Repertoire", "searchUrl": "https://…" },
    "ASCAP": { "label": "ASCAP Repertory", "searchUrl": "https://…" }
  },
  "lyricsUpgrade": { /* see §5 */ },
  "steno": { "flow": "…", "note": "…" },
  "pack": { /* only if include has pack — may be large */ }
}
```

### Match scores (`match` field)

| Score | `match` | Meaning |
|------:|---------|---------|
| 1000 | `slug-exact` | Slug equals query |
| 980 | `title-artist-exact` | Normalized title+artist |
| 950 | `title-exact` | Title only |
| 920 | `artist-exact` | Artist only |
| 900 | `hay-exact` | Full haystack exact |
| 880 | `title-prefix-artist` | Title prefix + artist token |
| 500–580 | `substring` | Contiguous substring |
| ≤860 | `all-tokens` / `token` | Token overlap |

**matchMode:**

- **`auto`** — if any hit has score ≥ 900, drop weaker fuzzy hits  
- **`exact`** — only score ≥ 900  
- **`fuzzy`** — all score > 0  

---

## 4. flowClass on hits

Pure BPM (aligned with chart capsules):

```text
bpm ≥ 155        → dense
141 ≤ bpm ≤ 154  → balanced
bpm ≤ 140        → glide
```

Browser may still use trail density when BPM is missing (`flowClassFromMetrics`).

---

## 5. Licensed-lyric upgrade path

Default pack mode is **`title-path`** (geometry only). Full lyrics require citation.

### `lyricsUpgrade` block (on each hit when included)

```json
{
  "mode": "title-path",
  "upgradeable": true,
  "hasFullText": false,
  "citation": null,
  "dropPaths": {
    "citedTxt": "data/lyrics/cited/too-sweet-hozier.txt",
    "citedCite": "data/lyrics/cited/too-sweet-hozier.cite.json",
    "chartsLyrics": "data/lyrics/charts/lyrics/too-sweet-hozier.txt",
    "analysis": "data/lyrics/analyses/too-sweet-hozier.json"
  },
  "steps": [
    "Place PD/licensed lyrics at data/lyrics/cited/{slug}.txt",
    "Add citation sidecar data/lyrics/cited/{slug}.cite.json",
    "Re-run analyze:charts for that slug",
    "Re-query with include:[\"pack\"]"
  ],
  "docs": "docs/LYRICS-CITATION-AND-SONG-FLOW.md"
}
```

### Upgrade steps (operator)

```text
1. Confirm rights (BMI/ASCAP links on hit.rights — verify, do not assume license)
2. Write lyrics body → data/lyrics/cited/{slug}.txt
3. Write citation → data/lyrics/cited/{slug}.cite.json
   {
     "source": "…",
     "url": "…",
     "license": "PD | CC0 | licensed-sync | user-owned",
     "rightsHolder": "…",
     "retrieved": "YYYY-MM-DD"
   }
4. npm run analyze:charts   # or single-slug analyze
5. Pack meta.lyricsMode → cited-file | public-domain
6. kbatch_chart_lookup({ slug, include: ["pack","metrics","path"] })
   → full line geometry, not 6-line title-path stub
```

### Allowed modes

| `lyricsMode` | When |
|--------------|------|
| `title-path` | Default bulk (1141 packs) |
| `public-domain` | PD / CC0 works |
| `cited-file` | Licensed / granted display rights |
| `user-paste` | Browser-only paste (not bulk-uploaded) |

**Do not** scrape Genius/Musixmatch into the repo.

---

## 6. Agent chain after lookup

```js
const res = await kbatchDict.mcp("kbatch_chart_lookup", {
  query: "too sweet hozier",
  matchMode: "exact",
  include: ["path", "metrics", "rights", "lyricsUpgrade"],
});
const hit = res.hits[0];
const path = hit.path.text;

const steno = await kbatchDict.mcp("kbatch_steno_path", { text: path });
const ranked = await kbatchDict.mcp("kbatch_path_rank", {
  text: path,
  baseLayout: "qwerty",
  limit: 6,
});
// Optional Colossus / JAX
```

---

## 7. HTTP vs browser

| Capability | HTTP `/api/mcp` | Browser `kbatchDict.mcp` |
|------------|-----------------|---------------------------|
| Exact schema `kbatch-chart-lookup-v1` | Yes (aligned) | Yes |
| Filters + capsules + flowClass | Yes | Yes |
| `matchMode` / exact scores | Yes | Yes |
| `rights` + `lyricsUpgrade` | Yes | Yes |
| Live path recompute (`analyze`) | No | Yes when SPA analyzer present |
| Full `pack` object | Summary + line count on HTTP (size) | Full pack if `include: pack` |

---

## 8. Related docs

- [LYRICS-CITATION-AND-SONG-FLOW.md](./LYRICS-CITATION-AND-SONG-FLOW.md) — citation doctrine  
- [LYRICS-BILLBOARD-2026.md](./LYRICS-BILLBOARD-2026.md) — corpus / UI  
- [MCP.md](./MCP.md) — tool catalog  
