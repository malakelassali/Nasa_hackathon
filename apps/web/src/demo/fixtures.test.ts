import { describe, expect, it } from "vitest";
import en from "./fixtures/en.json";
import fr from "./fixtures/fr.json";
import ar from "./fixtures/ar.json";
import {
  LAND_FACTOR_IDS,
  FARM_RESOURCE_ICON_IDS,
  SCENE_IDS,
  type Flow,
  type FixtureItem,
} from "./types";

const fixtures = { en, fr, ar };
describe("localized scene contracts", () => {
  for (const [locale, data] of Object.entries(fixtures)) {
    const flow = data as Flow;
    it(`${locale} includes all 28 scenes exactly once with localized screen text`, () => {
      expect(flow.screens.map((scene) => scene.id).sort()).toEqual(
        [...SCENE_IDS].sort(),
      );
      expect(new Set(flow.screens.map((scene) => scene.id)).size).toBe(28);
      for (const scene of flow.screens) {
        expect(scene.title.trim().length).toBeGreaterThan(0);
        expect(scene.subtitle.trim().length).toBeGreaterThan(0);
        expect(scene.primary.label.trim().length).toBeGreaterThan(0);
      }
    });
    it(`${locale} has valid primary, secondary and nested navigation targets`, () => {
      const targets: string[] = [];
      for (const scene of flow.screens) {
        targets.push(scene.primary.target);
        if (scene.secondary) targets.push(scene.secondary.target);
        for (const block of scene.blocks) {
          if (block.target) targets.push(block.target);
          for (const item of block.items ?? [])
            if (typeof item === "object" && item.target)
              targets.push(item.target);
        }
      }
      for (const target of targets) expect(SCENE_IDS).toContain(target);
    });
  }
  it("keeps geography independent of text direction", () => {
    expect(en.rtl).toBe(false);
    expect(fr.rtl).toBe(false);
    expect(ar.rtl).toBe(true);
  });
  it("keeps machinery, labor, goals and sales illustrations attached to the same questions in every language", () => {
    for (const data of Object.values(fixtures)) {
      const flow = data as Flow;
      const work = flow.screens.find((scene) => scene.id === "work")!;
      const questions = work.blocks.filter((block) => block.type === "chips");
      expect(questions.map((block) => block.factor)).toEqual([
        ...FARM_RESOURCE_ICON_IDS,
      ]);
      expect(
        questions.every((block) => block.label && block.items?.length),
      ).toBe(true);
    }
  });
  it("keeps the same five illustrated land factors in every language without conflating a field test with map data", () => {
    for (const data of Object.values(fixtures)) {
      const flow = data as Flow;
      for (const id of ["analysis", "land"]) {
        const screen = flow.screens.find((scene) => scene.id === id)!;
        const factors = screen.blocks.find(
          (block) => block.type === "factors",
        )!;
        expect(
          (factors.items as FixtureItem[]).map((item) => item.factor),
        ).toEqual([...LAND_FACTOR_IDS]);
        expect(
          (factors.items as FixtureItem[]).every(
            (item) => item.label && item.value,
          ),
        ).toBe(true);
      }
      const land = flow.screens.find((scene) => scene.id === "land")!;
      const fieldTest = land.blocks.find((block) => block.type === "list")!;
      expect(fieldTest.items).toHaveLength(1);
      expect((fieldTest.items as FixtureItem[])[0]?.factor).toBe("soil");
    }
  });
});
