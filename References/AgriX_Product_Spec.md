# AgriX — Product functionality and farmer experience

**Audience:** The AgriX product, design, and engineering team  
**Primary user:** A farmer planning their first production cycles on a plot they can access.  
**Core decision:** What can I grow on this land, in what order, and what will it take to get to my first sale?

AgriX opens on an interactive map. The farmer draws and confirms their plot, then AgriX builds a soil and climate profile from available data. The farmer can compare suggested crop rotations, assess a rotation they design themselves, and ask questions about their farm plan in Moroccan Darija. Each rotation explains what to do, when to do it, how much money is needed, and what could make the plan difficult to carry out.

## 1. End-to-end user flow

| Step | What the farmer does | What AgriX shows or does |
|---|---|---|
| 1. Find the plot | Open the map, zoom to the plot, and draw its boundary. Search by address, village, locality, or nearby landmark, or optionally use device location to get close. | Show satellite imagery, a highlighted outline, and the estimated area in hectares. Give clear controls to undo, edit, or redraw the outline. |
| 2. Confirm the plot | Check the outline and tap **Confirm plot**. | Start the analysis immediately. Show progress in everyday language. Keep the plot selected if a source fails and offer a retry for the missing layer. |
| 3. Review the land | Read the land summary and optionally add known information about soil, water access, and previous crops. | Explain what each finding means for growing crops. Ask focused questions when the answer affects eligibility or cost. Let the farmer choose **I don't know**. |
| 4. See rotation options | Browse suggested rotations or start a custom rotation. | Use one card per option with the crop sequence, total duration, first-season cash requirement if known, main benefit, and main constraint. |
| 5. Open or compare plans | Select a rotation to see its details, or choose plans to compare. | Show a calendar, costs and returns, historic market data, suppliers, machinery, labor, and trade-offs. Compare on the same field area, dates, and assumptions. |
| 6. Try a change | Edit an assumption, such as the available budget, rental price, or planting date. | Reassess feasibility and update the affected figures. Show what changed and why. |
| 7. Ask for help | Open the chatbot from the plot profile, results, or a rotation. | Explain the current screen and compare options using the farmer's plot and selected plans. Provide short answers in Darija by default. |
| 8. Keep a plan | Save a shortlisted rotation for later review. | Keep the plot, selected plan, and scenario assumptions together. Reopen the plan with a short list of the details still to verify. |

## 2. Plot selection and soil analysis

### Map and confirmation

- Make the map the landing screen, with one obvious action to select a plot. On mobile, keep the drawing controls and confirmation button within reach.
- Offer explicit **Use my phone's location** on phones and **Use device location** on desktop, alongside an address, village, or landmark search. Ask for location permission only when the farmer chooses that action. A device position or search result centers the map; the farmer still draws and confirms the exact plot boundary. Show an approximate device position without implying it is the field boundary. If permission is declined or the device cannot return a location, keep address search and manual map selection available, and preserve the farmer's existing plot and draft.
- Let farmers trace the boundary by placing and moving points around the field. Show the line, filled area, and calculated hectares before confirmation. Detect invalid boundaries, including crossing edges, and explain how to fix them.
- Use the confirmed polygon, area, and location for all applicable calculations. Keep the plot when the farmer changes language or edits a rotation. If the polygon changes, refresh the analysis and mark dependent results for recalculation.
- Display the drawn outline as the farmer's selected area. Let them correct it independently of the satellite basemap.

### Land profile and farmer inputs

| Input | What the farmer sees | How AgriX uses it |
|---|---|---|
| Rainfall history | When rains typically start, how rainfall varies by season, and examples of dry spells and late starts. | Use NASA GPM IMERG as regional evidence for historical rainfall scenarios and compare those scenarios with local planting windows. |
| Soil moisture | A plain-language summary of the moisture pattern and the period it covers. | Use available NASA SMAP data for regional moisture context. |
| Soil properties | Estimated texture, pH, and other available properties with a short explanation of why they matter. | Use available soil maps such as SoilGrids as estimates. Prefer a farmer-supplied soil test for the properties it measures. |
| Terrain and vegetation | Slope, vegetation cover patterns, or field greenness history where coverage supports a useful result. | Use available elevation and satellite imagery to flag questions about erosion, accessibility, or bare periods. |
| Farm constraints | Rainfed or irrigated, reliability of irrigation, previous crops if known, cash available, machinery access, available labor, farm goals, and sales options. | Ask the farmer or let them enter information from a landowner, adviser, cooperative, or contractor. Use these inputs to check whether a plan can be carried out. |

Show the key findings first, such as **Rain often starts late** or **Check soil texture before choosing a crop**. Put the source, observation date or period, resolution, units, and limitations in an optional details panel. Distinguish **area estimate**, **field measurement**, **farmer input**, and **unknown**. When a satellite grid is larger than the plot, label the value as an estimate for the surrounding area. Treat a data failure and a missing field observation as separate states. Continue with available inputs and explain any conclusion that needs more evidence.

Candidate sources for the product. [NASA GPM IMERG](https://gpm.nasa.gov/data/imerg) · [NASA SMAP soil moisture](https://nsidc.org/data/spl4smgp/versions/8) · [ISRIC SoilGrids](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs.html) · [NASA HLS vegetation indices](https://science.nasa.gov/mission/landsat/hls-vegetation-indices/)

## 3. Suggested rotations and comparison

- Generate options from a regional catalog with crop calendars, crop sequence rules, and documented soil and water requirements. Use confirmed plot data and farmer inputs when checking the options.
- Show the sequence in order, starting with the first planting opportunity. A card might say **Wheat → Chickpea · 2 growing seasons**, with approximate start and end months, the first expected sales window, and a short explanation of why the option appeared. Label the displayed sequence as illustrative where local evidence is incomplete.
- Check planting windows, crop order, water access, field conditions, and requirements for seed, machinery, labor, and cash. Show the reason behind an option's feasibility, including any important unknown.
- Give farmers a side-by-side view with **duration**, **cash needed before first sale**, **estimated margin**, **peak labor needs**, **machinery access**, and **main risks**. Keep one shared climate and market scenario across the compared plans. If durations differ, show the period covered and compare matching periods where there is enough data.
- Let the farmer prioritize a lower cash requirement, better performance in a dry scenario, lower labor demand, fodder availability, or higher estimated margin. Explain which trade-off each choice makes. If no plan fits known constraints, list what would need to change and offer edits to the inputs.

## 4. Rotation detail

Open the detail view for any suggested or feasible custom rotation. Show **what to grow**, **how long it takes**, **cash needed before first sale**, and **the main trade-off** at the top. Provide the following sections below.

| Section | Required information |
|---|---|
| **Pros and cons** | Explain each plan's fit for the plot, water and climate exposure, expected benefits for soil cover or diversification, and practical issues such as seed availability, labor peaks, or finding a buyer. Identify which points are supported by local guidance and which need confirmation. |
| **Timeline** | Season-by-season plan with approximate sowing and harvest windows, land preparation, operations, inputs, labor bookings, machinery bookings, expected expenses, and expected sales. Show the first action and any dates that depend on rain or field conditions. |
| **Initial investment and cash** | Break down one-time setup and equipment purchases, then show pre-sale operating expenses such as land rent where applicable, seed, inputs, hired labor, machinery hire, and transport. Show when payments fall due, peak cash needed before receipts, and any gap against the farmer's available budget. |
| **Profitability** | Estimate revenue from crop-specific yield and sale price assumptions. Show operating margin after season costs, and total plan cash remaining after including one-time cash expenses, with the cost items visible. Show values per hectare and for the whole plot, in MAD. Provide dry, typical, and favorable examples, plus break-even yield or price where inputs allow. |
| **Past crop market data** | Show available historical prices for each crop, the date range, market or region, the price category (farm-gate or wholesale), and consistent units. Use a simple chart and summarize the range or seasonality in one sentence. Keep the future sale price editable and label it as an assumption. |
| **Suppliers and services** | Show available seed and input suppliers, cooperatives, equipment contractors, and relevant collection or sales points. Include location, public contact details, what they provide, and when the listing or quote was last checked. Offer a checklist of what to ask when no listing or quote is available. |
| **Machinery** | List machinery by operation, the time window, and whether it is owned, shared, rented, or hired with an operator. Include the rate and unit where known. Compare buying with hiring if both are available and avoid counting the operator twice when included in a contractor quote. |
| **Human labor** | List person-days by task, paid and family labor separately, local wage assumptions, weeks of peak demand, and tasks that need particular skills. Flag when the plan depends on labor the farmer has yet to arrange. |

Use the same calculation basis for suggested and custom rotations. Calculate cash needs from dated outflows and expected receipts, including any delay between harvest and payment. Opening cash needed is the largest cumulative shortfall over the plan. Show the cash needed before the first sale separately if a later season creates a larger gap. Record setup costs once. Include the value of family labor in a separate view if the farmer wants to compare the economic cost of their time.

Let farmers tap a number to see its inputs. Show a range or **Unavailable** when evidence is incomplete. Keep historical market observations separate from modeled revenue, and update the comparison and chatbot context whenever the farmer changes an assumption.

## 5. Custom rotation builder

1. Open **Build my rotation** from the suggestions or comparison view.
2. Add crops to a season-by-season timeline from the supported catalog. Let the farmer reorder crops, adjust dates within the calendar, and add a fallow period where appropriate.
3. Show the overall start, end, and duration. Run the feasibility check against the same plot and farm constraints used for suggested options.
4. Return a clear result with the reasons and the next action.

| Result | Farmer experience |
|---|---|
| **Feasible with current inputs** | Open the same detailed report as a suggested rotation. Add the plan to the comparison or save it. |
| **Needs confirmation** | Show the specific gap, such as irrigation availability or an unknown previous crop, and let the farmer fill it in. Show the parts that can already be estimated and mark the rest pending. |
| **Doesn't fit current conditions** | Highlight the specific crop, season, or requirement that conflicts. Offer an applicable edit, such as changing the planting window or using another locally supported crop. Keep the draft available for revision and reassessment. |

## 6. Darija chatbot

- Provide a persistent **Ask AgriX** entry point. The chatbot can answer broad questions about the farm project and use the active plot, selected rotation, scenario, and current assumptions for specific questions.
- Default to Moroccan Darija **written in Arabic script**. Switch to French or English when selected in chat or explicitly requested, and keep the conversation context. Use short sentences and familiar farming terms.
- Let farmers record a voice question as an alternative to typing. Provide a visible microphone action, request microphone access when chosen, show a recording indicator and elapsed time, and allow stop or cancel. Before sending, let the farmer play back, rerecord, and review or correct a transcript where available. Send only after the farmer confirms. Keep typing available if access is declined or unavailable, and retain the active plot and plan context. Sent voice messages show their duration and associated transcript. Support the same interface languages as text chat.
- Cover soil and climate findings, crop choices, differences between plans, cash needs, profitability, market history, suppliers, machinery, labor, seasonal tasks, and how to use the app.
- Offer contextual prompts such as **شحال خاصني قبل أول بيعة؟** (How much do I need before my first sale?), **واش خاصني نشري الماكينة ولا نقدر نكريها؟** (Do I need to buy the machine or can I rent it?), and **إلا تأخر الشتا، شنو نقدر نزرع؟** (If the rain starts late, what can I plant?).
- Use the same figures, rules, and sources as the detail screens. Link to the relevant card, estimate, or calendar entry. If an answer depends on an unknown input, say what it is and ask for it. If the farmer asks to try a change, preview the updated plan and let them confirm before saving.

## 7. UI and language requirements

**The interface and data presentation must be as simple as possible for first-time farmers.** Put the decision and its reason on screen first. Keep maps, charts, formulas, and source notes available through a secondary **See details** action.

- Build mobile-first, with large tap targets, readable text, clear labels alongside icons, and one primary action per step. Use words as well as color for statuses. Keep plot outlines visible on both light and dark imagery.
- Use everyday units and phrases, such as **hectares**, **DH**, **days of work**, and **money needed before first sale**. Use simple charts with a one-sentence interpretation. Prefer crop names and months over technical indices and codes.
- Localize the entire interface in **Moroccan Darija in Arabic script**, **French**, and **English**. This covers navigation, forms, map and drawing controls, crop names, charts, legends, errors, chatbot prompts, saved plans, and generated summaries.
- Use **right-to-left layout** for Darija and **left-to-right layout** for French and English. Render mixed-direction amounts, units, dates, phone numbers, and crop sequences clearly. Keep maps geographically oriented when languages change.
- Place the language switch where it is easy to find. Let farmers switch without losing their plot, custom draft, assumptions, or chat. Review Darija labels with Moroccan speakers familiar with farm vocabulary.
- Preserve progress during data loading and temporary connection failures. Show a plain-language retry or next action. Keep precise plot geometry and farm inputs private to the user's workspace unless they choose to share.

| English | French | Darija |
|---|---|---|
| Select my plot | Choisir ma parcelle | نختار الأرض ديالي |
| Confirm plot | Confirmer la parcelle | نأكد الاختيار |
| Compare rotations | Comparer les rotations | نقارن بين اختيارات الزرع |
| Money needed before first sale | Argent nécessaire avant la première vente | شحال خاصني قبل أول بيعة؟ |
| Ask AgriX | Demander à AgriX | نسول AgriX |

## 8. Suggested hackathon demonstration and acceptance checks

Use one rainfed Settat example, a locally documented crop shortlist, real NASA rainfall history, and clearly labelled example budgets and supplier data where verified coverage is unavailable. A two-season comparison keeps the demo manageable. Treat the region, crops, and length as pilot choices and allow each plan to display its own duration.

- A farmer can draw, edit, and confirm a plot, then see its area and a plain-language analysis. A missing layer produces a specific message while the available results remain visible.
- Suggested cards show ordered crops and durations. Opening one reveals the timeline, profitability, initial investment, cash needs, market history, suppliers, machinery, labor, and pros and cons.
- A farmer can create a custom sequence, understand why it fits or needs a change, and open the same detail view once it passes the feasibility check.
- Changing a cost or budget updates the figures and the explanation. Unverified market prices, supplier listings, field data, and example inputs are visibly labelled.
- The farmer can complete the flow in all three languages and ask the chatbot about a number or trade-off from the current plan in Arabic-script Darija.
- A farmer can find an area using an address or device location, then confirm the plot independently. Declined or failed location access offers address search and manual map selection. A voice question can be recorded, stopped, reviewed, and sent; declined microphone access offers typing.
- In a walkthrough, a first-time farmer can identify the first action, the cash needed before sales, and one condition to verify before committing.
