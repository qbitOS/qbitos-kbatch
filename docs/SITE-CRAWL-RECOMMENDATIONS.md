# KBatch site crawl · structure · same-lane · **status update**

**Original crawl:** 2026-07-26T01:45Z · MG-SiteAtlas BFS  
**This status:** 2026-07-26T02:16Z  
**Live verify:** kbatch.ugrad.ai  

## Status vs original findings

| Original defect | Status | Evidence |
|-----------------|--------|----------|
| SPA home on unknown paths | **FIXED** | HTTP **404** + real `404.html` (title “404 · not found”) |
| `/dojo.html` is Shadow shell | **FIXED** | **301 → `/dojo/`** |
| Relative nav explosions | **FIXED** (nav) | `site-nav` v12 root-absolute; DOJO product links absolute |
| Mesh fakes as internal IA | **FIXED** | `/mesh/` hub; `/quantum-gutter.html` → `/mesh/` |
| Dual `/foo` + `/foo.html` | **MITIGATED** | Redirects to extensionless canons |
| Letter-grid few anchors | **PARTIAL** | Agent strip + hub cards + `data-section` |
| Home weak first-run | **PARTIAL** | `#door-beats` type · rank · agents + MCP badge |
| Collab thin | **OPEN** | Scaffold; honesty banner next |
| Primary nav overloaded | **OPEN** | Still full rail (P3) |

### Shipped commits (this thread)
- `7733799` P0 404 / dojo / mesh / absolute nav  
- `4a0e053` P1 door beats / MCP badge / Declaration hub  

### Live smoke (2026-07-26T02:16Z)
- miss path → 404 real page  
- `/dojo.html` → 301 `/dojo/`  
- `/mesh/` → 200  
- `/` contains `#door-beats` + `#mcp-ping-badge`  
- Declaration hub `#declaration-hub`  

### MG operating model (updated)
| Mode | Action |
|------|--------|
| Crawl | **site-nav.js routes only** · flag 200-but-wrong-title |
| Prefer | `/for-ai#declaration-lab` · `/` `#search-input` · `/dojo/` · Declaration hub |
| Never | Relative thrash · treat 404 as Shadow |
| Re-crawl | `python3 scripts/mg-site-crawl.py` then diff this status table |

---

## 1. What the crawl actually found

### Coverage

| Origin | HTML pages crawled | Broken | Notes |
|--------|-------------------:|-------:|-------|
| kbatch.ugrad.ai | 174 | 1 | CF email-protection 404 only |
| 127.0.0.1:8899 | 60 | 13 | Missing extensionless routes (`/research` vs `/research.html`); no local `/api/mcp` |
| **Filesystem** | **85** HTML | — | Product + `.pages-dist` + labs |

After de-pollution (drop `.pages-dist`, nested `/labs/labs/…` link explosions): **~93 real paths**, **~79 distinct titles**.

### Primary product map (nav axes)

| Axis | Paths | Role |
|------|-------|------|
| **Shadow Live (core)** | `/`, `/shadow`, `/shadow.html` | Type-once → multi-layout geometry · 211 ids · 68 buttons |
| **Agents** | `/for-ai`, `/dojo/`, MCP | Agent quickstart · letter-grid · cages · 14–82 section ids |
| **Learn** | `/learn` | Skills ladder · drills |
| **Culture** | `/lyrics`, `/labs/music-staff`, `/labs/living-books` | Chart geometry · staff · books |
| **History / paleography** | `/research`, Declaration lab tree | Probes · letter-grid · cage · paleography |
| **World / axes** | `/world-ranking`, `/museum`, `/labs/rosetta`, `/labs/lang-tree` | Partnerships · exhibits · writing systems |
| **Collab** | `/labs/collab` | Multiplayer scaffold (thin) |
| **Docs / install** | `/docs`, `/install` | CLI · mesh · MCP |

### Structure quality (highlights)

| Surface | Section IDs | Landmarks | Agent-ready | Gaps |
|---------|------------:|-----------|-------------|------|
| `/` Shadow | 211 | strong | yes | No semantic `<section>` tags; dense chrome |
| `/shadow.html` | many | strong | yes | Duplicates home capability (two doors) |
| `/for-ai.html` | 14 named sections | excellent | **best** | Agent map not mirrored on every lab |
| `/dojo/` | 82 | strong | yes | Heavy; `/dojo.html` is **SPA shell** (wrong) |
| Letter-grid / cage | 1–10 | thin | **weak in HTML** | Mount-only shells; few crawlable anchors |
| Agent play / pipe | few | weak | partial | Several **no h1** / no outbound links |
| `/labs/collab` | 2 | thin | claimed | Looks unfinished vs DOJO |

### Critical crawl defects (pre-P0; most fixed)

1. **SPA fallback pollution** — Extensionless or mis-routed URLs return the **home Shadow shell** with title “type once, understand everywhere” (e.g. `/dojo.html`). Crawlers and MG think “page loaded” when it’s the wrong product.  
2. **Relative-link explosion** — From deep labs, relative `docs` / `install` links create `/labs/.../labs/labs/...` ghosts (crawl saw nested paths; all shells).  
3. **Duplicate doors** — Every major page exists as both `/foo` and `/foo.html` (good for hosting, doubles IA noise).  
4. **Local static server ≠ CF** — `:8899` lacks pretty routes + MCP; MG on local shadow is fine for UI, not for agent tools.  
5. **High inbound to missing / external** — Graph points hard at:
   - `/quantum-gutter.html` (118) — not a first-class kbatch page (lives on mueee)  
   - `/GrokYtalkY/` (94)  
   - `/codex-regius-digital/paleography-hub.html` (93)  
   - `/qbitOS` (36)  
   Many are cross-site or 404 in pure kbatch context → **broken promise of one mesh**.  
6. **Letter-grid agent surfaces** under-anchored — few `id`s → cannot `scrollToSection` / deep-link the way ugrad-r0 can.  
7. **data.ugrad.ai/kbatch/** index **404** — remote corpus packs optional; documented, but weak vs “live world data” claim.

---

## 2. Same-lane collabs / competitors (axes KBatch already claims)

KBatch sits at the **intersection** of several lanes. Each lane has a “best of breed” that owns UX simplicity; KBatch’s bet is **geometry + multi-layout + agent MCP + culture/history**.

### Lane A — Keyboard layout analysis / ergo

| Player | Strength | Weakness vs KBatch |
|--------|----------|--------------------|
| **patorjk Keyboard Layout Analyzer** | Paste corpus → rank layouts; heatmaps; famous | English/layout-centric; no languages/agents |
| **Workman / Colemak sites** | Clear story, one layout | Not a platform |
| **keybr / Monkeytype** | Habit loops, gamified speed | Not geometry/shadows; not multi-script |
| **Kanata / QMK configurators** | Firmware power users | Offline-ish; not linguistic |

**KBatch edge:** 15-layout shadows in one type-once stroke; path rank; language×alphabet matrix.  
**KBatch lag:** First-run clarity, “why this beats KLA in 30s” demo, mobile typing comfort.

### Lane B — Stenography / chording

| Player | Strength | Weakness vs KBatch |
|--------|----------|--------------------|
| **Plover / Open Steno** | Real steno system, community | Court-reporting model; steep |
| **QMK steno / ZSA Oryx** | Hardware path | Not linguistic dictionary |
| **Whitespace stego tools** | Niche crypto | No UI product |

**KBatch edge:** Steno-as-**whitespace codec** + glyph-in-spaces + QFS/GlueLam (unique).  
**KBatch lag:** Naming collision (“steno” ≠ Plover); need one sentence + live strip demo on `/` hero.

### Lane C — Agent tools / MCP / LLM

| Player | Strength | Weakness vs KBatch |
|--------|----------|--------------------|
| **Browser-use / Playwright agents** | Generic web | No geometric domain tools |
| **Claude/Cursor MCP hosts** | Distribution | Need high-value domain tools |
| **LangChain tool catalogs** | Ecosystem | Generic |

**KBatch edge:** Live MCP (`lettergrid_ping` 6235 glyphs, cage, shadows, chart_lookup, path_rank). `/for-ai` is unusually good.  
**KBatch lag:** Manifest URL sometimes SPA-falls-back; tools not auto-listed on every lab; no “install MCP in 1 click” badge on home.

### Lane D — Digital humanities / paleography / archives

| Player | Strength | Weakness vs KBatch |
|--------|----------|--------------------|
| **Library of Congress / NARA viewers** | Authority, scans | Not interactive geometry |
| **Transkribus / eScriptorium** | HTR ML | Heavy academic UX |
| **IIIF viewers** | Standard | Not keyboard-path |

**KBatch edge:** Declaration letter-grid, cage litmus, paleography hub as **playable** research.  
**KBatch lag:** Labs feel like separate apps; weak breadcrumb back to Shadow; few section ids for MG scroll discipline.

### Lane E — Music / lyrics / culture geometry

| Player | Strength | Weakness vs KBatch |
|--------|----------|--------------------|
| **Genius / Musixmatch** | Lyrics corpus | No keyboard geometry |
| **Music notation tools** | Staff truth | Not multi-layout typing |

**KBatch edge:** Lyrics → line geometry → keyboard flow; music-staff lab.  
**KBatch lag:** Rights banners exist; partner story must stay human-gated; chart packs need reliability.

### Lane F — Collab / multiplayer / mesh

| Player | Strength | Weakness vs KBatch |
|--------|----------|--------------------|
| **Figma multiplayer** | Real-time UX gold standard | Not this domain |
| **Excalidraw / tldraw** | Simple collab canvas | Not linguistic |
| **ugrad / qbitos mesh** | Sister stack | Cross-link confusion |

**KBatch edge:** Mesh docs + collab lab scaffold + multi-device claims.  
**KBatch lag:** `/labs/collab` is thin; mesh not visible in first 10 seconds of `/`.

---

## 3. Competitive scorecard (honest)

| Dimension | Best-in-lane | KBatch today | Gap |
|-----------|--------------|--------------|-----|
| Time-to-value (first type) | keybr / Monkeytype | Medium | Guided first glyph tour |
| Layout science credibility | patorjk KLA | Strong math, weak marketing | Side-by-side KLA export |
| Steno clarity | Plover | Confusing name | Rename UI: “whitespace codec” primary |
| Agent integration | (emerging) | **Leading** | Surface MCP on home + labs |
| Archive seriousness | NARA/IIIF | Playful + deep | Provenance strip on every Declaration surface |
| IA cleanliness | Simple tools | **Overloaded** | 3-tier nav + hide advanced |
| Cross-site mesh | — | Broken links | Proxy or drop dead links |
| Section/deep-link (MG) | ugrad-r0 | Weak on labs | Add `data-section` everywhere |
| Mobile | Typing sites | Heavy SPA | Shadow-solo already; push it |
| Trust / load reliability | Static tools | Thrash-sensitive ESM | Smaller entry chunks; SSR shell |

**Overall:** KBatch is a **research OS** pretending to be a **single app**. That is the opportunity *and* the UX risk. Competitors win by being *one* lane well; KBatch wins by becoming the **glue plane** (geometry × language × agents × culture) without looking like 20 half-products.

---

## 4. Recommendations (prioritized)

### P0 — Stop lying to crawlers and users (1–2 days)

1. **Fix SPA fallback** for unknown paths → proper 404 page (not home Shadow). Especially `/dojo.html` → redirect 301 to `/dojo/`.  
2. **Kill relative link traps** — all site-nav and footer links must be **root-absolute** (`/docs`, `/install`).  
3. **Canonical URLs** — pick extensionless; redirect `.html` → clean path (or reverse); set `<link rel="canonical">`.  
4. **Outbound mesh policy** — for `/quantum-gutter.html`, `/GrokYtalkY/`, `/qbitOS`: either  
   - reverse-proxy under `kbatch.ugrad.ai/mesh/…`, or  
   - mark external with icon + `rel=noopener` and stop counting as internal IA.

### P1 — One “front door” story (3–5 days)

5. **Home hero rewrite** (3 beats only):  
   1. Type a word → see 15 shadows  
   2. Rank path / health  
   3. “Agents: open /for-ai · MCP live”  
6. **Collapse dual home** — `/shadow` is the product; `/` = same or marketing strip + launch Shadow.  
7. **Declaration lab hub** — one landing with cards (grid, cage, pipe, paleography) all with **section ids** and agent deep-links.  
8. **for-ai as system map** — auto-generated from crawl (this report) + MCP tool list; badge “6235 glyphs · ping ok”.

### P2 — Beat each lane with one killer loop

| Lane | Ship |
|------|------|
| vs KLA | “Paste sample → KBatch path_rank + export JSON that KLA can’t” |
| vs Monkeytype | 60s Shadow drill on `/labs/typing` with layout switch mid-run |
| vs Plover | “Whitespace codec” live strip on home (not buried steno docs) |
| vs generic MCP | Cursor/Claude config snippets **copy-one-click** on every lab footer |
| vs archives | Provenance + NARA glossary link on cage + letter-grid |
| vs Figma collab | Make `/labs/collab` do one real multi-cursor shadow session or unpublish |

### P3 — Structure for Memory Glass + QFS

9. **Section discipline** — every major block: `id` + `data-section` (match ugrad / QFS).  
10. **MG crawl mode** — TOOLS → Qbit → “Atlas crawl” that walks `site-nav` routes only (no thrash of relative ghosts).  
11. **Agent HTML** — letter-grid-agent / pipe pages need real h1, outbound “back to for-ai#declaration-lab”, and status ids.  
12. **GlueLam parity** — vendor on CF matches uvspeed; document QFS readiness on `/docs#gutter`.

### P4 — Partnership / axes (`/world-ranking`)

13. Treat axes as **collab menu**, not SEO list: each axis = problem, KBatch surface, partner ask, status (live / scaffold).  
14. Human-gated outreach only (existing policy).  
15. Museum kits: one downloadable “exhibit in a box” that works offline.

---

## 5. Suggested IA (target)

```
kbatch.ugrad.ai
├── /                 → Shadow Live (core loop)
├── /for-ai           → Agents + MCP + declaration-lab map
├── /dojo/            → Matrices · atoms · world-path (power)
├── /learn            → Skills
├── /labs
│   ├── declaration/  → hub (grid · cage · pipe · paleography)
│   ├── typing        → drills
│   ├── music-staff
│   ├── living-books
│   ├── rosetta · lang-tree · ancestory
│   └── collab        → real or hidden
├── /lyrics · /research · /museum · /world-ranking
├── /docs · /install
└── /mesh/*           → proxied sister products (gutter, ugrad, qbitOS)
```

**Nav chrome:** 6 items max in primary: Shadow · Learn · Labs · DOJO · For AI · Docs. Everything else under Labs/More.

---

## 6. What MG should do on the site (operating model)

| Mode | Action |
|------|--------|
| **Crawl** | Walk `site-nav.js` routes only; record title/ids/h1; flag SPA shells |
| **Section** | Prefer `#declaration-lab`, DOJO headings, Shadow `#search-input` |
| **Terminal** | ugrad-r0 `μgrad>` for train/steno; not on Shadow |
| **Suggest** | Diff this report vs live crawl weekly |
| **Never** | Relative-link thrash, ⌘⇧R during ESM boot, type into half-loaded Shadow |

---


## 7. Quick wins checklist (updated)

- [x] 404 page + `/dojo.html` → `/dojo/`  
- [x] Absolute nav links (site-nav + DOJO)  
- [x] Home 3-beat + MCP ping badge  
- [x] for-ai#declaration-lab on letter-grid / cage / hub  
- [x] Declaration hub cards + section ids  
- [x] External mesh hub `/mesh/`  
- [x] Letter-grid agent strip anchors  
- [ ] Whitespace codec naming on hero (not buried “steno”)  
- [ ] MCP one-click config footer on labs  
- [ ] Collab: real session or hide/honesty  
- [ ] Primary nav 6-item slim  
- [ ] Weekly crawl automation  

---
## 8. Bottom line

KBatch is **ahead** on agent geometry (MCP + letter-grid + multi-layout shadows) and **behind** on product focus and link hygiene. Same-lane tools win by being simple; you win by being the **only system that connects type → path → language → archive → agent**.

Make the front door as sharp as patorjk/keybr, keep the basement as deep as DOJO/Declaration, and make every lab speak **For AI + scroll sections** the way ugrad-r0’s terminal already does.

*Generated for Memory Glass site-atlas style review. Data: crawl.json.*
