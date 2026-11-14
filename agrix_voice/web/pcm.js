class PCMRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Float32Array(2048);
    this.cursor = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    for (const sample of channel) {
      this.samples[this.cursor++] = sample;
      if (this.cursor === this.samples.length) {
        const level = Math.sqrt(this.samples.reduce((total, x) => total + x * x, 0) / this.cursor);
        this.port.postMessage({ samples: this.samples, level });
        this.cursor = 0;
      }
    }
    return true;
  }
}

registerProcessor("pcm-recorder", PCMRecorder);
