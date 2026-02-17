import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings:
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = ENV == "development"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        # Fail fast if critical config is missing
        raise ValueError("CRITICAL: DATABASE_URL is not set in environment variables.")

    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR: str = os.getenv("MODEL_DIR", os.path.join(BASE_DIR, "data", "models"))
    EMBEDDING_DIR: str = os.getenv("EMBEDDING_DIR", os.path.join(BASE_DIR, "data", "embeddings"))

    # Feature Flags
    ENABLE_FORECASTING: bool = os.getenv("ENABLE_FORECASTING", "true").lower() == "true"
    ENABLE_RISK_MODEL: bool = os.getenv("ENABLE_RISK_MODEL", "true").lower() == "true"

    # Security
    # WARNING: Fallback is for dev only. Production MUST set this env var.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "UNSAFE_DEV_KEY_CHANGE_IMMEDIATELY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    
    # CORS (Comma separated in env, e.g. "http://localhost:3000,https://myapp.com")
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")

settings = Settings()