import { useEffect, useState } from "react";
import { Button, Icon, Modal } from "@agrix/ui";
import { useDemo } from "../../demo/DemoContext";
import { labels, words } from "../../demo/copy";
import { ChatView } from "./ChatView";

/** Persistent, labelled help access without leaving the farmer's current task. */
export function AssistantAccess() {
  const { state, flow } = useDemo();
  const [open, setOpen] = useState(false);
  const text = labels[state.locale];
  const chat = flow.screens.find((scene) => scene.id === "chat")!;

  // Following a report link from chat reveals that report in the workspace.
  useEffect(() => {
    setOpen(false);
  }, [state.scene]);

  function showHelp() {
    if (state.scene === "chat") {
      const voice = document.getElementById("chat-voice-action");
      voice?.scrollIntoView({ block: "center", behavior: "instant" });
      voice?.focus({ preventScroll: true });
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <div className="assistant-access">
        <Button
          className="assistant-access__button"
          onClick={showHelp}
          aria-haspopup={state.scene === "chat" ? undefined : "dialog"}
          aria-expanded={state.scene === "chat" ? undefined : open}
        >
          <span className="assistant-access__symbol">
            <Icon name="chat" size="large" />
          </span>
          <span className="assistant-access__copy">
            <strong>{flow.ui.help}</strong>
            <span>
              {words(
                state.locale,
                "Speak or write your question",
                "Posez votre question à voix haute ou par écrit",
                "سول بصوتك ولا كتب السؤال ديالك",
              )}
            </span>
          </span>
          <Icon name="arrowRight" size="large" />
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={flow.ui.help}
        description={words(
          state.locale,
          "Ask about your land or your growing plan.",
          "Posez une question sur votre parcelle ou votre plan de culture.",
          "سول على الأرض ديالك ولا على خطة الزرع.",
        )}
        closeLabel={words(
          state.locale,
          "Close help and return to my page",
          "Fermer l’aide et revenir à ma page",
          "نسد المساعدة ونرجع للصفحة ديالي",
        )}
        className="assistant-panel"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            <Icon name="arrowLeft" />
            {words(
              state.locale,
              "Back to my page",
              "Revenir à ma page",
              "نرجع للصفحة ديالي",
            )}
          </Button>
        }
      >
        {open && <ChatView scene={chat} onNavigate={() => setOpen(false)} />}
        <p className="assistant-preview-note">{text.sample}</p>
      </Modal>
    </>
  );
}
