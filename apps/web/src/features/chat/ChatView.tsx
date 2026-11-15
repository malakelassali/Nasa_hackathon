import { Badge, Button, Card, Icon, Input, Select } from "@agrix/ui";
import { useDemo } from "../../demo/DemoContext";
import { labels, money, words } from "../../demo/copy";
import type { Locale, Scene } from "../../demo/types";
import { MapPanel } from "../map/MapPanel";
import { ActionRow, BudgetStatus } from "../../components/BlockRenderer";

function SampleAnswer() {
  const { state } = useDemo();
  const locale =
    (["ar", "fr", "en"] as const)[state.choices["chat-language"] ?? 0] ?? "ar";
  const gap = Math.max(0, 12000 - state.budget);
  const reply = words(
    locale,
    `In this example, you need 12,000 DH before your first sale for the whole plot. You have ${money(state.budget, locale)} available${gap ? `, leaving a ${money(gap, locale)} gap` : ` and a ${money(state.budget - 12000, locale)} buffer`}. Confirm prices and dates locally.`,
    `Dans cet exemple, il faut 12 000 DH avant la première vente pour toute la parcelle. Vous avez ${money(state.budget, locale)}${gap ? `, il manque donc ${money(gap, locale)}` : `, avec ${money(state.budget - 12000, locale)} de réserve`}. Confirmez les prix et dates localement.`,
    `فهاد المثال، خاصك 12,000 درهم قبل أول بيعة للأرض كاملة. عندك دابا ${money(state.budget, locale)}. ${gap ? `باقي خاصك ${money(gap, locale)}.` : `كيبقى ${money(state.budget - 12000, locale)} احتياط.`} خاصك تأكد الأثمنة والتواريخ محلياً.`,
  );
  return (
    <Card className="chat-message chat-message--assistant">
      <span className="message-author">
        <Icon name="leaf" size="small" />
        AgriX
        <Badge tone="neutral">
          {words(state.locale, "Sample reply", "Réponse fictive", "جواب كمثال")}
        </Badge>
      </span>
      <p
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale === "ar" ? "ar-MA" : locale}
      >
        {reply}
      </p>
    </Card>
  );
}

export function ChatView({
  scene,
  onNavigate,
}: {
  scene: Scene;
  onNavigate?: () => void;
}) {
  const { state, dispatch, flow } = useDemo();
  const text = labels[state.locale];
  const sender = flow.ui.you ?? words(state.locale, "You", "Vous", "نتا");
  const prompts = ["واش نقدر نكري الماكينة؟", "إلا تأخر الشتا؟"];
  return (
    <div className="task-layout chat-layout">
      <section className="task-main">
        <Button
          id="chat-voice-action"
          className="voice-question"
          onClick={() =>
            dispatch({ type: "patch", patch: { voiceStage: "permission" } })
          }
          aria-haspopup="dialog"
        >
          <span className="voice-question__symbol">
            <Icon name="mic" size="large" />
          </span>
          <span className="voice-question__copy">
            <strong>
              {words(
                state.locale,
                "Ask with your voice",
                "Posez votre question à voix haute",
                "سول بصوتك",
              )}
            </strong>
            <span>
              {words(
                state.locale,
                "Tap here to speak. Review your question before sending.",
                "Appuyez ici pour parler. Vérifiez votre question avant de l’envoyer.",
                "ضغط هنا وهضر. راجع السؤال ديالك قبل ما تصيفطو.",
              )}
            </span>
          </span>
        </Button>
        <div className="chat-context">
          <Badge tone="success">{flow.ui.context}</Badge>
          <span>
            {words(
              state.locale,
              "Wheat → Chickpea · typical example",
              "Blé → Pois chiche · exemple typique",
              "القمح ← الحمص · مثال عادي",
            )}
          </span>
          <Select
            label={words(
              state.locale,
              "Chat language",
              "Langue du chat",
              "لغة الدردشة",
            )}
            value={state.choices["chat-language"] ?? 0}
            onChange={(event) =>
              dispatch({
                type: "choice",
                key: "chat-language",
                value: Number(event.target.value),
              })
            }
          >
            <option value="0">الدارجة</option>
            <option value="1">Français</option>
            <option value="2">English</option>
          </Select>
        </div>
        <div
          className="chat-conversation"
          role="log"
          aria-label={words(
            state.locale,
            "Sample conversation",
            "Conversation fictive",
            "دردشة كمثال",
          )}
        >
          <Card className="chat-message chat-message--user">
            <span className="message-author">{sender}</span>
            <p dir="rtl" lang="ar-MA">
              شحال خاصني قبل أول بيعة؟
            </p>
          </Card>
          <SampleAnswer />
          {state.sentMessages.map((message, index) => (
            <div className="message-pair" key={`${index}-${message}`}>
              <Card className="chat-message chat-message--user">
                <span className="message-author">{sender}</span>
                <p dir="auto">{message}</p>
              </Card>
              <Card className="chat-message chat-message--assistant">
                <span className="message-author">
                  AgriX
                  <Badge tone="neutral">
                    {words(
                      state.locale,
                      "Sample reply",
                      "Réponse fictive",
                      "جواب كمثال",
                    )}
                  </Badge>
                </span>
                <p
                  dir="auto"
                  lang={
                    (state.choices["chat-language"] ?? 0) === 0
                      ? "ar-MA"
                      : undefined
                  }
                >
                  {words(
                    (["ar", "fr", "en"] as Locale[])[
                      state.choices["chat-language"] ?? 0
                    ] ?? "ar",
                    "This is a sample reply. Check the current cash breakdown and confirm machinery, rain and buyer terms locally.",
                    "Ceci est une réponse fictive. Consultez le budget et confirmez localement machines, pluie et conditions de vente.",
                    "هاد الجواب غير كمثال. شوف تفصيل الفلوس وتأكد محلياً من الماكينة والشتا وشروط البيعة.",
                  )}
                </p>
                <ActionRow
                  label={words(
                    state.locale,
                    "Open cash breakdown",
                    "Voir le budget",
                    "نشوف تفصيل الفلوس",
                  )}
                  target="cash"
                  onNavigate={onNavigate}
                />
              </Card>
            </div>
          ))}
          {state.sentVoiceMessages.map((message) => (
            <div className="message-pair" key={message.id}>
              <Card className="chat-message chat-message--user">
                <span className="message-author">{sender}</span>
                <div className="sent-voice">
                  <Icon name="mic" />
                  <span>
                    {words(
                      state.locale,
                      "Voice sample",
                      "Message vocal fictif",
                      "صوت كمثال",
                    )}{" "}
                    ·{" "}
                    <bdi>
                      00:
                      {String(message.duration).padStart(2, "0")}
                    </bdi>
                  </span>
                  <Badge tone="info">{text.preview}</Badge>
                </div>
                <p dir="auto">{message.transcript}</p>
              </Card>
              <SampleAnswer />
            </div>
          ))}
        </div>
        <div className="chat-prompts">
          <h2>{scene.blocks.find((block) => block.type === "chips")?.label}</h2>
          <div>
            {prompts.map((prompt) => (
              <Button
                variant="secondary"
                key={prompt}
                onClick={() =>
                  dispatch({ type: "patch", patch: { chatDraft: prompt } })
                }
              >
                <span dir="rtl" lang="ar-MA">
                  {prompt}
                </span>
              </Button>
            ))}
          </div>
        </div>
        <form
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            dispatch({ type: "send-message" });
          }}
        >
          <Input
            label={words(
              state.locale,
              "Or write your question",
              "Ou écrivez votre question",
              "ولا كتب السؤال ديالك",
            )}
            value={state.chatDraft}
            onChange={(event) =>
              dispatch({
                type: "patch",
                patch: { chatDraft: event.target.value },
              })
            }
            maxLength={500}
            dir="auto"
            placeholder={words(
              state.locale,
              "Ask about your plan…",
              "Posez une question…",
              "سول على الخطة ديالك…",
            )}
          />
          <div className="composer-actions">
            <Button type="submit" disabled={!state.chatDraft.trim()}>
              {text.send}
              <Icon name="arrowRight" />
            </Button>
          </div>
        </form>
        <div className="note">
          <Icon name="alert" size="small" />
          <p>
            {words(
              state.locale,
              "Replies and voice messages are local examples. To try a budget change, preview it before applying.",
              "Réponses et messages vocaux sont des exemples locaux. Un changement de budget se prévisualise avant application.",
              "الأجوبة والصوت غير أمثلة محلية. إلا بغيتي تبدل الميزانية جربها قبل ما تأكد.",
            )}
          </p>
        </div>
      </section>
      <aside className="task-aside">
        <BudgetStatus />
        <ActionRow
          label={words(
            state.locale,
            "Open cash breakdown · 12,000 DH",
            "Voir le budget · 12 000 DH",
            "نشوف تفصيل الفلوس · 12,000 درهم",
          )}
          target="cash"
          onNavigate={onNavigate}
        />
        <MapPanel compact />
        <Card className="key-finding agrix-card--sage">
          <p>{flow.ui.context}</p>
          <strong>
            {words(
              state.locale,
              "Wheat → Chickpea",
              "Blé → Pois chiche",
              "القمح ← الحمص",
            )}
          </strong>
          <p>{flow.ui.demo}</p>
        </Card>
        <Button
          onClick={() => {
            dispatch({ type: "navigate", scene: "edit" });
            onNavigate?.();
          }}
        >
          {scene.primary.label}
          <Icon name="arrowRight" />
        </Button>
      </aside>
    </div>
  );
}
