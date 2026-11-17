import os
import tempfile
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

_default_repo_path = "/tmp/reposense" if os.name != "nt" else os.path.join(tempfile.gettempdir(), "reposense")


class Settings(BaseSettings):
    # API Keys
    GEMINI_API_KEY: Optional[str] = None

    # Repository settings
    REPO_BASE_PATH: str = _default_repo_path
    MAX_REPO_SIZE_MB: int = 500
    CLONE_TIMEOUT_SECONDS: int = 60
    CLEANUP_INTERVAL_MINUTES: int = 60

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

# Ensure repo base path exists
Path(settings.REPO_BASE_PATH).mkdir(parents=True, exist_ok=True)