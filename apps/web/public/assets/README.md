# Asset provenance

- `settat-map.png`: downloaded from the user-provided AgriX Figma design, node context for the desktop map. The design labels its basemap **Esri World Imagery**. It is a static illustrative Settat crop, not a live map or geographic measurement service. Validate imagery rights and attribution with the provider before a public production release.
- `icons/*.svg`: eight Figma exports (leaf, back arrow, plus, minus, location, map, bookmark and chat), plus twelve original SVG controls authored in this repository to match the rounded green strokes. Export-only inline display styles were removed without changing vector geometry. These are local assets and make no runtime requests.
- `agriculture/*.svg`: nine original SVG illustrations inspired by the two user-provided agricultural infographics. Five colored illustrations cover rainfall, soil properties, terrain, soil moisture and vegetation; four green circular symbols cover machinery, labor, goals and selling. Labels stay in the translated interface rather than being baked into the images. No external resources or fonts are embedded.

The source design is https://www.figma.com/design/IIS4xCR1Vte01C0gBY7dgK/AgriX. Temporary Figma asset URLs are download sources only and must not be embedded in runtime code. Fonts use the local/system stack declared by the UI package; there is no external font request.
