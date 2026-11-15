import { useEffect } from "react";
import { Badge, Button, Card, Icon, Modal } from "@agrix/ui";
import { useDemo } from "../../demo/DemoContext";
import { labels, words } from "../../demo/copy";

export function VoiceDialog() {
  const { state, dispatch } = useDemo();
  const text = labels[state.locale];
  const close = () =>
    dispatch({
      type: "patch",
      patch: { voiceStage: null, voicePlaying: false },
    });
  useEffect(() => {
    if (state.voiceStage !== "recording") return;
    const timer = window.setInterval(
      () =>
        dispatch({
          type: "patch",
          patch: { voiceElapsed: Math.min(59, state.voiceElapsed + 1) },
        }),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [state.voiceStage, state.voiceElapsed, dispatch]);
  return (
    <Modal
      className="voice-dialog"
      open={state.voiceStage !== null}
      onClose={close}
      closeLabel={text.close}
      title={text.record}
      description={words(
        state.locale,
        "Your plot and current assumptions stay in context.",
        "La parcelle et les hypothèses restent dans le contexte.",
        "الأرض والافتراضات ديالك كيبقاو فالسياق.",
      )}
    >
      <div className="dialog-stack">
        <Badge tone="info">{text.preview}</Badge>
        {state.voiceStage === "permission" && (
          <>
            <div className="permission-symbol">
              <Icon name="mic" size="large" />
            </div>
            <h3>
              {words(
                state.locale,
                "Try the microphone permission flow",
                "Essayez l’autorisation du microphone",
                "جرب السماح للميكروفون",
              )}
            </h3>
            <p>
              {words(
                state.locale,
                "No microphone is opened. This simulates recording, reviewing and sending a voice question.",
                "Aucun microphone n’est ouvert. Cet aperçu simule l’enregistrement, la relecture et l’envoi.",
                "الميكروفون ما كيتحلش. هاد التجربة كتحاكي التسجيل والمراجعة والإرسال.",
              )}
            </p>
            <Button
              onClick={() =>
                dispatch({
                  type: "patch",
                  patch: {
                    voiceStage: "recording",
                    voiceElapsed: 0,
                    voicePlaying: false,
                  },
                })
              }
            >
              <Icon name="mic" size="large" />
              {words(
                state.locale,
                "Start recording · preview",
                "Commencer l’enregistrement · aperçu",
                "نبدا نسجل · تجربة",
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch({ type: "patch", patch: { voiceStage: "denied" } })
              }
            >
              {text.block}
            </Button>
          </>
        )}
        {state.voiceStage === "denied" && (
          <>
            <Card className="agrix-card--warning">
              <h3>
                {words(
                  state.locale,
                  "Microphone unavailable",
                  "Microphone indisponible",
                  "الميكروفون ما متوفرش",
                )}
              </h3>
              <p>
                {words(
                  state.locale,
                  "You can keep typing. Your plan and conversation are still here.",
                  "Vous pouvez écrire. Le plan et la conversation sont conservés.",
                  "تقدر تبقى تكتب. الخطة والدردشة باقيين.",
                )}
              </p>
            </Card>
            <Button onClick={close}>
              {words(
                state.locale,
                "Write a question instead",
                "Écrire une question",
                "نكتب السؤال",
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch({ type: "patch", patch: { voiceStage: "permission" } })
              }
            >
              {text.retry}
            </Button>
          </>
        )}
        {state.voiceStage === "recording" && (
          <>
            <div className="recording-state">
              <span className="recording-dot" />
              <strong>
                {words(
                  state.locale,
                  "Recording simulation",
                  "Enregistrement simulé",
                  "محاكاة التسجيل",
                )}
              </strong>
              <span className="recording-timer" aria-live="off">
                00:{String(state.voiceElapsed).padStart(2, "0")}
              </span>
              <div className="voice-wave" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <p>
                {words(
                  state.locale,
                  "No audio is captured. A sample question will appear for review.",
                  "Aucun son n’est capturé. Une question fictive sera proposée.",
                  "حتى صوت ما كيتسجل. سؤال كمثال غادي يبان باش تراجعو.",
                )}
              </p>
            </div>
            <Button
              onClick={() =>
                dispatch({
                  type: "patch",
                  patch: {
                    voiceStage: "review",
                    voiceElapsed: Math.max(5, state.voiceElapsed),
                  },
                })
              }
            >
              <Icon name="pause" />
              {words(
                state.locale,
                "Stop and review",
                "Arrêter et relire",
                "نوقف ونراجع",
              )}
            </Button>
            <Button variant="secondary" onClick={close}>
              {text.cancel}
            </Button>
          </>
        )}
        {state.voiceStage === "review" && (
          <>
            <div className="review-player">
              <Button
                variant="secondary"
                size="icon"
                aria-label={
                  state.voicePlaying
                    ? words(
                        state.locale,
                        "Pause sample",
                        "Pause",
                        "نوقف المثال",
                      )
                    : words(
                        state.locale,
                        "Preview playback state",
                        "Simuler la lecture",
                        "نجرب تشغيل المثال",
                      )
                }
                onClick={() =>
                  dispatch({
                    type: "patch",
                    patch: { voicePlaying: !state.voicePlaying },
                  })
                }
              >
                <Icon name={state.voicePlaying ? "pause" : "play"} />
              </Button>
              <div>
                <strong>
                  {words(
                    state.locale,
                    "Voice question · sample",
                    "Question vocale · exemple",
                    "سؤال صوتي · مثال",
                  )}
                </strong>
                <p>
                  <bdi>00:{String(state.voiceElapsed).padStart(2, "0")}</bdi> ·{" "}
                  {words(
                    state.locale,
                    "silent UI preview",
                    "aperçu silencieux",
                    "تجربة واجهة بلا صوت",
                  )}
                </p>
              </div>
            </div>
            <label className="agrix-field">
              <span className="agrix-field__label">
                {words(
                  state.locale,
                  "Review or correct the sample transcript",
                  "Relire ou corriger la transcription fictive",
                  "راجع ولا صحح النص ديال المثال",
                )}
              </span>
              <textarea
                className="agrix-input transcript-input"
                value={state.transcript}
                onChange={(event) =>
                  dispatch({
                    type: "patch",
                    patch: { transcript: event.target.value },
                  })
                }
                maxLength={500}
                dir="auto"
              />
            </label>
            <p className="muted">
              {words(
                state.locale,
                "Send only after you are happy with the question.",
                "Envoyez uniquement après avoir vérifié la question.",
                "صيفط غير من بعد ما تراجع السؤال.",
              )}
            </p>
            <Button
              disabled={!state.transcript.trim()}
              onClick={() => dispatch({ type: "send-voice" })}
            >
              {text.send}
              <Icon name="arrowRight" />
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch({
                  type: "patch",
                  patch: {
                    voiceStage: "recording",
                    voiceElapsed: 0,
                    voicePlaying: false,
                  },
                })
              }
            >
              <Icon name="mic" />
              {words(
                state.locale,
                "Record again",
                "Réenregistrer",
                "نعاود نسجل",
              )}
            </Button>
            <Button variant="ghost" onClick={close}>
              {text.cancel}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
