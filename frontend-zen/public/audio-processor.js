/**
 * AudioWorklet Processor for capturing microphone audio
 * This runs in a separate audio thread for better performance
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      const inputChannel = input[0];

      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex++] = inputChannel[i];

        // When buffer is full, send it to main thread
        if (this.bufferIndex >= this.bufferSize) {
          // Convert Float32 to PCM16
          const pcm16 = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            const s = Math.max(-1, Math.min(1, this.buffer[j]));
            pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Send to main thread
          this.port.postMessage({
            type: 'audio',
            data: pcm16.buffer
          }, [pcm16.buffer]); // Transfer ownership for efficiency

          // Reset buffer
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }
      }
    }

    // Keep processor alive
    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
