from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator
from app.config import settings

# 1. Create Engine
# pool_pre_ping: Checks if connection is alive before using it
# pool_recycle: Recycles connections older than 1 hour to prevent timeout drops
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600,   # <-- CRITICAL FIX: Prevents stale connections overnight
    pool_size=10,        
    max_overflow=20      
)

# 2. Create Session Factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

# 3. Create Base Model
Base = declarative_base()

# 4. Dependency Injection
def get_db() -> Generator[Session, None, None]:
    """Yields a database session and ensures it closes securely."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback() # Failsafe rollback if an error occurs mid-request
        raise e
    finally:
        db.close()