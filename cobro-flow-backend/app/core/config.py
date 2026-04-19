import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings using Pydantic v2 Settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "CobroFlow"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Environment: "local" | "production" | "" (auto-detect)
    # Auto-detection: K_SERVICE present → production, else → local
    APP_ENV: str = ""

    # API
    API_V1_PREFIX: str = "/api/v1"

    # ── Database (Supabase) ──────────────────────────────────────────────────
    # Set DATABASE_URL to the full Supabase connection string.
    # For local development, defaults to a local PostgreSQL instance.
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cobroflow"

    # GCP
    GCP_PROJECT_ID: str = ""
    GCP_LOCATION: str = "us-central1"
    GEMINI_API_KEY: str = ""

    # Vertex AI
    VERTEX_EMBEDDING_MODEL: str = "text-embedding-005"
    VERTEX_FLASH_MODEL: str = "gemini-2.0-flash-001"
    VERTEX_PRO_MODEL: str = "gemini-2.5-pro-preview-06-05"

    # Cloud Tasks
    CLOUD_TASKS_QUEUE_CAMPAIGNS: str = "campaign-evaluation"
    CLOUD_TASKS_QUEUE_MESSAGES: str = "message-sending"
    CLOUD_RUN_SERVICE_URL: str = ""
    CLOUD_TASKS_SERVICE_ACCOUNT: str = ""  # e.g. my-sa@my-project.iam.gserviceaccount.com

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:4200", "http://localhost:3000"]

    # Dev / testing
    AI_MOCK_MODE: bool = False
    TEST_RECIPIENT_PHONE: str = ""  # If set, overrides all WhatsApp/SMS recipients

    # Communication — Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""

    # Communication — SendGrid
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = ""
    SENDGRID_FROM_NAME: str = "CobroFlow"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    s = Settings()
    import re
    masked = re.sub(r"(?<=://)([^:]+):([^@]+)@", r"\1:***@", s.DATABASE_URL)
    print(f"[config] DATABASE_URL={masked}")
    return s


settings = get_settings()
