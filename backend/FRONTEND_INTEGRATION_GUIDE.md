# Frontend Integration Guide
## Medical Intake Voice System - Backend API

---

## Quick Start

Your backend is running at: `ws://localhost:8000/ws`

**What you need to build:**
1. Microphone capture (16kHz PCM audio)
2. WebSocket client
3. Audio playback (24kHz PCM)
4. Real-time transcript display
5. Medical form that auto-fills from extracted data

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Your Job)                     │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Microphone │→ │  WebSocket   │→ │  Audio Player    │   │
│  │  Capture   │  │    Client    │  │   (24kHz PCM)    │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
│                         ↕                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │            Real-Time Transcript Display            │   │
│  └────────────────────────────────────────────────────┘   │
│                         ↕                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Medical Form (Auto-fills from data)        │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
                   WebSocket Connection
                   ws://localhost:8000/ws
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Ready to Use)                    │
│                                                              │
│  FastAPI Server (main.py) → GeminiLiveSession              │
│  ↓                                                           │
│  Gemini Live API (gemini-2.0-flash-exp)                    │
│  - Bidirectional audio streaming                            │
│  - Real-time transcription (patient + AI)                   │
│  - Medical data extraction (Pydantic)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## WebSocket Protocol

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
    console.log('Connected to medical intake backend');
};
```

### Messages FROM Frontend → Backend

#### 1. Audio Data (Binary)
Send raw PCM audio from microphone:

```javascript
// Format: 16-bit PCM, 16kHz, mono
navigator.mediaDevices.getUserMedia({ audio: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true
}}).then(stream => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);

    processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // Convert float32 to int16 PCM
        const pcm = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            pcm[i] = Math.max(-32768, Math.min(32767,
                inputData[i] * 32768));
        }

        // Send to backend
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(pcm.buffer);
        }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
});
```

#### 2. Control Messages (JSON)
```javascript
// Interrupt AI mid-response
ws.send(JSON.stringify({
    type: "interrupt"
}));

// End the session
ws.send(JSON.stringify({
    type: "end_session"
}));
```

### Messages TO Frontend ← Backend

#### 1. Audio Response (Binary)
AI speaking - play this to the user:

```javascript
ws.onmessage = async (event) => {
    if (event.data instanceof Blob) {
        // This is audio from Gemini
        // Format: 16-bit PCM, 24kHz, mono

        const arrayBuffer = await event.data.arrayBuffer();
        const pcmData = new Int16Array(arrayBuffer);

        // Convert to float32 for Web Audio API
        const float32 = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
            float32[i] = pcmData[i] / 32768.0;
        }

        // Create audio buffer and play
        const audioContext = new AudioContext({ sampleRate: 24000 });
        const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    }
};
```

#### 2. Text Transcripts (JSON)
Real-time streaming transcription:

```javascript
ws.onmessage = (event) => {
    if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);

        if (msg.type === 'text') {
            // msg.role: "patient" or "assistant"
            // msg.text: "I a", "m s", "orr", "y t"... (streaming chunks!)

            console.log(`${msg.role}: ${msg.text}`);

            // IMPORTANT: Chunks stream rapidly!
            // You should concatenate them for display:
            appendToTranscript(msg.role, msg.text);
        }
    }
};

// Example concatenation logic
let currentTranscript = { patient: '', assistant: '' };
let currentSpeaker = null;

function appendToTranscript(role, text) {
    if (currentSpeaker !== role) {
        // New speaker - flush old and start new
        if (currentSpeaker) {
            displayTranscript(currentSpeaker, currentTranscript[currentSpeaker]);
        }
        currentSpeaker = role;
        currentTranscript[role] = '';
    }

    // Append chunk
    currentTranscript[role] += text;

    // Update UI (debounce recommended)
    updateLiveTranscript(role, currentTranscript[role]);
}
```

#### 3. Medical Data Extraction (JSON)
Structured medical information - auto-fill your form!

```javascript
ws.onmessage = (event) => {
    if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);

        if (msg.type === 'extracted_data') {
            // msg.data contains structured medical info
            console.log('Medical data extracted:', msg.data);

            // Example structure:
            const data = msg.data;

            // Patient Info
            if (data.patient_info) {
                document.getElementById('name').value = data.patient_info.name || '';
                document.getElementById('dob').value = data.patient_info.date_of_birth || '';
                document.getElementById('age').value = data.patient_info.age || '';
                document.getElementById('gender').value = data.patient_info.gender || '';
            }

            // Chief Complaint
            if (data.present_illness) {
                document.getElementById('complaint').value =
                    data.present_illness.chief_complaint || '';
                document.getElementById('duration').value =
                    data.present_illness.duration || '';
                document.getElementById('severity').value =
                    data.present_illness.severity || '';
            }

            // Medications
            if (data.medications && data.medications.length > 0) {
                const medList = document.getElementById('medications-list');
                medList.innerHTML = '';
                data.medications.forEach(med => {
                    const li = document.createElement('li');
                    li.textContent = `${med.name} - ${med.dosage} (${med.frequency})`;
                    medList.appendChild(li);
                });
            }

            // Allergies
            if (data.allergies && data.allergies.length > 0) {
                const allergyList = document.getElementById('allergies-list');
                allergyList.innerHTML = '';
                data.allergies.forEach(allergy => {
                    const li = document.createElement('li');
                    li.textContent = `${allergy.allergen} - ${allergy.reaction}`;
                    allergyList.appendChild(li);
                });
            }

            // Past Medical History
            if (data.past_medical_history) {
                // ... fill in history fields
            }

            // Family History
            if (data.family_history) {
                // ... fill in family history
            }

            // Social History
            if (data.social_history) {
                // ... fill in social history
            }
        }
    }
};
```

#### 4. Status Messages (JSON)
System state updates:

```javascript
ws.onmessage = (event) => {
    if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);

        if (msg.type === 'status') {
            // msg.state: "ready", "listening", "processing", etc.
            // msg.message: Human-readable description

            updateStatusIndicator(msg.state, msg.message);
        }
    }
};
```

#### 5. Error Messages (JSON)
Error handling:

```javascript
ws.onmessage = (event) => {
    if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);

        if (msg.type === 'error') {
            console.error('Backend error:', msg.message);
            showErrorToUser(msg.message);
        }
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    showErrorToUser('Connection error');
};

ws.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
    showReconnectButton();
};
```

---

## Complete Frontend Example (React)

```jsx
import React, { useState, useEffect, useRef } from 'react';

function MedicalIntakeApp() {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [medicalData, setMedicalData] = useState({});
    const [status, setStatus] = useState('disconnected');

    const wsRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const streamRef = useRef(null);

    // Connect to backend
    const connect = () => {
        const ws = new WebSocket('ws://localhost:8000/ws');

        ws.onopen = () => {
            console.log('Connected');
            setIsConnected(true);
            setStatus('ready');
        };

        ws.onmessage = async (event) => {
            // Handle binary audio
            if (event.data instanceof Blob) {
                await playAudio(event.data);
                return;
            }

            // Handle JSON messages
            if (typeof event.data === 'string') {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case 'text':
                        // Append transcript chunk
                        setTranscript(prev => [
                            ...prev,
                            { role: msg.role, text: msg.text }
                        ]);
                        break;

                    case 'extracted_data':
                        // Update medical form
                        setMedicalData(msg.data);
                        break;

                    case 'status':
                        setStatus(msg.state);
                        break;

                    case 'error':
                        console.error(msg.message);
                        break;
                }
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            setIsConnected(false);
            setStatus('disconnected');
        };

        wsRef.current = ws;
    };

    // Start recording
    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true
            }
        });

        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(2048, 1, 1);

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);

            // Convert to PCM
            const pcm = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                pcm[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
            }

            // Send to backend
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(pcm.buffer);
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        audioContextRef.current = audioContext;
        processorRef.current = processor;
        streamRef.current = stream;

        setIsRecording(true);
    };

    // Stop recording
    const stopRecording = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        setIsRecording(false);
    };

    // Play audio response
    const playAudio = async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        const pcmData = new Int16Array(arrayBuffer);

        // Convert to float32
        const float32 = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
            float32[i] = pcmData[i] / 32768.0;
        }

        // Play
        const audioContext = new AudioContext({ sampleRate: 24000 });
        const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    };

    return (
        <div className="medical-intake-app">
            <h1>Voice Medical Intake</h1>

            {/* Connection Status */}
            <div className="status">
                Status: {status}
                {!isConnected && (
                    <button onClick={connect}>Connect</button>
                )}
            </div>

            {/* Recording Controls */}
            <div className="controls">
                {!isRecording ? (
                    <button onClick={startRecording} disabled={!isConnected}>
                        Start Recording
                    </button>
                ) : (
                    <button onClick={stopRecording}>
                        Stop Recording
                    </button>
                )}
            </div>

            {/* Live Transcript */}
            <div className="transcript">
                <h2>Conversation</h2>
                <div className="messages">
                    {transcript.map((msg, i) => (
                        <div key={i} className={`message ${msg.role}`}>
                            <strong>{msg.role}:</strong> {msg.text}
                        </div>
                    ))}
                </div>
            </div>

            {/* Medical Form */}
            <div className="medical-form">
                <h2>Medical Information</h2>

                <section>
                    <h3>Patient Info</h3>
                    <input
                        placeholder="Name"
                        value={medicalData.patient_info?.name || ''}
                        readOnly
                    />
                    <input
                        placeholder="Date of Birth"
                        value={medicalData.patient_info?.date_of_birth || ''}
                        readOnly
                    />
                    <input
                        placeholder="Age"
                        value={medicalData.patient_info?.age || ''}
                        readOnly
                    />
                </section>

                <section>
                    <h3>Chief Complaint</h3>
                    <textarea
                        placeholder="Chief complaint"
                        value={medicalData.present_illness?.chief_complaint || ''}
                        readOnly
                    />
                </section>

                <section>
                    <h3>Medications</h3>
                    <ul>
                        {medicalData.medications?.map((med, i) => (
                            <li key={i}>
                                {med.name} - {med.dosage} ({med.frequency})
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h3>Allergies</h3>
                    <ul>
                        {medicalData.allergies?.map((allergy, i) => (
                            <li key={i}>
                                {allergy.allergen} - {allergy.reaction}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default MedicalIntakeApp;
```

---

## Medical Data Schema

The `extracted_data` message contains this structure:

```typescript
interface MedicalIntake {
    patient_info?: {
        name?: string;
        date_of_birth?: string;
        age?: number;
        gender?: string;
        contact_number?: string;
        email?: string;
        address?: string;
    };

    present_illness?: {
        chief_complaint?: string;
        duration?: string;
        severity?: string;
        onset?: string;
        location?: string;
        quality?: string;
        aggravating_factors?: string[];
        relieving_factors?: string[];
        associated_symptoms?: string[];
    };

    medications?: Array<{
        name: string;
        dosage?: string;
        frequency?: string;
        start_date?: string;
        reason?: string;
    }>;

    allergies?: Array<{
        allergen: string;
        reaction?: string;
        severity?: string;
    }>;

    past_medical_history?: {
        conditions?: string[];
        surgeries?: string[];
        hospitalizations?: string[];
    };

    family_history?: {
        conditions?: string[];
        details?: string;
    };

    social_history?: {
        smoking?: string;
        alcohol?: string;
        drug_use?: string;
        occupation?: string;
        living_situation?: string;
    };
}
```

---

## Testing Your Frontend

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","live_api":"connected"}
```

### 2. WebSocket Connection Test
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onopen = () => console.log('✅ Connected!');
ws.onerror = (e) => console.error('❌ Error:', e);
```

### 3. Test with Simple Text
```javascript
// Backend also accepts text input for testing
ws.send(JSON.stringify({
    type: "text",
    content: "I have a headache"
}));
```

---

## Audio Format Specifications

### Input (Frontend → Backend):
- **Format**: 16-bit PCM
- **Sample Rate**: 16,000 Hz (16 kHz)
- **Channels**: 1 (mono)
- **Encoding**: Little-endian signed integer
- **Frame Size**: 2048 samples recommended

### Output (Backend → Frontend):
- **Format**: 16-bit PCM
- **Sample Rate**: 24,000 Hz (24 kHz)
- **Channels**: 1 (mono)
- **Encoding**: Little-endian signed integer
- **Streaming**: Chunks arrive as they're generated

---

## Common Issues & Solutions

### 1. "WebSocket connection failed"
**Solution**: Ensure backend is running:
```bash
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. "No audio heard from AI"
**Causes**:
- Sample rate mismatch (must be 24kHz for playback)
- Audio context not created with correct sample rate
- Volume muted

**Solution**:
```javascript
const audioContext = new AudioContext({ sampleRate: 24000 });
```

### 3. "Microphone not working"
**Causes**:
- Permissions not granted
- Sample rate not supported by device

**Solution**:
```javascript
// Check permissions first
const permission = await navigator.permissions.query({ name: 'microphone' });
console.log('Microphone permission:', permission.state);
```

### 4. "Transcript chunks too fragmented"
**Expected**: Transcripts stream as "I a", "m s", "orr"...

**Solution**: Concatenate and debounce:
```javascript
let buffer = '';
let debounceTimer;

function handleTranscript(text) {
    buffer += text;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        displayTranscript(buffer);
        buffer = '';
    }, 100); // Wait 100ms for more chunks
}
```

---

## Next.js Example (Bonus)

If you're using Next.js (like the frontend template), here's a starting point:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';

export default function MedicalIntakePage() {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [transcript, setTranscript] = useState<Array<{role: string, text: string}>>([]);
    const [medicalData, setMedicalData] = useState<any>({});

    useEffect(() => {
        // Connect on mount
        const websocket = new WebSocket('ws://localhost:8000/ws');

        websocket.onopen = () => {
            setIsConnected(true);
        };

        websocket.onmessage = async (event) => {
            if (event.data instanceof Blob) {
                // Handle audio
                await playAudio(event.data);
            } else {
                // Handle JSON
                const msg = JSON.parse(event.data);

                if (msg.type === 'text') {
                    setTranscript(prev => [...prev, { role: msg.role, text: msg.text }]);
                }

                if (msg.type === 'extracted_data') {
                    setMedicalData(msg.data);
                }
            }
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, []);

    // ... rest of component
}
```

---

## Summary: What You Need to Build

1. **WebSocket Client**
   - Connect to `ws://localhost:8000/ws`
   - Handle binary and JSON messages
   - Send audio and control messages

2. **Audio Capture**
   - Get microphone access
   - Capture at 16kHz, mono, 16-bit PCM
   - Stream to WebSocket

3. **Audio Playback**
   - Receive 24kHz PCM audio
   - Convert and play through speakers

4. **Transcript Display**
   - Show real-time conversation
   - Concatenate streaming chunks
   - Differentiate patient vs AI

5. **Medical Form**
   - Auto-fill from `extracted_data`
   - Allow manual edits
   - Save/export functionality

---

## Backend Endpoints Reference

### WebSocket
- **URL**: `ws://localhost:8000/ws`
- **Purpose**: Main real-time audio + data streaming

### HTTP (for monitoring)
- **GET** `/` - Service info
- **GET** `/health` - Health check
- **GET** `/docs` - API documentation (Swagger)

---

## Need Help?

Check these files in the backend:
- `README_BACKEND.md` - Backend setup and architecture
- `TRANSCRIPTION_FIX_SUMMARY.md` - Technical details on transcription
- `main.py` - Entry point with inline docs
- `gemini_live.py` - Core session logic with comments

Backend is **ready and running**. Start building! 🚀
