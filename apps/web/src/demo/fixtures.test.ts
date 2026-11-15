import { describe, expect, it } from "vitest";
import en from "./fixtures/en.json";
import fr from "./fixtures/fr.json";
import ar from "./fixtures/ar.json";
import { SCENE_IDS, type Flow } from "./types";

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
});
