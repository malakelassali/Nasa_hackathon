# Verification record

Verified locally on 15 November 2026 with Node 24.22.3 and a clean `npm ci --ignore-scripts` from the committed lockfile.

- `npm run check`: passed strict TypeScript, 20 showcase tests, three SVG security regression tests, source boundaries, production build and built CSP/header validation.
- Render coverage includes all 28 scenes in all three languages. State checks cover budget preview/apply, retained context across language changes, bounded conversations and immutable sent voice drafts.
- `npm audit --audit-level=high`: no known vulnerabilities reported at the time of the check.
- Production HTTP smoke check: HTML returned 200; all canonical security headers matched; both built bundles, all 20 icons and the map image returned the expected content type and exact built bytes.
- `git diff --check`: passed.

Visual browser and pointer/keyboard interaction review could not be completed: the browser access host was unavailable and native Computer Use reported that permissions were not granted. Automated rendering and HTTP checks do not verify visual layout, focus behavior or touch interaction. Review the walkthrough in `docs/showcase.md` on desktop, mobile and RTL before accepting the visual design or publishing.

No deployment, real permissions, external service calls or end-to-end agricultural calculations were tested or implemented in this phase.

## Persistent assistant and voice accessibility update

Ask AgriX now has a large sticky entry on desktop and phone screens. It opens help over the current task and keeps the shared session intact. The full chat page has a large microphone action above the conversation, and recording controls have larger targets. English, French and Darija copy and RTL layouts are included.

The update passes the same type, rendering/state, security and production-build checks. Visual review remains incomplete: the browser host was unavailable and the native Chrome attempt returned “Computer Use was not approved to use Google Chrome.” No browser, touch or keyboard review is claimed for this update.
