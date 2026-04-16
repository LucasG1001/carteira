from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "carteira"
    
    KEYCLOAK_URL: str = "https://gomeslab.tech/keycloak"
    KEYCLOAK_REALM: str = "master"
    KEYCLOAK_CLIENT_ID: str = "carteira"
    ALLOWED_ORIGINS: List[str] = ["*"]

    MARKET_DATA_TIMEZONE: str = "America/Sao_Paulo"
    STOCK_SYNC_START_HOUR: int = 10
    STOCK_SYNC_END_HOUR: int = 17
    STOCK_SYNC_MAX_WORKERS: int = 4
    STOCK_SYNC_SUBMISSION_DELAY_SECONDS: float = 1.0
    STOCK_SYNC_LOG_FILE: str = "app.log"
    STOCK_SYNC_TICKERS_FILE: str = "tickers.txt"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def SYNC_DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def stock_sync_log_path(self) -> Path:
        return Path(self.STOCK_SYNC_LOG_FILE)

    @property
    def stock_sync_tickers_path(self) -> Path:
        return Path(self.STOCK_SYNC_TICKERS_FILE)

    @property
    def jwks_url(self) -> str:
        return f"{self.KEYCLOAK_URL}/realms/{self.KEYCLOAK_REALM}/protocol/openid-connect/certs"

    # Support reading from a .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
