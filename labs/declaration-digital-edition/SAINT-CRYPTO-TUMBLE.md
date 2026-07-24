# Saint · Crypto Tumble Live

**Tone:** educational cypher salon (Saint-movie *style* intrigue), not a black-hat toolkit.  
**When:** After Letter-Grid + Cage litmus are fully grown — this is the conversation layer.

## Pitch

Take **two short conversations**, cast three voices, and **tumble** them live through the dictionary stack so the same geometry tools that score Letter-Grid also *speak*:

| Voice | Role | Stack bias |
|-------|------|------------|
| **Vals** | Handler / control cipher | DAC prefixes · written/digital/thought faces |
| **Human Fly** | Path hopper | StenoStrip blank coins · movement/analog · letter hop |
| **Boris** | Stone / RAW weight | Quantum gutter errors & returns · challenges fiction |

**Live product:** one interleaved tape + Rubik 3×3 face heat + Letter-Grid glyph seed + MG scrape.

## Tool map (dictionary is source of truth)

| Tool | Dictionary home | Tumble use |
|------|-----------------|------------|
| **DAC / prefixes** | `vendor/gluelam/qbit-dac.js` · quantum-prefixes | Every beat gets a gutter prefix (`0:`, `+n:`, `-1:`, …) |
| **StenoStrip** | `js/steno-strip.js` | Blank-space coin capacity · demo side-channel tail on each line |
| **Quantum Gutter** | `js/quantum-gutter.js` | 11-symbol speech classification rail |
| **Rubik 3×3 language** | `js/rubik-language-map.js` | Faces U/D/F/B/L/R heat net · move labels |
| **Letter-Grid** | `js/declaration-letter-grid.js` | Ordered letter seed → timed codex pass |
| **Cage litmus** | cage-litmus | Boris lane: FACT / FICTION / STONE_TRAP doctrine |

Saint Tumble ships a **self-contained mixer** (`js/saint-crypto-tumble.js`) that mirrors those semantics offline. Deep analysis still happens on the main dictionary page when GlueLam + Rubik modules are live.

## Pipeline

```
Conv A ──┐
         ├─ parse speaker:line → cast Vals|Fly|Boris
Conv B ──┘
         ↓
   classify prefix (speech patterns + cast bias)
         ↓
   pick Rubik face (cast faceBias · step)
         ↓
   steno coin analysis + optional tail spaces
         ↓
   DAC line = prefix + text + steno tail
         ↓
   tumble mode: zip | face-rotate | boris-heavy
         ↓
   live tape · face heat · letter seed · markdown report
         ↓
   Memory Glass  __mgSaintTumble / __saintTumbleApi
         ↓
   optional → Letter-Grid (?from=saint)
```

## Tumble modes

| Mode | Behavior |
|------|----------|
| `zip` | A₁ B₁ A₂ B₂ … classic two-talk interleave |
| `face-rotate` | Sort beats by Rubik face id (U→…→R) |
| `boris-heavy` | Stone lane first each step (truth challenges story) |

## Surfaces

| URL | Role |
|-----|------|
| `saint-tumble.html` | Live mixer UI |
| `letter-grid.html` | Consume glyph seed / score stair |
| `/` dictionary | Full Rubik atlas · gutter · steno panels |
| MG | `__saintTumbleApi.run()` · event `saint-tumble-done` |

## Memory Glass

```js
const st = window.__saintTumbleApi;
const rep = st.run();
// rep.tape · rep.faces · rep.letterSeed · rep.markdown
// window.__mgSaintTumble === rep
// window.__mgAgentPlayLast.kind === 'saint-crypto-tumble'
```

## Growth stair (product)

1. **Now (v1):** salon mixer + cast + three tumble modes + MG hooks + Letter-Grid link  
2. **Next:** deep-import dictionary ES modules when present (`buildRubikLanguageState`, `gutterPrefixContent`, real `stenoEncode`)  
3. **Then:** live dual-pane chat (type as Vals / answer as Fly) with real-time tumble  
4. **Later:** persona-tensor L5 loop — MG agent plays Letter-Grid using tumbled seed; Boris grades fiction  

## Legal / tone

- Public-domain codex + original short dialogue seeds  
- “Crypto” = *cypher / tumble / stego capacity demo*, not currency crime  
- Cage / National Treasure fiction stays labeled on litmus surfaces  
