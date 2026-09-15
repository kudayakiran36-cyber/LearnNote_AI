from typing import List
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "LearnNote AI"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite:///./learnnote.db"

    # Groq AI
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_VISION_MODEL: str = "llama-3.2-11b-vision-preview"

    # JWT Authentication
    JWT_SECRET: str = "learnnote_ai_jwt_dev_secret_key_random_string_32_chars_minimum"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Supabase (optional)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "learnnote-files"

    @property
    def cors_origins(self) -> List[str]:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        if self.FRONTEND_URL:
            for url in self.FRONTEND_URL.split(","):
                cleaned = url.strip()
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)
        return origins

    @property
    def normalized_database_url(self) -> str:
        # Render / Supabase compatibility: postgres:// -> postgresql://
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
