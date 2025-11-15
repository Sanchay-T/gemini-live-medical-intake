from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # API Keys
    GEMINI_API_KEY: str

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002"
    ]

    # Logging
    LOG_LEVEL: str = "DEBUG"  # Set to DEBUG to see function calling details

    # ================================================================
    # BRANDING & CUSTOMIZATION
    # ================================================================
    # These settings allow you to customize the AI assistant for your clinic

    # Clinic/Hospital name (shown in greetings and system prompts)
    CLINIC_NAME: str = "Medical Center"

    # Department or specialty (e.g., "Primary Care", "Cardiology")
    SPECIALTY: str = "Primary Care"

    # Greeting style: "warm", "professional", or "friendly"
    GREETING_STYLE: str = "warm"

    # Voice model for AI responses
    # Options: "Puck" (default), "Charon", "Kore", "Fenrir", "Aoede"
    VOICE_MODEL: str = "Puck"

    # ================================================================
    # DATA STORAGE
    # ================================================================

    # Directory path for storing conversation JSON files
    CONVERSATION_STORAGE_PATH: str = "./conversations"

    # Enable/disable conversation persistence
    SAVE_CONVERSATIONS: bool = True

    # Session log files (per voice session)
    ENABLE_SESSION_LOGS: bool = True
    SESSION_LOG_PATH: str = "./session_logs"

    class Config:
        env_file = ".env"


settings = Settings()
