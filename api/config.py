import os
from dotenv import load_dotenv
# from pydantic import BaseSettings, Field


load_dotenv(dotenv_path=".env.production")

class Config:
    DB_PARAMS = {
        "host": os.getenv("DB_HOST"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASS"),
        "sslmode": "require"
    }


# class Settings(BaseSettings):
#     SECRET_KEY: str
#     DATABASE_URL: str
#     CLIENT_ID: str
#     PROJECT_ID: str
#     AUTH_URI: str
#     TOKEN_URI: str
#     AUTH_PROVIDER_X509_CERT_URL: str
#     CLIENT_SECRET: str
#     ALGORITHM: str
#     ACCESS_TOKEN_EXPIRE_MINUTES: int
#     REFRESH_TOKEN_EXPIRE_DAYS: int

#     class Config:
#         env_file = ".env.production"

# settings = Settings()