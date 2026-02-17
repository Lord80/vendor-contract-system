from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator
from app.config import settings

# 1. Create Engine
# pool_pre_ping=True helps prevent "server has gone away" errors
# pool_size controls concurrent connections
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
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
    """Yields a database session and ensures it closes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()