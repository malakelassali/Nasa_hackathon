# Architecture

## Current decision

Use a small npm workspace with React, TypeScript and Vite. This phase is a static UI showcase; it has no backend, router service, external data client, AI integration or persistent storage. Framework and dependencies are pinned in the lockfile. Node 24 is the recommended runtime.

## Boundaries

`apps/web/src` owns the shell and product-specific views. `demo/` owns typed fixtures, locale copy, context and the reducer for the synthetic session. `features/` groups map/location, report/builder and chat/voice presentation. Navigation is in memory and intentionally resets on refresh. Page state remains independent of language so switching to Darija preserves the plot and draft while changing layout direction.

`packages/ui` owns reusable visual primitives and design tokens. It has no product rules, fetches or persistence. It exports source to the workspace build rather than introducing a second packaging pipeline. CSS classes support a strict production policy without inline style attributes. Shared primitives are reused by multiple showcase views.

`References` remains the product and design source. `docs/showcase.md` records the distinction between a rendered product flow and future functional behavior. Map imagery and icons are local static files in `apps/web/public/assets` with provenance documented there.

`infrastructure/security/headers.mjs` is the canonical response policy. Vite uses a development variant for refresh and the strict policy for production preview. The build emits host-compatible `_headers` and a meta CSP fallback. CI checks policy consistency alongside source boundaries, types, reducer tests and the production bundle.

## Future application work

Keep the UI primitives and page layouts. Replace the demo state boundary deliberately with typed application services when real features are authorized; do not let fixtures become a silent production data source. Keep provider secrets, authorization, validation and AI tool execution on a trusted server. A future server may live under `apps/api` after requirements and hosting are selected; no empty service or unused infrastructure is created now.

Separate device permission and upload handling from UI presentation. Revisit the threat model and CSP before connecting a map, audio service, AI model or data source. Preserve the specification's distinction between estimated, measured, supplied and unknown information.

## Verification

`npm run check` is the root gate: source security boundaries, strict TypeScript, meaningful state-transition tests, production build and built-policy validation. Browser review covers desktop, narrow layouts, RTL, dialogs and the main journey. `npm audit --audit-level=high` checks current dependency advisories; it does not establish that the application is secure.
