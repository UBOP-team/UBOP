from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_root_env() -> str:
    """Find monorepo root directory containing .env or project anchors."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / ".env").exists():
            return str(parent / ".env")
        if (parent / "pnpm-workspace.yaml").exists() or (parent / "docker-compose.yml").exists():
            candidate = parent / ".env"
            return str(candidate)
    return ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "UBOP API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database (Default to async sqlite for dev & tests, can be overridden by POSTGRES_URL in docker)
    DATABASE_URL: str = "sqlite+aiosqlite:///./ubop.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=_resolve_root_env(),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
