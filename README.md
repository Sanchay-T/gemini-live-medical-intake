# Medical Intake App

Production-ready voice-first medical intake assistant powered by Gemini Live API. Features a clean, minimalist Zen design with real-time speech-to-speech conversation, animated voice orb visualization, and instant medical data extraction.

## Features

- 🎙️ **Voice-First Interface** - Natural conversation flow with AI medical assistant
- 🎨 **Zen Design System** - Clean, minimal UI with smooth animations
- 🌊 **Sound Wave Orb** - Beautiful animated visualization during conversation
- 📊 **Real-Time Transcription** - See the conversation as it happens
- 🏥 **Medical Data Extraction** - Automatic structuring of patient information
- 🔒 **HIPAA-Ready** - Secure handling of medical data
- ⚡ **WebSocket Streaming** - Low-latency audio communication

## Repository Layout

```
medical-intake-app/
├── backend/   # FastAPI WebSocket server + Gemini Live session manager
└── frontend/  # Next.js UI with Zen design (voice orb, transcript, review screens)
```

## Prerequisites

- Python 3.9+
- Node.js 18+
- Google AI Studio API key with access to Gemini Live

## Environment Variables

### Backend (`backend/.env`)

Copy the template and fill in your key:

```bash
cd medical-intake-app/backend
cp .env.example .env
```

Required values:

```
GEMINI_API_KEY=your_google_ai_key
CLINIC_NAME=Your Clinic Name
SPECIALTY=Primary Care
VOICE_MODEL=Puck            # or Charon, Kore, Fenrir, Aoede
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (`frontend/.env.local`)

```bash
cd medical-intake-app/frontend
cp .env.local.example .env.local
```

Set the backend URL (default FastAPI port):

```
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_API_BASE=http://localhost:8000
PORT=3002
```

## Backend Setup

```bash
cd medical-intake-app/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

- WebSocket endpoint: `ws://localhost:8000/ws`
- Session logs land in `backend/session_logs/` automatically so you can inspect each run.

## Frontend Setup

```bash
cd medical-intake-app/frontend
npm install
npm run dev
```

Open `http://localhost:3002` to access the medical intake app.

### Using the App

1. **Landing Page** - Click "Start Voice Intake" to begin
2. **Voice Conversation** - Speak naturally with the AI assistant about your medical concerns
3. **Live Transcript** - Watch the conversation unfold in the fixed transcript box at the bottom
4. **Review Screen** - Verify and edit extracted medical information
5. **Confirmation** - Confirm details before submission

The animated sound wave orb visualizes the conversation state and stays centered while the transcript scrolls independently.

## API Key Setup

The app supports flexible API key configuration:

1. **Backend Environment** (Recommended for development):
   - Add `GEMINI_API_KEY` to `backend/.env`
   - Backend automatically uses this key for all sessions

2. **User-Provided Key** (For public deployments):
   - If no backend key is configured, users see an API key setup screen
   - Users can paste their own Gemini API key
   - Key is stored locally in browser (never sent to your servers)
   - Key is passed directly to Google's Gemini API via WebSocket query parameter

## Deployment Notes

- Keep the backend `.env` file out of version control; only ship `.env.example`
- The frontend only needs public WebSocket/API URLs—never expose your Gemini key in the browser
- For public deployments without a backend API key, users will provide their own keys
- FastAPI is stateless; scale it horizontally and point each instance at the same Gemini API project
- The Zen design is fully responsive and optimized for modern browsers

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend**: FastAPI, Python 3.9+, WebSockets, Pydantic
- **AI**: Google Gemini Live API (speech-to-speech with function calling)
- **Design**: Custom Zen design system with glassmorphism effects

Happy building!
