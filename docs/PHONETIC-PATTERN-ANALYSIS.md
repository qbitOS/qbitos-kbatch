# Phonetic pattern analysis

**Status:** shipped (English grapheme→phone approx)  
**Module:** `js/phonetic-pattern.js`  
**MCP:** `kbatch_phon_pattern`  
**Probes:** `/data/calibration/phon-probe-set.json`  
**Articulatory bank:** `/data/calibration/articulatory-bank.json`

---

## SO vs phonetic (do not conflate)

| Layer | Encodes | Status |
|-------|---------|--------|
| **SO** | Orthographic stop/open on **spelling** | Live (`analyzeOrder`) |
| **PHON** | Sound **classes** / CV on approximate pronunciation | Live (this doc) |
| **JAX x[10]** | Path geometry | Unchanged — **never** fold phon into `x[]` |

---

## Phone-class alphabet

| Class | Symbol | Typical |
|-------|--------|---------|
| Stop | P | p b t d k g |
| Fricative | F | f v s z ʃ h … |
| Affricate | A | tʃ dʒ |
| Nasal | N | m n ŋ |
| Liquid/glide | L | l r w j |
| Vowel high | Vh | i ɪ u ʊ |
| Vowel mid | Vm | e ɛ o ɔ ə |
| Vowel low | Vl | æ ɑ a |
| Other | X | residual |

**CV collapse:** {P,F,A,N,L,X}→C · {Vh,Vm,Vl}→V

---

## Analyze / MCP shape

```js
await kbatchDict.mcp("kbatch_phon_pattern", {
  text: "Too Sweet Hozier",
  lang: "en",
  level: "caption",
})
```

```json
{
  "cv": "CVCCVCV…",
  "phones": "PVm…",
  "openRatioPhon": 42.0,
  "bigrams": { "CV": 4, "VC": 3 },
  "trigrams": { "CVC": 2 },
  "topPatterns": [{ "pattern": "CV", "count": 4 }],
  "orderChain": "CVC|CCVC|…",
  "artMean": [/* 12 floats */],
  "articulatory": {
    "dim": 12,
    "feature_names": ["syllabic","consonantal", "…"],
    "mean": [/* 12 */]
  },
  "words": [{ "text": "Too", "cv": "CV", "phones": "…", "openRatioPhon": 50 }],
  "blend": {
    "muSO": 0.2,
    "muPhon": 0.3,
    "form": "c_tilde = c * (1 + muSO*E[d_SO] + muPhon*E[d_PHON])"
  }
}
```

Also attached on `kbatch_analyze` as `meta.phon` (same payload).

---

## Distances + blend

$$
d_{\mathrm{PHON}}(u,v)=1-\mathrm{Jaccard}(G_n(\mathrm{cv}(u)),G_n(\mathrm{cv}(v)))
$$

$$
\tilde c(a,b)=c(a,b)\bigl(1+\mu_{\mathrm{SO}}\,\mathbb{E}[d_{\mathrm{SO}}]+\mu_{\mathrm{PHON}}\,\mathbb{E}[d_{\mathrm{PHON}}]\bigr)
$$

Defaults: $\mu_{\mathrm{SO}}=0.2$, $\mu_{\mathrm{PHON}}=0.3$, cap $2.5\cdot c$.

Optional articulatory extension:

$$
\tilde{c}' = c\cdot\bigl(1 + \mu_{\mathrm{SO}}\,\mathbb{E}[d_{\mathrm{SO}}] + \mu_{\mathrm{PHON}}\,\mathbb{E}[d_{\mathrm{PHON}}] + \mu_{\mathrm{art}}\,\mathbb{E}[d_{\mathrm{art}}]\bigr)
$$

Suggested $\mu_{\mathrm{art}}\approx 0.10$–$0.15$ (secondary to CV Jaccard). Use z-scored art means from `/data/calibration/articulatory-bank.json`.

---

## Articulatory 12-D features

```text
syllabic · consonantal · sonorant · continuant · nasal · voice
labial · coronal · dorsal · high · low · back
```

---

## Probe set (12+)

`phon-cv-open/closed/alt/cluster` · manner sets · vowel height · duals of SO/Declaration/chart motto.

---

## Agent stack

```js
const C = await fetch("/data/world-path/cost-matrix.json").then((r) => r.json())
const bank = await fetch("/data/calibration/jax-feature-bank.json").then((r) => r.json())
const phonProbes = await fetch("/data/calibration/phon-probe-set.json").then((r) => r.json())

const c = C.matrix[C.index.en][C.index.ru] // 9.3
const dPH = phonProbes.dPhon.sample["phon-cv-open|phon-cv-closed"]
// cTilde = c * (1 + 0.2*dSO + 0.3*dPH)

const live = await kbatchDict.mcp("kbatch_phon_pattern", {
  text: "Too Sweet Hozier",
  lang: "en",
})
```

```bash
node scripts/build-phon-pattern-probes.mjs
npm run build:calibration  # does not rebuild phon by default
npm run build:phon         # phon probes + articulatory bank
```

---

## What not to do

- Do **not** put phone features inside `jax.x[10]`  
- Do **not** bulk-scrape commercial pronunciation DBs  
- Do **not** treat SO as phonetic in agent prompts  
- Do **not** force FN/honor packs into auto phonetic mapping  
