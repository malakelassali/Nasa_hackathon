# Showcase scope and review guide

The product specification in `References/AgriX_Product_Spec.md` defines the future application. This showcase demonstrates its interaction flow using an illustrative two-hectare Settat plot. It is for reviewing the UI, language and states; its sample findings are not a diagnosis or forecast.

| Product flow | Showcase behavior | Future real capability |
|---|---|---|
| Find and confirm a plot | Local basemap, sample address result, point editing, undo/redraw, confirmation and invalid-outline state | Search/geocoding, live map, real geometry validation and area calculations |
| Device location | Permission, denied, unavailable and successful sample states | Explicit device permission and real position; the boundary remains separate |
| Land profile | Progress, partial source failure/retry, unknown inputs and expandable source details | NASA/soil data ingestion with verified provenance, dates, units and uncertainty |
| Farm constraints | Selectable sample constraints and budget edit | Validation and an agronomic feasibility model |
| Suggestions and comparison | Ordered sample rotations with a shared period/scenario and visible trade-offs | Regional crop catalog and evidence-based filtering/ranking |
| Plan detail | Timeline, cash, returns, market history state, services, machinery, labor and pros/cons | Dated cash-flow engine, verified quotes, yields and observed market history |
| Try a change | Budget changes the displayed sample funding gap; scenario changes select fixed examples | Recalculate all dependent figures with an auditable model |
| Custom rotation | Add, reorder and remove supported crops/fallow, then inspect preset feasibility states; the detailed report is explicitly the fixed Wheat → Chickpea sample | Calendar/crop sequence rules, feasibility assessment and reports for each custom plan |
| Ask AgriX | Large sticky help bar on every desktop/phone screen; opens chat over the current page with contextual prompts, typed messages and fixed replies | Server-side AI service grounded in the current plan, with authorization and output validation |
| Voice | Large microphone action above the conversation, with explicit text and larger recording controls; simulated permission, timer, stop, transcript review, playback state and send | Real capture, transcription, playback, retention and explicit consent |
| Save and reopen | Session-only saved selection and checklist | Private authenticated persistence and deletion controls |
| Languages | English, French, Arabic-script Darija; RTL preserves map orientation and draft state | Moroccan-speaker review and production localization QA |

## Suggested walkthrough

1. Find the sample area with search or the location simulation. Draw the outline, undo a point, use the example outline and confirm it.
2. Inspect analysis and its source details. Use **Showcase controls** for missing-source and invalid-outline states.
3. Review the land and constraints, then open the two-season options. Compare the same two-hectare basis and typical scenario.
4. Open Wheat → Chickpea. Review the first action, cash needed before sale, date ranges and the details still to verify. Edit the available budget to 10,000 DH to see the 2,000 DH sample gap.
5. Inspect the calendar, cash timing, returns, market-data-unavailable state and service verification checklist. Examples must remain labelled.
6. Try the custom builder. Reorder a crop, add fallow and inspect confirmation/conflict outcomes without losing the draft.
7. Open chat, send a sample text, then walk through simulated recording and transcript confirmation. Test the denied permission path too.
8. Save/reopen the sample plan. Switch to French and Darija midway to check retained state, labels, amounts and map orientation. Reload to clear the demo.

## Sample financial basis

The Wheat → Chickpea example covers November 2026–July 2028, two hectares and two growing seasons. First-season pre-sale cash is 12,000 DH including 1,000 DH of setup; second-season operating cost is 9,000 DH. Total operating cost is 20,000 DH; example receipts are 30,000 DH. Operating margin is 10,000 DH (5,000 DH/ha); cash after setup is 9,000 DH (4,500 DH/ha). With 14,000 DH available, the first-sale buffer is 2,000 DH; with 10,000 DH available, the gap is 2,000 DH. These are fixed design examples, not an agricultural prediction or calculation service.

The source-failure state is separate from an unknown farmer observation. Supplier contacts and historical prices are unavailable when unverified; do not invent them. Custom outcomes and financial scenarios are curated fixtures. The returns chart has its own example selector; comparison and the report retain their fixed typical basis. Barley is available in comparison; the full report template demonstrates Wheat → Chickpea. Any later model must implement the specification's full dated cash and comparison rules before its outputs can be treated as functional results.
