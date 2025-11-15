# Medical Intake App

Production-ready example of a Gemini Live, speech-to-speech intake assistant. The backend is FastAPI, the frontend is Next.js/React, and the whole stack is optimized for tutorials—you only need the pieces required to capture patient info and hand it to a doctor quickly.

## Repository Layout

```
medical-intake-app/
├── backend/   # FastAPI WebSocket server + Gemini Live session manager
└── frontend/  # Next.js UI (microphone control + transcript + review screen)
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

Open `http://localhost:3000` and click the microphone button to start a conversation. Once the summary is confirmed, hit **Continue to Review** to move through the remaining screens.

## Deployment Notes

- Keep the backend `.env` file out of version control; only ship `.env.example`.
- The frontend only needs the public websocket/API URLs—never expose your Gemini key in the browser.
- FastAPI is stateless; scale it horizontally and point each instance at the same Gemini API project.

Happy building!
