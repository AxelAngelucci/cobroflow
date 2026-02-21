from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field
from functools import lru_cache
from urllib.parse import quote_plus


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

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Database - PostgreSQL on GCP
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "postgres"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""

    # GCP
    GCP_PROJECT_ID: str = ""
    GCP_LOCATION: str = "us-central1"

    # Vertex AI
    VERTEX_VECTOR_SEARCH_INDEX_ID: str = ""
    VERTEX_VECTOR_SEARCH_ENDPOINT_ID: str = ""
    VERTEX_EMBEDDING_MODEL: str = "text-embedding-005"
    VERTEX_FLASH_MODEL: str = "gemini-2.0-flash-001"
    VERTEX_PRO_MODEL: str = "gemini-2.5-pro-preview-06-05"

    # When true, uses PostgreSQL + numpy for vector search instead of Vertex AI
    # Vector Search (saves ~$200/mo). Embeddings and Gemini still use Vertex AI.
    VERTEX_LOCAL_VECTOR_STORE: bool = True

    # Cloud Tasks
    CLOUD_TASKS_QUEUE_CAMPAIGNS: str = "campaign-evaluation"
    CLOUD_TASKS_QUEUE_MESSAGES: str = "message-sending"
    CLOUD_RUN_SERVICE_URL: str = ""

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Build database URL.

        Supports two modes:
        - TCP: DB_HOST is an IP/hostname (e.g. "34.61.165.82" or "localhost")
        - Unix socket: DB_HOST starts with "/" (e.g. "/cloudsql/project:region:instance")
          Used by Cloud SQL Auth Proxy sidecar in Cloud Run.
        """
        encoded_password = quote_plus(self.DB_PASSWORD)
        if self.DB_HOST.startswith("/"):
            # Cloud SQL Auth Proxy Unix socket
            return (
                f"postgresql://{self.DB_USER}:{encoded_password}"
                f"@/{self.DB_NAME}?host={self.DB_HOST}"
            )
        return (
            f"postgresql://{self.DB_USER}:{encoded_password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:4200", "http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
