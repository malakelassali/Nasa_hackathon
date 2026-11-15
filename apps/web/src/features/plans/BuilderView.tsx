import { Badge, Button, Card, Icon, Select } from "@agrix/ui";
import { useDemo } from "../../demo/DemoContext";
import { words } from "../../demo/copy";
import type { Scene } from "../../demo/types";
import { crops, cropName } from './catalog';
export function BuilderView({ scene }: { scene: Scene }) {
  const { state, dispatch, flow } = useDemo();
  function update(next: string[]) {
    dispatch({ type: "patch", patch: { customCrops: next } });
  }
  function move(index: number, offset: number) {
    const next = [...state.customCrops];
    const destination = index + offset;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination]!, next[index]!];
    update(next);
  }
  return (
    <div className="builder-layout">
      <Card className="crop-catalog">
        <span className="eyebrow">
          {words(
            state.locale,
            "PILOT CATALOG",
            "CATALOGUE PILOTE",
            "لائحة المثال",
          )}
        </span>
        <h2>{scene.blocks[0]?.label}</h2>
        <p>
          {words(
            state.locale,
            "Add a crop or a resting season to your draft.",
            "Ajoutez une culture ou une saison de repos.",
            "زيد زرع ولا موسم ديال الراحة للمسودة.",
          )}
        </p>
        <div className="crop-catalog__options">
          {crops.map((crop) => (
            <Button
              key={crop}
              variant="secondary"
              onClick={() => update([...state.customCrops, crop])}
              disabled={state.customCrops.length >= 4}
            >
              <Icon name="plus" size="small" />
              {cropName(crop, state.locale)}
            </Button>
          ))}
        </div>
        <p className="muted">
          {words(
            state.locale,
            "Up to 4 seasons in this UI preview.",
            "Jusqu’à 4 saisons dans cet aperçu.",
            "حتى لـ4 مواسم فهاد التجربة.",
          )}
        </p>
      </Card>
      <section
        className="sequence-editor"
        aria-label={words(
          state.locale,
          "Season sequence",
          "Ordre des saisons",
          "ترتيب المواسم",
        )}
      >
        {state.customCrops.map((crop, index) => (
          <Card className="season-editor" key={index}>
            <span className="step-number">{index + 1}</span>
            <div>
              <Select
                label={words(
                  state.locale,
                  `Season ${index + 1}`,
                  `Saison ${index + 1}`,
                  `الموسم ${index + 1}`,
                )}
                value={crop}
                onChange={(event) =>
                  update(
                    state.customCrops.map((item, i) =>
                      index === i ? event.target.value : item,
                    ),
                  )
                }
              >
                {crops.map((option) => (
                  <option value={option} key={option}>
                    {cropName(option, state.locale)}
                  </option>
                ))}
              </Select>
              <Select
                label={words(
                  state.locale,
                  "Planting window · example",
                  "Fenêtre de semis · exemple",
                  "وقت الزرع · مثال",
                )}
                value={state.choices[`season-window-${index}`] ?? 0}
                onChange={(event) =>
                  dispatch({
                    type: "choice",
                    key: `season-window-${index}`,
                    value: Number(event.target.value),
                  })
                }
              >
                <option value="0">
                  {words(
                    state.locale,
                    `November ${2026 + index}`,
                    `Novembre ${2026 + index}`,
                    `نونبر ${2026 + index}`,
                  )}
                </option>
                <option value="1">
                  {words(
                    state.locale,
                    `December ${2026 + index}`,
                    `Décembre ${2026 + index}`,
                    `دجنبر ${2026 + index}`,
                  )}
                </option>
              </Select>
              <div className="season-controls">
                <Button
                  variant="ghost"
                  size="small"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  {words(state.locale, "Move earlier", "Avancer", "نقدم")}
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  disabled={index === state.customCrops.length - 1}
                  onClick={() => move(index, 1)}
                >
                  {words(state.locale, "Move later", "Reculer", "نأخر")}
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  disabled={state.customCrops.length <= 1}
                  onClick={() =>
                    update(state.customCrops.filter((_, i) => i !== index))
                  }
                >
                  {words(state.locale, "Remove", "Retirer", "نحيد")}
                </Button>
              </div>
            </div>
          </Card>
        ))}
        <Button
          variant="secondary"
          disabled={state.customCrops.length >= 4}
          onClick={() => update([...state.customCrops, "Fallow"])}
        >
          <Icon name="plus" />
          {words(
            state.locale,
            "Add a season or fallow period",
            "Ajouter une saison ou une jachère",
            "نزيد موسم ولا راحة للأرض",
          )}
        </Button>
        <p className="draft-note">
          <Icon name="check" size="small" />
          {flow.ui.draft}
        </p>
      </section>
      <aside className="task-aside">
        <Card>
          <Badge tone="success">
            {words(
              state.locale,
              "Custom draft",
              "Brouillon personnalisé",
              "المسودة ديالك",
            )}
          </Badge>
          <h2>
            {state.customCrops.length}{" "}
            {words(
              state.locale,
              "growing seasons",
              "saisons de culture",
              "مواسم ديال الزرع",
            )}
          </h2>
          <p>
            {state.customCrops
              .map((crop) => cropName(crop, state.locale))
              .join(" → ")}
          </p>
          <p>
            {words(
              state.locale,
              `Nov 2026–Jul ${2026 + state.customCrops.length}. Timing is illustrative and depends on local conditions.`,
              `Nov. 2026–juil. ${2026 + state.customCrops.length}. Calendrier indicatif selon les conditions locales.`,
              `نونبر 2026–يوليوز ${2026 + state.customCrops.length}. التوقيت غير كمثال وكيتعلق بالظروف المحلية.`,
            )}
          </p>
        </Card>
        <Button
          onClick={() =>
            dispatch({ type: "navigate", scene: state.customResult })
          }
        >
          {scene.primary.label}
          <Icon name="check" />
        </Button>
        <div className="note">
          <Icon name="alert" size="small" />
          <p>
            {words(
              state.locale,
              "The result is a showcase preset, not a real suitability check. Try all three results in Showcase controls.",
              "Le résultat est un état prédéfini, sans contrôle agronomique réel. Essayez les trois états dans les commandes de démonstration.",
              "النتيجة مختارة للتجربة، ماشي تقييم فلاحي حقيقي. جرب النتائج الثلاثة فالتحكم فالتجربة.",
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}
