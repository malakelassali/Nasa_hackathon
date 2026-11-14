import { startRecording, transcribe } from "./capture.js";

const byId = id => document.getElementById(id);
const mic = byId("mic");
const level = byId("level");
const status = byId("status");
const input = byId("input");
const chat = byId("chat");
const messages = byId("messages");
const audio = byId("speech");
const stopSpeech = byId("stop-speech");
let stopRecording;
let busy = false;
let session;
let speechEnabled = false;
let speechTimeout = 130000;
let micEnabled = false;
let objectUrl;
let confirmationButtons = [];

function updateControls() {
  mic.disabled = !micEnabled || (busy && !stopRecording);
  chat.querySelector("button").disabled = busy;
  confirmationButtons.forEach(button => { button.disabled = busy; });
}

async function request(path, body, timeout = 130000) {
  const response = await fetch(path, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) throw new Error(response.status);
  return response;
}

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = "message " + role;
  const name = document.createElement("strong");
  name.textContent = role === "user" ? "نتا" : "AgriX";
  const content = document.createElement("p");
  content.dir = "auto";
  content.textContent = text;
  message.append(name, content);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
  return message;
}

async function speak(text) {
  audio.pause();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = undefined;
  audio.hidden = stopSpeech.hidden = true;
  if (!speechEnabled) {
    status.textContent = "الجواب مكتوب الفوق.";
    return;
  }
  status.textContent = "كنوجّد الصوت…";
  try {
    const response = await request("/api/speech", { text }, speechTimeout);
    objectUrl = URL.createObjectURL(await response.blob());
    audio.src = objectUrl;
    audio.hidden = stopSpeech.hidden = false;
    status.textContent = "الجواب واجد. تقدر تسمعو.";
    await audio.play().catch(() => {});
  } catch {
    status.textContent = "الصوت ما خدمش دابا. تقدر تقرا الجواب الفوق.";
  }
}

function clearConfirmation() {
  confirmationButtons.forEach(button => button.remove());
  confirmationButtons = [];
}

function offerConfirmation(message, proposal) {
  if (!proposal) return;
  const labels = { area_ha: "الهكتارات", previous_crop: "الزرع اللي فات", irrigation: "السقي",
    location: "البلاصة", soil: "التربة", budget_mad: "الميزانية بالدرهم", observation: "الملاحظة" };
  const values = { rainfed: "غير الشتا", limited: "السّقي قليل", available: "كاين السقي" };
  const details = document.createElement("p");
  details.textContent = Object.entries(proposal.data).map(([key, value]) =>
    `${labels[key]} — ${values[value] ?? value}`).join("، ");
  const actions = document.createElement("div");
  actions.className = "buttons";
  for (const [approved, label] of [[true, "سجّل"], [false, "لغِ الطلب"]]) {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = approved ? "" : "secondary";
    button.addEventListener("click", async () => {
      busy = true;
      updateControls();
      try {
        const response = await request("/api/confirm", {
          session_id: session, confirmation_id: proposal.id, approved,
        });
        clearConfirmation();
        const { reply } = await response.json();
        addMessage("assistant", reply);
        await speak(reply);
      } catch {
        clearConfirmation();
        status.textContent = "ما قدرناش نأكدو الطلب. عاود صيفطو.";
      } finally {
        busy = false;
        updateControls();
      }
    });
    actions.append(button);
    confirmationButtons.push(button);
  }
  message.append(details, actions);
  messages.scrollTop = messages.scrollHeight;
}

mic.addEventListener("click", async () => {
  if (stopRecording) {
    await stopRecording();
    return;
  }
  audio.pause();
  busy = true;
  updateControls();
  status.textContent = "كنحلّ الميكرو…";
  try {
    stopRecording = await startRecording(value => { level.value = value; }, async blob => {
      stopRecording = undefined;
      updateControls();
      mic.setAttribute("aria-pressed", "false");
      mic.setAttribute("aria-label", "بدا التسجيل");
      level.hidden = true;
      status.textContent = "كنحوّل الصوت لكتابة…";
      try {
        input.value = await transcribe(blob);
        input.focus();
        status.textContent = "راجع الكلام اللي تسجّل ومن بعد صيفطو.";
      } catch {
        status.textContent = "ما قدرناش نقراو التسجيل. عاود سجّل ولا كتب سؤالك.";
      } finally {
        busy = false;
        updateControls();
      }
    });
    updateControls();
    mic.setAttribute("aria-pressed", "true");
    mic.setAttribute("aria-label", "وقف التسجيل");
    level.hidden = false;
    status.textContent = "كنسجلو… ضغط على الميكرو باش تسالي.";
  } catch {
    status.textContent = "ما قدرناش نفتحو الميكرو. راجع السماح ديال المتصفح ولا كتب سؤالك.";
    busy = false;
    updateControls();
  }
});

chat.addEventListener("submit", async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (busy || !text) return;
  busy = true;
  audio.pause();
  updateControls();
  status.textContent = "كنوجّد الجواب…";
  try {
    const response = await request("/api/chat", { text, session_id: session });
    const turn = await response.json();
    session = turn.session_id;
    input.value = "";
    clearConfirmation();
    addMessage("user", text);
    offerConfirmation(addMessage("assistant", turn.reply), turn.confirmation);
    await speak(turn.reply);
  } catch (error) {
    if (error.message === "409") {
      session = undefined;
      clearConfirmation();
      messages.replaceChildren();
      status.textContent = "المحادثة سالات. صيفط سؤالك باش تبدا من جديد.";
    } else {
      status.textContent = "ما وصلناش للخدمة. عاود صيفط السؤال.";
    }
  } finally {
    busy = false;
    updateControls();
  }
});

audio.addEventListener("play", () => { status.textContent = "كنقرا الجواب…"; });
audio.addEventListener("ended", () => { status.textContent = "تقدر تكمّل المحادثة."; });
stopSpeech.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  status.textContent = "تقدر تكمّل المحادثة.";
});

updateControls();
try {
  const response = await fetch("/api/status", { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error();
  const settings = await response.json();
  byId("demo").hidden = !settings.development_data;
  speechEnabled = settings.audio_reply;
  speechTimeout = settings.speech_timeout_ms ?? speechTimeout;
  micEnabled = Boolean(settings.speech && navigator.mediaDevices?.getUserMedia && window.AudioWorkletNode);
  if (!micEnabled) status.textContent = "تقدر تكتب سؤالك هنا.";
} catch {
  status.textContent = "ما وصلناش للخدمة. تأكّد من الاتصال.";
}
updateControls();
