# Medical Intake Assistant - Frontend Documentation

> A voice-first medical intake system powered by Gemini Live API, built with Next.js 14 and real-time audio streaming.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Core Components](#core-components)
4. [State Management](#state-management)
5. [Audio System](#audio-system)
6. [WebSocket Communication](#websocket-communication)
7. [UI Components Library](#ui-components-library)
8. [Testing](#testing)
9. [Development Guide](#development-guide)
10. [Build & Deployment](#build--deployment)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Voice-First Design Philosophy

This application is built around a **voice-first architecture** where the primary user interaction is through natural speech. The UI is designed to fade into the background while the voice interaction takes center stage.

### Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety throughout
- **Zustand** - Lightweight state management (3 stores)
- **Framer Motion** - Fluid animations and transitions
- **shadcn/ui** - Accessible, customizable components
- **Tailwind CSS** - Utility-first styling
- **Web Audio API** - Audio capture and playback
- **WebSocket** - Real-time bidirectional communication
- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Frontend                          │
│                                                                   │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐      │
│  │   UI Layer  │   │  State Layer │   │   Audio Layer   │      │
│  │             │   │              │   │                 │      │
│  │ VoiceOrb    │◄──┤ audio-store  │◄──┤ AudioManager    │      │
│  │ Floating    │   │ conversation │   │ - 16kHz capture │      │
│  │ Conversation│◄──┤ intake-store │   │ - 48kHz playback│      │
│  │ DataDrawer  │   │              │   │ - Web Audio API │      │
│  └─────────────┘   └──────────────┘   └─────────────────┘      │
│         │                  │                    │                │
│         └──────────────────┼────────────────────┘                │
│                            │                                     │
│                  ┌─────────▼──────────┐                          │
│                  │  WebSocketClient   │                          │
│                  │  - Binary audio    │                          │
│                  │  - JSON messages   │                          │
│                  │  - Auto-reconnect  │                          │
│                  └─────────┬──────────┘                          │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    WebSocket (ws://)
                             │
                ┌────────────▼────────────┐
                │   Backend Server        │
                │   - Gemini Live API     │
                │   - Audio processing    │
                │   - Data extraction     │
                └─────────────────────────┘
```

---

## Directory Structure

```
frontend/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # Main application page (entry point)
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles and Tailwind directives
│   └── favicon.ico               # App icon
│
├── components/                   # React components
│   ├── intake/                   # Medical intake components
│   │   ├── DataDrawer.tsx        # Sliding drawer for extracted data
│   │   └── FloatingConversation.tsx  # Conversation transcript display
│   │
│   ├── voice/                    # Voice interaction components
│   │   └── VoiceOrb.tsx          # Main voice button with animations
│   │
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx            # Button variants
│   │   ├── card.tsx              # Card container
│   │   ├── badge.tsx             # Badge for status/labels
│   │   ├── drawer.tsx            # Drawer (Vaul)
│   │   ├── accordion.tsx         # Collapsible sections
│   │   ├── scroll-area.tsx       # Custom scrollbar
│   │   ├── skeleton.tsx          # Loading placeholders
│   │   ├── command-menu.tsx      # Keyboard shortcuts (⌘K)
│   │   └── magic/                # Special effect components
│   │       ├── particles.tsx     # Animated background particles
│   │       ├── confetti.tsx      # Celebration effect
│   │       ├── gradient-text.tsx # Animated gradient text
│   │       └── shimmer-button.tsx # Shimmer effect button
│   │
│   └── ErrorBoundary.tsx         # Error handling wrapper
│
├── lib/                          # Core utilities
│   ├── audio-manager.ts          # Web Audio API wrapper (365 lines)
│   ├── websocket-client.ts       # WebSocket client (275 lines)
│   ├── medical-intake.ts         # Medical data utilities
│   ├── simulation-engine.ts      # Test simulation logic
│   └── utils.ts                  # Helper functions (cn, generateId)
│
├── store/                        # Zustand state stores
│   ├── audio-store.ts            # Audio state (voice state, level, connection)
│   ├── conversation-store.ts     # Messages and transcript streaming
│   └── intake-store.ts           # Extracted medical data
│
├── types/                        # TypeScript definitions
│   └── index.ts                  # All type definitions (158 lines)
│
├── public/                       # Static assets
│   └── audio-processor.js        # AudioWorklet processor for capture
│
├── __tests__/                    # Test suites
│   ├── integration/              # Component integration tests
│   ├── e2e/                      # Playwright E2E tests
│   └── utils/                    # Test utilities and mocks
│
├── test-scenarios/               # Test data
│   └── scenarios.json            # Pre-built conversation scenarios
│
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration
├── vitest.config.ts              # Vitest test configuration
├── playwright.config.ts          # Playwright E2E configuration
└── vitest.setup.ts               # Test environment setup
```

---

## Core Components

### 1. VoiceOrb (`components/voice/VoiceOrb.tsx`)

The centerpiece of the UI - an animated, interactive orb that visualizes voice state.

**Features:**
- **4 distinct states** with unique visual styles:
  - `idle` - Grey, pulsing gently
  - `listening` - Blue gradient, reacts to audio input
  - `processing` - Yellow/orange, spinning loader
  - `speaking` - Green gradient, AI responding

- **Audio-reactive animation** - Scales based on microphone input level
- **Particle effects** - 8 particles radiate outward during listening
- **Accessibility** - Full ARIA labels and keyboard support

**Usage:**

```tsx
import { VoiceOrb } from '@/components/voice/VoiceOrb';

<VoiceOrb
  isActive={isActive}
  state="listening"
  audioLevel={0.5}
  onClick={handleToggle}
/>
```

**State Colors:**
- Idle: `from-slate-400 via-slate-500 to-slate-600`
- Listening: `from-blue-500 via-purple-500 to-pink-500`
- Processing: `from-yellow-500 via-orange-500 to-red-500`
- Speaking: `from-green-500 via-emerald-500 to-teal-500`

### 2. FloatingConversation (`components/intake/FloatingConversation.tsx`)

Real-time conversation transcript display with streaming support.

**Features:**
- **Auto-scrolling** - Always shows latest messages
- **Streaming text** - Messages build up character by character
- **Role differentiation** - Distinct styles for AI vs Patient
- **Typing indicator** - Animated dots when AI is thinking
- **Skeleton loader** - Graceful loading states
- **Timestamps** - Each message shows time sent

**Message Flow:**

```tsx
// Messages stream into the store
appendTranscriptChunk('ai', 'Hello, ');
appendTranscriptChunk('ai', 'how can I help?');
// Finalized when complete
finalizeCurrentMessage();
```

**Styling:**
- AI messages: Left-aligned, blue/purple gradient background
- Patient messages: Right-aligned, purple/pink gradient background
- Smooth entrance animations with Framer Motion

### 3. DataDrawer (`components/intake/DataDrawer.tsx`)

Bottom drawer that displays extracted medical data with categorization.

**Features:**
- **Slide-up drawer** (Vaul library)
- **Accordion sections** - Collapsible data categories
- **Color-coded severity** - Allergies highlight by severity
- **Real-time updates** - Data appears as extracted
- **Badge counts** - Shows number of items per category
- **Export button** - PDF export (placeholder)

**Data Categories:**

1. **Chief Complaint** (Red)
   - Complaint text
   - Duration
   - Location
   - Severity badge

2. **Current Medications** (Blue)
   - Medication name
   - Dose
   - Frequency
   - Checkmark indicators

3. **Allergies** (Yellow/Orange/Red)
   - Allergen name
   - Reactions list
   - Severity badge (color-coded)
   - Special highlight for life-threatening

4. **Medical History** (Purple)
   - Past conditions
   - Surgeries
   - Hospitalizations

5. **Social History** (Green)
   - Smoking status
   - Alcohol consumption
   - Occupation

**Usage:**

```tsx
import { DataDrawer } from '@/components/intake/DataDrawer';

// Automatically reads from intake-store
<DataDrawer />
```

---

## State Management

Zustand provides simple, TypeScript-friendly state management without boilerplate.

### 1. Audio Store (`store/audio-store.ts`)

Manages audio and connection state.

```typescript
interface AudioStore {
  state: VoiceState;           // 'idle' | 'listening' | 'processing' | 'speaking'
  audioLevel: number;          // 0-1, normalized audio input level
  isConnected: boolean;        // WebSocket connection status
  error: string | null;        // Error message if any

  setState: (state: VoiceState) => void;
  setAudioLevel: (level: number) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
```

**Usage:**

```tsx
import { useAudioStore } from '@/store/audio-store';

const { state, audioLevel, isConnected, setState } = useAudioStore();

// Update state
setState('listening');
setAudioLevel(0.75);
```

### 2. Conversation Store (`store/conversation-store.ts`)

Manages conversation messages with streaming support.

```typescript
interface ConversationStore {
  messages: Message[];          // Complete messages
  currentAIChunk: string;       // AI message being built
  currentPatientChunk: string;  // Patient message being built
  lastRole: 'ai' | 'patient' | null;

  addMessage: (role, content) => void;
  appendTranscriptChunk: (role, chunk) => void;  // Streaming
  finalizeCurrentMessage: () => void;
  clearConversation: () => void;
}
```

**Streaming Flow:**

```typescript
// Backend sends transcript chunks
wsClient.onTranscript((payload) => {
  appendTranscriptChunk(payload.role, payload.text);
});

// Role change or stop signal finalizes message
finalizeCurrentMessage();
```

**Key Feature - Automatic Finalization:**
When the role changes (AI → Patient or vice versa), the previous message is automatically finalized and added to the messages array.

### 3. Intake Store (`store/intake-store.ts`)

Stores extracted medical data.

```typescript
interface IntakeStore {
  extractedData: MedicalIntake | null;

  updateData: (data: Partial<MedicalIntake>) => void;  // Merge partial updates
  setData: (data: MedicalIntake) => void;              // Replace all data
  clearData: () => void;
}
```

**Usage:**

```tsx
import { useIntakeStore } from '@/store/intake-store';

const { extractedData, setData } = useIntakeStore();

// Backend sends extracted data
wsClient.onDataExtracted((data) => {
  setData(data);
});
```

---

## Audio System

The audio system is the heart of the voice-first architecture, handling both input (microphone) and output (speakers).

### AudioManager Class (`lib/audio-manager.ts`)

A comprehensive wrapper around the Web Audio API that handles:
- Microphone capture at 16kHz
- Audio playback at 48kHz
- Format detection (PCM vs encoded)
- Queueing and streaming
- Audio level analysis

#### Architecture

```
Microphone Input (16kHz)
         │
         ▼
  ┌──────────────┐
  │ getUserMedia │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────┐
  │  AudioContext    │
  │  (16kHz capture) │
  └──────┬───────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────────┐
│Analyser│  │AudioWorklet│
│ Node   │  │ Processor  │
└────┬───┘  └──────┬─────┘
     │             │
     │             ▼
     │      PCM16 Chunks (4096 samples)
     │             │
     ▼             ▼
Audio Level    WebSocket
 (0-1)        to Backend
```

```
Backend Audio Response (24kHz PCM16)
         │
         ▼
    WebSocket
         │
         ▼
  ┌──────────────────┐
  │ Format Detection │
  │ (PCM vs Encoded) │
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │  AudioContext    │
  │  (48kHz playback)│
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │  Audio Queue     │
  │  (smooth stream) │
  └──────┬───────────┘
         │
         ▼
   BufferSourceNode
         │
         ▼
      Speakers
```

#### Key Methods

**1. Microphone Capture**

```typescript
// Request microphone access
const hasAccess = await audioManager.requestMicrophoneAccess();

// Start capturing audio
await audioManager.startCapture();

// Listen for audio chunks
audioManager.onAudioData((chunk: ArrayBuffer) => {
  // chunk is 16kHz, mono, PCM16
  // Send to backend via WebSocket
  wsClient.sendAudio(chunk);
});

// Stop capturing
audioManager.stopCapture();
```

**Configuration:**
- Sample Rate: 16kHz (optimized for speech)
- Channels: 1 (mono)
- Format: PCM16 (Int16Array)
- Chunk Size: 4096 samples (~256ms at 16kHz)
- Echo Cancellation: Enabled
- Noise Suppression: Enabled

**2. Audio Playback**

```typescript
// Play audio chunk (auto-queued)
await audioManager.playAudioChunk(audioBuffer, 24000);

// Stop all playback
audioManager.stopPlayback();

// Get current audio level (0-1)
const level = audioManager.getAudioLevel();
```

**Playback Features:**
- **Format Detection** - Automatically detects PCM vs encoded (WAV, MP3, etc.)
- **Queue System** - Smooth streaming without gaps or overlaps
- **Sample Rate Conversion** - Accepts 24kHz, outputs at browser's native rate (48kHz)
- **State Management** - `isPlaying` flag prevents overlapping chunks

**3. Audio Format Detection**

The system can detect and handle multiple audio formats:

```typescript
private detectAudioFormat(data: ArrayBuffer): 'raw-pcm' | 'encoded' {
  // Checks magic bytes for:
  // - WAV (RIFF)
  // - MP3 (0xFF 0xFB or ID3)
  // - OGG (OggS)
  // - WebM/Matroska
  // - FLAC
  // Defaults to raw PCM if no match
}
```

**4. AudioWorklet Processor**

For optimal performance, audio capture uses AudioWorklet (with ScriptProcessor fallback).

`public/audio-processor.js`:

```javascript
class AudioCaptureProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Runs in audio thread
    // Buffers 4096 samples
    // Converts Float32 → PCM16
    // Posts to main thread
    return true; // Keep alive
  }
}
```

**Benefits:**
- Runs in separate audio thread (no main thread blocking)
- Lower latency
- More stable performance
- Better battery life

#### Audio Level Analysis

```typescript
getAudioLevel(): number {
  // Uses AnalyserNode
  // Returns 0-1 normalized value
  // Used for VoiceOrb animations
}
```

**Implementation:**

```typescript
const updateAudioLevel = () => {
  if (audioManager && isActive) {
    const level = audioManager.getAudioLevel();
    setAudioLevel(level); // Updates Zustand store
    requestAnimationFrame(updateAudioLevel);
  }
};
```

#### Sample Rate Handling

The system handles three different sample rates:

1. **Capture: 16kHz**
   - Optimal for speech recognition
   - Lower bandwidth
   - Reduces backend processing

2. **Backend Response: 24kHz**
   - Gemini Live API output format
   - Good quality for speech
   - Efficient streaming

3. **Playback: 48kHz**
   - Browser's native sample rate
   - Automatic resampling by Web Audio API
   - Best quality for speakers

**Resampling Flow:**

```typescript
// Create buffer at SOURCE rate (24kHz)
const buffer = playbackContext.createBuffer(1, pcm16.length, 24000);

// Browser automatically resamples to native rate (48kHz) during playback
source.buffer = buffer;
source.start(0);
```

#### Error Handling

```typescript
try {
  await audioManager.playAudioChunk(data, 24000);
} catch (error) {
  // Tries fallback format if detection failed
  console.error('Audio playback failed:', error);
}
```

#### Cleanup

```typescript
audioManager.cleanup();
// - Stops capture
// - Stops playback
// - Closes both AudioContexts
// - Releases microphone
```

---

## WebSocket Communication

### WebSocketClient Class (`lib/websocket-client.ts`)

Manages bidirectional real-time communication with the backend.

#### Connection Flow

```
Frontend                          Backend
   │                                 │
   │  1. Health check (HTTP)         │
   ├────────────────────────────────►│
   │  2. OK response                 │
   │◄────────────────────────────────┤
   │                                 │
   │  3. WebSocket upgrade           │
   ├────────────────────────────────►│
   │  4. Connection established      │
   │◄────────────────────────────────┤
   │                                 │
   │  5. Control: 'start'            │
   ├────────────────────────────────►│
   │                                 │
   │  6. Audio chunks (binary)       │
   ├────────────────────────────────►│
   │                                 │
   │  7. Status update (JSON)        │
   │◄────────────────────────────────┤
   │                                 │
   │  8. Audio response (binary)     │
   │◄────────────────────────────────┤
   │                                 │
   │  9. Transcript (JSON)           │
   │◄────────────────────────────────┤
   │                                 │
   │  10. Extracted data (JSON)      │
   │◄────────────────────────────────┤
   │                                 │
   │  11. Control: 'stop'            │
   ├────────────────────────────────►│
   │                                 │
```

#### Message Types

**Outgoing (Frontend → Backend):**

1. **Audio Data** (Binary)
```typescript
wsClient.sendAudio(audioBuffer: ArrayBuffer);
// Raw PCM16 audio, 16kHz, mono
```

2. **Control Messages** (JSON)
```typescript
wsClient.sendControl('start' | 'stop' | 'interrupt');
// 'start' - Begin conversation
// 'stop' - End conversation
// 'interrupt' - Stop AI mid-speech
```

**Incoming (Backend → Frontend):**

1. **Audio Response** (Binary)
```typescript
// Received as ArrayBuffer
// Typically 24kHz PCM16
// Automatically played through AudioManager
```

2. **Transcript** (JSON)
```typescript
{
  type: 'transcript',
  role: 'assistant' | 'patient',
  text: 'Transcribed speech chunk'
}
```

3. **Extracted Data** (JSON)
```typescript
{
  type: 'extracted_data',
  data: {
    chief_complaint: 'Headache',
    current_medications: [...],
    allergies: [...],
    // ... more fields
  }
}
```

4. **Status Update** (JSON)
```typescript
{
  type: 'status',
  state: 'listening' | 'processing' | 'speaking'
}
```

5. **Error** (JSON)
```typescript
{
  type: 'error',
  message: 'Error description'
}
```

#### Usage

```typescript
// Initialize
const wsClient = new WebSocketClient('ws://localhost:8000/ws');

// Register handlers
wsClient.onConnected(() => {
  console.log('Connected!');
  setConnected(true);
});

wsClient.onAudio((audioBuffer) => {
  audioManager.playAudio(audioBuffer);
});

wsClient.onTranscript((payload) => {
  const role = payload.role === 'assistant' ? 'ai' : 'patient';
  appendTranscriptChunk(role, payload.text);
});

wsClient.onDataExtracted((data) => {
  setData(data);
});

wsClient.onStatusUpdate((status) => {
  setState(status);
});

wsClient.onError((error) => {
  console.error('WebSocket error:', error);
});

// Connect
await wsClient.connect();

// Send audio
wsClient.sendAudio(audioChunk);

// Disconnect
wsClient.disconnect();
```

#### Auto-Reconnection

The client automatically attempts to reconnect on disconnection:

```typescript
private attemptReconnect(): void {
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}
```

**Configuration:**
- Max attempts: 5
- Base delay: 1000ms
- Exponential backoff: delay × attempt number

#### Health Check

Before connecting, the client checks if the backend is ready:

```typescript
private async checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/health', {
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

This prevents failed connection attempts when the backend is still starting up.

---

## UI Components Library

### shadcn/ui Components

Pre-built, accessible components from shadcn/ui:

- **button.tsx** - Multiple variants (default, destructive, outline, ghost, link)
- **card.tsx** - Container with header/content/footer
- **badge.tsx** - Labels and status indicators
- **drawer.tsx** - Slide-up drawer (Vaul)
- **accordion.tsx** - Collapsible sections
- **scroll-area.tsx** - Custom scrollbar styling
- **skeleton.tsx** - Loading placeholders
- **avatar.tsx** - User/AI avatars
- **dialog.tsx** - Modal dialogs
- **command-menu.tsx** - Keyboard command palette (⌘K)

### Magic UI Components

Special effect components for enhanced UX:

#### 1. Particles (`components/ui/magic/particles.tsx`)

Animated background particles that float across the screen.

```tsx
<Particles
  className="absolute inset-0"
  quantity={60}        // Number of particles
  staticity={30}       // Movement randomness
  ease={50}            // Animation easing
  color="#ffffff"      // Particle color
/>
```

**Implementation:**
- Canvas-based rendering
- Configurable count, speed, and color
- Minimal performance impact
- Adds depth to the UI

#### 2. Confetti (`components/ui/magic/confetti.tsx`)

Celebration effect triggered on completion.

```tsx
<Confetti isActive={showConfetti} />
```

**Triggers:**
- When chief complaint is extracted
- When medications are captured
- On session completion

#### 3. GradientText (`components/ui/magic/gradient-text.tsx`)

Animated gradient text for titles.

```tsx
<GradientText as="h1" className="text-5xl">
  Medical Intake Assistant
</GradientText>
```

**Effect:**
- Smooth gradient animation
- Customizable element type (`h1`, `h2`, `p`, etc.)
- Inherits text sizing from className

#### 4. ShimmerButton (`components/ui/magic/shimmer-button.tsx`)

Button with animated shimmer effect.

```tsx
<ShimmerButton
  shimmerDuration="3s"
  background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
>
  View Data
</ShimmerButton>
```

**Used in:**
- DataDrawer trigger button
- Primary action buttons

---

## Testing

### Unit & Integration Tests (Vitest)

**Configuration:** `vitest.config.ts`

```typescript
{
  environment: 'happy-dom',  // Lightweight DOM implementation
  globals: true,
  setupFiles: ['./vitest.setup.ts'],
}
```

**Running Tests:**

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run once (CI mode)
npm run test:run

# Coverage report
npm run test:coverage
```

**Test Structure:**

```
__tests__/
├── integration/
│   ├── VoiceOrb.test.tsx
│   ├── FloatingConversation.test.tsx
│   └── DataDrawer.test.tsx
└── utils/
    ├── mockAudioContext.ts
    └── mockWebSocket.ts
```

**Example Test:**

```typescript
import { render, screen } from '@testing-library/react';
import { VoiceOrb } from '@/components/voice/VoiceOrb';

describe('VoiceOrb', () => {
  it('should render idle state', () => {
    render(
      <VoiceOrb
        isActive={false}
        state="idle"
        audioLevel={0}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### End-to-End Tests (Playwright)

**Configuration:** `playwright.config.ts`

```typescript
{
  testDir: './__tests__/e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
}
```

**Running E2E Tests:**

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

**Example E2E Test:**

```typescript
import { test, expect } from '@playwright/test';

test('should toggle voice input', async ({ page }) => {
  await page.goto('/');

  // Click voice orb
  await page.click('[aria-label="Start voice input"]');

  // Should show listening state
  await expect(page.locator('text=Listening')).toBeVisible();
});
```

### Test Coverage Goals

- **Components**: 80%+
- **Utilities**: 90%+
- **Critical paths**: 100% (audio, WebSocket)

---

## Development Guide

### Getting Started

**Prerequisites:**
- Node.js 18+
- Backend running on `http://localhost:8000`

**Installation:**

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### Development Workflow

1. **UI Changes**
   - Edit components in `components/`
   - Hot reload updates instantly
   - Check browser console for errors

2. **State Changes**
   - Modify stores in `store/`
   - Zustand DevTools available

3. **Audio Logic**
   - Edit `lib/audio-manager.ts`
   - Test with live microphone
   - Check Web Audio API in DevTools

4. **WebSocket Logic**
   - Edit `lib/websocket-client.ts`
   - Monitor Network tab (WS)
   - Check backend logs

### Adding a New Component

1. **Create component file:**

```tsx
// components/MyComponent.tsx
'use client';

import { motion } from 'framer-motion';

export function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Hello World
    </motion.div>
  );
}
```

2. **Add types if needed:**

```typescript
// types/index.ts
export interface MyComponentProps {
  title: string;
  onClick: () => void;
}
```

3. **Use in page:**

```tsx
// app/page.tsx
import { MyComponent } from '@/components/MyComponent';

<MyComponent title="Test" onClick={handleClick} />
```

### Styling Guidelines

**Use Tailwind CSS:**

```tsx
// Good
<div className="flex items-center gap-4 p-6 rounded-lg bg-slate-900">

// Avoid inline styles
<div style={{ display: 'flex' }}>
```

**Use cn() for conditional classes:**

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  error && 'error-classes'
)} />
```

**Use CSS variables for themes:**

```css
/* globals.css */
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
}
```

### Animation Best Practices

**Use Framer Motion:**

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

**Wrap with AnimatePresence for exit animations:**

```tsx
<AnimatePresence>
  {show && (
    <motion.div exit={{ opacity: 0 }}>
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### Performance Tips

1. **Memoize expensive components:**

```tsx
import { memo } from 'react';

export const ExpensiveComponent = memo(({ data }) => {
  // Complex rendering
});
```

2. **Use useCallback for handlers:**

```tsx
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

3. **Lazy load heavy components:**

```tsx
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />
});
```

### Keyboard Shortcuts

The app includes keyboard shortcuts via Command Menu (⌘K):

- **Space** - Toggle voice input
- **⌘K / Ctrl+K** - Open command menu
- **Esc** - Close dialogs/menus

**Adding new shortcuts:**

Edit `components/ui/command-menu.tsx`:

```tsx
<CommandItem onSelect={handleAction}>
  <Icon className="mr-2" />
  Action Name
  <CommandShortcut>⌘A</CommandShortcut>
</CommandItem>
```

### Accessibility

**ARIA Labels:**

```tsx
<button
  aria-label="Start voice input"
  aria-pressed={isActive}
  role="button"
>
```

**Keyboard Navigation:**

```tsx
<div
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleAction();
  }}
>
```

**Screen Reader Announcements:**

```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusText}
</div>
```

---

## Build & Deployment

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm start

# Build output in .next/
```

### Deployment to Vercel

1. **Push to GitHub:**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Import in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables:**
   - `NEXT_PUBLIC_BACKEND_URL` - Your backend URL
   - `NEXT_PUBLIC_WS_URL` - Your WebSocket URL (wss:// for production)

4. **Deploy:**
   - Click "Deploy"
   - Vercel automatically builds and deploys
   - Get production URL

### Other Platforms

**Netlify:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Railway:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

**Docker:**

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t medical-intake-frontend .
docker run -p 3000:3000 medical-intake-frontend
```

### Environment-Specific Config

**Development:**
- Hot reload enabled
- Source maps included
- Verbose logging

**Production:**
- Optimized bundle
- Minified code
- No source maps
- Error boundaries

---

## Troubleshooting

### Common Issues

#### 1. Microphone Not Working

**Symptoms:**
- "Microphone access denied" error
- No audio level visualization
- Audio not reaching backend

**Solutions:**

✅ **Check browser permissions:**
- Click lock icon in address bar
- Allow microphone access
- Refresh page

✅ **Verify HTTPS/localhost:**
- Microphone requires secure context
- Use `https://` or `localhost`
- Not `http://your-ip`

✅ **Try different browser:**
- Chrome/Edge recommended
- Safari/Firefox may have restrictions

✅ **Check system settings:**
- Microphone not muted in OS
- Correct input device selected
- Test in other apps

#### 2. WebSocket Connection Failed

**Symptoms:**
- "Disconnected" badge shown
- No communication with backend
- Console error: "WebSocket connection failed"

**Solutions:**

✅ **Verify backend is running:**
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

✅ **Check environment variables:**
```bash
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

✅ **Check CORS settings:**
Backend must allow frontend origin.

✅ **Check firewall/antivirus:**
May block WebSocket connections.

#### 3. Audio Playback Issues

**Symptoms:**
- AI speaks but no sound
- Choppy/distorted audio
- Console errors about AudioContext

**Solutions:**

✅ **Check browser autoplay policy:**
```typescript
// AudioContext may be suspended
if (audioContext.state === 'suspended') {
  await audioContext.resume();
}
```

✅ **Check speaker volume:**
- System volume not muted
- Browser tab not muted

✅ **Clear audio queue:**
```typescript
audioManager.stopPlayback();
audioManager.cleanup();
```

✅ **Check console for format errors:**
- "Failed to decode audio"
- May indicate wrong sample rate

#### 4. UI Animations Choppy

**Symptoms:**
- Slow, stuttering animations
- High CPU usage
- Page feels sluggish

**Solutions:**

✅ **Close other tabs/apps**

✅ **Enable GPU acceleration:**
- Chrome: `chrome://settings` → Advanced → System
- Enable "Use hardware acceleration"

✅ **Reduce particle count:**
```tsx
<Particles quantity={30} /> // Instead of 60
```

✅ **Check for memory leaks:**
- Open DevTools → Memory
- Take heap snapshot
- Look for detached DOM nodes

#### 5. Build Errors

**Symptoms:**
- `npm run build` fails
- Type errors
- Module not found

**Solutions:**

✅ **Clear cache and reinstall:**
```bash
rm -rf node_modules .next
npm install
npm run build
```

✅ **Check TypeScript errors:**
```bash
npx tsc --noEmit
```

✅ **Update dependencies:**
```bash
npm update
```

#### 6. State Not Updating

**Symptoms:**
- Component doesn't re-render
- Old data displayed
- Store changes not reflected

**Solutions:**

✅ **Check Zustand store usage:**
```tsx
// ❌ Wrong - doesn't subscribe
const store = useAudioStore;

// ✅ Correct - subscribes to changes
const { state } = useAudioStore();
```

✅ **Check if store is being mutated:**
```typescript
// ❌ Wrong - mutates state
state.messages.push(newMessage);

// ✅ Correct - creates new array
setState({ messages: [...messages, newMessage] });
```

✅ **Use React DevTools:**
- Install React DevTools extension
- Check component props/state
- Verify re-renders

### Debugging Tools

**Browser DevTools:**

1. **Console Tab:**
   - WebSocket messages logged
   - Audio system logs
   - Error stack traces

2. **Network Tab:**
   - Filter: WS (WebSocket)
   - View frames sent/received
   - Check connection status

3. **Application Tab:**
   - Local Storage
   - Session Storage
   - Service Workers

**Zustand DevTools:**

```bash
npm install --save-dev @redux-devtools/extension
```

```tsx
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools((set) => ({
    // store implementation
  }))
);
```

**React DevTools:**

- Install browser extension
- View component tree
- Inspect props/state
- Profile performance

### Performance Monitoring

**Lighthouse:**

```bash
# Run Lighthouse audit
npm run build
npm start
# Open DevTools → Lighthouse
```

**Key Metrics:**
- FCP (First Contentful Paint): < 1.8s
- LCP (Largest Contentful Paint): < 2.5s
- TBT (Total Blocking Time): < 300ms
- CLS (Cumulative Layout Shift): < 0.1

### Getting Help

1. **Check this documentation**
2. **Search browser console for errors**
3. **Check backend logs**
4. **Review Network tab (WebSocket frames)**
5. **Test in different browser**
6. **Check GitHub issues**

---

## Additional Resources

### Documentation Links

- [Next.js 14 Docs](https://nextjs.org/docs)
- [React 18 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Framer Motion API](https://www.framer.com/motion/)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live)

### Key Files to Review

- **Main App:** `app/page.tsx` (433 lines)
- **Audio Manager:** `lib/audio-manager.ts` (365 lines)
- **WebSocket Client:** `lib/websocket-client.ts` (275 lines)
- **Type Definitions:** `types/index.ts` (158 lines)

---

## Appendix: Code Examples

### Complete Audio Integration Example

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioManager } from '@/lib/audio-manager';
import { WebSocketClient } from '@/lib/websocket-client';
import { useAudioStore } from '@/store/audio-store';

export function VoiceInterface() {
  const audioManagerRef = useRef<AudioManager | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const [isActive, setIsActive] = useState(false);

  const { setState, setAudioLevel } = useAudioStore();

  useEffect(() => {
    // Initialize WebSocket
    const wsClient = new WebSocketClient('ws://localhost:8000/ws');

    wsClient.onAudio((audioBuffer) => {
      audioManagerRef.current?.playAudio(audioBuffer);
    });

    wsClient.onStatusUpdate((status) => {
      setState(status as any);
    });

    wsClient.connect();
    wsClientRef.current = wsClient;

    return () => {
      wsClient.disconnect();
    };
  }, []);

  const handleStart = async () => {
    const audioManager = new AudioManager();

    const hasAccess = await audioManager.requestMicrophoneAccess();
    if (!hasAccess) return;

    await audioManager.startCapture();

    audioManager.onAudioData((audioData) => {
      wsClientRef.current?.sendAudio(audioData);
    });

    audioManagerRef.current = audioManager;
    setIsActive(true);
    setState('listening');
    wsClientRef.current?.sendControl('start');
  };

  const handleStop = () => {
    audioManagerRef.current?.stopCapture();
    setIsActive(false);
    setState('idle');
    wsClientRef.current?.sendControl('stop');
  };

  return (
    <button onClick={isActive ? handleStop : handleStart}>
      {isActive ? 'Stop' : 'Start'}
    </button>
  );
}
```

---

**Built with Next.js 14, shadcn/ui, Framer Motion, and Gemini Live API**
