# Hosting and infrastructure

The current deliverable is a static UI showcase built into `apps/web/dist`. Run the root `npm run check` before publishing a build. No hosting provider, cloud account, backend or deployment pipeline is configured yet.

[`security/headers.mjs`](security/headers.mjs) exports the production CSP, meta fallback and HTTP headers, plus a separate development policy for Vite refresh. Vite configuration consumes these exports so production preview and the emitted `_headers` file use the same policy. [`security/_headers`](security/_headers) is the portable hosting example; regenerate it from `serializeHeaders()` when the policy changes.

`_headers` uses Netlify/Cloudflare Pages-style syntax. Apply equivalent settings on another host and verify the actual HTTPS response headers after deployment. Keep service credentials in the future platform's secret store and trusted backend. Never expose them in client environment variables or build artifacts.

See [the security baseline](../docs/security.md) for current limits and requirements before connecting real services.
