import type { AgricultureIconName } from "../demo/types";

/** Decorative companion to a translated text label, never the only explanation. */
export function AgricultureIcon({
  factor,
  size = "large",
}: {
  factor: AgricultureIconName;
  size?: "small" | "large";
}) {
  const dimension = size === "large" ? 96 : 56;
  return (
    <img
      className={`agriculture-icon agriculture-icon--${size}`}
      src={`/assets/agriculture/${factor}.svg`}
      width={dimension}
      height={dimension}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
