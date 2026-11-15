# Security baseline

AgriX is currently a static React showcase for reviewing the documented product flow. Form values, sample audio, map choices, analysis and history stay in memory and reset when the page reloads. Use synthetic data. There is no authentication, server, upload, microphone capture, device location request, external AI call, analytics or client storage.

The present trust boundaries are the browser, the static host and the dependency/build pipeline. The main risks are untrusted content reaching an HTML sink, accidental addition of real data collection or networking, a compromised dependency and an incorrectly configured host. These controls form a starting point informed by [OWASP ASVS 5.0](https://asvs.owasp.org/) and the OWASP cheat sheets. They are not an ASVS assessment or certification.

## Enforced controls

- React renders user input as text. Source checks reject raw HTML sinks, dynamic code execution, device APIs, network clients, persistence and unreviewed client environment values. This targeted guard supplements code review; it is not a complete static analyzer.
- Production CSP defaults to denying all resources. Scripts, styles, images and fonts must come from the same origin. Connections, media, workers, frames, form submission, plugins and base URL overrides are blocked. Inline scripts, inline styles and eval are disabled.
- HTTP headers deny framing, disable microphone/camera/geolocation and other device capabilities, prevent MIME sniffing and suppress referrer disclosure. The showcase is still a simulation even if a browser does not implement every policy.
- Imagery is served locally and fonts use a system stack with no remote request. Public SVG assets are checked for scripts, embedded HTML, event handlers, inline CSS and remote URL references, including encoded URL schemes. No API keys belong in frontend code, `VITE_*` variables, fixtures, screenshots, prompts or commits. Frontend environment values and bundles are public.
- CI uses the lockfile, disables dependency lifecycle scripts during install, runs repository checks and checks known high/critical dependency advisories. Actions are pinned to immutable commits and the workflow token has read-only repository access. Dependabot proposes updates for review.

The canonical policies are exported from [`infrastructure/security/headers.mjs`](../infrastructure/security/headers.mjs). Production Vite preview applies the production headers. The built HTML also contains a CSP meta fallback; `frame-ancestors` and other HTTP headers still require a correctly configured host.

## Development and hosting

Vite development needs inline script/style injection and local WebSocket connections for refresh. Only the development CSP allows those exceptions, using loopback WebSocket origins; it never enables eval. Keep development servers bound to loopback and use production preview when checking the final policy.

The build emits `_headers` using the shared production policy. This syntax is supported by hosts such as Netlify and Cloudflare Pages; other hosts require equivalent response configuration. Configure HTTPS and verify actual HTTP response headers before publishing. A meta tag or an unused `_headers` file does not configure a host. Introduce HSTS only after HTTPS and the relevant domain/subdomain coverage have been confirmed; local HTTP preview does not set it.

Run `npm run check` for local validation and `node scripts/security-check.mjs --built` after a build to check the emitted policy. Test the served UI in a browser as well: CSP failures appear in the console, while the Network panel should show only local static resources. No deployment or cloud account has been configured by this baseline.

## Before adding real features

Real accounts, storage, device access, uploads, external maps, AI or agricultural recommendations change the threat model. Design those integrations explicitly and review their privacy, authorization and abuse boundaries before implementation:

- Put secrets and provider calls behind a trusted backend. Validate request structure and limits on the server, authorize every resource operation, use established authentication/session controls, and add rate limits and safe error handling.
- Request device permissions only after an explicit user action and clear explanation. Define collection, retention, deletion and access rules for recordings, addresses and plot data. Validate uploaded types, size and content on the server before processing.
- Treat prompts, retrieved content, audio transcripts and model output as untrusted data. Model output must not grant permission, execute code or authorize tools. Validate structured output and tool arguments against allowlists; keep tenant data and credentials outside model-controlled decisions.
- Make factual provenance and uncertainty visible. Generated agricultural advice requires an appropriate product safety review and validation; the showcase examples do not establish agronomic accuracy.
- Revisit CSP using explicit provider origins, validate third-party asset licenses and dependency provenance, and test access control, injection and abuse cases. Do not weaken the policy with broad wildcards or inline/eval exceptions to make an integration work.

Guidance: [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html), [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), and [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use).
