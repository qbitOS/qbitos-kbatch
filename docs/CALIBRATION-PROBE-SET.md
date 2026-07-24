# Calibration probe set

**Schema:** `kbatch-calibration-probe-set-v1`  
**File:** `/data/calibration/probe-set.json`  
**Generator:** `node scripts/build-calibration-probes.mjs`  
**Pairs with:** `/data/world-path/cost-matrix.json`

Sized for the feature bank in the cross-language calibration sketch:

```text
X[probes × 15 layouts]  — strain / efficiency / travel / home / RSI per layout
C[88 × 88]              — precomputed transfer costs
SO distances            — cheap orthographic prior
```

---

## Probe kinds

| Kind | Role | Examples |
|------|------|----------|
| `declaration` | Master stream samples | head-40, layer1 0–143, L01, body-200, tail |
| `chart-title-path` | Music-axis geometry strings | too-sweet, anxiety, die-with-a-smile, … |
| `so-probe` | SSO/OSO/SOS / pangram / motto | type once…, people, home row |

---

## Probe record

```json
{
  "id": "decl-layer1-12x12",
  "kind": "declaration",
  "text": "INCONGRESSJuly…",
  "source": "data/declaration/master-glyphs.json",
  "meta": { "note": "first grid layer @12×12", "range": "0-144" },
  "so": {
    "so": "OSOSSOSS…",
    "compressed": "O S×2 O …",
    "n2": { "OS": 12, "SO": 11 },
    "n3": { "SSO": 3, "OSO": 4 },
    "len": 144,
    "openFrac": 0.38
  }
}
```

### SO metric (cheap prior)

$$
d_{\mathrm{SO}}(u,v) = 1 - \frac{|n\text{-grams}(u)\cap n\text{-grams}(v)|}{|n\text{-grams}(u)\cup n\text{-grams}(v)|}
\quad (n\in\{2,3\})
$$

Blend into transfer:

$$
\tilde{c}(a,b) = c(a,b)\cdot\bigl(1 + \mu\cdot \mathbb{E}_t[d_{\mathrm{SO}}(t_a,t_b)]\bigr)
$$

`probe-set.json` includes a sample `soDistance` matrix over SO probes + declaration head.

---

## Feature bank fill (agent / offline)

For each probe `p` and layout `ℓ` in the 15-ring:

```text
analyze(p.text, layout=ℓ) → {
  efficiency, complexity, strain, homeRowPct, travelMM, rsiRisk, …
}
```

Store as `X[p, ℓ, :]`. Amortize once; language jump then:

1. Lookup `C[a,b]`  
2. Optional SO prefilter on short text  
3. Align via kernel on probe features for layouts of `a` vs `b`  
4. Full `path_rank` only if needed  

---

## Agent entry

```js
const probes = await fetch("/data/calibration/probe-set.json").then((r) => r.json())
const C = await fetch("/data/world-path/cost-matrix.json").then((r) => r.json())

// Live complement
await kbatchDict.mcp("kbatch_declaration_cadence", { range: "0-143" })
await kbatchDict.mcp("kbatch_shadows", { text: probes.probes.find(p => p.id === "so-type-once").text })
await kbatchDict.mcp("kbatch_world_path", { from: "en", mode: "ready" })
await kbatchDict.mcp("kbatch_calibrate_check", { toolNames: [/* … */] })
```

---

## Rebuild

```bash
node scripts/build-calibration-probes.mjs
node scripts/build-world-path-cost-matrix.mjs
```
