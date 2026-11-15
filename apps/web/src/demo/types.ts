export const SCENE_IDS = [
  "map",
  "draw",
  "analysis",
  "land",
  "farm",
  "work",
  "options",
  "compare",
  "plan",
  "timeline",
  "cash",
  "returns",
  "edit",
  "updated",
  "market",
  "services",
  "resources",
  "builder",
  "ready",
  "chat",
  "saved",
  "invalid",
  "partial",
  "sources",
  "needs",
  "conflict",
  "no-fit",
  "offline",
] as const;
export type SceneId = (typeof SCENE_IDS)[number];
export type Locale = "en" | "fr" | "ar";
export type Scenario = "dry" | "typical" | "favorable";
export type Point = { x: number; y: number };
export type SentVoiceMessage = Readonly<{
  id: number;
  transcript: string;
  duration: number;
}>;
export type VoiceStage =
  | "permission"
  | "recording"
  | "review"
  | "denied"
  | null;
export type LocationStage =
  | "permission"
  | "blocked"
  | "unavailable"
  | "address"
  | null;
export type FixtureItem = { label: string; value?: string; target?: string };
export type Block = {
  type: string;
  label?: string;
  title?: string;
  body?: string;
  value?: string;
  target?: string;
  role?: "user" | "assistant";
  items?: string[] | FixtureItem[];
  columns?: string[];
  rows?: string[][];
  values?: number[];
  labels?: string[];
};
export type Scene = {
  id: SceneId;
  title: string;
  subtitle: string;
  kind: string;
  blocks: Block[];
  primary: { label: string; target: string };
  secondary?: { label: string; target: string };
};
export type Flow = {
  locale: Locale;
  language: string;
  rtl: boolean;
  ui: Record<string, string>;
  screens: Scene[];
};
export type DemoState = {
  locale: Locale;
  scene: SceneId;
  history: SceneId[];
  points: Point[];
  confirmed: boolean;
  plotChanged: boolean;
  saved: boolean;
  budget: number;
  budgetDraft: string;
  scenario: Scenario;
  choices: Record<string, number>;
  address: string;
  locationSource: "initial" | "address" | "device";
  locationStage: LocationStage;
  voiceStage: VoiceStage;
  sentVoiceMessages: readonly SentVoiceMessage[];
  voiceElapsed: number;
  voicePlaying: boolean;
  transcript: string;
  chatDraft: string;
  sentMessages: string[];
  customCrops: string[];
  customResult: "ready" | "needs" | "conflict";
  showControls: boolean;
};
