# Changelog


## [0.3.0] — 2026-08-29

### Changed
- **Renamed package to `dsh-skill-manager`** (it manages the DSH skill system, a.k.a. long-term memory).
- `list` now scans `~/.dsh/skills` directly (directory bundles + flat `.md`, minimal frontmatter description
  parsing) instead of `ctx.skills.list()`, which returned empty in the plugin context. No dependency on the
  skill registry; verified locally against the real directory.
- Fixed the v2 row layout (a leftover v1 grid squeezed rows into a 28px column — descriptions are now fully
  visible and wrap).

All notable changes to **dsh-skill-manager** are documented here.

## [0.2.0] — 2026-08-29

### Changed (v2: manage the REAL skill directory)
- **The plugin now manages the actual DSH skill directory (`~/.dsh/skills`)**
  instead of a private store. `list` returns the authoritative `ctx.skills`
  registry view (the same skills DSH loads into every session); `delete`
  removes a skill from the user skills directory (bundled/project skills are
  protected).
- **Features simplified to view + delete** per user request: scope
  (global/project/session), tags, create/edit, and JSON/Markdown
  import/export were removed. New memories are created through the Agent flow
  documented in the `dsh-memory-guide` skill — the panel shows a tip pointing
  there.
- Storage model note: skills live per-installation (`$DSH_HOME/skills`,
  shared across profiles), matching how real skills behave.

## [0.1.1] — 2026-08-29

### Fixed
- **Double-envelope RPC crash**: host Remote methods returned a `{ ok, value }`
  envelope while the Typert Gateway wraps results itself, so the client received
  `result.value` = the inner envelope and `result.value.memories` was `undefined`
  — the panel crashed during render (`Cannot read properties of undefined
  (reading 'length')`) and the slot entry (sidebar button) disappeared with the
  fiber. Host methods now return bare business values; business failures throw.
- **Host build**: switched from tsdown to **esbuild** for the Node half.
  tsdown/rolldown emitted TypeScript standard decorators (`@Remote`) verbatim,
  which Node cannot parse (`Invalid or unexpected token` at loader import).
  esbuild lowers decorators to `__decorateClass` helpers and inlines `.ts`
  relative imports into a single `lib/index.mjs`.
- **Typert dispatch across module instances**: the `@Remote` marker table is
  module-private state in `dsh-typert-protocol`; the profile's copy and the
  app's copy are different module instances, so the Gateway could not see the
  markers (every RPC returned HTTP 404). The host now registers STRICT
  invocation descriptors into `ctx.typert` (`typert.register(...)`), which the
  Gateway dispatches through without reflection.
- **Client namespace access**: `ctx.remote.memoryManager` (dotted property)
  requires the namespace to be injected into the fiber; self-mounted namespaces
  cannot be injected (deadlock). Switched to `ctx.get('remote.memoryManager')`.
- **Idempotent slot registration**: `slots.inject` re-runs its callback when the
  slot declaration epoch changes; a second `register()` for the same id threw
  and slots.inject escalated it as an unhandled microtask error (fiber crash).
  The sidebar entry registration is now guarded.
- **Peer dependencies**: `dsh-storage-domain` declares `dsh-storage` /
  `dsh-invariants` as peers; profiles with `autoInstallPeers: false` (the DSH
  default template) must enable it or install the peers explicitly.
- Defensive `Array.isArray` guard on the list response before it enters state.

### Changed
- Sidebar entry is text-only (the 🧠 icon was removed for aesthetics).
- `package.json` exports/types align with the esbuild output (`.mjs` / `.d.ts`).

## [0.1.0] — 2026-08-18

### Added
- Initial plugin: sidebar「记忆管理」entry (registered into
  `sidebar.footer.action`), full-screen management panel, CRUD + bulk delete,
  JSON/Markdown import/export, scope filter + search, zh/en locales, DSH
  theme-token styling.
- Host half: `memoryManager` Typert Remote service over a `memory_manager`
  storage domain (`~/.dsh/storages/memory_manager.json`).
- Client bundle built to the `window.__ModuleLoader__.load({ id, factory })`
  handoff format consumed by `dsh-client-modules`.
