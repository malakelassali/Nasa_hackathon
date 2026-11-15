# AgriX

A responsive React UI showcase for the AgriX farmer journey. Explore the map, land profile, rotation comparison, planning reports, custom builder, chat, voice and location states in English, French and Arabic-script Darija.

This phase uses synthetic fixtures and in-memory state. Analysis, financial results, chat, recording, playback and device location are UI simulations. Reloading clears progress. There are no real services, accounts, recordings, agricultural calculations or saved user data.

## Start locally

Use Node **24 LTS** and npm. `.nvmrc` and `.node-version` record the recommended runtime.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Start on the map or use **Showcase controls** to inspect alternate, loading and error states. Switch languages without losing the current draft. Only enter sample data.

```sh
npm run check              # security boundaries, strict types, tests, production build
npm audit --audit-level=high
npm run preview            # production build on http://127.0.0.1:4173
```

Dependency lifecycle scripts are disabled through `.npmrc`. Use the committed lockfile; review dependency changes before enabling any install script.

## Workspace

| Path | Responsibility |
|---|---|
| `apps/web` | React/Vite showcase, views, translated fixtures, in-memory state and local assets |
| `packages/ui` | Shared presentational primitives, design tokens, accessibility and RTL support |
| `References` | Authoritative product specification and design references |
| `infrastructure` | Hosting-neutral security policies and future deployment configuration |
| `docs` | Architecture, flow coverage, security and AI development guidance |
| `.github` | CI checks and dependency update proposals |

The product flow follows [`References/AgriX_Product_Spec.md`](References/AgriX_Product_Spec.md) and the [AgriX Figma design](https://www.figma.com/design/IIS4xCR1Vte01C0gBY7dgK/AgriX). See [architecture](docs/architecture.md), [showcase coverage](docs/showcase.md), [security](docs/security.md), [AI development rules](docs/ai-development.md), and the [verification record](docs/verification.md).

## Hosting later

`npm run build` produces `apps/web/dist`. The build includes a CSP fallback and generated `_headers`. Select a static host and apply the equivalent HTTP headers before publishing; some hosts do not read `_headers`. No host or backend has been provisioned. Keep deployment credentials in the hosting platform's secret store. Future application features can grow inside `apps/web` with server-side services added under `apps/` when their scope is defined.
