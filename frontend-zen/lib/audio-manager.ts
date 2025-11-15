export class AudioManager {
  private captureContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private workletLoaded = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextPlaybackTime = 0; // Scheduled playback time for seamless audio
  private scheduledSources: AudioBufferSourceNode[] = []; // Track all scheduled sources
  private readonly INITIAL_BUFFER_COUNT = 1; // Buffer 1 chunk only - Gemini is fast enough!
  private hasStartedPlayback = false; // Track if we've started the initial playback

  private onAudioDataCallback: ((chunk: ArrayBuffer) => void) | null = null;

  async requestMicrophoneAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      this.mediaStream = stream;
      return true;
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      return false;
    }
  }

  async startCapture(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('Microphone access not granted');
    }

    if (!this.captureContext) {
      this.captureContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
    }

    // Load AudioWorklet processor if not already loaded
    if (!this.workletLoaded) {
      try {
        await this.captureContext.audioWorklet.addModule('/audio-processor.js');
        this.workletLoaded = true;
        console.log('[AudioManager] AudioWorklet processor loaded');
      } catch (error) {
        console.error('[AudioManager] Failed to load AudioWorklet, falling back to ScriptProcessorNode:', error);
        // Fallback to ScriptProcessorNode if AudioWorklet not supported
        return this.startCaptureLegacy();
      }
    }

    this.sourceNode = this.captureContext.createMediaStreamSource(this.mediaStream);

    this.analyserNode = this.captureContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.sourceNode.connect(this.analyserNode);

    // Create AudioWorklet node
    this.workletNode = new AudioWorkletNode(this.captureContext, 'audio-capture-processor');

    // Listen for audio data from worklet
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio' && this.onAudioDataCallback) {
        this.onAudioDataCallback(event.data.data);
      }
    };

    // Connect nodes
    this.sourceNode.connect(this.workletNode);
    this.workletNode.connect(this.captureContext.destination);
  }

  // Legacy fallback for browsers that don't support AudioWorklet
  private startCaptureLegacy(): void {
    if (!this.captureContext || !this.mediaStream) {
      throw new Error('Audio context or media stream not initialized');
    }

    this.sourceNode = this.captureContext.createMediaStreamSource(this.mediaStream);

    this.analyserNode = this.captureContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.sourceNode.connect(this.analyserNode);

    const processorNode = this.captureContext.createScriptProcessor(4096, 1, 1);

    processorNode.onaudioprocess = (event) => {
      if (this.onAudioDataCallback) {
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmData = this.convertToPCM16(inputData);
        this.onAudioDataCallback(pcmData.buffer as ArrayBuffer);
      }
    };

    this.sourceNode.connect(processorNode);
    processorNode.connect(this.captureContext.destination);
  }

  stopCapture(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.close();
      this.workletNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  onAudioData(callback: (chunk: ArrayBuffer) => void): void {
    this.onAudioDataCallback = callback;
  }

  /**
   * Initialize and resume the playback AudioContext
   * MUST be called from a user gesture (e.g., button click) to comply with autoplay policy
   */
  async initializePlayback(): Promise<void> {
    console.log('[AudioManager] 🎧 Initializing playback AudioContext...');

    if (!this.playbackContext) {
      this.playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log(`[AudioManager] ✅ NEW AudioContext created - State: ${this.playbackContext.state}, SampleRate: ${this.playbackContext.sampleRate}Hz`);
    }

    // Resume AudioContext if suspended (browser autoplay policy)
    if (this.playbackContext.state === 'suspended') {
      console.log('[AudioManager] ⚠️ AudioContext is SUSPENDED - resuming from user gesture...');
      try {
        await this.playbackContext.resume();
        console.log('[AudioManager] ✅ AudioContext resumed successfully!');
      } catch (err) {
        console.error('[AudioManager] ❌ Failed to resume AudioContext:', err);
        throw err;
      }
    } else {
      console.log(`[AudioManager] ✅ AudioContext already in "${this.playbackContext.state}" state`);
    }
  }

  private detectAudioFormat(data: ArrayBuffer): 'raw-pcm' | 'encoded' {
    // Check first 4 bytes for common audio file signatures
    const view = new DataView(data);

    if (data.byteLength < 4) {
      return 'raw-pcm'; // Too small to be a complete file
    }

    // Check for common audio file headers
    const magic = new Uint8Array(data.slice(0, 4));

    // WAV: "RIFF" (0x52494646)
    if (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46) {
      return 'encoded';
    }

    // MP3: 0xFF 0xFB or "ID3"
    if ((magic[0] === 0xFF && (magic[1] & 0xE0) === 0xE0) ||
        (magic[0] === 0x49 && magic[1] === 0x44 && magic[2] === 0x33)) {
      return 'encoded';
    }

    // OGG: "OggS"
    if (magic[0] === 0x4F && magic[1] === 0x67 && magic[2] === 0x67 && magic[3] === 0x53) {
      return 'encoded';
    }

    // WebM/Matroska: 0x1A 0x45 0xDF 0xA3
    if (magic[0] === 0x1A && magic[1] === 0x45 && magic[2] === 0xDF && magic[3] === 0xA3) {
      return 'encoded';
    }

    // FLAC: "fLaC"
    if (magic[0] === 0x66 && magic[1] === 0x4C && magic[2] === 0x61 && magic[3] === 0x43) {
      return 'encoded';
    }

    // Default to raw PCM if no signature matches
    return 'raw-pcm';
  }

  async playAudioChunk(data: ArrayBuffer, sampleRate = 24000): Promise<void> {
    console.log(`[AudioManager] 🎵 ===== RECEIVED AUDIO CHUNK =====`);
    console.log(`[AudioManager] 📦 Chunk size: ${data.byteLength} bytes, source sampleRate: ${sampleRate}Hz`);

    // Skip empty chunks
    if (data.byteLength === 0) {
      console.warn('[AudioManager] ⚠️ Received empty audio chunk, skipping');
      return;
    }

    // Create AudioContext with browser's preferred sample rate (usually 48kHz)
    // Don't force 24kHz - let browser handle resampling for better quality
    if (!this.playbackContext) {
      this.playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log(`[AudioManager] 🔊 NEW AudioContext created - State: ${this.playbackContext.state}, Native SampleRate: ${this.playbackContext.sampleRate}Hz`);
    } else {
      console.log(`[AudioManager] 🔊 Using existing AudioContext - State: ${this.playbackContext.state}, SampleRate: ${this.playbackContext.sampleRate}Hz`);
    }

    // Check if AudioContext is suspended (browser autoplay policy)
    if (this.playbackContext.state === 'suspended') {
      console.warn('[AudioManager] ⚠️ AudioContext is SUSPENDED - attempting to resume...');
      try {
        await this.playbackContext.resume();
        console.log('[AudioManager] ✅ AudioContext resumed successfully');
      } catch (err) {
        console.error('[AudioManager] ❌ Failed to resume AudioContext:', err);
      }
    }

    // Detect audio format
    const format = this.detectAudioFormat(data);
    console.log(`[AudioManager] 📊 Detected audio format: ${format}`);

    try {
      let audioBuffer: AudioBuffer;

      if (format === 'raw-pcm') {
        // Raw PCM data - convert directly (this is the expected format from backend)
        // Create buffer at SOURCE rate (24kHz), browser will resample to native rate
        console.log(`[AudioManager] 🔄 Converting PCM data at ${sampleRate}Hz (will be resampled to ${this.playbackContext.sampleRate}Hz)...`);
        audioBuffer = await this.pcm16ToAudioBuffer(data, sampleRate);
        console.log(`[AudioManager] ✅ PCM buffer created: duration=${audioBuffer.duration.toFixed(3)}s, channels=${audioBuffer.numberOfChannels}, sampleRate=${audioBuffer.sampleRate}Hz`);
      } else {
        // Encoded audio file (WAV, MP3, etc.) - decode with Web Audio API
        console.log(`[AudioManager] 🔄 Decoding encoded audio...`);
        try {
          audioBuffer = await this.playbackContext.decodeAudioData(data.slice(0));
          console.log(`[AudioManager] ✅ Encoded buffer decoded: duration=${audioBuffer.duration.toFixed(3)}s`);
        } catch (decodeError) {
          // If decoding fails, it's likely raw PCM misidentified as encoded
          console.warn(`[AudioManager] ⚠️ Decode failed, treating as raw PCM instead`);
          audioBuffer = await this.pcm16ToAudioBuffer(data, sampleRate);
        }
      }

      // Log queue state BEFORE any action
      console.log(`[AudioManager] 📋 QUEUE STATE: length=${this.audioQueue.length}, isPlaying=${this.isPlaying}`);

      // ✨ PRODUCTION-GRADE STREAMING: Initial buffering + scheduled playback
      this.audioQueue.push(audioBuffer);
      console.log(`[AudioManager] ➕ Buffer QUEUED. Queue length: ${this.audioQueue.length}`);

      // Initial buffering: Wait for a few chunks before starting playback
      // This prevents stuttering when chunks arrive at irregular intervals
      if (!this.hasStartedPlayback && this.audioQueue.length < this.INITIAL_BUFFER_COUNT) {
        console.log(`[AudioManager] 🔄 Buffering... (${this.audioQueue.length}/${this.INITIAL_BUFFER_COUNT} chunks)`);
        return;
      }

      // Start playback once we have enough buffered OR if already playing
      if (!this.isPlaying) {
        console.log('[AudioManager] ▶️ STARTING PLAYBACK (buffer ready)');
        this.hasStartedPlayback = true;
        this.playNextInQueue();
      } else {
        // Already playing - schedule this new chunk seamlessly
        console.log('[AudioManager] ⏭️ Scheduling additional chunk for seamless playback');
        this.playNextInQueue();
      }
    } catch (error) {
      console.error(`[AudioManager] ❌ FAILED to process audio:`, error);

      // Final fallback: always try raw PCM (backend sends raw PCM)
      try {
        console.log(`[AudioManager] 🔄 Final fallback: forcing raw PCM conversion...`);
        const audioBuffer = await this.pcm16ToAudioBuffer(data, sampleRate);
        this.audioQueue.push(audioBuffer);
        if (!this.isPlaying) {
          this.playNextInQueue();
        }
        console.log(`[AudioManager] ✅ Fallback successful`);
      } catch (fallbackError) {
        console.error('[AudioManager] ❌ All audio processing attempts failed:', fallbackError);
      }
    }
  }

  private playNextInQueue(): void {
    console.log(`[AudioManager] 🎬 playNextInQueue() called - queue length: ${this.audioQueue.length}`);

    if (!this.playbackContext) {
      console.error(`[AudioManager] ❌ No playbackContext! Cannot play.`);
      return;
    }

    // Process all queued buffers and schedule them
    while (this.audioQueue.length > 0) {
      const audioBuffer = this.audioQueue.shift()!;
      console.log(`[AudioManager] 🎯 Scheduling buffer: duration=${audioBuffer.duration.toFixed(3)}s, remaining in queue: ${this.audioQueue.length}`);

      // Calculate when this chunk should start playing
      const currentTime = this.playbackContext.currentTime;

      // If nextPlaybackTime is in the past or not set, start immediately
      if (this.nextPlaybackTime < currentTime) {
        this.nextPlaybackTime = currentTime;
        console.log(`[AudioManager] 🔄 Resetting playback timeline to current time: ${currentTime.toFixed(3)}s`);
      }

      const scheduledTime = this.nextPlaybackTime;

      // Create and schedule the audio source
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);

      // Schedule to start at the precise time for seamless playback
      source.start(scheduledTime);
      console.log(`[AudioManager] ⏰ Scheduled to play at ${scheduledTime.toFixed(3)}s (in ${(scheduledTime - currentTime).toFixed(3)}s)`);

      // Track this source
      this.scheduledSources.push(source);

      // Clean up when this chunk finishes
      source.onended = () => {
        console.log(`[AudioManager] ✅ Chunk finished playing (duration: ${audioBuffer.duration.toFixed(3)}s)`);
        const index = this.scheduledSources.indexOf(source);
        if (index > -1) {
          this.scheduledSources.splice(index, 1);
        }

        // If no more scheduled sources and queue is empty, stop playing
        if (this.scheduledSources.length === 0 && this.audioQueue.length === 0) {
          console.log(`[AudioManager] ⏹️ All audio finished, stopping playback`);
          this.isPlaying = false;
          this.nextPlaybackTime = 0;
        }
      };

      // Update next playback time (schedule next chunk immediately after this one)
      this.nextPlaybackTime += audioBuffer.duration;
      this.isPlaying = true;
    }

    console.log(`[AudioManager] ✨ All queued chunks scheduled for seamless playback`);
  }

  stopPlayback(): void {
    console.log(`[AudioManager] 🛑 stopPlayback() called`);

    // Stop all scheduled sources
    for (const source of this.scheduledSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source may have already finished
      }
    }
    this.scheduledSources = [];

    // Stop legacy current source (backward compatibility)
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.currentSource = null;
    }

    // Clear queue and reset playback timeline
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextPlaybackTime = 0;
    this.hasStartedPlayback = false;
    console.log(`[AudioManager] ✅ Playback stopped, queue cleared, timeline reset, AudioContext kept ALIVE`);
  }

  getAudioLevel(): number {
    if (!this.analyserNode) return 0;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    return average / 255; // Normalize to 0-1
  }

  private convertToPCM16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  private async pcm16ToAudioBuffer(data: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    // Use browser's native sample rate (don't force anything)
    if (!this.playbackContext) {
      this.playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const pcm16 = new Int16Array(data);
    // Create buffer at SOURCE sample rate (24kHz) - browser will automatically resample to native rate
    const buffer = this.playbackContext.createBuffer(1, pcm16.length, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Convert from 16-bit PCM to Float32 (-1.0 to 1.0)
    for (let i = 0; i < pcm16.length; i++) {
      channelData[i] = pcm16[i] / 0x8000;
    }

    return buffer;
  }

  // Alias for backward compatibility
  async playAudio(data: ArrayBuffer, sampleRate = 24000): Promise<void> {
    return this.playAudioChunk(data, sampleRate);
  }

  cleanup(): void {
    this.stopCapture();
    this.stopPlayback();

    if (this.captureContext) {
      this.captureContext.close();
      this.captureContext = null;
    }

    if (this.playbackContext) {
      this.playbackContext.close();
      this.playbackContext = null;
    }

    // Reset all state
    this.nextPlaybackTime = 0;
    this.scheduledSources = [];
    this.hasStartedPlayback = false;
  }
}
