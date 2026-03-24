# Syncing from uvspeed

Canonical **code** lives in [qbitOS/uvspeed](https://github.com/qbitOS/uvspeed). This repo is documentation + reference JSON only.

## Files to copy

| From uvspeed | To this repo |
|--------------|----------------|
| `LICENSE`, `LICENSE-MIT`, `LICENSE-APACHE` | repo root (when aligning license text) |

## Shell (adjust paths)

```bash
UVSPEED="${UVSPEED:-$HOME/dev/projects/uvspeed}"
KB="/Volumes/qbitOS/00.dev/qbitos-kbatch"

cp "$UVSPEED/LICENSE" "$UVSPEED/LICENSE-MIT" "$UVSPEED/LICENSE-APACHE" "$KB/"
```

## When the architecture doc changes

Edit **`docs/KBATCH_ARCHITECTURE.md`** when `web/kbatch.html` or the KBatch section of `.cursor/rules/uvspeed-project-context.mdc` / `PROGRESS.md` changes materially (capsule counts, channels, L4 notes).
