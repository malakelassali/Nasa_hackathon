# Verification record

Verified locally on 15 November 2026 with Node 24.22.3 and a clean `npm ci --ignore-scripts` from the committed lockfile.

- `npm run check`: passed strict TypeScript, 20 showcase tests, three SVG security regression tests, source boundaries, production build and built CSP/header validation.
- Render coverage includes all 28 scenes in all three languages. State checks cover budget preview/apply, retained context across language changes, bounded conversations and immutable sent voice drafts.
- `npm audit --audit-level=high`: no known vulnerabilities reported at the time of the check.
- Production HTTP smoke check: HTML returned 200; all canonical security headers matched; both built bundles, all 20 icons and the map image returned the expected content type and exact built bytes.
- `git diff --check`: passed.

Visual browser and pointer/keyboard interaction review could not be completed: the browser access host was unavailable and native Computer Use reported that permissions were not granted. Automated rendering and HTTP checks do not verify visual layout, focus behavior or touch interaction. Review the walkthrough in `docs/showcase.md` on desktop, mobile and RTL before accepting the visual design or publishing.

No deployment, real permissions, external service calls or end-to-end agricultural calculations were tested or implemented in this phase.
