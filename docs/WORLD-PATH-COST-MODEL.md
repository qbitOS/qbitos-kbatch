# Exact world-path cost model

**Source of truth:** `js/world-path.js`  
**Schema:** `kbatch-world-path-v1`  
**MCP:** `kbatch_world_path`

Doctrine (engine):

> Fastest path = minimize **layout + script + family** transfer; **ready packs first**; **honor langs opt-in only**.

---

## 1. Formula

```text
langTransferCost(a → b) =
    base 1.0
  + layoutCost(a.layout, b.layout)
  + scriptCost(a.script, b.script)
  + familyCost(a.family, b.family)
  + statusBias(b.status)
  − parentBonus(a, b)          // 0.5 if parent link either way
  clamped to ≥ 0.1
```

Same language (`a.id === b.id`) → **0**.

### Layout cost (`LAYOUT_COST`)

| Case | Cost | Condition |
|------|-----:|-----------|
| same | **0** | `a.layout === b.layout` |
| latin_family | **1.2** | both in Latin board set |
| different | **3.5** | otherwise |

Latin board set:  
`qwerty · dvorak · colemak · workman · azerty · qwertz · norman · halmak`  
(plus catalog layouts that map into those ids)

### Script cost

| Case | Cost |
|------|-----:|
| same script | **0** |
| same **script cluster** | **1.5** |
| different clusters | **4** |

**Script clusters** (`scriptCluster`):

| Cluster | Matches |
|---------|---------|
| `japanese` | Hiragana, Katakana, Kanji, Japanese |
| `cjk` | Han, Chinese, CJK |
| `cyrillic` | Cyrillic |
| `arabic` | Arabic, Persian, Urdu |
| `latin` | Latin, Roman |
| `indic` | Devanagari, Bengali, Tamil, Gujarati, Gurmukhi, Telugu, Kannada, Malayalam, Sinhala |
| `sea` | Thai, Khmer, Lao, Myanmar, Burmese |
| *(else)* | lowercased script name |

### Family cost

| Case | Cost |
|------|-----:|
| same family | **0** |
| same **family cluster** | **0.8** |
| different clusters | **2.2** |

**Family clusters** (`familyCluster`):

| Cluster | Families (regex-ish) |
|---------|----------------------|
| `ie` | Germanic, Romance, Celtic, Baltic, Slavic, Indo-European, Hellenic, Italic, Iranian, Indo-Aryan |
| `afroasiatic` | Semitic, Afro… |
| `altaic-ish` | Turkic, Uralic, Mongolic, Tungus… |
| `east-seasia` | Sinitic, Tibeto, Hmong, Tai, Austroasiatic, Austronesian |
| `turtle-island` | Algic, Iroquoian, Siouan, Na-Dené, Athabaskan, Salish, Muskogean, Eskimo… |
| `dravidian` | Dravidian |
| `niger-congo` | Niger, Bantu, Atlantic… |

### Status bias (applied to **target** `b`)

| Status | Bias |
|--------|-----:|
| `ready` | **0** |
| `placeholder` | **2.5** |
| `honor` / `honor-seed` | **6** |
| other / missing | **2** |

Honor is intentionally expensive so paths never auto-prioritize community-gated packs.

### Parent bonus

If `a.parent === b.id` or `b.parent === a.id` → subtract **0.5**.

---

## 2. Worked examples (live catalog)

| Edge | Layout | Script | Family | Status | ≈ Cost |
|------|--------|--------|--------|--------|-------:|
| en → fr | latin_family 1.2 | same 0 | IE cluster 0.8 | ready 0 | **3.0** (+ base 1) |
| en → de | latin_family 1.2 | same 0 | IE 0.8 | ready | **~2.2–3.0** |
| en → ru | different 3.5 | different 4 | IE 0.8 | ready | **9.3** |
| en → ar | different 3.5 | different 4 | different 2.2 | ready | **10.7** |
| en → ko | different 3.5 | different 4 | different 2.2 | ready | **10.7** |
| ru → uk | same jcuken 0 | same 0 | same/cluster low | ready | **3.5** |

*(Base 1 always included except same-id.)*

---

## 3. Path construction algorithm

### Modes

| `mode` | Behavior |
|--------|----------|
| `full` | Phase A portals → Phase B greedy · honor **off** by default |
| `ready` | Ready packs only |
| `portals` | Script portals only (one hub lang per writing system) |
| `ladder` | Same as full fill + CEFR-style rungs summary |

### Phase A — script portals (full / ladder)

`SCRIPT_PORTALS` hubs (prefer ready):

```text
Latin→en · Cyrillic→ru · Arabic→ar · Han→zh · Hangul→ko
Hiragana/Katakana→ja · Greek→el · Hebrew→he · Devanagari→hi
Thai→th · Georgian→ka · Armenian→hy · Cherokee→chr
Bengali→bn · Tamil→ta
```

Portals sorted by `langTransferCost(origin, portal)`, then walked in order (unlock each script early).

### Phase B — greedy nearest neighbor

```text
while remaining:
  pick lang minimizing:
    cost = langTransferCost(cursor, lang)
    if same script as cursor: cost *= 0.85
    if status ready:          cost *= 0.9
  append step; cursor = lang
```

### Opt-in flags

| Flag | Default | Effect |
|------|---------|--------|
| `includeHonor` | **false** | When true, honor / honor-seed enter the pool (still high cost) |
| `includePlaceholder` | true (false when `mode=ready`) | Placeholder orthography packs |
| `readyOnly` | false (`true` when `mode=ready`) | Ready only |
| `from` | `"en"` | Origin language id |
| `max` | 999 | Cap step count |

---

## 4. Step + package shape

### Step row

```json
{
  "n": 1,
  "id": "ru",
  "label": "Russian",
  "nativeName": "Русский",
  "script": "Cyrillic",
  "family": "Slavic",
  "layout": "jcuken",
  "status": "ready",
  "tier": "world",
  "dir": "ltr",
  "role": "portal",
  "transferCost": 9.3,
  "fromId": "en",
  "learnUrl": "https://kbatch.ugrad.ai/learn.html?lang=ru",
  "dictUrl": "https://kbatch.ugrad.ai/?lang=ru",
  "honor": false,
  "note": "Script portal · unlocks Cyrillic"
}
```

**Roles:** `portal` · `transfer` · `placeholder` · `honor-opt-in`

### Package (`computeWorldPath`)

```json
{
  "schema": "kbatch-world-path-v1",
  "doctrine": "Fastest path = minimize layout+script+family…",
  "origin": { "id": "en", "layout": "qwerty", "script": "Latin", "…" },
  "mode": "ready",
  "stepCount": 23,
  "totalTransferCost": 121.6,
  "avgStepCost": 5.29,
  "portals": [ /* SCRIPT_PORTALS resolved */ ],
  "steps": [ /* … */ ],
  "rungs": null,
  "mcp": { "tool": "kbatch_world_path" }
}
```

### Ladder rungs (mode=`ladder`)

| Rung | Name |
|-----:|------|
| 0 | Zero · home board |
| 1 | Living L2 · ready packs |
| 2 | Script portals |
| 3 | World placeholders |
| 4 | Honor / Indigenous (opt-in) |

---

## 5. Agent usage

```js
await kbatchDict.mcp("kbatch_world_path", { from: "en", mode: "ready" })
await kbatchDict.mcp("kbatch_world_path", { from: "en", mode: "portals" })
await kbatchDict.mcp("kbatch_world_path", {
  from: "en",
  mode: "full",
  includeHonor: true,
  max: 40,
})
await kbatchDict.mcp("kbatch_world_path", { snapshot: true })
// snapshot → ready + portals + ladder + full head/tail
```

```js
// Browser convenience
window.kbatchDict.worldPath({ from: "en", mode: "full" })
```

---

## 6. How this ties to cadence

World-path orders **languages** (packs + scripts + boards).  
Cadence metrics (strain, efficiency, BPM) live on a **physical path** projected across the **15 layouts** (see [DECLARATION-CADENCE-PROJECTION.md](./DECLARATION-CADENCE-PROJECTION.md)).  
Transfer cost does **not** recompute key-travel mm — it estimates **curriculum friction** (layout muscle memory + script unlock + family + readiness).
