# qbitOS — KBatch

**KBatch** is the **L4** “World Keyboard & Quantum Analyzer” surface: **121 capsules** across **16 categories**, **15 keyboard layouts**, **StenoEngine** + **contrail** integration, **IBM Quantum** bridge telemetry, and **plan corpus** cross-links — all on the **Gluelam** stack (prefixes → DAC → steno) and **Iron Line** buses.

This repository holds a **standalone reference pack** so org repos, agents, and mirrors can align on **capsule contracts**, **channels**, and **L4 placement** without cloning the full monorepo.

## Upstream

| Source | Role |
|--------|------|
| [qbitOS/uvspeed](https://github.com/qbitOS/uvspeed) | Primary monorepo: `web/kbatch.html`, `quantum-prefixes.js`, `qbit-dac.js`, `qbit-steno.js`, plan corpus ↔ capsule links |
| [qbitOS/qbitos-freya](https://github.com/qbitOS/qbitos-freya) | Compliance pattern (`COMPLIANCE.qmd`) |
| [qbitOS/qbitos-iron-line](https://github.com/qbitOS/qbitos-iron-line) | Iron Line L0–L7 (KBatch is **L4** — Notepad / Everything lane) |
| [qbitOS/qbitos-gluelam](https://github.com/qbitOS/qbitos-gluelam) | Shared modules (no forked classifiers) |

See **[UPSTREAM.md](UPSTREAM.md)** for sync commands.

## Contents

| Path | Purpose |
|------|---------|
| [docs/KBATCH_ARCHITECTURE.md](docs/KBATCH_ARCHITECTURE.md) | Layer placement, channels, capsule story, bridges |
| [docs/kbatch-overview.md](docs/kbatch-overview.md) | Short overview (points to monorepo app) |
| [reference/kbatch-surface.json](reference/kbatch-surface.json) | Machine-readable L4 surface + channels |
| [.cursor/rules/kbatch-architecture.mdc](.cursor/rules/kbatch-architecture.mdc) | Cursor rule stub |
| [COMPLIANCE.qmd](COMPLIANCE.qmd) | Runtime path + control envelope |

## Contract

1. **No duplicate capsule engines** — Capsule data and classifiers live in **uvspeed** `web/kbatch.html` (and related modules); this repo is **spec + reference** only.
2. **Gluelam** — KBatch loads the same **prefix / DAC / steno** stack as every other compliant app.
3. **Iron Line** — Use **`BroadcastChannel('iron-line')`** + **`kbatch-training`** / **`kbatch-transcript`** for cross-app data as defined in the architecture doc.

## Community

- **[Code of Conduct](CODE_OF_CONDUCT.md)** — Contributor Covenant; report issues via [GitHub Issues](https://github.com/qbitOS/qbitos-kbatch/issues).
- **[Contributing](CONTRIBUTING.md)** — how to propose changes and sync from upstream.
- **[Security](SECURITY.md)** — responsible disclosure.

## License

Licensed under **MIT OR Apache-2.0** — [LICENSE](LICENSE), [LICENSE-MIT](LICENSE-MIT), [LICENSE-APACHE](LICENSE-APACHE). Apache-2.0 text matches [qbitOS/qbitos-freya](https://github.com/qbitOS/qbitos-freya).

Copyright © 2026 Tad R. Ericson.

## GitHub

Push instructions: **[GITHUB.md](GITHUB.md)**.
