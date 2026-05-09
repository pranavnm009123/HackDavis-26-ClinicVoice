/* global AudioWorkletProcessor, sampleRate, registerProcessor */

const TARGET_SAMPLE_RATE = 16000;

class PcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pending = new Float32Array(0);
    this.sourceOffset = 0;
    this.ratio = sampleRate / TARGET_SAMPLE_RATE;
  }

  process(inputs) {
    const input = inputs[0]?.[0];

    if (!input?.length) {
      return true;
    }

    const samples = new Float32Array(this.pending.length + input.length);
    samples.set(this.pending);
    samples.set(input, this.pending.length);

    const outputLength = Math.max(0, Math.floor((samples.length - 1 - this.sourceOffset) / this.ratio) + 1);
    const output = new Int16Array(outputLength);

    for (let i = 0; i < outputLength; i += 1) {
      const index = Math.floor(this.sourceOffset);
      const fraction = this.sourceOffset - index;
      const current = samples[index] || 0;
      const next = samples[index + 1] ?? current;
      const interpolated = current + (next - current) * fraction;
      const clamped = Math.max(-1, Math.min(1, interpolated));

      output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      this.sourceOffset += this.ratio;
    }

    const consumed = Math.floor(this.sourceOffset);
    this.pending = samples.slice(consumed);
    this.sourceOffset -= consumed;

    if (output.length) {
      this.port.postMessage(output.buffer, [output.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-processor', PcmProcessor);
