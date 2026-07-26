#!/usr/bin/env bash
# Deploy SPA to Cloudflare Pages WITHOUT analyzed packs / fat multi-lang dumps.
# Analyzed packs + optional lang packs live on R2 (see upload-r2.sh).
#
# Pages free/pro limit: 20,000 files per deployment.
# CJK first-char buckets used to explode past that — grow-multilang now uses
# high-byte hXX buckets; this script still hard-caps the dist file count.
#
#   ./scripts/deploy-pages.sh
#   CLOUDFLARE_API_TOKEN=… ./scripts/deploy-pages.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/.pages-dist"
PROJECT="${PROJECT:-ugrad-kbatch}"
BRANCH="${BRANCH:-main}"
MAX_FILES="${MAX_FILES:-19000}"

echo "→ staging slim Pages dist (≤${MAX_FILES} files)"
rm -rf "$DIST"
mkdir -p "$DIST"

# --- SPA shell ---
for f in index.html shadow.html docs.html install.html lyrics.html learn.html research.html \
  for-ai.html museum.html world-ranking.html catalog.html \
  sw.js manifest.webmanifest version.json package.json \
  _headers _redirects wrangler.toml README.md; do
  [[ -f "$ROOT/$f" ]] && cp -f "$ROOT/$f" "$DIST/$f"
done

rsync -a "$ROOT/js/" "$DIST/js/"
rsync -a "$ROOT/css/" "$DIST/css/"
[[ -d "$ROOT/dojo" ]] && rsync -a "$ROOT/dojo/" "$DIST/dojo/"
# Labs: exclude multi‑GB masters + 14k stroke-pass tiles (player uses JSON paths)
if [[ -d "$ROOT/labs" ]]; then
  rsync -a \
    --max-size=18m \
    --exclude 'declaration-digital-edition/images/hires/nara-stone.jpg' \
    --exclude 'declaration-digital-edition/images/hires/nara-stone-contrast.jpg' \
    --exclude 'declaration-digital-edition/images/hires/nara-stone-inverse.jpg' \
    --exclude 'declaration-digital-edition/images/hires/nara-parchment.jpg' \
    --exclude 'declaration-digital-edition/images/calligraphy-stone.jpg' \
    --exclude 'declaration-digital-edition/images/calligraphy-contrast.jpg' \
    --exclude 'declaration-digital-edition/images/calligraphy-parchment.jpg' \
    --exclude 'declaration-digital-edition/images/sources/' \
    --exclude 'declaration-digital-edition/images/writing-path/lines/**/l*-stroke-pass*.jpg' \
    --exclude '**/node_modules/' \
    --exclude '**/.git/' \
    "$ROOT/labs/" "$DIST/labs/"
fi
[[ -d "$ROOT/embed" ]] && rsync -a "$ROOT/embed/" "$DIST/embed/"
[[ -d "$ROOT/mcp" ]] && rsync -a "$ROOT/mcp/" "$DIST/mcp/"
[[ -d "$ROOT/handoff" ]] && rsync -a "$ROOT/handoff/" "$DIST/handoff/"
[[ -d "$ROOT/public" ]] && rsync -a "$ROOT/public/" "$DIST/public/"
[[ -d "$ROOT/vendor" ]] && rsync -a --max-size=24m "$ROOT/vendor/" "$DIST/vendor/"

# Declaration research packs (JSON + geometry + stroke paths) — required for archive/world/stroke player
if [[ -d "$ROOT/data/declaration" ]]; then
  mkdir -p "$DIST/data/declaration"
  rsync -a --max-size=12m \
    --exclude '*.map' \
    "$ROOT/data/declaration/" "$DIST/data/declaration/"
fi
# --- data: indexes + monoletter en + multi-lang (bounded) ---
mkdir -p "$DIST/data/words" "$DIST/data/registers"

# root catalogs (+ funnel for AI/people)
for f in word-index.json analyzed-index.json layout-ring.json vocab-coverage.json dictionary.json funnel.json; do
  [[ -f "$ROOT/data/$f" ]] && cp -f "$ROOT/data/$f" "$DIST/data/$f"
done

# music staff + living books + waveform letter map (podcast embed seed)
for d in music-staff living-books waveform-letters mythology open-names names-glance; do
  if [[ -d "$ROOT/data/$d" ]]; then
    mkdir -p "$DIST/data/$d"
    # open-names / mythology indexes can be multi-MB thin gloss dumps
    # skip ancestory-bridge full dump (merged into names-index; saves Pages budget)
    rsync -a --max-size=12m \
      --exclude 'ancestory-bridge.json' \
      --exclude 'pg_catalog.csv' \
      --exclude '*.csv' \
      "$ROOT/data/$d/" "$DIST/data/$d/"
  fi
done
# music-rights + education indexes (small)
# world-path cost matrix + calibration probes (agent feature bank)
for d in music-rights education museum-resource typing-arena world-path calibration antiquity; do
  if [[ -d "$ROOT/data/$d" ]]; then
    mkdir -p "$DIST/data/$d"
    rsync -a --max-size=2m "$ROOT/data/$d/" "$DIST/data/$d/" 2>/dev/null || rsync -a "$ROOT/data/$d/" "$DIST/data/$d/"
  fi
done

# monoletter en packs (a–z) — full 1.69M geometric base
for L in a b c d e f g h i j k l m n o p q r s t u v w x y z; do
  f="$ROOT/data/words/$L.json"
  # Colossus atlas monoletters can be 10–20MB each — SPA must use slivers; fat packs stay on R2
  if [[ -f "$f" ]]; then
    sz=$(wc -c < "$f" | tr -d ' ')
    if (( sz <= 4000000 )); then
      cp -f "$f" "$DIST/data/words/$L.json"
    else
      echo "  skip fat monoletter $L.json (${sz} bytes) — use slivers / R2"
    fi
  fi
done

# multi-lang catalog + sliver index
[[ -f "$ROOT/data/words/lang-index.json" ]] && \
  cp -f "$ROOT/data/words/lang-index.json" "$DIST/data/words/lang-index.json"
[[ -f "$ROOT/data/words/sliver-index.json" ]] && \
  cp -f "$ROOT/data/words/sliver-index.json" "$DIST/data/words/sliver-index.json"

# slivers (typeahead) — ~1k files, keep on Pages for snappy en search
if [[ -d "$ROOT/data/words/slivers" ]]; then
  mkdir -p "$DIST/data/words/slivers"
  rsync -a --max-size=24m "$ROOT/data/words/slivers/" "$DIST/data/words/slivers/"
fi

# multi-lang packs: copy each lang dir if it stays under per-lang + global budget
# Skip _placeholders. Cap per-lang files (CJK rebucketed to ~256; old 10k+ skipped).
# zh high-byte rebucket lands ~680 files; keep headroom under Pages 20k
PER_LANG_MAX="${PER_LANG_MAX:-800}"
WORDS_BUDGET="${WORDS_BUDGET:-15000}"
words_copied=0
skipped_langs=()

for langdir in "$ROOT/data/words"/*/; do
  [[ -d "$langdir" ]] || continue
  lang=$(basename "$langdir")
  [[ "$lang" == "slivers" || "$lang" == "_placeholders" ]] && continue
  [[ -f "$langdir/word-index.json" ]] || continue

  n=$(find "$langdir" -type f -name '*.json' ! -path '*/slivers/*' | wc -l | tr -d ' ')
  if (( n > PER_LANG_MAX )); then
    skipped_langs+=("$lang:$n>max")
    # still ship word-index so UI knows pack exists (loads from R2 if present)
    mkdir -p "$DIST/data/words/$lang"
    cp -f "$langdir/word-index.json" "$DIST/data/words/$lang/word-index.json"
    continue
  fi
  if (( words_copied + n > WORDS_BUDGET )); then
    skipped_langs+=("$lang:budget")
    mkdir -p "$DIST/data/words/$lang"
    cp -f "$langdir/word-index.json" "$DIST/data/words/$lang/word-index.json"
    continue
  fi

  mkdir -p "$DIST/data/words/$lang"
  # copy bucket jsons only (not nested slivers unless small)
  # don't abort deploy on a single lang (set -e): use || true per-file
  while IFS= read -r -d '' jf; do
    cp -f "$jf" "$DIST/data/words/$lang/" 2>/dev/null || true
  done < <(find "$langdir" -maxdepth 1 -type f -name '*.json' -print0 2>/dev/null)
  words_copied=$((words_copied + n))
done

# registers index (+ small letter packs if under size)
mkdir -p "$DIST/data/registers"
if [[ -f "$ROOT/data/registers/index.json" ]]; then
  cp -f "$ROOT/data/registers/index.json" "$DIST/data/registers/" 2>/dev/null || true
fi
# ship register letter shards but not mega meta-map
if [[ -d "$ROOT/data/registers" ]]; then
  rsync -a \
    --exclude 'meta-map.json' \
    --exclude 'extension' \
    --max-size=8m \
    "$ROOT/data/registers/" "$DIST/data/registers/" 2>/dev/null || true
fi

# world charts + billboard catalogs + per-track title-path analyses (~2–3k small JSON)
# skip empty licensed-lyrics drops if huge; ship catalogs + corpus always
if [[ -d "$ROOT/data/lyrics" ]]; then
  mkdir -p "$DIST/data/lyrics"
  rsync -a \
    --exclude 'lyrics/' \
    --max-size=12m \
    "$ROOT/data/lyrics/" "$DIST/data/lyrics/" 2>/dev/null || true
  # keep empty licensed-lyrics dirs as markers if present
  for d in charts/lyrics billboard-2026/lyrics; do
    if [[ -d "$ROOT/data/lyrics/$d" ]]; then
      mkdir -p "$DIST/data/lyrics/$d"
      [[ -f "$ROOT/data/lyrics/$d/README.md" ]] && \
        cp -f "$ROOT/data/lyrics/$d/README.md" "$DIST/data/lyrics/$d/README.md"
    fi
  done
fi

# education / open-ed / school concepts (small JSON)
if [[ -d "$ROOT/data/education" ]]; then
  mkdir -p "$DIST/data/education"
  rsync -a --max-size=8m "$ROOT/data/education/" "$DIST/data/education/"
[[ -d "$ROOT/data/human-gates" ]] && rsync -a --max-size=2m "$ROOT/data/human-gates/" "$DIST/data/human-gates/"
[[ -d "$ROOT/data/lake" ]] && rsync -a --max-size=4m "$ROOT/data/lake/" "$DIST/data/lake/"
[[ -d "$ROOT/data/llm" ]] && rsync -a --max-size=4m "$ROOT/data/llm/" "$DIST/data/llm/"
[[ -d "$ROOT/data/ancestory" ]] && rsync -a --max-size=12m "$ROOT/data/ancestory/" "$DIST/data/ancestory/"
[[ -d "$ROOT/data/catalog" ]] && rsync -a --max-size=2m "$ROOT/data/catalog/" "$DIST/data/catalog/"
fi
# canonical capsules (ladder 0–7 index + mueee-live pack)
if [[ -d "$ROOT/data/capsules" ]]; then
  mkdir -p "$DIST/data/capsules"
  rsync -a --max-size=12m "$ROOT/data/capsules/" "$DIST/data/capsules/"
fi
# world ranking · senses · museum · music rights · typing arena (axis dominance)
for dir in world-ranking senses museum-resource music-rights typing-arena; do
  if [[ -d "$ROOT/data/$dir" ]]; then
    mkdir -p "$DIST/data/$dir"
    # senses index can be ~12–24MB (D5 10k+) — allow through Pages file cap (~25MB)
    if [[ "$dir" == "senses" ]]; then
      rsync -a --max-size=24m "$ROOT/data/$dir/" "$DIST/data/$dir/"
    else
      rsync -a --max-size=4m "$ROOT/data/$dir/" "$DIST/data/$dir/"
    fi
  fi
done
[[ -f "$ROOT/world-ranking.html" ]] && cp -f "$ROOT/world-ranking.html" "$DIST/world-ranking.html"
mkdir -p "$DIST/docs"
for f in WORLD-AXIS-DOMINANCE.md MEMORY-GLASS-KBATCH.md ASSET-MAP-LIVING-BOOKS.md RESUME-TOMORROW.md SMOKE-AND-COMMANDS.md \
  FLEET-NARRATIVE.md FLEET-R4-DATA.md MILESTONE-R4-DATA.md ANTIQUITY-DISCOVERY-MESH.md RESEARCH-LAYER.md \
  UNSOLVED-MANUSCRIPTS-MG.md MEMORY-GLASS-KBATCH.md RUBIK-ALL-LANGUAGE-PATH.md RUBIK-STAIR-NEXT.md SHADOW-RUBIK-LETTER-GRID.md; do
  [[ -f "$ROOT/docs/$f" ]] && cp -f "$ROOT/docs/$f" "$DIST/docs/"
done
[[ -d "$ROOT/docs/fornever-ledger" ]] && rsync -a --max-size=2m "$ROOT/docs/fornever-ledger/" "$DIST/docs/fornever-ledger/"
# alphabet matrix + other small root data catalogs used by labs
for f in language-alphabet-matrix.json kb-upgrade-set.json corpus-index.json; do
  [[ -f "$ROOT/data/$f" ]] && cp -f "$ROOT/data/$f" "$DIST/data/$f"
done

# Ensure meta points at R2
if ! grep -q 'kbatch-data-base' "$DIST/index.html" 2>/dev/null; then
  echo "WARN: add <meta name=\"kbatch-data-base\" content=\"https://data.ugrad.ai/kbatch/\" /> to index.html"
fi

echo "→ stamp version (root) + sync shells into dist"
(cd "$ROOT" && node scripts/stamp-version.mjs) || true
cp -f "$ROOT/version.json" "$DIST/version.json" 2>/dev/null || true
for f in index.html shadow.html docs.html install.html lyrics.html learn.html research.html for-ai.html \
  museum.html world-ranking.html sw.js _headers _redirects; do
  [[ -f "$ROOT/$f" ]] && cp -f "$ROOT/$f" "$DIST/$f"
done
# PD cited lyrics seeds (small) for full-song scrub
if [[ -d "$ROOT/data/lyrics/cited" ]]; then
  mkdir -p "$DIST/data/lyrics/cited"
  rsync -a --max-size=2m "$ROOT/data/lyrics/cited/" "$DIST/data/lyrics/cited/"
fi
# World analyzed rollup + per-lang sliver indexes (fat slivers stay on R2)
if [[ -f "$ROOT/data/analyzed/world-index.json" ]]; then
  mkdir -p "$DIST/data/analyzed"
  cp -f "$ROOT/data/analyzed/world-index.json" "$DIST/data/analyzed/world-index.json"
fi
for L in es de fr zh ar ru sr sl; do
  if [[ -f "$ROOT/data/analyzed/$L/sliver-index.json" ]]; then
    mkdir -p "$DIST/data/analyzed/$L"
    cp -f "$ROOT/data/analyzed/$L/sliver-index.json" "$DIST/data/analyzed/$L/sliver-index.json"
  fi
done
# PD analysis packs (small)
for slug in amazing-grace-newton auld-lang-syne simple-gifts twinkle-twinkle greensleeves scarborough-fair swing-low-sweet-chariot oh-susanna; do
  [[ -f "$ROOT/data/lyrics/analyses/$slug.json" ]] && \
    cp -f "$ROOT/data/lyrics/analyses/$slug.json" "$DIST/data/lyrics/analyses/$slug.json" 2>/dev/null || true
done
# Cloudflare Pages Functions (HTTP MCP)
if [[ -d "$ROOT/functions" ]]; then
  mkdir -p "$DIST/functions"
  rsync -a "$ROOT/functions/" "$DIST/functions/"
fi
[[ -d "$ROOT/dojo" ]] && rsync -a "$ROOT/dojo/" "$DIST/dojo/" 2>/dev/null || true
# Re-sync labs slim (same excludes as above) so stamp pass does not re-inflate masters
if [[ -d "$ROOT/labs" ]]; then
  rsync -a \
    --max-size=18m \
    --exclude 'declaration-digital-edition/images/hires/nara-stone.jpg' \
    --exclude 'declaration-digital-edition/images/hires/nara-stone-contrast.jpg' \
    --exclude 'declaration-digital-edition/images/hires/nara-stone-inverse.jpg' \
    --exclude 'declaration-digital-edition/images/hires/nara-parchment.jpg' \
    --exclude 'declaration-digital-edition/images/calligraphy-stone.jpg' \
    --exclude 'declaration-digital-edition/images/calligraphy-contrast.jpg' \
    --exclude 'declaration-digital-edition/images/calligraphy-parchment.jpg' \
    --exclude 'declaration-digital-edition/images/sources/' \
    --exclude 'declaration-digital-edition/images/writing-path/lines/**/l*-stroke-pass*.jpg' \
    --exclude '**/node_modules/' \
    "$ROOT/labs/" "$DIST/labs/" 2>/dev/null || true
fi
[[ -d "$ROOT/embed" ]] && rsync -a "$ROOT/embed/" "$DIST/embed/" 2>/dev/null || true
[[ -d "$ROOT/mcp" ]] && rsync -a "$ROOT/mcp/" "$DIST/mcp/" 2>/dev/null || true
[[ -d "$ROOT/data/declaration" ]] && rsync -a --max-size=12m "$ROOT/data/declaration/" "$DIST/data/declaration/" 2>/dev/null || true
rsync -a "$ROOT/js/" "$DIST/js/"
rsync -a "$ROOT/css/" "$DIST/css/"

# file count gate
count=$(find "$DIST" -type f | wc -l | tr -d ' ')
echo "→ dist files: $count (limit $MAX_FILES)"
if (( count > MAX_FILES )); then
  echo "ERROR: dist has $count files > $MAX_FILES. Skipped langs: ${skipped_langs[*]:-none}"
  echo "  Tip: re-grow CJK (zh/ja/ko) after high-byte bucketing, or raise PER_LANG_MAX carefully."
  find "$DIST" -type f | sed 's|^'"$DIST"'/||' | cut -d/ -f1-3 | sort | uniq -c | sort -rn | head -25
  exit 1
fi

if ((${#skipped_langs[@]})); then
  echo "→ skipped full packs (index-only on Pages; upload to R2): ${skipped_langs[*]}"
fi

echo "→ wrangler pages deploy $DIST → $PROJECT ($BRANCH)"
npx wrangler pages deploy "$DIST" \
  --project-name="$PROJECT" \
  --branch="$BRANCH" \
  --commit-dirty=true

echo "Done. SPA on Pages ($count files). Multi-lang full packs: R2 via npm run upload:r2"
if ((${#skipped_langs[@]})); then
  echo "  Skipped full ship: ${skipped_langs[*]}"
else
  echo "  Skipped full ship: none"
fi
