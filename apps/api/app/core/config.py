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

    # Real Provider Integrations (Stripe)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Real Provider Integrations (Shopify)
    SHOPIFY_SHOP_DOMAIN: str = ""
    SHOPIFY_ADMIN_API_ACCESS_TOKEN: str = ""
    SHOPIFY_API_VERSION: str = "2024-07"

    # Real Provider Integrations (Slack)
    SLACK_WEBHOOK_URL: str = ""
    SLACK_BOT_TOKEN: str = ""
    SLACK_DEFAULT_CHANNEL: str = "#operations-alerts"

    # Real Provider Integrations (Telegram)
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # Real Provider Integrations (SMTP / Email)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "notifications@ubop.internal"

    # AI Integration
    OPENAI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=_resolve_root_env(),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
