# JAX feature bank (cached)

**Schema:** `kbatch-jax-feature-bank-v1`  
**File:** `/data/calibration/jax-feature-bank.json`  
**Meta:** `/data/calibration/jax-feature-bank.meta.json`  
**Generator:** `node scripts/build-jax-feature-bank.mjs`  
**Vector source:** `analyzeLevel` → `jax` (same as `kbatch_export_jax`)

---

## Live vector shape (per cell)

```json
{
  "feature_names": [
    "keys", "efficiency", "complexity", "strain", "home_row_pct",
    "travel_mm", "trails", "calories", "rsi_risk", "bpm"
  ],
  "x": [28, 8.7, 82.8, 74.8, 12.5, 1278.1, 24, 0.127806, 74, 444],
  "dtype": "float32",
  "labels": { "level": "caption", "chars": 31, "openRatio": 42.9 }
}
```

| i | Name | Meaning |
|--:|------|---------|
| 0 | keys | Keystroke count |
| 1 | efficiency | % near-optimal / home-friendly |
| 2 | complexity | Direction changes, row jumps, same-finger |
| 3 | strain | Composite load |
| 4 | home_row_pct | Share of home-row strokes |
| 5 | travel_mm | Total finger travel (mm) |
| 6 | trails | Distinct path segments |
| 7 | calories | Estimated metabolic cost |
| 8 | rsi_risk | Same-finger + low-home + high-travel |
| 9 | bpm | Geometry-derived typing cadence |

`openRatio` lives in **labels** (from SO analysis), not inside `x[]`.

---

## Bank layout

```text
X[probe_id][layout_id] → float[10]
labels[probe_id]       → { level, chars, openRatio, kind, textId }
shape                  → { probes, layouts: 15, features: 10, cells }
```

Cache key (logical):

```text
hash(t_norm, layout, level)
```

Probes come from `probe-set.json` (Declaration · chart titles · SO probes).

---

## Normalization + kernel

Z-score over all cells:

$$\hat x_i = \frac{x_i - \mu_i}{\sigma_i + \varepsilon}$$

Layout ranking kernel (hot path):

$$K(\ell,\ell';t)=\exp(-\lambda\,\|\hat{\mathbf{x}}(t,\ell)-\hat{\mathbf{x}}(t,\ell')\|_2^2)$$

Default $\lambda = 0.15$. Sample kernel vs QWERTY for probe `so-type-once` is stored in `bank.kernel.sample`.

---

## SO + cost matrix blend

```text
text
  ├─ physical path → metrics → jax.x[10] → feature bank
  └─ SO stream → openRatio, n-grams → labels + d_SO prior

tilde_c(a,b) = c(a,b) · (1 + μ · E[d_SO])
```

- **C** = `/data/world-path/cost-matrix.json`  
- **d_SO** = sample in `/data/calibration/probe-set.json`  
- **X** = this feature bank  

---

## Agent recipes

```js
// Live one-shot (uncached)
await kbatchDict.mcp("kbatch_export_jax", {
  text: "Too Sweet Hozier",
  level: "caption",
  layout: "qwerty",
})

// Hot path (cached bank)
const bank = await fetch("/data/calibration/jax-feature-bank.json").then((r) => r.json())
const xQ = bank.X["so-type-once"]["qwerty"]
const xD = bank.X["so-type-once"]["dvorak"]
// rank layouts by kernel.sample or recompute L2 on hat-x

// Full envelope (path + SO)
await kbatchDict.mcp("kbatch_analyze", {
  text: "Too Sweet Hozier",
  level: "caption",
  layout: "qwerty",
})
```

```bash
npm run build:calibration   # probes + cost matrix
npm run build:jax-bank      # this bank
```

---

## Invalidation

Rebuild when:

- Layout / strain model version changes  
- Probe set text changes  
- Doctrine / calibrate fingerprint drift (optional full rebuild)  

---

## Related

- [CALIBRATION-PROBE-SET.md](./CALIBRATION-PROBE-SET.md)  
- [WORLD-PATH-COST-MATRIX.md](./WORLD-PATH-COST-MATRIX.md)  
- [WORLD-PATH-COST-MODEL.md](./WORLD-PATH-COST-MODEL.md)  
