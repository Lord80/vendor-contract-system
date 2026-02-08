import os
from dotenv import load_dotenv

load_dotenv()

ENV = os.getenv("ENV", "development")
DEBUG = ENV == "development"

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in environment variables")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_DIR = os.getenv(
    "MODEL_DIR",
    os.path.join(BASE_DIR, "data", "models")
)

EMBEDDING_DIR = os.getenv(
    "EMBEDDING_DIR",
    os.path.join(BASE_DIR, "data", "embeddings")
)

ENABLE_FORECASTING = os.getenv("ENABLE_FORECASTING", "true").lower() == "true"
ENABLE_RISK_MODEL = os.getenv("ENABLE_RISK_MODEL", "true").lower() == "true"
