import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { demoReducer, initialState, type DemoAction } from "./state";
import type { DemoState, Flow, Locale } from "./types";
import en from "./fixtures/en.json";
import fr from "./fixtures/fr.json";
import ar from "./fixtures/ar.json";
const flows: Record<Locale, Flow> = {
  en: en as Flow,
  fr: fr as Flow,
  ar: ar as Flow,
};
type Value = { state: DemoState; dispatch: Dispatch<DemoAction>; flow: Flow };
const DemoContext = createContext<Value | null>(null);
export function DemoProvider({
  children,
  initial = initialState,
}: {
  children: ReactNode;
  initial?: DemoState;
}) {
  const [state, dispatch] = useReducer(demoReducer, initial);
  return (
    <DemoContext.Provider
      value={{ state, dispatch, flow: flows[state.locale] }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo(): Value {
  const value = useContext(DemoContext);
  if (!value) throw new Error("Showcase components require DemoProvider.");
  return value;
}
