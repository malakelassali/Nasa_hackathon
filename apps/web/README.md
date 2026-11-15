# AgriX web showcase

Run commands from the repository root: `npm ci`, then `npm run dev`.

- `src/App.tsx`: responsive shell and current scene.
- `src/components`: reusable app-level scene presentation.
- `src/features`: map/location, report/builder and chat/voice views.
- `src/demo`: translated fixtures and the in-memory session reducer.
- `public/assets`: local map and icon assets.
- `vite.config.ts`: bundling, loopback preview and security policy wiring.

Keep all interactions simulated until real feature work is authorized. No provider credentials or private data belong in the client. See the root [README](../../README.md) and [showcase coverage](../../docs/showcase.md).
