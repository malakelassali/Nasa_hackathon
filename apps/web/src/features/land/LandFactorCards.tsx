import type { FixtureItem } from "../../demo/types";
import { AgricultureIcon } from "../../components/AgricultureIcon";

export function LandFactorCards({ items }: { items: FixtureItem[] }) {
  return (
    <dl className="land-factors">
      {items.map((item) => (
        <div className="land-factor-card" key={item.factor}>
          <dt>
            {item.factor && <AgricultureIcon factor={item.factor} />}
            <span>{item.label}</span>
          </dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
