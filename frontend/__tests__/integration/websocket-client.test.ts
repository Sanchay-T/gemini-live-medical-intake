import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from '@/lib/websocket-client';
import { MockWebSocket, setupWebAPIs } from '../utils/mocks';

describe('WebSocket Client', () => {
  beforeEach(() => {
    setupWebAPIs();
    vi.useFakeTimers();

    // Mock fetch for backend health check
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should connect successfully', async () => {
    const client = new WebSocketClient('ws://localhost:8000/ws');
    const onConnected = vi.fn();
    client.onConnected(onConnected);

    await client.connect();
    vi.advanceTimersByTime(100);

    expect(onConnected).toHaveBeenCalled();
  });

  it('should handle disconnection', async () => {
    const client = new WebSocketClient('ws://localhost:8000/ws');
    const onDisconnected = vi.fn();
    client.onDisconnected(onDisconnected);

    await client.connect();
    vi.advanceTimersByTime(100);

    client.disconnect();
    vi.advanceTimersByTime(100);

    expect(onDisconnected).toHaveBeenCalled();
  });

  it('should attempt reconnection on failure', async () => {
    const client = new WebSocketClient('ws://localhost:8000/ws');
    const onRetry = vi.fn();
    client.onRetry(onRetry);

    await client.connect();
    vi.advanceTimersByTime(100);

    // Simulate connection loss
    (client as any).ws?.simulateError();
    (client as any).ws?.close();

    // Should attempt to reconnect
    vi.advanceTimersByTime(2000);

    expect(onRetry).toHaveBeenCalledWith(1, 5);
  });

  it('should handle transcript messages', async () => {
    const client = new WebSocketClient('ws://localhost:8000/ws');
    const onTranscript = vi.fn();
    client.onTranscript(onTranscript);

    await client.connect();
    vi.advanceTimersByTime(100);

    const mockMessage = {
      type: 'transcript',
      role: 'assistant',
      text: 'Hello, how can I help you?',
    };

    (client as any).ws?.simulateMessage(JSON.stringify(mockMessage));

    expect(onTranscript).toHaveBeenCalledWith({
      role: 'assistant',
      text: 'Hello, how can I help you?',
    });
  });

  it('should handle extracted data messages', async () => {
    const client = new WebSocketClient('ws://localhost:8000/ws');
    const onDataExtracted = vi.fn();
    client.onDataExtracted(onDataExtracted);

    await client.connect();
    vi.advanceTimersByTime(100);

    const mockData = {
      type: 'extracted_data',
      data: {
        chief_complaint: 'Headache',
        severity: 'moderate',
      },
    };

    (client as any).ws?.simulateMessage(JSON.stringify(mockData));

    expect(onDataExtracted).toHaveBeenCalledWith({
      chief_complaint: 'Headache',
      severity: 'moderate',
    });
  });
});
