import { Badge, Button, Card, Icon, Input } from "@agrix/ui";
import { useDemo } from "../demo/DemoContext";
import { labels, money, words } from "../demo/copy";
import { isSceneId, previewBudget } from "../demo/state";
import type { Scene, SceneId } from "../demo/types";
import { MapPanel } from "../features/map/MapPanel";
import { BuilderView } from "../features/plans/BuilderView";
import { cropName } from '../features/plans/catalog';
import { ChatView } from "../features/chat/ChatView";
import {
  ActionRow,
  BlockRenderer,
  BudgetStatus,
  FarmInputs,
} from "./BlockRenderer";

function PrimaryActions({ scene }: { scene: Scene }) {
  const { state, dispatch } = useDemo();
  function primary() {
    if (scene.id === "draw") {
      dispatch({ type: "confirm-plot" });
      return;
    }
    if (scene.id === "plan") {
      dispatch({ type: "save" });
      return;
    }
    if (scene.id === "updated") {
      dispatch({ type: "apply-budget" });
      return;
    }
    if (scene.id === "analysis")
      dispatch({ type: "patch", patch: { plotChanged: false } });
    if (scene.id === "edit" && previewBudget(state.budgetDraft) === null)
      return;
    if (isSceneId(scene.primary.target))
      dispatch({ type: "navigate", scene: scene.primary.target });
  }
  const secondary = scene.secondary;
  return (
    <div className="primary-actions">
      <Button
        onClick={primary}
        disabled={
          (scene.id === "draw" && state.points.length < 3) ||
          (scene.id === "edit" && previewBudget(state.budgetDraft) === null)
        }
      >
        {scene.primary.label}
        <Icon
          name={
            scene.id === "plan"
              ? "bookmark"
              : scene.id === "draw"
                ? "check"
                : "arrowRight"
          }
        />
      </Button>
      {secondary && !["work", "builder", "ready"].includes(scene.id) && (
        <Button
          variant="secondary"
          onClick={() => {
            if (scene.id === "map") {
              dispatch({
                type: "patch",
                patch: { locationStage: "permission" },
              });
              return;
            }
            if (scene.id === "saved")
              dispatch({ type: "patch", patch: { plotChanged: false } });
            if (isSceneId(secondary.target))
              dispatch({ type: "navigate", scene: secondary.target });
          }}
        >
          {scene.id === "map" ? (
            <>
              <span className="desktop-location-label">
                {labels[state.locale].device}
              </span>
              <span className="phone-location-label">
                {labels[state.locale].phone}
              </span>
            </>
          ) : (
            secondary.label
          )}
        </Button>
      )}
    </div>
  );
}

function MapScene({ scene }: { scene: Scene }) {
  const { state, dispatch, flow } = useDemo();
  const text = labels[state.locale];
  const drawing = scene.id === "draw" || scene.id === "invalid";
  return (
    <div className="task-layout map-layout">
      <section className="task-main" aria-label={flow.ui.map}>
        {scene.id === "map" && (
          <form
            className="address-search"
            onSubmit={(event) => {
              event.preventDefault();
              if (state.address.trim())
                dispatch({
                  type: "patch",
                  patch: { locationSource: "address" },
                });
            }}
          >
            <Input
              label={text.address}
              required
              maxLength={160}
              value={state.address}
              onChange={(event) =>
                dispatch({
                  type: "patch",
                  patch: { address: event.target.value },
                })
              }
            />
            <Button type="submit">
              <Icon name="search" />
              {text.search}
            </Button>
          </form>
        )}
        <MapPanel
          editable={drawing && scene.id !== "invalid"}
          invalid={scene.id === "invalid"}
        />
        <p className="map-helper" role="status">
          {drawing
            ? words(
                state.locale,
                `${state.points.length} points placed · tap corners or use the sample outline. Move points with touch or arrow keys.`,
                `${state.points.length} points placés · touchez les coins ou utilisez le contour d’exemple. Déplacez les points au toucher ou avec les flèches.`,
                `${state.points.length} نقط تحطو · ضغط على الأركان ولا استعمل حدود المثال. حرك النقط باللمس ولا بالأسهم.`,
              )
            : state.locationSource === "address"
              ? words(
                  state.locale,
                  "Sample result centered on Settat. Your field boundary is still yours to draw.",
                  "Résultat fictif centré sur Settat. Vous devez encore tracer votre parcelle.",
                  "نتيجة كمثال فسطات. حدود الأرض باقين خاصك ترسمهم.",
                )
              : words(
                  state.locale,
                  "Find your area first. Your location never defines your plot boundary.",
                  "Repérez la zone. Votre position ne définit pas le contour de la parcelle.",
                  "قلب على الجهة أولا. البلاصة ديالك ما كتحددش حدود الأرض.",
                )}
        </p>
      </section>
      <aside className="task-aside">
        {scene.blocks
          .filter((block) => block.type !== "input")
          .map((block, index) => (
            <BlockRenderer
              key={index}
              block={block}
              index={index}
              scene={scene.id}
            />
          ))}
        {drawing && (
          <Badge tone={scene.id === "invalid" ? "danger" : "success"}>
            {scene.id === "invalid"
              ? words(
                  state.locale,
                  "Crossing edges · example",
                  "Bords croisés · exemple",
                  "الحدود متقاطعة · مثال",
                )
              : text.sampleArea}
          </Badge>
        )}
        <PrimaryActions scene={scene} />
        {scene.id === "map" && (
          <Button
            variant="ghost"
            onClick={() =>
              dispatch({ type: "patch", patch: { locationStage: "address" } })
            }
          >
            {words(
              state.locale,
              "Search with an address",
              "Chercher par adresse",
              "نقلب بالعنوان",
            )}
          </Button>
        )}
        <Card className="agrix-card--sage">
          <Icon name={drawing ? "map" : "leaf"} size="large" />
          <h2>
            {drawing
              ? words(
                  state.locale,
                  "Your outline, your choice",
                  "Votre contour, votre choix",
                  "الحدود ديالك، الاختيار ديالك",
                )
              : words(
                  state.locale,
                  "A practical first step",
                  "Un premier pas concret",
                  "أول خطوة عملية",
                )}
          </h2>
          <p>
            {drawing
              ? words(
                  state.locale,
                  "The surface is a fixed sample estimate in this UI preview. Confirmed geometry stays in this tab.",
                  "La surface est une estimation fixe dans cet aperçu. Le contour reste dans cet onglet.",
                  "المساحة ثابتة كمثال فهاد التجربة. الحدود كيبقاو فهاد الصفحة.",
                )
              : text.firstSale}
          </p>
        </Card>
      </aside>
    </div>
  );
}

function UpdatedScene({ scene }: { scene: Scene }) {
  const { state } = useDemo();
  const draft = previewBudget(state.budgetDraft) ?? state.budget;
  const gap = Math.max(0, 12000 - draft);
  return (
    <div className="task-layout">
      <section className="task-main">
        <Card className="key-finding agrix-card--sage">
          <p>
            {words(
              state.locale,
              "Preview of available cash",
              "Aperçu de l’argent disponible",
              "تجربة الفلوس المتوفرة",
            )}
          </p>
          <strong>{money(gap, state.locale)}</strong>
          <p>
            {gap
              ? words(
                  state.locale,
                  "more needed before the first sale",
                  "manquent avant la première vente",
                  "باقي خاصك قبل أول بيعة",
                )
              : words(
                  state.locale,
                  "No opening cash gap in this example",
                  "Aucun manque initial dans cet exemple",
                  "ما كاين حتى خصاص ففلوس البداية فهاد المثال",
                )}
          </p>
          <BudgetStatus preview />
        </Card>
        <Card>
          <h2>
            {words(
              state.locale,
              "What would change?",
              "Ce qui changerait",
              "شنو غادي يتبدل؟",
            )}
          </h2>
          <div className="change-row">
            <span>
              {words(
                state.locale,
                "Available cash",
                "Argent disponible",
                "الفلوس المتوفرة",
              )}
            </span>
            <strong>
              <bdi>{money(state.budget, state.locale)}</bdi>
              <Icon name="arrowRight" />
              <bdi>{money(draft, state.locale)}</bdi>
            </strong>
          </div>
          <p>
            {words(
              state.locale,
              "Example costs and receipts stay the same. Typical cash after setup remains 9,000 DH. Apply to update comparison, saved plan and chat together.",
              "Les dépenses et recettes fictives restent identiques. Le solde typique reste de 9 000 DH. Appliquez pour actualiser comparaison, plan et chat.",
              "المصاريف والمداخيل ديال المثال ما تبدلوش. الباقي من بعد التجهيز 9,000 درهم. أكد باش تتبدل المقارنة والخطة والدردشة مجموعين.",
            )}
          </p>
        </Card>
        {scene.blocks.slice(2, 3).map((block, index) => (
          <BlockRenderer
            key={index}
            block={block}
            index={index}
            scene="updated"
          />
        ))}
      </section>
      <aside className="task-aside">
        <Badge tone="warning">
          {words(
            state.locale,
            "Preview · not applied yet",
            "Aperçu · pas encore appliqué",
            "تجربة · باقي ما تأكداتش",
          )}
        </Badge>
        <PrimaryActions scene={scene} />
        <MapPanel compact />
      </aside>
    </div>
  );
}

export function SceneView({ scene }: { scene: Scene }) {
  const { state, dispatch, flow } = useDemo();
  const nav = (id: SceneId) => dispatch({ type: "navigate", scene: id });
  if (["map", "draw", "invalid"].includes(scene.id))
    return <MapScene scene={scene} />;
  if (scene.id === "chat") return <ChatView scene={scene} />;
  if (scene.id === "builder") return <BuilderView scene={scene} />;
  if (scene.id === "updated") return <UpdatedScene scene={scene} />;
  if (['ready', 'needs', 'conflict'].includes(scene.id)) {
    const resultLabel = scene.id === 'ready'
      ? words(state.locale, 'Feasible example', 'Exemple réalisable', 'مثال ممكن')
      : scene.id === 'needs'
        ? words(state.locale, 'Needs confirmation · example', 'À confirmer · exemple', 'خاص تأكيد · مثال')
        : words(state.locale, 'Conflicting requirement · example', 'Exigence incompatible · exemple', 'شرط ما كيناسبش · مثال');
    return <div className="task-layout">
      <section className="task-main">
        <Card className="agrix-card--sage">
          <Badge tone={scene.id === 'ready' ? 'success' : 'warning'}>{resultLabel}</Badge>
          <h2 className="draft-result-heading">{words(state.locale, 'Your current draft', 'Votre brouillon actuel', 'المسودة ديالك دابا')}</h2>
          <p>{state.customCrops.map(crop => cropName(crop, state.locale)).join(state.locale === 'ar' ? ' ← ' : ' → ')}</p>
          <p>{words(state.locale, 'The draft has not been assessed. No suitability or financial result is generated from these edits.', 'Ce brouillon n’a pas été évalué. Ces modifications ne génèrent aucun résultat agronomique ou financier.', 'هاد المسودة باقي ما تقيماتش. هاد التغييرات ما كتحسب حتى نتيجة فلاحية ولا مالية.')}</p>
        </Card>
        {scene.id !== 'ready' && scene.blocks.map((block, index) => <BlockRenderer key={index} block={block} index={index} scene={scene.id} />)}
        {scene.id === 'ready' && <Card>
          <h2>{words(state.locale, 'Explore the sample report layout', 'Explorer le rapport d’exemple', 'نشوف شكل التقرير ديال المثال')}</h2>
          <p>{words(state.locale, 'The detailed report uses the fixed Wheat → Chickpea example: two seasons, 12,000 DH before the first sale. It does not describe your edited sequence.', 'Le rapport détaillé utilise l’exemple fixe Blé → Pois chiche : deux saisons, 12 000 DH avant la première vente. Il ne décrit pas votre séquence modifiée.', 'التقرير المفصل كيستعمل المثال الثابت ديال القمح ← الحمص: جوج مواسم و12,000 درهم قبل أول بيعة. ماشي تقرير على التسلسل اللي بدلتي.')}</p>
        </Card>}
      </section>
      <aside className="task-aside">
        <Button onClick={() => nav('builder')}><Icon name="arrowLeft" />{words(state.locale, 'Return to my draft', 'Revenir à mon brouillon', 'نرجع للمسودة ديالي')}</Button>
        <Button variant="secondary" onClick={() => nav('plan')}>{words(state.locale, 'Open Wheat → Chickpea sample', 'Ouvrir l’exemple Blé → Pois chiche', 'نحل مثال القمح ← الحمص')}<Icon name="arrowRight" /></Button>
        <FarmInputs />
        <p className="aside-note">{labels[state.locale].sampleOnly}</p>
      </aside>
    </div>;
  }
  if (scene.id === "saved" && !state.saved)
    return (
      <Card className="empty-state">
        <span className="empty-symbol">
          <Icon name="bookmark" size="large" />
        </span>
        <h2>{labels[state.locale].notSaved}</h2>
        <p>
          {words(
            state.locale,
            "Open a growing plan, then save it to keep the current plot and assumptions together in this tab.",
            "Ouvrez un plan puis enregistrez-le pour conserver parcelle et hypothèses dans cet onglet.",
            "حل خطة الزرع وحفظها باش تبقى مع الأرض والافتراضات فهاد الصفحة.",
          )}
        </p>
        <Button onClick={() => nav("options")}>
          {labels[state.locale].choosePlan}
          <Icon name="arrowRight" />
        </Button>
      </Card>
    );
  if (scene.id === "compare")
    return (
      <div className="compare-view">
        <div className="comparison-context">
          <Badge tone="success">{flow.ui.unit}</Badge>
          <span>
            {words(
              state.locale,
              "Same dates · same scenario · sample figures",
              "Mêmes dates · même scénario · chiffres fictifs",
              "نفس التواريخ · نفس السيناريو · أرقام كمثال",
            )}
          </span>
        </div>
        {scene.blocks
          .filter((block) => block.type === "comparison")
          .map((block, index) => (
            <BlockRenderer
              key={index}
              block={block}
              index={index}
              scene={scene.id}
            />
          ))}
        <div className="compare-bottom">
          <Card>
            <h2>{scene.blocks[1]?.title}</h2>
            <p>{scene.blocks[1]?.body}</p>
            <BudgetStatus />
          </Card>
          <aside className="task-aside">
            {scene.blocks
              .filter((block) => block.type === "action")
              .map((block, index) => (
                <BlockRenderer
                  key={index}
                  block={block}
                  index={index}
                  scene={scene.id}
                />
              ))}
            <PrimaryActions scene={scene} />
            <FarmInputs />
          </aside>
        </div>
      </div>
    );
  if (scene.id === "options")
    return (
      <div className="options-view">
        <BlockRenderer block={scene.blocks[0]!} index={0} scene="options" />
        <div className="rotation-grid">
          {scene.blocks
            .filter((block) => block.type === "rotation")
            .map((block, index) => (
              <BlockRenderer
                key={index}
                block={block}
                index={index}
                scene="options"
              />
            ))}
        </div>
        <div className="options-footer">
          <p>{scene.blocks.at(-1)?.body}</p>
          <PrimaryActions scene={scene} />
          <FarmInputs />
        </div>
      </div>
    );
  const form = scene.kind === "form";
  const primaryBlocks = scene.blocks.filter(
    (block) => block.type !== "miniMap",
  );
  return (
    <div className={`task-layout ${form ? "form-layout" : ""}`}>
      <section className="task-main">
        {primaryBlocks.map((block, index) => (
          <BlockRenderer
            key={`${scene.id}-${index}`}
            block={block}
            index={index}
            scene={scene.id}
          />
        ))}
        {scene.id === "saved" && <BudgetStatus />}
        {scene.id === "plan" && <BudgetStatus />}
      </section>
      <aside className="task-aside">
        {!form && <MapPanel compact />}
        {form && (
          <Card className="agrix-card--sage">
            <span className="eyebrow">{flow.ui.context}</span>
            <h2>
              {words(
                state.locale,
                "Start with what you know",
                "Commencez par ce que vous savez",
                "بدا بداكشي اللي عارف",
              )}
            </h2>
            <p>
              {words(
                state.locale,
                "Unknown answers are welcome. This example keeps them visible so you know what to confirm locally.",
                "Vous pouvez répondre « Je ne sais pas ». Les informations à confirmer restent visibles.",
                "تقدر تجاوب بما عارفش. المعلومات اللي خاصها تأكيد كتبقى باينة.",
              )}
            </p>
          </Card>
        )}
        <PrimaryActions scene={scene} />
        {["plan", "ready", "saved"].includes(scene.id) && <FarmInputs />}
        {scene.id === "plan" && (
          <ActionRow
            target="compare"
            label={words(
              state.locale,
              "Compare with barley → chickpea",
              "Comparer avec orge → pois chiche",
              "نقارن مع الشعير ← الحمص",
            )}
          />
        )}
        {scene.id === "edit" && <BudgetStatus />}
        {!["chat", "analysis"].includes(scene.id) && (
          <Button variant="ghost" onClick={() => nav("chat")}>
            <Icon name="chat" />
            {flow.ui.help}
          </Button>
        )}
        <p className="aside-note">{labels[state.locale].sampleOnly}</p>
      </aside>
    </div>
  );
}
