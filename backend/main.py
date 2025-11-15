"""
Medical Intake Backend - FastAPI + Gemini Live API
===================================================

This is the main FastAPI server that handles real-time audio streaming
between the frontend and Google's Gemini Live API for voice-based medical intake.

Architecture Overview:
---------------------
    Frontend (Next.js)
        ↓ WebSocket connection
    FastAPI Server (this file)
        ↓ Creates session
    GeminiLiveSession (gemini_live.py)
        ↓ Bidirectional audio streaming
    Gemini Live API

Key Features:
------------
- Real-time bidirectional audio streaming (16kHz input, 24kHz output)
- WebSocket-based communication
- Medical data extraction from conversations
- Support for interruptions
- CORS-enabled for frontend integration

Endpoints:
---------
- GET  /          : Root endpoint with service info
- GET  /health    : Health check endpoint
- WS   /ws        : WebSocket endpoint for audio streaming

Usage:
------
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Environment Variables:
---------------------
- GEMINI_API_KEY : Required. Your Google AI API key
- HOST           : Server host (default: 0.0.0.0)
- PORT           : Server port (default: 8000)
- LOG_LEVEL      : Logging level (default: INFO)

For more details, see README.md
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from gemini_live import GeminiLiveSession
from config import settings

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Medical Intake Backend",
    description="Voice-First Medical Intake System using Gemini Live API",
    version="2.0.0",
    docs_url="/docs",  # Swagger UI at /docs
    redoc_url="/redoc"  # ReDoc at /redoc
)

# ============================================================================
# CORS MIDDLEWARE
# ============================================================================
# Enable CORS for frontend (Next.js) to connect
# Configured via .env CORS_ORIGINS setting

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# HTTP ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """
    Root endpoint - Returns service information

    Returns:
        dict: Service metadata including version and model info

    Example Response:
        {
            "service": "Medical Intake Backend",
            "version": "2.0.0",
            "status": "running",
            "api": "Gemini Live API",
            "model": "gemini-2.5-flash-native-audio-preview-09-2025"
        }
    """
    return {
        "service": "Medical Intake Backend",
        "version": "2.0.0",
        "status": "running",
        "api": "Gemini Live API",
        "model": "gemini-2.5-flash-native-audio-preview-09-2025"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint - Verify server is running

    Returns:
        dict: Health status

    Example Response:
        {
            "status": "healthy",
            "live_api": "connected"
        }
    """
    return {
        "status": "healthy",
        "live_api": "connected"
    }


# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time bidirectional audio streaming

    This is the main endpoint that handles audio streaming between the
    frontend and Gemini Live API. It creates a GeminiLiveSession that
    manages the entire conversation lifecycle.

    Connection Flow:
    ---------------
    1. Frontend connects to ws://localhost:8000/ws
    2. Server accepts connection
    3. GeminiLiveSession is created and initialized
    4. Gemini Live API connection is established
    5. Bidirectional audio streaming begins
    6. Session runs until disconnection or error

    Message Types FROM Frontend:
    ---------------------------
    1. Audio bytes:
       - Raw PCM audio chunks from microphone
       - Format: 16-bit PCM, 16kHz, mono
       - Sent as WebSocket binary frames

    2. Control messages (JSON):
       - {"type": "interrupt"}    : Interrupt AI mid-response
       - {"type": "end_session"}  : End the conversation

    Message Types TO Frontend:
    -------------------------
    1. Audio bytes:
       - AI audio response
       - Format: 16-bit PCM, 24kHz, mono
       - Sent as WebSocket binary frames

    2. Status messages (JSON):
       {
           "type": "status",
           "state": "ready",
           "message": "Connected to Gemini"
       }

    3. Transcript messages (JSON):
       {
           "type": "transcript",
           "role": "assistant",
           "text": "Hello! What brings you in today?"
       }

    4. Medical data updates (JSON):
       {
           "type": "extracted_data",
           "data": {
               "patient_info": {...},
               "present_illness": {...},
               "medications": [...],
               "allergies": [...],
               ...
           }
       }

    5. Error messages (JSON):
       {
           "type": "error",
           "message": "Error description"
       }

    Error Handling:
    --------------
    - WebSocketDisconnect: Normal disconnection, cleanup happens
    - Other exceptions: Logged, error sent to frontend if possible
    - All cases: Session cleanup is guaranteed via finally block

    Args:
        websocket (WebSocket): The WebSocket connection

    Example Frontend Connection (JavaScript):
        const ws = new WebSocket('ws://localhost:8000/ws');

        // Send audio
        ws.send(audioPCMBytes);

        // Receive messages
        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                // Audio data - play it
                playAudio(event.data);
            } else {
                // JSON message - parse it
                const msg = JSON.parse(event.data);
                if (msg.type === 'transcript') {
                    console.log(msg.role, msg.text);
                } else if (msg.type === 'extracted_data') {
                    updateForm(msg.data);
                }
            }
        };
    """
    # Accept the WebSocket connection
    await websocket.accept()
    logger.info("WebSocket connection accepted from client")

    # Create a new Gemini Live session for this connection
    # Each WebSocket connection gets its own isolated session
    session = GeminiLiveSession(api_key=settings.GEMINI_API_KEY)

    try:
        # Run the session - this blocks until disconnection or error
        # The session handles all bidirectional communication internally
        logger.info("Starting Gemini Live session")
        await session.run(websocket)

    except WebSocketDisconnect:
        # Client disconnected normally (e.g., closed browser tab)
        logger.info("WebSocket disconnected by client")

    except Exception as e:
        # Unexpected error occurred
        logger.error(f"WebSocket error: {e}", exc_info=True)

        # Try to send error message to frontend
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            # WebSocket might already be closed - ignore
            pass

    finally:
        # Always cleanup, regardless of how we exited
        # This ensures Gemini connection is properly closed
        await session.cleanup()
        logger.info("WebSocket connection closed and cleaned up")


# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    """
    Run the server directly with uvicorn

    Usage:
        python3 main.py

    Or use uvicorn directly:
        uvicorn main:app --reload --host 0.0.0.0 --port 8000

    Configuration is loaded from .env file via settings
    """
    logger.info(f"Starting Medical Intake Backend on {settings.HOST}:{settings.PORT}")
    logger.info(f"API Documentation: http://{settings.HOST}:{settings.PORT}/docs")

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,  # Auto-reload on code changes (development only)
        log_level=settings.LOG_LEVEL.lower(),
        loop="asyncio"
    )
