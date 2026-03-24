# KBatch — Architecture (org mirror)

<!-- Reference for qbitOS/qbitos-kbatch. Canonical app: qbitOS/uvspeed web/kbatch.html -->

**KBatch** (“World Keyboard & Quantum Analyzer”) is an **Iron Line L4** surface: *Notepad / Everything* lane — high-throughput classify + capsule graph + contrail + optional IBM Quantum bridge telemetry.

## Iron Line placement

| Layer | Name | KBatch role |
|-------|------|-------------|
| **L4** | Notepad / Everything | Primary home — capsule matrix, StenoEngine, keyboard layouts, terminal panel |

Upstream tables: [qbitOS/qbitos-iron-line](https://github.com/qbitOS/qbitos-iron-line) (`docs/IRON_LINE_ARCHITECTURE.md`).

## Gluelam + stack

KBatch loads the same **quantum gutter** stack as other compliant apps:

**Prefixes → DAC → Steno → `.qbit` / preflight** (where QASM appears)

No parallel classifier — see [qbitOS/qbitos-gluelam](https://github.com/qbitOS/qbitos-gluelam).

## Capsule & corpus graph

- **121 capsules**, **16 categories**, **15 keyboard layouts** (see monorepo `PROGRESS.md` / app for current counts).
- **Plan corpus** ↔ capsule `words[]` cross-links (StenoEngine: `findConceptAcrossLanguages`).
- **Contrail** integration for symbol learning across languages.

## BroadcastChannels (typical)

| Channel | Purpose |
|---------|---------|
| `hexterm` | General inter-app messaging |
| `quantum-prefixes` | Prefix state sync |
| `iron-line` | Pipeline telemetry |
| `kbatch-training` | Training / generation data |
| `kbatch-transcript` | DCA transcript blocks |

Exact set may evolve in uvspeed — treat **`web/kbatch.html`** as source of truth for wiring.

## Bridges

- **jawta-audio**: whisper → `bridgeToKbatch()` → hexterm → kbatch (see uvspeed project context).
- **IBM Quantum**: bridge telemetry in-app (configuration in monorepo).

## Verification

From uvspeed repo root (illustrative):

```bash
node -e "const QP = require('./web/quantum-prefixes.js'); console.log('QP', Object.keys(QP).length)"
```

Open **`web/kbatch.html`** via static server from **`web/`** so shared assets resolve.

## Relationship to other mirrors

| Repo | Role |
|------|------|
| [qbitos-iron-line](https://github.com/qbitOS/qbitos-iron-line) | Full L0–L7 + buses |
| [qbitos-gluelam](https://github.com/qbitOS/qbitos-gluelam) | Shared modules |
| [qbitos-kbatch](https://github.com/qbitOS/qbitos-kbatch) | **This** — KBatch-specific L4 reference |
