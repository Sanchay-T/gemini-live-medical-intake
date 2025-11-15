import { vi } from 'vitest';

// Mock WebSocket
export class MockWebSocket {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readyState = WebSocket.CONNECTING;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string | ArrayBuffer) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close() {
    this.readyState = WebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = WebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(new CloseEvent('close'));
      }
    }, 10);
  }

  // Test helper to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  // Test helper to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock AudioContext
export class MockAudioContext {
  sampleRate = 48000;
  destination = {};
  state = 'running';

  createGain() {
    return {
      connect: vi.fn(),
      gain: { value: 1 },
    };
  }

  createAnalyser() {
    return {
      connect: vi.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteTimeDomainData: vi.fn(),
    };
  }

  createMediaStreamSource() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createScriptProcessor() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

// Mock MediaStream
export class MockMediaStream {
  id = 'mock-stream-id';
  active = true;

  getTracks() {
    return [
      {
        id: 'audio-track',
        kind: 'audio',
        enabled: true,
        stop: vi.fn(),
      },
    ];
  }

  getAudioTracks() {
    return this.getTracks();
  }
}

// Mock getUserMedia
export const mockGetUserMedia = vi.fn().mockResolvedValue(new MockMediaStream());

// Setup Web APIs mocks
export function setupWebAPIs() {
  global.WebSocket = MockWebSocket as any;
  global.AudioContext = MockAudioContext as any;

  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: mockGetUserMedia,
    },
  });

  // Mock Web Audio API
  if (typeof window !== 'undefined') {
    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;
  }
}

// Test data helpers
export const mockMedicalIntakeData = {
  patient_info: {
    name: 'John Doe',
    age: 35,
    gender: 'male',
  },
  chief_complaint: 'Persistent headache for 3 days',
  severity: 'moderate',
  duration: '3 days',
  location: 'frontal region',
  current_medications: [
    {
      name: 'Aspirin',
      dose: '325mg',
      frequency: 'daily',
    },
  ],
  allergies: [
    {
      allergen: 'Penicillin',
      reaction: ['rash', 'itching'],
      severity: 'moderate',
    },
  ],
  past_medical_history: {
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    surgeries: [],
  },
  social_history: {
    smoking: false,
    alcohol: false,
  },
};

export const mockTranscriptMessage = (role: 'assistant' | 'patient', text: string) => ({
  type: 'transcript',
  role,
  text,
});

export const mockDataExtractedMessage = (data: any) => ({
  type: 'extracted_data',
  data,
});

export const mockStatusMessage = (status: string) => ({
  type: 'status',
  state: status,
});
