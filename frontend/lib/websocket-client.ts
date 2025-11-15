import { MedicalIntake } from '@/types';

type MessageHandler = (data: any) => void;
type AudioHandler = (audio: ArrayBuffer) => void;
type TranscriptHandler = (payload: { role: 'assistant' | 'patient' | 'system'; text: string }) => void;
type ErrorHandler = (error: Error) => void;
type StatusHandler = (status: string) => void;
type RetryHandler = (attempt: number, maxAttempts: number) => void;
type TurnCompleteHandler = () => void;
type IntakeCompleteHandler = (message: string) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private apiKey: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private healthCheckAttempts = 0;
  private maxHealthCheckAttempts = 10;

  private onAudioHandler: AudioHandler | null = null;
  private onTranscriptHandler: TranscriptHandler | null = null;
  private onDataExtractedHandler: MessageHandler | null = null;
  private onStatusUpdateHandler: StatusHandler | null = null;
  private onErrorHandler: ErrorHandler | null = null;
  private onConnectedHandler: (() => void) | null = null;
  private onDisconnectedHandler: (() => void) | null = null;
  private onRetryHandler: RetryHandler | null = null;
  private onTurnCompleteHandler: TurnCompleteHandler | null = null;
  private onIntakeCompleteHandler: IntakeCompleteHandler | null = null;

  constructor(url: string, apiKey?: string | null) {
    this.url = url;
    this.apiKey = apiKey || null;
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const httpUrl = this.url.replace('ws://', 'http://').replace('wss://', 'https://').replace('/ws', '/health');
      const response = await fetch(httpUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async waitForBackend(): Promise<void> {
    this.healthCheckAttempts = 0;

    while (this.healthCheckAttempts < this.maxHealthCheckAttempts) {
      const isHealthy = await this.checkBackendHealth();

      if (isHealthy) {
        console.log('[WebSocket] Backend is ready');
        return;
      }

      this.healthCheckAttempts++;
      console.log(`[WebSocket] Waiting for backend... (${this.healthCheckAttempts}/${this.maxHealthCheckAttempts})`);

      // Wait before next check (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.min(500 * this.healthCheckAttempts, 3000)));
    }

    console.warn('[WebSocket] Backend health check timed out, attempting connection anyway');
  }

  async connect(): Promise<void> {
    // Wait for backend to be ready before connecting
    await this.waitForBackend();

    return new Promise((resolve, reject) => {
      try {
        // Append API key to URL if provided
        const wsUrl = this.apiKey ? `${this.url}?api_key=${encodeURIComponent(this.apiKey)}` : this.url;
        console.log('[WebSocket] Connecting to:', wsUrl.replace(/api_key=[^&]+/, 'api_key=***'));

        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          if (this.onConnectedHandler) {
            this.onConnectedHandler();
          }
          resolve();
        };

        this.ws.onmessage = async (event) => {
          if (typeof event.data === 'string') {
            console.log('[WebSocket] 📨 Received TEXT message:', event.data.substring(0, 100));
            this.handleMessage(event.data);
            return;
          }

          if (event.data instanceof ArrayBuffer) {
            console.log(`[WebSocket] 🎵 Received AUDIO (ArrayBuffer): ${event.data.byteLength} bytes`);
            this.handleAudio(event.data);
            return;
          }

          if (event.data instanceof Blob) {
            console.log(`[WebSocket] 🎵 Received AUDIO (Blob): ${event.data.size} bytes - converting...`);
            const buffer = await event.data.arrayBuffer();
            console.log(`[WebSocket] ✅ Blob converted to ArrayBuffer: ${buffer.byteLength} bytes`);
            this.handleAudio(buffer);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          const err = new Error('WebSocket connection error');
          if (this.onErrorHandler) {
            this.onErrorHandler(err);
          }
          reject(err);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (this.onDisconnectedHandler) {
            this.onDisconnectedHandler();
          }
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  endSession(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end_session' }));
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send audio as binary data (backend expects raw bytes)
      this.ws.send(audioData);
    }
  }

  sendControl(action: 'start' | 'stop' | 'interrupt'): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'control',
        action,
      });
      this.ws.send(message);
    }
  }

  onAudio(handler: AudioHandler): void {
    this.onAudioHandler = handler;
  }

  onTranscript(handler: TranscriptHandler): void {
    this.onTranscriptHandler = handler;
  }

  onDataExtracted(handler: (data: MedicalIntake) => void): void {
    this.onDataExtractedHandler = handler;
  }

  onStatusUpdate(handler: StatusHandler): void {
    this.onStatusUpdateHandler = handler;
  }

  onError(handler: ErrorHandler): void {
    this.onErrorHandler = handler;
  }

  onConnected(handler: () => void): void {
    this.onConnectedHandler = handler;
  }

  onDisconnected(handler: () => void): void {
    this.onDisconnectedHandler = handler;
  }

  onRetry(handler: RetryHandler): void {
    this.onRetryHandler = handler;
  }

  onTurnComplete(handler: TurnCompleteHandler): void {
    this.onTurnCompleteHandler = handler;
  }

  onIntakeComplete(handler: IntakeCompleteHandler): void {
    this.onIntakeCompleteHandler = handler;
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'audio':
          if (this.onAudioHandler && message.data) {
            const audioData = new Uint8Array(message.data).buffer;
            this.onAudioHandler(audioData);
          }
          break;

        case 'text':
          if (this.onTranscriptHandler) {
            this.onTranscriptHandler({
              role: 'assistant',
              text: message.data,
            });
          }
          break;

        case 'transcript':
          if (this.onTranscriptHandler) {
            this.onTranscriptHandler({
              role: message.role ?? 'assistant',
              text: message.text ?? '',
            });
          }
          break;

        case 'extracted_data':
          if (this.onDataExtractedHandler) {
            this.onDataExtractedHandler(message.data);
          }
          break;

        case 'status':
          if (this.onStatusUpdateHandler) {
            this.onStatusUpdateHandler(message.state || message.message);
          }
          break;

        case 'error':
          if (this.onErrorHandler) {
            this.onErrorHandler(new Error(message.message));
          }
          break;

        case 'turn_complete':
          console.log('[WebSocket] 🏁 Turn complete - AI finished speaking');
          if (this.onTurnCompleteHandler) {
            this.onTurnCompleteHandler();
          }
          break;

        case 'intake_complete':
          console.log('[WebSocket] ✅ INTAKE COMPLETE - Medical intake finished successfully');
          if (this.onIntakeCompleteHandler) {
            this.onIntakeCompleteHandler(message.message || 'Intake complete');
          }
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleAudio(buffer: ArrayBuffer): void {
    console.log(`[WebSocket] 🎧 handleAudio() - Passing ${buffer.byteLength} bytes to handler`);
    if (this.onAudioHandler) {
      this.onAudioHandler(buffer);
      console.log(`[WebSocket] ✅ Audio passed to handler`);
    } else {
      console.warn(`[WebSocket] ⚠️ No audio handler registered!`);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      if (this.onRetryHandler) {
        this.onRetryHandler(this.reconnectAttempts, this.maxReconnectAttempts);
      }

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      if (this.onErrorHandler) {
        this.onErrorHandler(new Error('Failed to reconnect to WebSocket'));
      }
    }
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
