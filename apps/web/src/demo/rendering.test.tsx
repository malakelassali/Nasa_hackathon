import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DemoProvider } from "./DemoContext";
import { demoReducer, initialState, SAMPLE_POINTS } from "./state";
import { money } from "./copy";
import { SceneView } from "../components/SceneView";
import en from "./fixtures/en.json";
import fr from "./fixtures/fr.json";
import ar from "./fixtures/ar.json";
import type { Flow, Locale, SceneId } from "./types";

const flows: Record<Locale, Flow> = {
  en: en as Flow,
  fr: fr as Flow,
  ar: ar as Flow,
};
describe("showcase scene rendering", () => {
  it("renders all scenes in all languages including missing-data and blocked states", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      for (const scene of flows[locale].screens) {
        const html = renderToStaticMarkup(
          <DemoProvider
            initial={{
              ...initialState,
              locale,
              scene: scene.id,
              points: SAMPLE_POINTS,
              confirmed: true,
              saved: true,
            }}
          >
            <SceneView scene={scene} />
          </DemoProvider>,
        );
        expect(html.length).toBeGreaterThan(250);
        expect(html).not.toContain("style=");
        expect(html).not.toContain("https://");
      }
    }
  });
  it("renders the current budget in comparison, cash, saved plan and chat after a language change", () => {
    const edited = demoReducer(
      { ...initialState, budgetDraft: "10000", saved: true },
      { type: "apply-budget" },
    );
    for (const locale of ["en", "fr", "ar"] as const) {
      const state = demoReducer(edited, { type: "locale", locale });
      for (const id of ["compare", "cash", "saved", "chat"] as SceneId[]) {
        const scene = flows[locale].screens.find((item) => item.id === id)!;
        const html = renderToStaticMarkup(
          <DemoProvider initial={{ ...state, scene: id }}>
            <SceneView scene={scene} />
          </DemoProvider>,
        );
        expect(html).toContain(money(10000, locale));
        expect(html).not.toContain(money(14000, locale));
      }
    }
  });
  it("keeps the first sent voice transcript and duration when a second draft is cancelled", () => {
    const firstSent = demoReducer(
      {
        ...initialState,
        voiceStage: "review",
        transcript: "First sent voice question",
        voiceElapsed: 12,
      },
      { type: "send-voice" },
    );
    const draft = demoReducer(firstSent, {
      type: "patch",
      patch: {
        voiceStage: "review",
        transcript: "Cancelled voice question",
        voiceElapsed: 29,
      },
    });
    const cancelled = demoReducer(draft, {
      type: "patch",
      patch: { voiceStage: null },
    });
    const scene = flows.en.screens.find((screen) => screen.id === "chat")!;
    const render = (state: typeof initialState) =>
      renderToStaticMarkup(
        <DemoProvider initial={state}>
          <SceneView scene={scene} />
        </DemoProvider>,
      );
    const before = render(firstSent);
    const after = render(cancelled);
    expect(after).toBe(before);
    expect(after).toContain("First sent voice question");
    expect(after).toContain("00:12");
    expect(after).not.toContain("Cancelled voice question");
    expect(after).not.toContain("00:29");
  });
});
