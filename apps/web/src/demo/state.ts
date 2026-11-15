import { SCENE_IDS, type DemoState, type Locale, type SceneId } from "./types";

export const SAMPLE_POINTS = [
  { x: 220, y: 190 },
  { x: 760, y: 145 },
  { x: 790, y: 500 },
  { x: 280, y: 570 },
];
export const initialState: DemoState = {
  locale: "en",
  scene: "map",
  history: [],
  points: [],
  confirmed: false,
  plotChanged: false,
  saved: false,
  budget: 14000,
  budgetDraft: "10000",
  scenario: "typical",
  choices: {},
  address: "Settat, Morocco",
  locationSource: "initial",
  locationStage: null,
  voiceStage: null,
  sentVoiceMessages: [],
  voiceElapsed: 0,
  voicePlaying: false,
  transcript: "شحال خاصني قبل أول بيعة؟",
  chatDraft: "",
  sentMessages: [],
  customCrops: ["Wheat", "Chickpea"],
  customResult: "ready",
  showControls: false,
};
export type DemoAction =
  | { type: "navigate"; scene: SceneId }
  | { type: "back" }
  | { type: "locale"; locale: Locale }
  | {
      type: "patch";
      patch: Partial<Omit<DemoState, "locale" | "scene" | "history">>;
    }
  | { type: "choice"; key: string; value: number }
  | { type: "confirm-plot" }
  | { type: "apply-budget" }
  | { type: "save" }
  | { type: "send-message" }
  | { type: "send-voice" }
  | { type: "reset" };

export function isSceneId(value: string): value is SceneId {
  return (SCENE_IDS as readonly string[]).includes(value);
}
export function previewBudget(value: string): number | null {
  if (!/^\d{1,7}$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount <= 1000000 ? amount : null;
}
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "navigate":
      return {
        ...state,
        scene: action.scene,
        history:
          action.scene === state.scene
            ? state.history
            : [...state.history.slice(-30), state.scene],
      };
    case "back":
      return {
        ...state,
        scene: state.history.at(-1) ?? "map",
        history: state.history.slice(0, -1),
      };
    case "locale":
      return { ...state, locale: action.locale };
    case "patch":
      return { ...state, ...action.patch };
    case "choice":
      return {
        ...state,
        choices: { ...state.choices, [action.key]: action.value },
      };
    case "confirm-plot":
      return state.points.length < 3
        ? state
        : {
            ...state,
            confirmed: true,
            scene: "analysis",
            history: [...state.history, state.scene],
          };
    case "apply-budget": {
      const amount = previewBudget(state.budgetDraft);
      return amount === null
        ? state
        : {
            ...state,
            budget: amount,
            scene: "plan",
            history: [...state.history, state.scene],
          };
    }
    case "save":
      return {
        ...state,
        saved: true,
        scene: "saved",
        history: [...state.history, state.scene],
      };
    case "send-message": {
      const message = state.chatDraft.trim().slice(0, 500);
      return message
        ? {
            ...state,
            sentMessages: [...state.sentMessages.slice(-9), message],
            chatDraft: "",
          }
        : state;
    }
    case "send-voice": {
      const transcript = state.transcript.trim().slice(0, 500);
      if (state.voiceStage !== "review" || !transcript) return state;
      const duration = Number.isFinite(state.voiceElapsed)
        ? Math.max(5, Math.min(59, Math.floor(state.voiceElapsed)))
        : 5;
      const message = {
        id: (state.sentVoiceMessages.at(-1)?.id ?? 0) + 1,
        transcript,
        duration,
      };
      return {
        ...state,
        sentVoiceMessages: [...state.sentVoiceMessages.slice(-9), message],
        voiceStage: null,
        voicePlaying: false,
      };
    }
    case "reset":
      return { ...initialState, locale: state.locale };
  }
}
