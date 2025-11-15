"""
Gemini Live API Session Manager
================================

This module implements the core bidirectional audio streaming logic between
the frontend WebSocket and Google's Gemini Live API.

Architecture Pattern:
--------------------
Based on Google's official AudioLoop pattern from Get_started_LiveAPI.py

    Frontend WebSocket
        ↕ (audio + control messages)
    Async Task Group (5 concurrent tasks)
        ├─ _receive_from_frontend()    → Captures audio from frontend
        ├─ _send_to_gemini()            → Forwards audio to Gemini
        ├─ _receive_from_gemini()       → Receives AI responses
        ├─ _send_to_frontend()          → Sends responses to frontend
        └─ _extract_medical_data()      → Periodically extracts structured data
    Gemini Live API

Key Features:
------------
- Real-time bidirectional audio streaming
- Concurrent async tasks for non-blocking I/O
- Medical data extraction from conversation
- Interruption support
- Proper error handling and cleanup

Audio Specifications:
--------------------
- Input (from frontend):  16kHz, 16-bit PCM, mono
- Output (to frontend):   24kHz, 16-bit PCM, mono
- Streaming: Continuous chunks via WebSocket

For more details, see README.md and official docs at:
https://ai.google.dev/gemini-api/docs/live
"""

import asyncio
import logging
import json
import os
import inspect
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from google import genai
from google.genai import types
from google.genai import live as live_module

from schemas import MedicalIntake
from config import settings

logger = logging.getLogger(__name__)


def _patch_websockets_for_headers() -> None:
    """google-genai expects websockets to accept additional_headers kwarg."""

    target = getattr(live_module, "ws_connect", None)
    if target is None:
        return

    try:
        sig = inspect.signature(target)
    except (TypeError, ValueError):
        return

    if "additional_headers" in sig.parameters:
        return

    def connect_wrapper(*args, additional_headers=None, **kwargs):  # type: ignore[override]
        if additional_headers is not None and "extra_headers" not in kwargs:
            kwargs["extra_headers"] = additional_headers
        return target(*args, **kwargs)

    live_module.ws_connect = connect_wrapper  # type: ignore[assignment]


_patch_websockets_for_headers()

# ============================================================================
# AUDIO CONFIGURATION
# ============================================================================
# These settings match Google's official Live API requirements
# and are optimized for speech recognition and generation

FORMAT = "pcm"                  # PCM (Pulse Code Modulation) audio format
CHANNELS = 1                    # Mono audio (single channel)
SEND_SAMPLE_RATE = 16000       # 16kHz - Standard for speech input
RECEIVE_SAMPLE_RATE = 24000    # 24kHz - Higher quality for AI output

# ============================================================================
# GEMINI MODELS
# ============================================================================

MODEL = "models/gemini-2.5-flash-native-audio-preview-09-2025"            # Live API model for conversation
SUMMARY_MODEL = "models/gemini-2.0-flash-exp"    # Model for data extraction (NOT audio model)


# ============================================================================
# GEMINI LIVE SESSION CLASS
# ============================================================================

class GeminiLiveSession:
    """
    Manages a single conversation session with Gemini Live API

    This class handles the complete lifecycle of a voice conversation:
    1. Connection establishment
    2. Bidirectional audio streaming
    3. Medical data extraction
    4. Session cleanup

    Pattern: Based on Google's official AudioLoop implementation
    Reference: Get_started_LiveAPI.py from Google's Gemini cookbook

    Attributes:
        api_key (str): Google AI API key
        client (genai.Client): Gemini client instance
        session: Active Gemini Live API session
        websocket: Frontend WebSocket connection
        audio_in_queue (asyncio.Queue): Queue for audio FROM Gemini
        audio_out_queue (asyncio.Queue): Queue for audio TO Gemini
        conversation_history (list): Transcript for data extraction
        latest_structured (dict): Most recent medical data extraction

    Usage:
        session = GeminiLiveSession(api_key="your-api-key")
        await session.run(websocket)  # Blocks until disconnection
        await session.cleanup()       # Always call in finally block
    """

    def __init__(self, api_key: str):
        """
        Initialize a new Gemini Live session

        Args:
            api_key (str): Your Google AI API key

        Note:
            This only initializes the session object. The actual connection
            to Gemini is established in run() method.
        """
        self.api_key = api_key

        # Initialize Gemini client
        # v1beta API version required for Live API features
        self.client = genai.Client(
            http_options={"api_version": "v1beta"},
            api_key=api_key
        )

        # Queues for bidirectional audio streaming
        # These are initialized in run() when the session starts
        self.audio_in_queue = None   # From Gemini → to frontend (asyncio.Queue)
        self.audio_out_queue = None  # From frontend → to Gemini (asyncio.Queue)

        # Session state
        self.session = None          # Gemini Live API session object
        self.websocket = None        # Frontend WebSocket connection

        # Conversation tracking for medical data extraction
        self.conversation_history: List[Dict[str, str]] = []
        self.latest_structured: Optional[Dict[str, Any]] = None

        # Turn accumulators for streaming text chunks
        self.current_assistant_turn = ""  # Accumulate AI response chunks
        self.current_patient_turn = ""    # Accumulate patient speech chunks

        # Session logging
        self.session_log_file: Optional[str] = None
        self.session_id: str = uuid.uuid4().hex

    # ========================================================================
    # MAIN SESSION LIFECYCLE
    # ========================================================================

    async def run(self, websocket):
        """
        Main session loop - manages bidirectional audio streaming

        This is the primary method that handles the entire conversation lifecycle.
        It creates an async task group where multiple tasks run concurrently:

        Task Flow:
        ---------
        1. _receive_from_frontend → audio_out_queue → _send_to_gemini
        2. _receive_from_gemini → audio_in_queue → _send_to_frontend
        3. _extract_medical_data_periodically → structured data updates

        Args:
            websocket: FastAPI WebSocket connection to frontend

        Raises:
            asyncio.CancelledError: When session is cancelled
            Exception: Any other error during session

        Note:
            This method blocks until the session ends. Always call cleanup()
            in a finally block after run().
        """
        self.websocket = websocket
        self._init_session_log()
        self._log_event("session_started", voice=settings.VOICE_MODEL)

        # ====================================================================
        # GEMINI CONFIGURATION
        # ====================================================================
        # Configure the Gemini Live API session with our requirements

        config = types.LiveConnectConfig(
            # Request audio responses (not text)
            response_modalities=["AUDIO"],

            # 🔑 CRITICAL: Enable transcription for medical data extraction!
            # This gives us TEXT transcripts alongside AUDIO
            output_audio_transcription=types.AudioTranscriptionConfig(),  # Gemini's speech → text
            input_audio_transcription=types.AudioTranscriptionConfig(),   # Patient's speech → text

            # Voice configuration (from settings)
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=settings.VOICE_MODEL
                        # Configured in .env: Puck, Charon, Kore, Fenrir, or Aoede
                    )
                )
            ),

            # System instruction - defines AI behavior
            system_instruction=types.Content(
                parts=[types.Part(text=self._get_system_instruction())]
            ),

            # ================================================================
            # FUNCTION CALLING - Intake Completion Signal
            # ================================================================
            # AI calls this function when medical intake is complete
            tools=[
                types.Tool(function_declarations=[
                    types.FunctionDeclaration(
                        name="complete_intake",
                        description=(
                            "Call this function when you have successfully collected ALL required "
                            "medical information AND provided a verbal summary to the patient "
                            "for confirmation. Only call after patient confirms the summary is correct."
                        )
                    )
                ])
            ]
        )

        logger.info("Connecting to Gemini Live API...")

        try:
            # ================================================================
            # CONNECT TO GEMINI AND RUN TASK GROUP
            # ================================================================
            # Use async context managers for proper resource management
            # NOTE: Using asyncio.gather() for Python 3.9 compatibility
            # (TaskGroup was added in Python 3.11)

            async with self.client.aio.live.connect(model=MODEL, config=config) as session:
                # Store session reference
                self.session = session
                self._log_event("gemini_connected")

                # Initialize queues for audio streaming
                # audio_in_queue: Unlimited size (audio from Gemini)
                # audio_out_queue: Max 5 items (backpressure for frontend)
                self.audio_in_queue = asyncio.Queue()
                self.audio_out_queue = asyncio.Queue(maxsize=5)

                logger.info("Connected to Gemini Live API")

                # Send ready status to frontend
                await websocket.send_json({
                    "type": "status",
                    "state": "ready",
                    "message": "Connected to Gemini"
                })
                self._log_event("status", state="ready")

                # ============================================================
                # CREATE CONCURRENT ASYNC TASKS
                # ============================================================
                # All tasks run in parallel for true bidirectional streaming

                # Create all tasks
                # NOTE: Removed periodic extraction task - now uses function calling
                tasks = [
                    # Task 1: Receive audio from frontend WebSocket
                    asyncio.create_task(self._receive_from_frontend()),

                    # Task 2: Send audio to Gemini Live API
                    asyncio.create_task(self._send_to_gemini()),

                    # Task 3: Receive responses from Gemini
                    asyncio.create_task(self._receive_from_gemini()),

                    # Task 4: Send responses to frontend WebSocket
                    asyncio.create_task(self._send_to_frontend()),
                ]

                # Run all tasks concurrently
                # return_exceptions=True prevents one task's exception from canceling others
                await asyncio.gather(*tasks, return_exceptions=True)

        except asyncio.CancelledError:
            logger.info("Session cancelled")
            self._log_event("session_cancelled")
        except Exception as e:
            logger.error(f"Session error: {e}", exc_info=True)
            self._log_event("session_error", error=str(e))
            try:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
            except:
                pass

    # ========================================================================
    # ASYNC TASKS (Run concurrently in TaskGroup)
    # ========================================================================

    async def _receive_from_frontend(self):
        """
        Task 1: Receive audio and control messages from frontend WebSocket

        This task continuously listens for messages from the frontend and
        queues audio for sending to Gemini.

        Message Handling:
        ----------------
        - Binary messages (audio): Queued to audio_out_queue
        - JSON messages: Parsed for control commands

        Control Commands:
        ----------------
        - {"type": "interrupt"}: Interrupt AI mid-response
        - {"type": "end_session"}: End the conversation

        Raises:
            asyncio.CancelledError: When task is cancelled (normal)
            Exception: Any error during message processing
        """
        logger.info("Started receiving from frontend")
        try:
            while True:
                # Receive message from frontend (blocks until message arrives)
                message = await self.websocket.receive()

                # ============================================================
                # HANDLE AUDIO DATA
                # ============================================================
                if "bytes" in message:
                    # Binary message = audio chunk from frontend microphone
                    audio_chunk = message["bytes"]
                    logger.debug(f"Received {len(audio_chunk)} bytes from frontend")

                    # Queue audio for sending to Gemini
                    # Format: Dict with 'data' and 'mime_type' fields
                    await self.audio_out_queue.put({
                        "data": audio_chunk,
                        "mime_type": "audio/pcm"
                    })

                # ============================================================
                # HANDLE CONTROL MESSAGES
                # ============================================================
                elif "text" in message:
                    # Text message = JSON control command
                    import json
                    try:
                        data = json.loads(message["text"])
                        msg_type = data.get("type")

                        if msg_type == "interrupt":
                            logger.info("Interrupt requested by frontend")
                            await self._interrupt()
                            await self._signal_turn_end("legacy_interrupt")

                        elif msg_type == "end_session":
                            logger.info("End session requested by frontend")
                            self._log_event("end_session_request")
                            raise asyncio.CancelledError("User ended session")

                        elif msg_type == "control":
                            action = data.get("action")
                            self._log_event("control", action=action)
                            if action == "start":
                                logger.info("Frontend mic start")
                            elif action == "stop":
                                logger.info("Frontend mic stop - signaling end_of_turn")
                                await self._signal_turn_end("mic_stop")
                            elif action == "interrupt":
                                logger.info("Frontend issued interrupt control")
                                await self._interrupt()
                                await self._signal_turn_end("control_interrupt")

                    except json.JSONDecodeError:
                        logger.warning("Invalid JSON from frontend")

        except asyncio.CancelledError:
            logger.info("Frontend receiver stopped")
            raise
        except Exception as e:
            logger.error(f"Error receiving from frontend: {e}", exc_info=True)
            raise

    async def _send_to_gemini(self):
        """
        Task 2: Send audio from queue to Gemini Live API

        This task continuously pulls audio from audio_out_queue and
        forwards it to Gemini Live API.

        Pattern:
        -------
        1. Get audio from queue (blocks if queue is empty)
        2. Send to Gemini via session.send()
        3. Repeat

        Note:
            Audio is sent as continuous stream (not turn-based)
            end_of_turn is NOT set here - Gemini detects pauses automatically
        """
        logger.info("Started sending to Gemini")
        try:
            while True:
                # Get next audio chunk from queue
                # This blocks if queue is empty (waiting for frontend audio)
                audio_data = await self.audio_out_queue.get()

                # Send to Gemini Live API
                # session.send() is from official Google SDK
                await self.session.send(input=audio_data)

                logger.debug(f"Sent {len(audio_data['data'])} bytes to Gemini")

        except asyncio.CancelledError:
            logger.info("Gemini sender stopped")
            raise
        except Exception as e:
            logger.error(f"Error sending to Gemini: {e}", exc_info=True)
            raise

    async def _receive_from_gemini(self):
        """
        Task 3: Receive responses from Gemini Live API

        This task continuously receives responses from Gemini and queues
        them for sending to the frontend.

        Response Types:
        --------------
        - response.data: Audio bytes from Gemini's speech
        - response.text: Text transcript of Gemini's speech
        - response.server_content.input_transcription: Patient's speech as text
        - response.server_content.output_transcription: Gemini's speech as text
        - response.turn_complete: Indicates end of AI's turn

        Flow:
        ----
        1. Listen for responses from Gemini
        2. Queue audio for frontend playback
        3. Track transcripts for medical data extraction
        4. Signal turn completion
        """
        logger.info("Started receiving from Gemini")
        try:
            while True:
                # Receive one turn from Gemini
                # A "turn" is a complete response from the AI
                turn = self.session.receive()

                # Iterate through all responses in this turn
                async for response in turn:

                    # ========================================================
                    # HANDLE PATIENT INPUT TRANSCRIPTION
                    # ========================================================
                    # This is the patient's speech transcribed to text
                    # NOTE: input_transcription is an OBJECT with .text field (not a list!)
                    # It streams in small chunks just like output_transcription
                    if hasattr(response, 'server_content') and response.server_content:
                        if hasattr(response.server_content, 'input_transcription'):
                            input_trans = response.server_content.input_transcription
                            if input_trans:  # Check it's not None
                                user_text = getattr(input_trans, 'text', '')
                                if user_text:
                                    logger.debug(f"Patient transcription chunk: {user_text}")
                                    # Accumulate for this turn (don't save yet)
                                    self.current_patient_turn += user_text
                                    # Send to frontend
                                    await self.audio_in_queue.put({
                                        "type": "text",
                                        "role": "patient",
                                        "text": user_text
                                    })

                    # ========================================================
                    # HANDLE AUDIO DATA
                    # ========================================================
                    if data := response.data:
                        # Audio bytes from Gemini's speech
                        logger.debug(f"Received {len(data)} bytes from Gemini")

                        # Queue for frontend playback
                        await self.audio_in_queue.put({
                            "type": "audio",
                            "data": data
                        })

                    # ========================================================
                    # HANDLE GEMINI TEXT TRANSCRIPT
                    # ========================================================
                    if text := response.text:
                        # Text transcript of what Gemini is saying
                        logger.info(f"Gemini: {text[:100]}...")

                        # Accumulate for this turn (don't save yet)
                        self.current_assistant_turn += text

                        # Queue for frontend display
                        await self.audio_in_queue.put({
                            "type": "text",
                            "role": "assistant",
                            "text": text
                        })

                    # ========================================================
                    # HANDLE GEMINI OUTPUT TRANSCRIPTION (Alternative)
                    # ========================================================
                    # Some models return transcription in output_transcription
                    # NOTE: output_transcription is an OBJECT with .text field (not a list!)
                    # It streams in small chunks like "I a", "m s", "orr", "y t"...
                    if hasattr(response, 'server_content') and response.server_content:
                        if hasattr(response.server_content, 'output_transcription'):
                            output_trans = response.server_content.output_transcription
                            if output_trans:  # Check it's not None
                                ai_text = getattr(output_trans, 'text', '')
                                if ai_text:
                                    logger.debug(f"Gemini transcription chunk: {ai_text}")
                                    # Accumulate for this turn (don't save yet)
                                    self.current_assistant_turn += ai_text
                                    # Send to frontend
                                    await self.audio_in_queue.put({
                                        "type": "text",
                                        "role": "assistant",
                                        "text": ai_text
                                    })

                    # ========================================================
                    # HANDLE FUNCTION CALLS - CORRECT IMPLEMENTATION
                    # ========================================================
                    # Function calls are at response.tool_call (top-level field)
                    # NOT inside server_content.model_turn.parts!
                    if response.tool_call:
                        logger.info(f"🔍 TOOL CALL DETECTED - type: {type(response.tool_call)}")
                        logger.info(f"Tool call content: {response.tool_call}")

                        if response.tool_call.function_calls:
                            for func_call in response.tool_call.function_calls:
                                logger.info(f"🎯 FUNCTION CALL: {func_call.name}")
                                logger.info(f"Function ID: {func_call.id}")
                                logger.info(f"Function args: {func_call.args if hasattr(func_call, 'args') else 'none'}")

                                if func_call.name == "complete_intake":
                                    logger.info("✅ complete_intake() called - triggering final extraction")
                                    self._log_event("function_call", name="complete_intake")
                                    # Trigger final data extraction
                                    await self.audio_in_queue.put({
                                        "type": "function_call",
                                        "function_name": "complete_intake"
                                    })

                    # ========================================================
                    # HANDLE TURN COMPLETE
                    # ========================================================
                    # Check if turn is complete (if attribute exists)
                    if hasattr(response, 'server_content') and response.server_content:
                        if hasattr(response.server_content, 'turn_complete') and response.server_content.turn_complete:
                            # AI finished speaking - finalize accumulated turns
                            logger.debug("Turn complete")

                            # Save accumulated turns to conversation history
                            self._finalize_turn()

                            await self.audio_in_queue.put({
                                "type": "turn_complete"
                            })

        except asyncio.CancelledError:
            logger.info("Gemini receiver stopped")
            raise
        except Exception as e:
            logger.error(f"Error receiving from Gemini: {e}", exc_info=True)
            raise

    async def _send_to_frontend(self):
        """
        Task 4: Send responses from queue to frontend WebSocket

        This task pulls responses from audio_in_queue and sends them
        to the frontend WebSocket.

        Message Types Sent:
        ------------------
        - Binary: Audio bytes for playback
        - JSON: Transcripts, status updates, medical data
        """
        logger.info("Started sending to frontend")
        try:
            while True:
                # Get next response from queue
                # This blocks if queue is empty (waiting for Gemini response)
                response = await self.audio_in_queue.get()

                # ============================================================
                # SEND AUDIO TO FRONTEND
                # ============================================================
                if response["type"] == "audio":
                    # Send audio bytes as binary WebSocket frame
                    await self.websocket.send_bytes(response["data"])
                    logger.debug(f"Sent {len(response['data'])} bytes to frontend")

                # ============================================================
                # SEND TRANSCRIPT TO FRONTEND
                # ============================================================
                elif response["type"] == "text":
                    # Send transcript as JSON
                    await self.websocket.send_json({
                        "type": "transcript",
                        "role": response["role"],
                        "text": response["text"]
                    })

                # ============================================================
                # HANDLE FUNCTION CALL - Intake Complete
                # ============================================================
                elif response["type"] == "function_call" and response["function_name"] == "complete_intake":
                    logger.info("📊 [FUNCTION_CALL] Processing complete_intake() - final data extraction")
                    self._log_event("function_call_processing", name="complete_intake")

                    # Generate final structured data from complete conversation
                    structured = await self._generate_structured_data()

                    logger.info(f"🔎 [FUNCTION_CALL] Extraction returned: {type(structured)} - {bool(structured)}")
                    if structured:
                        logger.info(f"📦 [FUNCTION_CALL] Structured data keys: {list(structured.keys())}")
                    else:
                        logger.error(f"❌ [FUNCTION_CALL] Extraction returned empty/None! Cannot send data to frontend.")

                    if structured:
                        # Send extracted medical data to frontend
                        await self.websocket.send_json({
                            "type": "extracted_data",
                            "data": structured
                        })
                        logger.info("✅ [FUNCTION_CALL] Extracted data sent to frontend")
                    else:
                        logger.warning("⚠️ [FUNCTION_CALL] Skipping extracted_data message - no data to send")

                    # Save conversation to file if enabled
                    if settings.SAVE_CONVERSATIONS:
                        logger.info(f"💾 [FUNCTION_CALL] Saving conversation to file...")
                        await self._save_conversation_to_file(structured)

                    # Send intake_complete signal to trigger auto-navigation
                    await self.websocket.send_json({
                        "type": "intake_complete",
                        "message": "Medical intake completed successfully"
                    })
                    logger.info("🏁 [FUNCTION_CALL] Intake complete signal sent - frontend will auto-navigate")

                # ============================================================
                # HANDLE TURN COMPLETE
                # ============================================================
                elif response["type"] == "turn_complete":
                    # AI finished speaking - send turn_complete to frontend
                    await self.websocket.send_json({
                        "type": "turn_complete"
                    })
                    self._log_event("turn_complete")

                    # FALLBACK: If conversation has enough data, trigger extraction
                    # (In case function calling doesn't work as expected)
                    if len(self.conversation_history) >= 10 and not self.latest_structured:
                        logger.info("⚡ FALLBACK: Conversation has sufficient data, triggering extraction")
                        structured = await self._generate_structured_data()

                        if structured and structured.get('chief_complaint'):
                            # Send extracted data
                            await self.websocket.send_json({
                                "type": "extracted_data",
                                "data": structured
                            })
                            logger.info("✅ Fallback extraction successful")

                            # Save conversation if enabled
                            if settings.SAVE_CONVERSATIONS:
                                await self._save_conversation_to_file(structured)

                            # Don't auto-navigate yet - let user manually proceed
                            # (We can add auto-navigation later once function calling works)

        except asyncio.CancelledError:
            logger.info("Frontend sender stopped")
            raise
        except Exception as e:
            logger.error(f"Error sending to frontend: {e}", exc_info=True)
            raise

    async def _extract_medical_data_periodically(self):
        """
        Task 5: Periodically extract structured medical data

        This task runs in the background and extracts structured medical
        data from the conversation every 10 seconds.

        Why Periodic?
        ------------
        - Provides real-time form updates to frontend
        - Doesn't wait for conversation to end
        - Useful for long conversations

        Frequency: Every 10 seconds (if enough conversation history)
        """
        logger.info("Started periodic data extraction")
        try:
            while True:
                # Wait 10 seconds between extractions
                await asyncio.sleep(10)

                # Only extract if we have enough conversation
                if len(self.conversation_history) >= 4:
                    structured = await self._generate_structured_data()

                    if structured:
                        # Send to frontend
                        await self.websocket.send_json({
                            "type": "extracted_data",
                            "data": structured
                        })
                        logger.info("Sent periodic medical data update")

        except asyncio.CancelledError:
            logger.info("Periodic extractor stopped")
            raise
        except Exception as e:
            logger.error(f"Error in periodic extraction: {e}", exc_info=True)

    # ========================================================================
    # HELPER METHODS
    # ========================================================================

    def _init_session_log(self) -> None:
        if not settings.ENABLE_SESSION_LOGS:
            return
        try:
            os.makedirs(settings.SESSION_LOG_PATH, exist_ok=True)
            timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
            filename = f"session_{timestamp}_{self.session_id}.log"
            self.session_log_file = os.path.join(settings.SESSION_LOG_PATH, filename)
            metadata = {
                "session_id": self.session_id,
                "started_at": datetime.utcnow().isoformat() + "Z",
                "voice": settings.VOICE_MODEL,
            }
            with open(self.session_log_file, 'w', encoding='utf-8') as f:
                f.write(json.dumps(metadata) + "\n")
        except Exception as exc:  # pragma: no cover
            logger.warning(f"Unable to initialize session log: {exc}")
            self.session_log_file = None

    def _log_event(self, event: str, **data) -> None:
        if not self.session_log_file:
            return
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": event,
            "data": data,
        }
        try:
            with open(self.session_log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as exc:  # pragma: no cover
            logger.warning(f"Unable to write session log entry: {exc}")

    async def _interrupt(self):
        """
        Interrupt current AI response

        Pattern from official example:
        - Clear audio output queue (stop playing buffered audio)
        - Gemini will detect interruption and stop generating

        Use Case:
        --------
        User starts speaking while AI is still talking
        """
        if self.session:
            # Clear all queued audio to stop playback immediately
            while not self.audio_in_queue.empty():
                try:
                    self.audio_in_queue.get_nowait()
                except asyncio.QueueEmpty:
                    break

            logger.info("Interrupted AI response")
            self._log_event("interrupt_triggered")

    async def _signal_turn_end(self, reason: str = "manual"):
        """Explicitly tell Gemini the speaker finished their turn."""
        if not self.session:
            return
        try:
            await self.session.send(end_of_turn=True)
            self._log_event("turn_end_signal", reason=reason)
        except Exception as exc:  # pragma: no cover
            logger.warning(f"Failed to signal end_of_turn: {exc}")

    def _finalize_turn(self):
        """
        Finalize accumulated text chunks into conversation history

        Called on turn_complete to save complete sentences instead of fragments.
        Combines all streaming chunks from current turn into single entries.
        """
        # Save assistant's complete turn
        if self.current_assistant_turn.strip():
            logger.info(f"📝 [TURN_FINALIZE] Saving assistant turn: '{self.current_assistant_turn[:100]}{'...' if len(self.current_assistant_turn) > 100 else ''}'")
            self.conversation_history.append({
                "role": "assistant",
                "text": self.current_assistant_turn.strip()
            })
            self._log_event("transcript", role="assistant", text=self.current_assistant_turn.strip())
            self.current_assistant_turn = ""  # Reset accumulator

        # Save patient's complete turn
        if self.current_patient_turn.strip():
            logger.info(f"📝 [TURN_FINALIZE] Saving patient turn: '{self.current_patient_turn[:100]}{'...' if len(self.current_patient_turn) > 100 else ''}'")
            self.conversation_history.append({
                "role": "patient",
                "text": self.current_patient_turn.strip()
            })
            self._log_event("transcript", role="patient", text=self.current_patient_turn.strip())
            self.current_patient_turn = ""  # Reset accumulator

        # Keep last 40 turns only
        if len(self.conversation_history) > 40:
            self.conversation_history = self.conversation_history[-40:]

        logger.info(f"📚 [TURN_FINALIZE] Total conversation turns: {len(self.conversation_history)}")

    def _append_history(self, role: str, text: str):
        """
        Track conversation history for medical data extraction

        Args:
            role (str): "assistant" or "patient"
            text (str): What was said

        Note:
            Keeps only last 40 turns to prevent memory issues
        """
        text = text.strip()
        if not text:
            return

        logger.info(f"📝 [CONVERSATION] Appending to history - role={role}, text_len={len(text)}, text='{text[:50]}{'...' if len(text) > 50 else ''}'")

        self.conversation_history.append({
            "role": role,
            "text": text
        })

        logger.info(f"📚 [CONVERSATION] Total conversation entries: {len(self.conversation_history)}")

        # Keep last 40 turns only
        if len(self.conversation_history) > 40:
            self.conversation_history = self.conversation_history[-40:]

    async def _generate_structured_data(self) -> Optional[Dict[str, Any]]:
        """
        Extract structured medical data from conversation history

        This uses a secondary Gemini model call to analyze the conversation
        and extract structured medical intake information.

        Process:
        -------
        1. Build transcript from conversation_history
        2. Send to Gemini with schema definition
        3. Parse response as MedicalIntake object
        4. Return as dictionary

        Returns:
            Optional[Dict]: Structured medical data, or None if extraction fails

        Note:
            This is a separate API call (not part of Live API session)
            Falls back to latest cached data if extraction fails
        """
        logger.info(f"🔍 [EXTRACTION] Starting data extraction from {len(self.conversation_history)} conversation entries")

        if len(self.conversation_history) < 2:
            logger.warning(f"⚠️ [EXTRACTION] Not enough conversation data ({len(self.conversation_history)} entries)")
            self._log_event("extraction_skipped", reason="insufficient_history", entries=len(self.conversation_history))
            return self.latest_structured

        # Build transcript text
        transcript_text = "\n".join(
            f"{turn['role'].capitalize()}: {turn['text']}"
            for turn in self.conversation_history
        )

        logger.info(f"📝 [EXTRACTION] Built transcript ({len(transcript_text)} chars):")
        logger.info(f"--- TRANSCRIPT START ---\n{transcript_text[:500]}{'...' if len(transcript_text) > 500 else ''}\n--- TRANSCRIPT END ---")

        # Prompt for data extraction - MATCHES FRONTEND EXACTLY
        prompt = (
            "You are a medical data extraction assistant. "
            "Extract structured medical intake information from this conversation. "
            "Return ONLY valid JSON with EXACTLY these fields:\n"
            "{\n"
            '  "chief_complaint": "main health issue",\n'
            '  "current_medications": [{"name": "med name", "dose": "dosage", "frequency": "how often"}],\n'
            '  "allergies": [{"allergen": "substance", "reaction": ["symptom1", "symptom2"], "severity": "mild"}],\n'
            '  "past_medical_history": {"conditions": ["condition1"], "surgeries": ["surgery1"], "hospitalizations": ["hospital1"]},\n'
            '  "social_history": {"smoking": "status", "alcohol": "status", "occupation": "job"}\n'
            "}\n"
            "IMPORTANT:\n"
            '- Use "current_medications" NOT "medications"\n'
            '- Use "past_medical_history" NOT "medical_history"\n'
            '- allergies.reaction must be ARRAY of strings like ["hives", "rash"], NOT single string\n'
            '- allergies.severity must be one of: "mild", "moderate", "serious", "life-threatening"\n'
            "- If information not mentioned, use empty arrays [] or empty strings\n\n"
            f"Conversation:\n{transcript_text}"
        )

        try:
            logger.info(f"🤖 [EXTRACTION] Calling Gemini model: {SUMMARY_MODEL}")
            self._log_event("extraction_started", entries=len(self.conversation_history))

            # Call Gemini WITHOUT schema constraint - just ask for JSON
            response = await self.client.aio.models.generate_content(
                model=SUMMARY_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                    # NO response_schema - let it return whatever JSON it wants
                )
            )

            logger.info(f"✅ [EXTRACTION] Received response from model: {response.text[:200]}...")

            # Parse as raw JSON - NO PYDANTIC VALIDATION
            import json
            self.latest_structured = json.loads(response.text)

            logger.info(f"✅ [EXTRACTION] Successfully extracted data:")
            logger.info(f"   - Chief Complaint: {self.latest_structured.get('chief_complaint', 'N/A')}")
            logger.info(f"   - Current Medications: {len(self.latest_structured.get('current_medications', []))} items")
            logger.info(f"   - Allergies: {len(self.latest_structured.get('allergies', []))} items")
            past_med = self.latest_structured.get('past_medical_history', {})
            logger.info(f"   - Past Medical History: {len(past_med.get('conditions', []))} conditions, {len(past_med.get('surgeries', []))} surgeries")
            logger.info(f"   - Full data: {json.dumps(self.latest_structured, indent=2)}")

            self._log_event("extraction_success", keys=list(self.latest_structured.keys()))
            return self.latest_structured

        except Exception as e:
            logger.error(f"❌ [EXTRACTION] FAILED: {type(e).__name__}: {str(e)}", exc_info=True)
            self._log_event("extraction_error", error=str(e))
            logger.error(f"💾 [EXTRACTION] Falling back to cached data: {self.latest_structured}")
            # Return last successful extraction
            return self.latest_structured

    async def _save_conversation_to_file(self, extracted_data: Optional[Dict[str, Any]] = None) -> None:
        """
        Save conversation and extracted data to JSON file for compliance/audit

        File Format:
        -----------
        {
            "timestamp": "2025-11-13T22:30:45.123Z",
            "clinic": "Medical Center - Primary Care",
            "voice_model": "Puck",
            "conversation": [
                {"role": "assistant", "text": "..."},
                {"role": "patient", "text": "..."}
            ],
            "extracted_data": {...},
            "session_id": "unique-session-id"
        }

        File Naming:
        -----------
        intake_{timestamp}_{session_id}.json

        Args:
            extracted_data: Structured medical data (optional)
        """
        try:
            # Create storage directory if it doesn't exist
            storage_path = settings.CONVERSATION_STORAGE_PATH
            os.makedirs(storage_path, exist_ok=True)

            # Generate timestamp and session ID
            timestamp = datetime.utcnow().isoformat() + "Z"
            session_id = f"{int(datetime.utcnow().timestamp())}"

            # Build file data
            file_data = {
                "timestamp": timestamp,
                "clinic": f"{settings.CLINIC_NAME} - {settings.SPECIALTY}",
                "voice_model": settings.VOICE_MODEL,
                "greeting_style": settings.GREETING_STYLE,
                "conversation": self.conversation_history,
                "extracted_data": extracted_data or {},
                "session_id": session_id
            }

            # Generate filename
            filename = f"intake_{timestamp.replace(':', '-').replace('.', '-')}_{session_id}.json"
            filepath = os.path.join(storage_path, filename)

            # Write to file
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(file_data, f, indent=2, ensure_ascii=False)

            logger.info(f"💾 Conversation saved to: {filepath}")

        except Exception as e:
            logger.error(f"Failed to save conversation to file: {e}", exc_info=True)
            # Don't raise - file persistence shouldn't break the flow

    def _get_system_instruction(self) -> str:
        """
        Get the system instruction for Gemini

        This defines the AI's behavior, personality, and conversation structure.
        Uses configuration variables for branding and tone.

        Returns:
            str: System instruction text with branding
        """
        # Determine greeting tone based on style
        greeting_tones = {
            "warm": "Be warm, empathetic, and caring in your tone",
            "professional": "Maintain a professional and clinical tone throughout",
            "friendly": "Be friendly, approachable, and conversational"
        }
        tone = greeting_tones.get(settings.GREETING_STYLE, greeting_tones["warm"])

        return f"""You are an intelligent front-desk intake coordinator for {settings.CLINIC_NAME} - {settings.SPECIALTY} Department.

Primary Mission:
- Move the queue quickly by collecting accurate info that busy doctors need.
- Sound like a professional receptionist: efficient, courteous, but never a clinician.
- NEVER give medical advice, diagnoses, or treatment suggestions. Redirect such questions back to the doctor's visit.

CONVERSATION STYLE:
- {tone}
- Keep questions short and clear; focus on one item at a time.
- Politely cut off long stories and steer back to the checklist.
- Confirm key facts (especially allergies) but avoid chit-chat.

REQUIRED INFORMATION (in order):
1. Chief complaint + goal of visit (why they're here today).
2. Symptom basics: location, duration, severity (just headline facts for doctor).
3. Current medications (names, doses, frequency) or clearly note "none".
4. Allergies (substance + reaction + severity). Double-check accuracy.
5. Past medical/surgical history or hospitalizations relevant to today.
6. Social snapshot: smoking, alcohol, occupation, exercise if relevant.

COMPLETION PROTOCOL:
1. Give a concise receptionist-style summary (max 3 sentences) that doctors can scan fast.
2. Ask the patient to confirm it is correct and if anything essential is missing.
3. Once the patient confirms, immediately call complete_intake(). Do not delay or ask new questions afterward.
4. If the patient asks for medical guidance, respond: "I'm here to capture details for your doctor; they’ll review and advise you shortly."

EXAMPLE SUMMARY:
"Here’s what I’ll share with your doctor: follow-up visit for [complaint], pain level [severity] for [duration], meds: [list or 'none'], allergies: [list or 'none'], history highlights: [key items]. Does that look right?"

Wait for a "yes" or equivalent, then say "Great, I’ll get this ready for the doctor now." and call complete_intake(). Keep everything brisk and focused on prepping the doctor."""

    async def cleanup(self):
        """
        Cleanup session resources

        This should ALWAYS be called in a finally block after run()

        Cleanup Actions:
        ---------------
        - Close Gemini session
        - Clear queues
        - Reset state

        Usage:
            try:
                await session.run(websocket)
            finally:
                await session.cleanup()
        """
        logger.info("Cleaning up session")
        self._log_event("session_cleanup")
        if self.session:
            self.session = None
        # Queues will be garbage collected automatically
