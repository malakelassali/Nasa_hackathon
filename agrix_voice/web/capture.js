export async function startRecording(onLevel, onStop) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
  let context;
  let timer;
  try {
    context = new AudioContext();
    await context.audioWorklet.addModule("/pcm.js");
    const recorder = new AudioWorkletNode(context, "pcm-recorder");
    const source = context.createMediaStreamSource(stream);
    const mute = context.createGain();
    mute.gain.value = 0;
    source.connect(recorder).connect(mute).connect(context.destination);
    const chunks = [];
    let frames = 0;
    let stopped = false;
    const stop = async () => {
      if (stopped) return;
      stopped = true;
      clearTimeout(timer);
      stream.getTracks().forEach(track => track.stop());
      await context.close().catch(() => {});
      onStop(toWav(chunks, frames, context.sampleRate));
    };
    const maxFrames = Math.floor(context.sampleRate * 25);
    recorder.port.onmessage = ({ data }) => {
      if (stopped) return;
      const chunk = data.samples.subarray(0, maxFrames - frames);
      chunks.push(chunk);
      frames += chunk.length;
      onLevel(Math.min(1, data.level * 5));
      if (frames >= maxFrames) stop();
    };
    await context.resume();
    timer = setTimeout(stop, 25000);
    return stop;
  } catch (error) {
    stream.getTracks().forEach(track => track.stop());
    if (context) await context.close().catch(() => {});
    throw error;
  }
}

function toWav(chunks, frames, inputRate) {
  // Average source samples while downsampling to 16 kHz.
  const samples = new Float32Array(frames);
  let cursor = 0;
  for (const chunk of chunks) {
    samples.set(chunk, cursor);
    cursor += chunk.length;
  }
  const rate = 16000;
  const length = Math.floor(frames * rate / inputRate);
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  function label(at, word) {
    for (let i = 0; i < word.length; i++) view.setUint8(at + i, word.charCodeAt(i));
  }
  label(0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  label(8, "WAVE");
  label(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  label(36, "data");
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++) {
    const from = Math.floor(i * inputRate / rate);
    const to = Math.min(frames, Math.max(from + 1, Math.floor((i + 1) * inputRate / rate)));
    let value = 0;
    for (let j = from; j < to; j++) value += samples[j];
    const mean = Math.max(-1, Math.min(1, value / (to - from)));
    view.setInt16(44 + i * 2, mean * 32767, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export async function transcribe(blob) {
  const response = await fetch("/api/transcribe", {
    method: "POST", headers: { "Content-Type": "audio/wav" }, body: blob,
    signal: AbortSignal.timeout(130000),
  });
  if (!response.ok) throw new Error(response.status);
  return (await response.json()).text;
}
