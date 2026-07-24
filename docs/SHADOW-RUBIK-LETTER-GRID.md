# Shadow Rubik × Letter-Grid · calibration lock

**Live bind pack:** `/data/declaration/letter-grid-rubik.json` (`kbatch-letter-grid-rubik-v1`)  
**MCP:** `kbatch_lettergrid_rubik`  
**Other terminal:** owns bank rebuilds (`build:calibration`, phon); this doc points at shipped files.

---

## 1. Two tensors, one Declaration

| Tensor | Role | Scale |
|--------|------|-------|
| **Letter-Grid** | Motor / archival glyph stream | 6235 letters · 44 layers @12×12 |
| **Shadow Rubik** | Origin-pathway cubes (genealogy + modality) | **13** pathways · 6 faces |
| **DOJO matrix** | Physical path × 15 layouts | 30 slots × 15 boards |
| **World-path C** | Transfer cost graph | 88×88 precomputed |
| **JAX bank** | Cached geometry features | 25 probes × 15 × 10-D |

**Default Focus for engrossed English:** `pie-germanic-en` (PIE → Germanic → English).

### Cube faces (fixed)

| Face | Modality | Stickers encode |
|------|----------|-----------------|
| U | Written | Orthography / script stages |
| D | Spoken | Phonology / speech path |
| F | Movement | Gesture / signed layer |
| B | Digital | Keyboard / input geometry |
| L | Analog | Pre-digital media (ink, stone…) |
| R | Thought | Conceptual / internal form |

Selecting a cube binds that pathway into Shadow Live (typing, shadows, strain, cortical loop).

---

## 2. Pattern stack (short)

1. **Origin chains** — Rubik sticker sequences (13 trees)  
2. **SO orthography** — S/O streams, openRatio, n-grams (cheap prior)  
3. **Physical path** — 15 shadows of same path  
4. **Language×alphabet** — 88 packs / ~28 scripts  
5. **World-path** — $c(a,b)$ layout+script+family+status  
6. **Cortical / registers** — L0–L7 + capsules  

### Math (live precomputes)

$$c(a,b)=1+L+S+F+B-0.5\cdot\mathbf{1}_{\text{parent}},\quad c\ge 0.1$$

Files:

- `/data/world-path/cost-matrix.json`
- `/data/world-path/portal-subgraph.json`
- `/data/calibration/probe-set.json` (25 probes: 5 Declaration · 10 chart · 10 SO)
- `/data/calibration/jax-feature-bank.json` (+ `.meta.json`)
- `/data/calibration/phon-probe-set.json` · `articulatory-bank.json`

**Purity:** `jax.x[10]` = keyboard geometry only. SO/phon live in labels + phon banks — never rewrite JAX bank from phon scripts.

Cross-layout kernel (hot path over bank):

$$K(\ell,\ell';t)=\exp(-\lambda\|\mathbf{x}(t,\ell)-\mathbf{x}(t,\ell')\|_2^2)$$

Blended transfer prior:

$$\tilde c(a,b)=c(a,b)\bigl(1+\mu\,\mathbb{E}_t[d_{\mathrm{SO}}]\bigr)$$

(optional $d_{\mathrm{PHON}}$ same role, separate artifact)

---

## 3. Agent pipeline (sped-up)

```
1. kbatch_lettergrid_ping / kbatch_lettergrid_rubik   (static)
2. Load C[88×88] + portal subgraph                    (static)
3. Load JAX bank X[probes × 15]                       (static)
4. Language jump a→b: C[a,b]; Dijkstra portals if large
5. Align layouts via kernel on decl-* probes
6. Optional SO / phon prefilter
7. Focus Rubik pie-germanic-en → Shadow Live
8. Letter-Grid play / training JSONL / Colossus
9. Cage litmus for RAW+STONE claims
10. calibrate_check → recalibrate on drift
```

```js
await kbatchDict.mcp("kbatch_lettergrid_rubik")
await kbatchDict.mcp("kbatch_lettergrid_ping")
await kbatchDict.mcp("kbatch_world_path", { from: "en", mode: "ready" })
await kbatchDict.mcp("kbatch_export_jax", { text: "IN CONGRESS", layout: "qwerty" })
// banks:
// GET /data/calibration/jax-feature-bank.json
// GET /data/world-path/cost-matrix.json
```

---

## 4. Declaration probes in the bank

| probe_id | Role |
|----------|------|
| `decl-head-40` | Opening orthography |
| `decl-layer1-12x12` | Full first N×N layer (144) |
| `decl-L01` | Title line glyphs |
| `decl-body-200` | Body sample |
| `decl-tail-80` | Closing / signature band |

Rebuild (other terminal / fleet):

```bash
npm run build:calibration   # probes + cost matrix + jax bank
npm run build:phon          # phon probes + articulatory (does not touch JAX)
```

---

## 5. How pieces lock

```
Shadow Rubik (13 × 6 modalities)
        │ Focus (default pie-germanic-en)
        ▼
Shadow Live path → 15 shadows → strain / SO / registers
        │
        ▼
Letter-Grid master stream (6235) ── motor tensor
        │
        ▼
Language packs × shared geometry threads
        │
        ▼
World-path C + JAX bank + (optional) phon priors
        │
        ▼
Cage litmus · paleography · Colossus export
```

Cross-language calibration = geometric + genealogical (Rubik) + orthographic (SO) + economic ($c$) + doctrinal (fingerprint / honor).
