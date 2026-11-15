# AgriX UI primitives

This private workspace package holds the visual foundations shared by the showcase and the future application. It contains presentational React primitives, CSS tokens, accessible field associations, native modal dialogs, and keyboard-operable segmented choices. Product state and demo data belong in `apps/web`.

```tsx
import { Button, Card, Input, Modal } from '@agrix/ui';
import '@agrix/ui/styles.css';
```

Exports include `Button`, `Card`, `Badge`, `Icon`, `Input`, `Select`, `SegmentedControl`, and `Modal`. Buttons default to `type="button"`; use `type="submit"` explicitly inside forms. Label every icon-only button, input, and select. `Modal` uses the browser's native dialog focus containment, Escape handling, and focus restoration. Every segmented option is a native radio input, retaining arrow-key operation.

`Icon` reads local files from `/assets/icons/{name}.svg`. The host application owns those assets. Fonts are resolved from the application's local font files and system fallbacks; this package never makes network requests.

Native props are intended for trusted application code. Do not spread objects from user input, fixtures imported from third parties, or model output into these components. Render untrusted content as text; do not use raw HTML or dynamically execute strings. The primitives contain no storage, permissions, service calls, or business rules.
