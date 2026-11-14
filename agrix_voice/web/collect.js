import { startRecording, transcribe } from "./capture.js";

const el = id => document.getElementById(id);
const status = el("status");
const transcript = el("transcript");
const consent = el("consent");
const record = el("record");
const preview = el("preview");
let stopRecording;
let clip;
let previewUrl;
let busy = false;
let draftAvailable = false;

function controls() {
  record.disabled = !navigator.mediaDevices?.getUserMedia || (busy && !stopRecording) || !consent.checked;
  el("draft").disabled = busy || !clip || !consent.checked || !draftAvailable;
  el("export").disabled = busy || !clip || !consent.checked;
}

consent.addEventListener("change", () => {
  if (!consent.checked && stopRecording) stopRecording();
  controls();
});
record.addEventListener("click", async () => {
  if (stopRecording) {
    await stopRecording();
    return;
  }
  preview.pause();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  preview.hidden = true;
  clip = undefined;
  busy = true;
  controls();
  try {
    stopRecording = await startRecording(value => { el("level").value = value; }, blob => {
      stopRecording = undefined;
      busy = false;
      el("level").hidden = true;
      record.textContent = "Record clip";
      transcript.value = "";
      el("terms").value = "";
      if (consent.checked && blob.size >= 8044) {
        clip = blob;
        previewUrl = URL.createObjectURL(blob);
        preview.src = previewUrl;
        preview.hidden = false;
        status.textContent = "Check the clip, then enter or generate a transcript.";
      } else {
        status.textContent = "Record at least a quarter of a second with consent.";
      }
      controls();
    });
    if (!consent.checked) {
      await stopRecording();
      return;
    }
    el("level").hidden = false;
    record.textContent = "Finish clip";
    status.textContent = "Recording…";
  } catch {
    busy = false;
    status.textContent = "Microphone unavailable. Check browser permissions.";
  }
  controls();
});

el("draft").addEventListener("click", async () => {
  busy = true;
  controls();
  status.textContent = "Transcribing…";
  try {
    transcript.value = await transcribe(clip);
    status.textContent = "Correct the draft before exporting.";
  } catch {
    status.textContent = "Transcription unavailable. Enter it manually.";
  } finally {
    busy = false;
    controls();
  }
});

function download(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

el("annotation").addEventListener("submit", event => {
  event.preventDefault();
  if (!clip || busy || !consent.checked || !transcript.value.trim()) return;
  const id = crypto.randomUUID();
  const metadata = {
    id, audio: id + ".wav", speaker: el("speaker").value.trim(), region: el("region").value.trim(),
    environment: el("environment").value, text: transcript.value.trim(), consent_training: true,
    terms: el("terms").value.split("\n").map(term => term.trim()).filter(Boolean),
    code_switch: el("mixed").checked, noisy: el("noisy").checked,
  };
  download(clip, metadata.audio);
  download(new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" }), id + ".json");
  status.textContent = "Keep both files in the same folder. Allow multiple downloads if prompted.";
});

controls();
try {
  const response = await fetch("/api/status", { signal: AbortSignal.timeout(5000) });
  if (response.ok) draftAvailable = (await response.json()).speech;
} catch {
  status.textContent = "The voice service is unavailable. You can still add a transcript manually.";
}
controls();
