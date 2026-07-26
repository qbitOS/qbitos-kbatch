# Memory Glass × KBatch — terminal writeup

**Status:** session brief for Grok / DOJO agents  
**Saved:** 2026-07-18  
**Sources:** fornevercollective/grok-build · `experiments/memory-glass/` · KBatch-dictionary  

**Mission (one line):** Make **kbatch** the geometry/strain/world-language brain and **Memory Glass** the glass WebGrid body — clear playfield, main-only chrome, strain-true contrails, tight dojo↔composer↔steno↔story loop.

**Related:** [ASSET-MAP-LIVING-BOOKS.md](./ASSET-MAP-LIVING-BOOKS.md) · [labs/living-books.html](../labs/living-books.html) · MG `hotpipe/KBATCH_SESSION.md`  

**Live paste URL:** https://kbatch.ugrad.ai/handoff/MEMORY-GLASS-KBATCH.md

### Bidirectional sync · acknowledged

| Side | Commit / note |
|------|----------------|
| **Memory Glass** | `001cdcb` — `docs(mg): sync KBatch FN honor-seed + accreditation handoff` · hotpipe → `~/Applications/Memory Glass.app` resign-signed |
| **MG docs** | `experiments/memory-glass/docs/KBATCH-HANDOFF.md` · ledger `MEMORY-GLASS-HANDOFF.md` · LEAP_MAP addenda |
| **Glass TOOLS** | LEARN · HANDOFF · TERM (+ KBATCH/DOJO) |
| **Glass BOOKS** | LAB · FN ETHIC · ACCREDIT · HANDOFF · BEATS→ |
| **KBatch live** | 15× `honor-seed` · 191 skills · 7 accreditation families · handoff 200 |

**Doctrine (both sides):** FN educational seed only · community gate · no mass scrape · certified = prep habits not exam banks · security = defensive only (no exploits).

---

## Session brief (paste into Grok / DOJO)

Memory Glass × KBatch — terminal writeup (paste into Grok / DOJO)

Copy everything below into your kbatch Grok terminal (or DOJO agent context) as a session brief.

───

Context: what Memory Glass is to KBatch

Memory Glass = native macOS droplet browser (fornevercollective/grok-build → experiments/memory-glass/)
KBatch = path-first geometry + world languages + dojo MCP (https://kbatch.ugrad.ai)

They share one control-surface language: path · shadow · strain · steno · SO order · capsules — not “another website tab.”

┌────────────┬───────────────────────────┬─────────────────────────────────┐
│ Layer      │ KBatch                    │ Memory Glass                    │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ Path       │ keyboard geometry /       │ WebGrid contrail + float        │
│            │ stenoSTRIP                │ keyboard path                   │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ Strain     │ analyze metrics s, finger │ contrail color bands (intended: │
│            │ strain colors             │ green→gold→red)                 │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ Shadows    │ 15 layouts L[] via        │ dojo bridge seeds phrase →      │
│            │ analyze_lite              │ shadows/words                   │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ Steno /    │ whitespace stego, gyg1    │ snapshot→13×13 glyph→steno      │
│ glyph      │ glyph matrices            │ capacity test                   │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ World      │ packs / word slivers /    │ phrase→data.ugrad.ai prefix +   │
│            │ learn                     │ world hits                      │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ SO order   │ SSO / OSO / SOS…          │ phrase SO n-grams on seed text  │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ Rubik /    │ language cube + quantum   │ links + gutter stream from      │
│ gutter     │ -gutter                   │ binary                          │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ Living     │ capsules, school skills,  │ contrail storyBeat → beats      │
│ books      │ LOC/PD                    │ export                          │
├────────────┼───────────────────────────┼─────────────────────────────────┤
│ Unsolved   │ unsolved-manuscripts.json │ deep-zoom survey · path · Cage  │
│ MSS        │ hi-res docs + batch jobs  │ · independent study · beats     │
└────────────┴───────────────────────────┴─────────────────────────────────┘

**Unsolved pack (MG batch):** `/data/living-books/unsolved-manuscripts.json` · lab fold on `labs/living-books.html` · docs [UNSOLVED-MANUSCRIPTS-MG.md](./UNSOLVED-MANUSCRIPTS-MG.md)

Repo / app

• Code: /Volumes/qbitOS/00.dev/projects/grok-build/experiments/memory-glass/
• Hotpipe (JS inject): hotpipe/*.js — ships without full Rust rebuild when only JS changes
• App: ~/Applications/Memory Glass.app (resign after native binary change)
• Data: ~/.panda/mg-soak/ (play.jsonl, train/, flip-board-live/, contrail trials in localStorage)

Recent MG commits (link chain)
LEAP filmstrip · glass Dragon capsule · float keyboard · kbatch-dojo-bridge · contrail v3 strain — see fornevercollective/grok-build main.

───

Known issue: “no contrails” when mouse over the new window

What you saw: browser opens; cursor is already over the window; window chrome/highlight steals focus; contrail overlay looks missing or empty.

Why (likely stack):

1. Contrail only runs on neuralink.com + path /webgrid/ — not on other MG tabs.
2. Trail is pointer-driven (pointermove / agent shots). If focus/events go to inspect, float keyboard, pattern-flow panel (pointer-events: auto), or OS window-move highlight, samples never accumulate on the game canvas.
3. Chrome defaults on: float keyboard + pattern-flow + glass capsule sit bottom-center and can cover the playfield / score.
4. Hotpipe injects into main and inspect → duplicate keyboard/capsule on the right pane (see dual “Dragon · glass” in screenshots).
5. Solid green trail when it does draw: agent path marks almost all samples as success → green; kbatch strain often arrives after the scribble, so colors don’t vary mid-stroke.

Immediate recovery (main WebGrid page console):

// Clear blockers, force trail + flow
if (window.__mgFloatKb) __mgFloatKb.close();
if (window.__mgContrail) {
  __mgContrail.setOverlay(true);
  __mgContrail.setFlow(true); // or false to free the board
}
document.getElementById("mg-glass-cap")?.classList.add("collapsed");
// Confirm inject surface
console.log({
  contrail: window.__mgContrail?.ver,
  kbatch: window.__mgKbatchDojo?.ver,
  kb: window.__mgFloatKb?.ver,
  isInspect: !!document.getElementById("pip-wrap"),
});

Play hygiene: after launch, click once on the blue-grid canvas (not the glass dock) so pointer events hit WebGrid, then move. Prefer moving the cursor off the window until the page loads if OS “highlight under cursor” steals first moves.

───

APIs already on the WebGrid page (agent can use)

// Contrail
__mgContrail.report()
__mgContrail.exportStoryBeats()   // living-book beats
__mgContrail.lastDojo?.()         // last kbatch phrase report
__mgContrail.setOverlay(true|false)
__mgContrail.setFlow(true|false)

// KBatch dojo bridge (HTTP MCP + data plane)
await __mgKbatchDojo.runPhrase("E2SEN3")  // or float-kb buffer as seed
__mgKbatchDojo.strainColor(67)            // rgba for HUD
__mgKbatchDojo.last()

// Glass + keyboard
__mgGlassCap.setMode("tools"|"qbit"|"lark"|"mkt"|"vid"|"books")
__mgFloatKb.open(); __mgFloatKb.close(); __mgFloatKb.buffer()

// Staff notation catalogue (KBatch data/music-staff · MG Beats)
__mgKeyboardBeats.loadCatalogueId("scale-c-ionian")
__mgKeyboardBeats.loadCatalogueId("motif-ode-joy")
// Browser: https://kbatch.ugrad.ai/labs/music-staff.html · window.__kbatchStaff

// Native IPC (when in MG WKWebView)
// ipc: navigate | media_feed | load_filmstrip | page_zoom | clipboard_copy

KBatch HTTP tools MG actually hits today

• POST https://kbatch.ugrad.ai/api/mcp
  • kbatch_analyze_lite → strain s, shadows L[], binary bi, …
  • (full kbatch_shadows / kbatch_world_predict are browser dojo tools — not all on HTTP)

• Word prefix: https://data.ugrad.ai/kbatch/words/en/{letter}.json

Browser-only (open DOJO):

await kbatchDict.mcp('kbatch_analyze', { text: '…' })
await kbatchDict.mcp('kbatch_world_predict', { text: '…', limit: 12 })
await kbatchDict.mcp('kbatch_glyph_steno', { mode: 'encode', text: 'carrier', pixels: '…', n: 13 })
await kbatchDict.mcp('kbatch_quantum_binary', { text: '…', binary: '01…' })

───

Extension goals (prioritized for the terminal agent)

P0 — Unblock play (must-do)

1. Main-only chrome: do not mount float keyboard / glass capsule / contrail-flow on inspect (#pip-wrap present → return).
2. Default off during WebGrid autoplay: keyboard closed, pattern-flow closed or phase=end only, capsule collapsed.
3. Dock chrome off-playfield: pattern flow → inspect under PIP or right edge; keyboard → inspect bottom or bottom-right pocket (~40% width).
4. Click-to-arm trail: first pointerdown on canvas enables sampling (avoids empty trail when window opens under the cursor).

P1 — Strain-true contrails (kbatch-linked)

1. Color per segment from local jerk/curvature/velocity before dojo returns.
2. On runPhrase resolve: write strain onto stroke samples and redraw.
3. Map kbatch bands: s≥70 red, ≥40 gold, else green (same as kbatch contrails-viz).
4. Thin agent trail (last N samples / lower alpha) so 300+ BPS scribble isn’t a solid green sheet.

P2 — Composer phrase → world languages (dojo)

On each stroke / PHRASE→DOJO:

1. Seed = float-KB buffer or phrase→seed (E2SE… → keys).
2. analyze_lite → list latin L[] shadows as cross-layout “word-shaped” hits.
3. Prefix-fetch world words; show in composer: phrase → word  s{strain}.
4. SO n-grams SSO / OSO / SOS… for sentence-order phrasing.
5. Optional: open dojo with ?q= for full CapsuleAnalyzer.

P3 — stenoSTRIP + glyph binary image feed

1. Contrail overlay (or still-pipe frame) → 13×13 (or 25×25) bits.
2. encodeGlyphInSteno(carrier, bits) — whitespace budget vs bit length (canCarryImage).
3. Round-trip test: encode → decode → PSNR / bit error.
4. Mesh/blank channel: BroadcastChannel kbatch-blank (already used by float KB ANALYZE).

P4 — Quantum gutter + Rubik language pack

1. Binary bi / glyph bits → gutter stream (0:, 1:, +n: …) aligned with quantum-gutter.html.
2. Rubik faces U/D/F/B/L/R heat from path modality; SO order as sticker sequencing.
3. Sentence phrasing pack: templates tagged SSO/OSO/SOS for living books + learn rungs.

P5 — Living books link

1. exportStoryBeats() → moods triumph/tension/wonder/rush/journey.
2. Lab: KBatch-dictionary/labs/living-books.html
3. Creator: ugrad-ant/kids-book-creator.html + LOC classics only (PD).
4. Capsule skill: lit_gutenberg_index / living-book center — no commercial scrape.

───

File map (where to extend)

experiments/memory-glass/
  hotpipe/
    kbatch-dojo-bridge.js   # MCP + SO + steno/glyph + strainColor
    webgrid-contrail.js     # trail + pattern flow + dojo hook
    float-keyboard.js       # Neuralink hit targets + kbatch tools
    glass-capsule-shell.js  # single glass Dragon panel
    sx-rail-chrome.js       # glass tokens; hides old rails
    inspect-dock.js         # PIPE… QBIT; BOOKS / BEATS
  scripts/
    flip-train-bridge.py    # domain webgrid_contrail
    launch-webgrid-laptop.sh
  src/main.rs               # inject order; media_feed; filmstrip

KBatch side:

KBatch-dictionary/
  js/steno-strip.js, glyph-steno.js, quantum-gutter.js
  js/rubik-language-map.js, order-analysis.js, contrails-viz.js
  mcp/manifest.json         # tools list + HTTP subset
  labs/living-books.html
  docs/ASSET-MAP-LIVING-BOOKS.md - Memory Glass ↔ KBatch — Grok terminal handoff

Paste this into the kbatch Grok terminal as project context / next-session brief.

───

Goal

Extend kbatch.ugrad.ai (geometry, dojo, steno, world packs, strain) as the path/language spine, and Memory Glass (fornevercollective/grok-build · experiments/memory-glass) as the glass browser + WebGrid train + contrail/story surface. Link them further without mass-merging forks or auto-trading.

Differentiator: agent + vision + train bus + filterable market filmstrip + living-book beats — not generic tabs, not a brokerage.

───

Repos / paths

┌──────────┬───────────────────────────────────────────────────────────────┐
│ Surface  │ Location                                                      │
├──────────┼───────────────────────────────────────────────────────────────┤
│ MG fork  │ https://github.com/fornevercollective/grok-build · main (     │
│          │ ahead of xai-org/grok-build; unrelated roots — cherry-pick    │
│          │ harness only)                                                 │
├──────────┼───────────────────────────────────────────────────────────────┤
│ MG app   │ ~/Applications/Memory Glass.app · hotpipe in Contents/        │
│          │ Resources/hotpipe/                                            │
├──────────┼───────────────────────────────────────────────────────────────┤
│ MG       │ /Volumes/qbitOS/00.dev/projects/grok-build/experiments/memory │
│ source   │ -glass/                                                       │
├──────────┼───────────────────────────────────────────────────────────────┤
│ KBatch   │ /Volumes/qbitOS/00.dev/projects/KBatch-dictionary/ (often not │
│          │ a git repo on this volume)                                    │
├──────────┼───────────────────────────────────────────────────────────────┤
│ Live     │ https://kbatch.ugrad.ai/ · dojo · MCP                         │
│          │ https://kbatch.ugrad.ai/api/mcp                               │
├──────────┼───────────────────────────────────────────────────────────────┤
│ Data     │ https://data.ugrad.ai/kbatch/                                 │
│ plane    │                                                               │
├──────────┼───────────────────────────────────────────────────────────────┤
│ Living   │ KBatch-dictionary/labs/living-books.html                      │
│ books    │                                                               │
│ lab      │                                                               │
├──────────┼───────────────────────────────────────────────────────────────┤
│ Kids     │ /Users/tref/dev/projects/ugrad-ant/kids-book-creator.html     │
│ creator  │                                                               │
├──────────┼───────────────────────────────────────────────────────────────┤
│ LOC PD   │ /Users/tref/dev/projects/ugrad-ant/loc-classic-childrens      │
│ books    │ -books/ (~879MB, 26 titles)                                   │
└──────────┴───────────────────────────────────────────────────────────────┘

Doctrine: PD / LOC / cited only. No commercial book piracy. No auto-trading.

───

What already links them

Hotpipe inject tag (recent builds)

…+webgrid+mkt+vid+lark+qwg+sx+kbatch+contrail+gcap+fkb

┌────────────────┬─────────────────────────────────────────────────────────┐
│ Module         │ Role                                                    │
├────────────────┼─────────────────────────────────────────────────────────┤
│ kbatch-dojo-   │ MCP kbatch_analyze_lite + word-pack prefix → strain, 15 │
│ bridge.js      │ shadows, SO order, steno/glyph, quantum gutter          │
├────────────────┼─────────────────────────────────────────────────────────┤
│ webgrid-       │ Path phrasing, pattern flow (unwind / flat / composer), │
│ contrail.js    │ story beats                                             │
├────────────────┼─────────────────────────────────────────────────────────┤
│ float-keyboard │ Large-target KB → kbatch / dojo / blank / analyze       │
│ .js            │                                                         │
├────────────────┼─────────────────────────────────────────────────────────┤
│ glass-capsule  │ One Dragon glass panel (TOOLS/QBIT/LARK/MKT/VID/BOOKS)  │
│ -shell.js      │                                                         │
├────────────────┼─────────────────────────────────────────────────────────┤
│ sx-rail-chrome │ Glass tokens; hides legacy full-height rails            │
│ .js            │                                                         │
└────────────────┴─────────────────────────────────────────────────────────┘

APIs (in MG WKWebView console)

__mgKbatchDojo.runPhrase("E2SEN3")     // dojo analyze + world words
__mgKbatchDojo.last()
__mgContrail.exportStoryBeats()        // overnight → living books
__mgContrail.lastDojo()
__mgFloatKb.toggle()
__mgGlassCap.setMode("tools")

Pipeline (intended)

WebGrid play → contrail strokes → kbatch strain + shadows + SO (SSO/OSO/SOS)
  → storyBeat{mood,glyph,hint} → living-books lab / kids-book-creator
  → stenoSTRIP whitespace + 13×13 glyph binary (snapshot feed test)
  → quantum gutter / rubik faces (mueee hosts)

HTTP MCP tools actually live on the edge
kbatch_analyze_lite, kbatch_word_index, kbatch_world_path, capsules, charts, school…
Not on HTTP (browser dojo only): full kbatch_shadows, kbatch_world_predict, kbatch_glyph_steno as in-page MCP. Bridge uses analyze_lite + data plane word JSON.

───

Known bugs (from live play + screenshot)

1) Keyboard + pattern flow obscure the game
Fixed bottom stack on main: float KB + Dragon capsule + contrail pattern flow all position:fixed center-bottom, high z-index, some pointer-events: auto.

2) Chrome duplicated on inspect
inject_live_js hits main + inspect → keyboard/capsule appear in both. Guard with if (document.getElementById("pip-wrap")) return; for float-kb / glass-cap / contrail flow (overlay may stay main-only).

3) Trail looks solid green
Agent shots force outcome=hit → traj=success → green until async strain returns. Dense scribble + late lastStrain ⇒ monochrome mesh. Need per-segment kinematic stress + redraw after dojo, thinner agent trail.

4) Mouse over window → no contrails (user report)
Very likely:

┌──────────────┬───────────────────────────────────────────────────────────┐
│ Mechanism    │ Why trails vanish                                         │
├──────────────┼───────────────────────────────────────────────────────────┤
│ Window/hover │ Capsule/KB/pattern-flow under the cursor steal hits or    │
│ chrome       │ sit over canvas                                           │
├──────────────┼───────────────────────────────────────────────────────────┤
│ Focus /      │ Watcher/agent may pause when pointer leaves canvas or     │
│ phase scrape │ hits non-game chrome                                      │
├──────────────┼───────────────────────────────────────────────────────────┤
│ Hover        │ OS or WK focus ring on the glass window doesn’t kill JS   │
│ highlight    │ by itself — more often pointer is not on the game canvas, │
│              │ so pointermove samples stop or only sample chrome         │
├──────────────┼───────────────────────────────────────────────────────────┤
│ Dual surface │ Moving to inspect focuses the other webview; main         │
│              │ contrail still runs but you’re looking at inspect with no │
│              │ game                                                      │
└──────────────┴───────────────────────────────────────────────────────────┘

Working theory to verify: contrail only records pointermove on the document; if the OS “highlighted” the window chrome or the cursor sits on overlay panels, you get little/no path on the grid. Agent autoplay still paints green mesh when the agent fires synthetic points.

Mitigations for the kbatch terminal to implement in MG:
1. Default hide float KB + pattern flow + collapse capsule during WebGrid playing.
2. Main-only inject for gcap/fkb/contrail-flow.
3. Contrail: sample from canvas bounding box only; ignore events over #mg-float-kb, #mg-glass-cap, #mg-contrail-flow.
4. Optional: keep last trail visible when pointer leaves canvas (don’t clear on blur).
5. When launching WebGrid, move pointer programmatically off chrome or set showOverlay true only after first in-canvas sample.

───

What the kbatch terminal should build next

Priority order:

P0 — Unblock play surface
• [ ] Main-only inject for keyboard, glass capsule, contrail flow panel
• [ ] Default: KB off, pattern flow off, capsule collapsed on neuralink.com/webgrid
• [ ] Dock pattern flow to inspect under PIP or a thin right edge strip on main
• [ ] Event filter: ignore pointer events whose target is chrome ids

P1 — Strain-true contrails
• [ ] Color by local jerk/curvature/v before dojo
• [ ] On runPhrase resolve: stamp strain on stroke points + full redraw
• [ ] Cap path length / agent alpha so mesh doesn’t wash out green
• [ ] Map kbatch precomputed.s bands exactly like js/contrails-viz.js (>60 red, >30 gold, else green) with finer steps already in __mgKbatchDojo.strainColor

P2 — Composer → world languages (deeper)
• [ ] After each stroke: show top world words + latin shadows in glass capsule (not only pattern strip)
• [ ] Optional: open dojo with seed https://kbatch.ugrad.ai/dojo/ + postMessage payload
• [ ] Wire float-KB ANALYZE → runPhrase + display SO hits (SSO/OSO/SOS) in capsule

P3 — stenoSTRIP + glyph image feed
• [ ] Round-trip test: contrail snapshot → 13×13 bits → steno whitespace → decode → re-draw
• [ ] Document bit budget vs canCarryImage in living-books lab
• [ ] Align with js/glyph-steno.js / js/steno-strip.js (copy pure functions into MG or fetch dojo page and use kbatchDict.mcp if CORS allows)

P4 — Quantum gutter + Rubik sentence order
• [ ] Expose SO n-grams + gutter preview in QBIT glass mode
• [ ] Link phrase order (SSO/OSO/SOS) to rubik face heat (written/spoken/movement…) for “language pack” sketches
• [ ] Hosts: https://mueee.qbitos.ai/quantum-gutter.html, rubiks-ugrad.html

P5 — Living books
• [ ] One-click: __mgContrail.exportStoryBeats() → labs/living-books.html
• [ ] PD footer from LOC manifest.json or capsule gutenberg_id
• [ ] Keep creator under ugrad-ant until SPA merge is deliberate

P6 — Git / product hygiene
• [ ] Do not merge upstream monorepo blindly (see docs/fornever-ledger/UPSTREAM_CHERRY.md)
• [ ] After hotpipe edits: copy to app Resources + scripts/resign-app.sh
• [ ] Launch: scripts/launch-webgrid-laptop.sh --large --rounds 1

───

Quick debug snippets (MG main WebGrid console)

// See if chrome is blocking
$$('#mg-float-kb,#mg-glass-cap,#mg-contrail-flow').forEach(el => {
  console.log(el.id, el.getBoundingClientRect());
});

// Clear blockers during play
__mgFloatKb?.close();
__mgContrail?.setFlow(false);
document.getElementById('mg-glass-cap')?.classList.add('collapsed');

// Force trail visible
__mgContrail?.setOverlay(true);

// Run last phrase through kbatch
await __mgKbatchDojo.runPhrase(__mgContrail?.stats?.lastPhrase || 'path');
console.log(__mgKbatchDojo.last());

───

Session note for the human (mouse / highlight)

When the browser window opened under the cursor and the window chrome highlighted, contrails often won’t draw on the grid because:

1. Pointer is on shell chrome (or OS focus affordance), not the WebGrid canvas → few/no path samples.
2. Or pointer is on our bottom stack (keyboard / pattern flow / capsule) → samples and/or view blocked.
3. Agent autoplay can still paint a green agent mesh independent of your mouse; human “no contrails” usually means no human path, not that inject failed.

Play recipe: launch WebGrid → immediately HIDE keyboard (or leave it closed) → collapse Dragon capsule → keep mouse inside the blue-grid canvas → watch path + pattern strip. Use inspect for CAM/MIC/dock; keep game chrome minimal on main.

───

One-line mission for this terminal

Make kbatch the geometry/strain/world-language brain and Memory Glass the glass WebGrid body: clear the playfield, main-only chrome, strain-true contrails, and a tight dojo↔composer↔steno↔story loop — without obscuring the game when the cursor is on the board.

───

Recent commits to know

┌─────────────────────────────────┬────────────────────────────────────────┐
│ Commit (approx)                 │ Topic                                  │
├─────────────────────────────────┼────────────────────────────────────────┤
│ LEAP / filmstrip / rails        │ Market + quantum + lark + video        │
├─────────────────────────────────┼────────────────────────────────────────┤
│ Glass capsule + float KB        │ Dragon glass morphism + Neuralink      │
│                                 │ -style KB                              │
├─────────────────────────────────┼────────────────────────────────────────┤
│ kbatch dojo bridge + strain     │ Phrase→world words, steno/glyph, SO/   │
│ colors                          │ gutter                                 │
└─────────────────────────────────┴────────────────────────────────────────┘

Repo: fornevercollective/grok-build · path experiments/memory-glass/.

───
