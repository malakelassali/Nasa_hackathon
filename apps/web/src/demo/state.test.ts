import { describe, expect, it } from "vitest";
import {
  demoReducer,
  initialState,
  previewBudget,
  SAMPLE_POINTS,
} from "./state";

describe("showcase context", () => {
  it("preserves plot, custom draft, budget and conversation when changing language", () => {
    const state = {
      ...initialState,
      points: SAMPLE_POINTS,
      confirmed: true,
      customCrops: ["Barley", "Fallow"],
      budget: 10000,
      chatDraft: "question",
      sentMessages: ["message"],
    };
    const result = demoReducer(state, { type: "locale", locale: "ar" });
    expect(result).toEqual({ ...state, locale: "ar" });
    expect(state.locale).toBe("en");
  });
  it("previews a budget without applying it and applies only when requested", () => {
    const draft = demoReducer(initialState, {
      type: "patch",
      patch: { budgetDraft: "10000" },
    });
    const preview = demoReducer(draft, { type: "navigate", scene: "updated" });
    expect(preview.budget).toBe(14000);
    const result = demoReducer(preview, { type: "apply-budget" });
    expect(result.budget).toBe(10000);
    expect(result.scene).toBe("plan");
    expect(result.budgetDraft).toBe("10000");
  });
  it("keeps current assumptions when a preview is cancelled", () => {
    const preview = {
      ...initialState,
      budgetDraft: "10000",
      scene: "updated" as const,
    };
    expect(
      demoReducer(preview, { type: "navigate", scene: "plan" }).budget,
    ).toBe(14000);
  });
  it("rejects invalid budget formats and nonfinite amounts", () => {
    for (const value of [
      "",
      "-1",
      "1e5",
      "10.5",
      "Infinity",
      "1000001",
      "<script>",
    ])
      expect(previewBudget(value)).toBeNull();
    expect(previewBudget("0")).toBe(0);
    expect(previewBudget("1000000")).toBe(1000000);
    const invalid = { ...initialState, budgetDraft: "1e5" };
    expect(demoReducer(invalid, { type: "apply-budget" })).toBe(invalid);
  });
  it("requires a polygon before confirming a plot", () => {
    expect(demoReducer(initialState, { type: "confirm-plot" }).confirmed).toBe(
      false,
    );
    const selected = { ...initialState, points: SAMPLE_POINTS };
    const result = demoReducer(selected, { type: "confirm-plot" });
    expect(result.confirmed).toBe(true);
    expect(result.scene).toBe("analysis");
    expect(result.points).toEqual(SAMPLE_POINTS);
  });
  it("keeps current assumptions when a saved plan is reopened", () => {
    const saved = demoReducer(
      { ...initialState, budget: 10000 },
      { type: "save" },
    );
    const reopened = demoReducer(saved, { type: "navigate", scene: "plan" });
    expect(reopened.saved).toBe(true);
    expect(reopened.budget).toBe(10000);
  });
  it("bounds local conversations and clears the composer after sending", () => {
    const state = {
      ...initialState,
      sentMessages: Array.from({ length: 10 }, (_, index) => String(index)),
      chatDraft: "  hello  ",
    };
    const result = demoReducer(state, { type: "send-message" });
    expect(result.sentMessages).toHaveLength(10);
    expect(result.sentMessages.at(-1)).toBe("hello");
    expect(result.chatDraft).toBe("");
    expect(state.sentMessages.at(-1)).toBe("9");
  });
  it("resets all session data while retaining the chosen language", () => {
    const result = demoReducer(
      {
        ...initialState,
        locale: "fr",
        saved: true,
        budget: 10000,
        points: SAMPLE_POINTS,
      },
      { type: "reset" },
    );
    expect(result).toEqual({ ...initialState, locale: "fr" });
  });
  it("keeps sent voice snapshots when a later recording is edited and cancelled", () => {
    const first = demoReducer(
      {
        ...initialState,
        voiceStage: "review",
        transcript: "First question",
        voiceElapsed: 12,
      },
      { type: "send-voice" },
    );
    const secondDraft = demoReducer(first, {
      type: "patch",
      patch: {
        voiceStage: "recording",
        transcript: "Unsent second question",
        voiceElapsed: 3,
      },
    });
    const cancelled = demoReducer(secondDraft, {
      type: "patch",
      patch: { voiceStage: null, voicePlaying: false },
    });
    expect(cancelled.sentVoiceMessages).toEqual([
      { id: 1, transcript: "First question", duration: 12 },
    ]);
    expect(cancelled.sentVoiceMessages[0]).toBe(first.sentVoiceMessages[0]);
    const secondSent = demoReducer(
      { ...cancelled, voiceStage: "review", voiceElapsed: 9 },
      { type: "send-voice" },
    );
    expect(secondSent.sentVoiceMessages).toEqual([
      { id: 1, transcript: "First question", duration: 12 },
      { id: 2, transcript: "Unsent second question", duration: 9 },
    ]);
    expect(secondSent.voiceStage).toBeNull();
    expect(secondSent.voicePlaying).toBe(false);
  });
  it("requires voice review and a nonblank transcript, and bounds sent voice history", () => {
    expect(
      demoReducer(
        { ...initialState, voiceStage: "recording" },
        { type: "send-voice" },
      ).sentVoiceMessages,
    ).toHaveLength(0);
    expect(
      demoReducer(
        { ...initialState, voiceStage: "review", transcript: "  " },
        { type: "send-voice" },
      ).sentVoiceMessages,
    ).toHaveLength(0);
    let state = initialState;
    for (let index = 0; index < 12; index += 1)
      state = demoReducer(
        {
          ...state,
          voiceStage: "review",
          transcript: `Question ${index}`,
          voiceElapsed: 7,
        },
        { type: "send-voice" },
      );
    expect(state.sentVoiceMessages).toHaveLength(10);
    expect(state.sentVoiceMessages[0]?.id).toBe(3);
    expect(state.sentVoiceMessages.at(-1)).toEqual({
      id: 12,
      transcript: "Question 11",
      duration: 7,
    });
  });
});
