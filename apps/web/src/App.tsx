import { useEffect, useRef } from "react";
import { Badge, Button, Card, Icon, Select } from "@agrix/ui";
import { DemoProvider, useDemo } from "./demo/DemoContext";
import { labels, money, words } from "./demo/copy";
import { isSceneId, previewBudget } from "./demo/state";
import type { Locale, SceneId } from "./demo/types";
import { SceneView } from "./components/SceneView";
import { LocationDialog } from "./features/map/LocationDialog";
import { VoiceDialog } from "./features/chat/VoiceDialog";
import { AssistantAccess } from "./features/chat/AssistantAccess";

const plotScenes = [
  "map",
  "draw",
  "invalid",
  "analysis",
  "land",
  "farm",
  "work",
  "partial",
  "sources",
  "offline",
];
function Workspace() {
  const { state, dispatch, flow } = useDemo();
  const text = labels[state.locale];
  const heading = useRef<HTMLHeadingElement>(null);
  const scene = flow.screens.find((screen) => screen.id === state.scene)!;
  const previewGap = Math.max(
    0,
    12000 - (previewBudget(state.budgetDraft) ?? state.budget),
  );
  const title =
    state.scene === "updated"
      ? previewGap
        ? words(
            state.locale,
            `You would need ${money(previewGap, state.locale)} more`,
            `Il manquerait ${money(previewGap, state.locale)}`,
            `باقي غادي خاصك ${money(previewGap, state.locale)}`,
          )
        : words(
            state.locale,
            "Your opening cash covers this example",
            "Votre argent couvre cet exemple",
            "الفلوس ديالك كافية لهاد المثال",
          )
      : state.scene === "ready"
        ? words(
            state.locale,
            "Review a sample check result",
            "Consulter un résultat d’exemple",
            "نراجع نتيجة كمثال",
          )
        : scene.title;
  const navigate = (id: SceneId) => dispatch({ type: "navigate", scene: id });
  const active = plotScenes.includes(state.scene)
    ? "map"
    : state.scene === "saved"
      ? "saved"
      : state.scene === "chat"
        ? "chat"
        : "options";
  const nav = [
    { id: "map", icon: "map", label: flow.ui.map },
    { id: "options", icon: "plans", label: flow.ui.plans },
    { id: "saved", icon: "bookmark", label: flow.ui.saved },
    { id: "chat", icon: "chat", label: flow.ui.help },
  ] as const;
  useEffect(() => {
    document.documentElement.lang =
      state.locale === "ar" ? "ar-MA" : state.locale;
    document.documentElement.dir = flow.rtl ? "rtl" : "ltr";
    document.title = `${title} · AgriX UI preview`;
  }, [state.locale, flow.rtl, title]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [state.scene]);

  return (
    <div className="workspace" dir={flow.rtl ? "rtl" : "ltr"}>
      <a className="skip-link" href="#main-content">
        {words(
          state.locale,
          "Skip to content",
          "Aller au contenu",
          "نمشي للمحتوى",
        )}
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            navigate("map");
          }}
          aria-label="AgriX"
        >
          <Icon name="leaf" size="large" />
          AgriX
        </a>
        <p className="brand-caption">{text.workflow}</p>
        <nav
          aria-label={words(
            state.locale,
            "Main navigation",
            "Navigation principale",
            "التنقل الرئيسي",
          )}
          className="desktop-nav"
        >
          {nav.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`nav-item ${active === item.id ? "is-active" : ""}`}
              aria-current={active === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>
        <Card className="plot-context agrix-card--sage">
          <span className="eyebrow">
            {words(state.locale, "YOUR PLOT", "VOTRE PARCELLE", "الأرض ديالك")}
          </span>
          <strong>
            {words(
              state.locale,
              "Settat pilot",
              "Parcelle pilote de Settat",
              "مثال أرض فسطات",
            )}
          </strong>
          <span>{text.sampleArea}</span>
          <span>
            {words(
              state.locale,
              "Rainfed · example",
              "Pluviale · exemple",
              "بور · كمثال",
            )}
          </span>
          <span className="privacy">
            <Icon name="check" size="small" />
            {flow.ui.privacy}
          </span>
        </Card>
        <p className="sidebar-footer">{text.firstSale}</p>
      </aside>
      <div className="workspace-body">
        <header className="app-header">
          <span className="mobile-brand">
            <Icon name="leaf" />
            AgriX
          </span>
          <div className="header-context">
            <span>
              {words(
                state.locale,
                "Farm workspace",
                "Espace de la ferme",
                "فضاء الفيرمة",
              )}
            </span>
            <span className="header-divider">/</span>
            <strong>{text.context}</strong>
          </div>
          <div className="header-actions">
            <Select
              aria-label={words(
                state.locale,
                "Interface language",
                "Langue de l’interface",
                "لغة الواجهة",
              )}
              value={state.locale}
              onChange={(event) =>
                dispatch({
                  type: "locale",
                  locale: event.target.value as Locale,
                })
              }
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">الدارجة</option>
            </Select>
          </div>
        </header>
        <AssistantAccess />
        <main id="main-content" className={`main-content scene-${state.scene}`}>
          <div className="page-heading">
            <div className="heading-topline">
              {state.scene !== "map" && (
                <Button
                  variant="ghost"
                  size="small"
                  className="back-button"
                  onClick={() => dispatch({ type: "back" })}
                >
                  <Icon name="arrowLeft" />
                  {flow.ui.back}
                </Button>
              )}
              <Badge tone="info">{text.preview}</Badge>
              <span className="sample-label">{text.sample}</span>
            </div>
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
            <p className="page-subtitle">
              {state.scene === "map"
                ? words(
                    state.locale,
                    "Use device location, enter an address, or choose on the map.",
                    "Utilisez votre position, une adresse ou choisissez sur la carte.",
                    "استعمل البلاصة ديالك، دخل عنوان ولا اختار فالخريطة.",
                  )
                : state.scene === "ready"
                  ? words(
                      state.locale,
                      "Your draft is kept. This result is a preset for reviewing the UI.",
                      "Votre brouillon est conservé. Ce résultat prédéfini sert à tester l’interface.",
                      "المسودة باقية. هاد النتيجة مختارة باش نجربو الواجهة.",
                    )
                  : scene.subtitle}
            </p>
          </div>
          {state.plotChanged &&
            !["map", "draw", "invalid", "analysis"].includes(state.scene) && (
              <div role="status" className="notice notice--warning">
                <Icon name="alert" />
                {words(
                  state.locale,
                  "The outline changed. Review the sample analysis before relying on this plan.",
                  "Le contour a changé. Revoyez l’analyse avant de poursuivre.",
                  "الحدود تبدلات. راجع تحليل المثال قبل ما تكمل.",
                )}
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => navigate("analysis")}
                >
                  {words(state.locale, "Review", "Revoir", "نراجع")}
                </Button>
              </div>
            )}
          <SceneView scene={scene} />
          <details
            className="showcase-controls"
            open={state.showControls}
            onToggle={(event) => {
              const open = event.currentTarget.open;
              if (open !== state.showControls)
                dispatch({ type: "patch", patch: { showControls: open } });
            }}
          >
            <summary>
              <Icon name="play" size="small" />
              {text.controls}
              <span>
                {words(
                  state.locale,
                  "For testing the UI",
                  "Pour tester l’interface",
                  "باش نجربو الواجهة",
                )}
              </span>
            </summary>
            <div className="showcase-controls__content">
              <Select
                label={text.scene}
                value={state.scene}
                onChange={(event) => {
                  if (isSceneId(event.target.value))
                    navigate(event.target.value);
                }}
              >
                {flow.screens.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    {screen.title}
                  </option>
                ))}
              </Select>
              <Select
                label={words(
                  state.locale,
                  "Builder check example",
                  "Résultat du créateur",
                  "مثال نتيجة التسلسل",
                )}
                value={state.customResult}
                onChange={(event) =>
                  dispatch({
                    type: "patch",
                    patch: {
                      customResult: event.target.value as
                        | "ready"
                        | "needs"
                        | "conflict",
                    },
                  })
                }
              >
                <option value="ready">
                  {words(
                    state.locale,
                    "Feasible example",
                    "Exemple réalisable",
                    "مثال ممكن",
                  )}
                </option>
                <option value="needs">
                  {words(
                    state.locale,
                    "Needs confirmation",
                    "À confirmer",
                    "خاص تأكيد",
                  )}
                </option>
                <option value="conflict">
                  {words(
                    state.locale,
                    "Conflicting requirement",
                    "Exigence incompatible",
                    "شرط ما كيناسبش",
                  )}
                </option>
              </Select>
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: "reset" })}
              >
                <Icon name="reset" />
                {text.reset}
              </Button>
              <p>
                {text.sampleOnly}{" "}
                {words(
                  state.locale,
                  "Progress lasts only while this tab is open. Location, recording, analysis and chat are simulations.",
                  "La progression reste dans cet onglet. Position, audio, analyse et chat sont simulés.",
                  "التقدم كيبقى غير مادام هاد الصفحة محلولة. البلاصة والصوت والتحليل والدردشة كاملين محاكاة.",
                )}
              </p>
            </div>
          </details>
        </main>
        <nav
          className="mobile-nav"
          aria-label={words(
            state.locale,
            "Main navigation",
            "Navigation principale",
            "التنقل الرئيسي",
          )}
        >
          {nav.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => navigate(item.id)}
              className={active === item.id ? "is-active" : ""}
              aria-current={active === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <LocationDialog />
      <VoiceDialog />
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <Workspace />
    </DemoProvider>
  );
}
