import { Badge, Button, Card, Icon, Input, SegmentedControl } from "@agrix/ui";
import { useDemo } from "../demo/DemoContext";
import { money, words } from "../demo/copy";
import { isSceneId, previewBudget } from "../demo/state";
import type { Block, FixtureItem, SceneId } from "../demo/types";
import { MapPanel } from "../features/map/MapPanel";
import { AgricultureIcon } from "./AgricultureIcon";
import { LandFactorCards } from "../features/land/LandFactorCards";

export function ActionRow({
  label,
  target,
  onNavigate,
}: {
  label: string;
  target: string;
  onNavigate?: () => void;
}) {
  const { dispatch } = useDemo();
  return (
    <button
      type="button"
      className="action-row"
      onClick={() => {
        if (isSceneId(target)) {
          dispatch({ type: "navigate", scene: target });
          onNavigate?.();
        }
      }}
    >
      <span>{label}</span>
      <Icon name="arrowRight" />
    </button>
  );
}

export function BudgetStatus({ preview = false }: { preview?: boolean }) {
  const { state } = useDemo();
  const amount = preview
    ? (previewBudget(state.budgetDraft) ?? state.budget)
    : state.budget;
  const gap = amount - 12000;
  return (
    <div className={`budget-status ${gap < 0 ? "budget-status--gap" : ""}`}>
      <Icon name={gap < 0 ? "alert" : "check"} />
      <div>
        <strong>
          {money(amount, state.locale)}{" "}
          {words(state.locale, "available", "disponibles", "متوفرة")}
        </strong>
        <span>
          {money(Math.abs(gap), state.locale)}{" "}
          {gap < 0
            ? words(
                state.locale,
                "more needed before first sale",
                "manquent avant la première vente",
                "باقي خاصك قبل أول بيعة",
              )
            : words(
                state.locale,
                "buffer before first sale",
                "de réserve avant la première vente",
                "احتياط قبل أول بيعة",
              )}
        </span>
      </div>
    </div>
  );
}

export function FarmInputs() {
  const { state, flow } = useDemo();
  const farm = flow.screens.find((screen) => screen.id === "farm")!;
  const work = flow.screens.find((screen) => screen.id === "work")!;
  const fields = [
    { scene: "farm", block: farm.blocks[0]!, index: 0 },
    { scene: "farm", block: farm.blocks[2]!, index: 2 },
    ...work.blocks
      .slice(0, 4)
      .map((block, index) => ({ scene: "work", block, index })),
  ];
  return (
    <details className="farm-inputs">
      <summary>
        {words(
          state.locale,
          "Your farm inputs",
          "Vos réponses sur la ferme",
          "المعلومات ديال الفيرمة",
        )}
      </summary>
      <dl>
        {fields.map(({ scene, block, index }) => (
          <div key={`${scene}-${index}`}>
            <dt>{block.label}</dt>
            <dd>
              {
                (block.items as string[])[
                  state.choices[`${scene}-${index}`] ?? 0
                ]
              }
            </dd>
          </div>
        ))}
        {state.choices["farm-0"] === 1 && (
          <div>
            <dt>
              {words(
                state.locale,
                "Irrigation reliability",
                "Fiabilité de l’irrigation",
                "واش السقي مضمون",
              )}
            </dt>
            <dd>
              {
                [
                  words(state.locale, "Reliable", "Fiable", "مضمون"),
                  words(
                    state.locale,
                    "Sometimes interrupted",
                    "Parfois interrompu",
                    "كيقطع بعض المرات",
                  ),
                  words(
                    state.locale,
                    "I don’t know",
                    "Je ne sais pas",
                    "ما عارفش",
                  ),
                ][state.choices["water-reliability"] ?? 2]
              }
            </dd>
          </div>
        )}
      </dl>
      <p>
        {words(
          state.locale,
          "Example inputs stay with your plan. Unknown details need local confirmation.",
          "Ces réponses restent avec le plan. Les inconnues sont à confirmer localement.",
          "المعلومات كيبقاو مع الخطة. اللي ما معروفش خاصو تأكيد محلي.",
        )}
      </p>
    </details>
  );
}

function Chart({ block }: { block: Block }) {
  const { state, dispatch } = useDemo();
  const values = block.values ?? [-1000, 9000, 17000];
  const names = block.labels ?? ["Dry", "Typical", "Favorable"];
  const options = ["dry", "typical", "favorable"] as const;
  const selected = options.indexOf(state.scenario);
  return (
    <Card className="chart-card">
      <h2>{block.label}</h2>
      <div className="scenario-summary">
        <span>{names[selected]}</span>
        <strong>{money(values[selected]!, state.locale)}</strong>
      </div>
      <svg
        className="scenario-chart"
        viewBox="0 0 560 250"
        role="img"
        aria-label={names
          .map((name, i) => `${name}: ${money(values[i]!, state.locale)}`)
          .join(", ")}
      >
        <line className="chart-baseline" x1="30" x2="530" y1="190" y2="190" />
        <text x="10" y="194" className="chart-zero">
          0
        </text>
        {values.map((value, index) => (
          <g
            key={index}
            className={
              selected === index ? "chart-bar is-selected" : "chart-bar"
            }
          >
            <rect
              x={75 + index * 170}
              y={value < 0 ? 190 : 190 - value / 110}
              width="80"
              height={Math.max(10, Math.abs(value) / 110)}
              rx="6"
            />
            <text
              x={115 + index * 170}
              y={value < 0 ? 180 : 177 - value / 110}
              textAnchor="middle"
            >
              {money(value, state.locale)}
            </text>
            <text
              x={115 + index * 170}
              y="238"
              textAnchor="middle"
              className="chart-label"
            >
              {names[index]}
            </text>
          </g>
        ))}
      </svg>
      <SegmentedControl
        label={words(
          state.locale,
          "Chart example",
          "Exemple du graphique",
          "مثال ديال الرسم",
        )}
        value={state.scenario}
        options={options.map((value, index) => ({
          value,
          label: names[index]!,
        }))}
        onChange={(scenario) =>
          dispatch({ type: "patch", patch: { scenario } })
        }
      />
      <p className="chart-explanation">
        {words(
          state.locale,
          "Example cash after setup ranges from −1,000 to 17,000 DH. This choice changes only the chart. Comparison and the current plan keep the typical example; these are not forecasts.",
          "Le solde fictif après installation va de −1 000 à 17 000 DH. Ce choix change seulement le graphique. La comparaison et le plan restent sur l’exemple habituel, sans prévision réelle.",
          "الفلوس فهاد المثال من بعد التجهيز بين ناقص 1,000 و17,000 درهم. هاد الاختيار كيبدل غير الرسم. المقارنة والخطة كيبقاو على المثال العادي، ماشي توقعات مؤكدة.",
        )}
      </p>
    </Card>
  );
}

export function BlockRenderer({
  block,
  index,
  scene,
}: {
  block: Block;
  index: number;
  scene: SceneId;
}) {
  const { state, dispatch, flow } = useDemo();
  const navigate = (id: string) => {
    if (isSceneId(id)) dispatch({ type: "navigate", scene: id });
  };
  const key = `${scene}-${index}`;
  const items = block.items ?? [];
  if (block.type === "miniMap") return <MapPanel compact />;
  if (block.type === "action")
    return (
      <ActionRow label={block.label ?? ""} target={block.target ?? "plan"} />
    );
  if (block.type === "note")
    return (
      <div className="note">
        <Icon name="alert" size="small" />
        <p>{block.body}</p>
      </div>
    );
  if (block.type === "hero")
    return (
      <Card className="key-finding agrix-card--sage">
        <p className="key-finding__label">{block.label}</p>
        <strong>{block.value}</strong>
        <p>
          {scene === "cash"
            ? words(
                state.locale,
                "For the whole 2.0 ha plot. Payments are sample assumptions.",
                "Pour les 2 ha de la parcelle. Paiements illustratifs.",
                "للأرض كاملة ديال 2 هكتار. الأداءات غير كمثال.",
              )
            : block.body}
        </p>
        {scene === "cash" && <BudgetStatus />}
      </Card>
    );
  if (block.type === "card")
    return (
      <Card>
        <h2 className={block.factor ? "illustrated-heading" : undefined}>
          {block.factor && (
            <AgricultureIcon factor={block.factor} size="small" />
          )}
          <span>{block.title}</span>
        </h2>
        <p className="multiline">{block.body}</p>
      </Card>
    );
  if (block.type === "progress")
    return (
      <Card className="analysis-progress">
        <span className="analysis-spinner" aria-hidden="true">
          <Icon name="leaf" size="large" />
        </span>
        <div>
          <h2>{block.label}</h2>
          <p>
            {words(
              state.locale,
              "Illustrative analysis · no sources are being contacted",
              "Analyse simulée · aucune source contactée",
              "تحليل كمثال · حتى مصدر ما كنتاصلو به",
            )}
          </p>
          <progress max="5" value="3" aria-label={block.label} />
        </div>
      </Card>
    );
  if (block.type === "chips" || block.type === "crops") {
    const options = items as string[];
    const selected = state.choices[key] ?? 0;
    if (scene === "returns") return null;
    return (
      <div className="form-group">
        <div className={block.factor ? "illustrated-question" : undefined}>
          {block.factor && (
            <AgricultureIcon factor={block.factor} size="small" />
          )}
          <SegmentedControl
            label={block.label ?? ""}
            options={options.map((label, i) => ({ label, value: String(i) }))}
            value={String(selected)}
            onChange={(value) =>
              dispatch({ type: "choice", key, value: Number(value) })
            }
          />
        </div>
        {scene === "farm" && index === 0 && selected === 1 && (
          <div className="nested-question">
            <SegmentedControl
              label={words(
                state.locale,
                "How reliable is the irrigation?",
                "Quelle est la fiabilité de l’irrigation ?",
                "واش ماء السقي مضمون؟",
              )}
              value={String(state.choices["water-reliability"] ?? 2)}
              onChange={(value) =>
                dispatch({
                  type: "choice",
                  key: "water-reliability",
                  value: Number(value),
                })
              }
              options={[
                words(
                  state.locale,
                  "Reliable supply",
                  "Approvisionnement fiable",
                  "الماء مضمون",
                ),
                words(
                  state.locale,
                  "Sometimes interrupted",
                  "Parfois interrompu",
                  "كيقطع بعض المرات",
                ),
                words(
                  state.locale,
                  "I don’t know",
                  "Je ne sais pas",
                  "ما عارفش",
                ),
              ].map((label, i) => ({ label, value: String(i) }))}
            />
          </div>
        )}
        {scene === "farm" && index === 3 && selected === 0 && (
          <Card className="agrix-card--sage">
            <Badge tone="info">
              {words(
                state.locale,
                "Sample field test",
                "Test de terrain fictif",
                "تحليل أرض كمثال",
              )}
            </Badge>
            <p>
              {words(
                state.locale,
                "Test-entry UI preview: texture unknown, pH not supplied. No document is uploaded.",
                "Aperçu de saisie : texture inconnue, pH non fourni. Aucun document envoyé.",
                "تجربة إدخال التحليل: نوع التراب ما معروفش، والحموضة ما متوفراش. ما كيتصيفط حتى ملف.",
              )}
            </p>
          </Card>
        )}
      </div>
    );
  }
  if (block.type === "input") {
    const budget =
      (scene === "farm" && index === 1) || (scene === "edit" && index === 0);
    if (budget)
      return (
        <Input
          label={block.label}
          inputMode="numeric"
          maxLength={7}
          value={scene === "farm" ? String(state.budget) : state.budgetDraft}
          error={
            scene === "edit" && previewBudget(state.budgetDraft) === null
              ? words(
                  state.locale,
                  "Enter a whole amount from 0 to 1,000,000.",
                  "Saisissez un montant entier de 0 à 1 000 000.",
                  "دخل مبلغ صحيح بين 0 و1,000,000.",
                )
              : undefined
          }
          onChange={(event) => {
            if (scene === "farm") {
              const amount = previewBudget(event.target.value);
              if (amount !== null)
                dispatch({ type: "patch", patch: { budget: amount } });
            } else
              dispatch({
                type: "patch",
                patch: { budgetDraft: event.target.value },
              });
          }}
        />
      );
    return (
      <Input
        label={block.label}
        value={block.value ?? ""}
        readOnly
        hint={words(
          state.locale,
          "Sample baseline · view only in this preview",
          "Base fictive · consultation dans cet aperçu",
          "معطيات المثال · للقراءة فهاد التجربة",
        )}
      />
    );
  }
  if (block.type === "factors")
    return <LandFactorCards items={items as FixtureItem[]} />;
  if (block.type === "list")
    return (
      <Card className="facts-card">
        <dl className="facts-list">
          {(items as FixtureItem[]).map((item, itemIndex) => (
            <div key={`${item.label}-${itemIndex}`}>
              <dt className={item.factor ? "illustrated-fact" : undefined}>
                {item.factor && (
                  <AgricultureIcon factor={item.factor} size="small" />
                )}
                <span>{item.label}</span>
              </dt>
              <dd>
                {scene === "ready" && itemIndex === 2
                  ? money(state.budget, state.locale)
                  : item.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    );
  if (block.type === "timeline")
    return (
      <div className="timeline">
        {(items as FixtureItem[]).map((item, i) => (
          <Card key={item.label} className="timeline-step">
            <span className="step-number">{i + 1}</span>
            <div>
              <h2>{item.label}</h2>
              <p>{item.value}</p>
              {i === 3 && (
                <Badge tone="success">
                  {words(
                    state.locale,
                    "First sale",
                    "Première vente",
                    "أول بيعة",
                  )}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  if (block.type === "menu")
    return (
      <div className="action-list">
        {(items as FixtureItem[]).map((item) => (
          <ActionRow
            key={item.label}
            label={item.label}
            target={item.target ?? "plan"}
          />
        ))}
      </div>
    );
  if (block.type === "rotation")
    return (
      <Card className="rotation-card">
        <div className="rotation-card__top">
          <Badge tone={scene === "saved" ? "success" : "neutral"}>
            {block.label}
          </Badge>
          <Icon name="leaf" />
        </div>
        <h2>{block.title}</h2>
        <p className="multiline">
          {scene === "saved"
            ? words(
                state.locale,
                `2.0 ha · 2 seasons · typical example\n12,000 DH before first sale\nAvailable cash: ${money(state.budget, state.locale)}`,
                `2 ha · 2 saisons · exemple typique\n12 000 DH avant la première vente\nArgent disponible : ${money(state.budget, state.locale)}`,
                `2 هكتار · جوج مواسم · مثال عادي\n12,000 درهم قبل أول بيعة\nالفلوس المتوفرة: ${money(state.budget, state.locale)}`,
              )
            : block.body}
        </p>
        <div className="rotation-card__value">{block.value}</div>
        <Button
          variant="secondary"
          onClick={() => navigate(block.target ?? "plan")}
        >
          {block.target === "compare"
            ? words(
                state.locale,
                "Compare this option",
                "Comparer cette option",
                "نقارن هاد الاختيار",
              )
            : flow.ui.details}
          <Icon name="arrowRight" />
        </Button>
      </Card>
    );
  if (block.type === "comparison")
    return (
      <div className="comparison-container">
        <table className="comparison-table">
          <caption>
            {words(
              state.locale,
              "Shared basis: 2.0 ha · 2 seasons · Nov 2026–Jul 2028",
              "Même base : 2 ha · 2 saisons · nov. 2026–juil. 2028",
              "نفس الأساس: 2 هكتار · جوج مواسم · نونبر 2026–يوليوز 2028",
            )}
          </caption>
          <thead>
            <tr>
              <th scope="col">
                {words(state.locale, "Compare", "Comparer", "المقارنة")}
              </th>
              {block.columns?.map((column) => (
                <th scope="col" key={column}>
                  <span className="crop-label">
                    <Icon name="leaf" size="small" />
                    {column}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows?.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th scope="row" key={cellIndex}>
                      {cell}
                    </th>
                  ) : (
                    <td key={cellIndex}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
            <tr>
              <th scope="row">
                {words(
                  state.locale,
                  "Available cash",
                  "Argent disponible",
                  "الفلوس المتوفرة",
                )}
              </th>
              <td>{money(state.budget, state.locale)}</td>
              <td>{money(state.budget, state.locale)}</td>
            </tr>
            <tr>
              <th scope="row">
                {words(
                  state.locale,
                  "Cash gap",
                  "Manque de trésorerie",
                  "الخصاص",
                )}
              </th>
              <td>{money(Math.max(0, 12000 - state.budget), state.locale)}</td>
              <td>{money(Math.max(0, 10000 - state.budget), state.locale)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  if (block.type === "chart") return <Chart block={block} />;
  return null;
}
