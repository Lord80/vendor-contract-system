from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL, DEBUG

# 1. Create Engine
engine = create_engine(
    DATABASE_URL,
    echo=DEBUG,
    pool_pre_ping=True
)

# 2. Create Session Factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

# 3. Create Base Model
Base = declarative_base()

# 4. Dependency Injection (The fix you requested)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()