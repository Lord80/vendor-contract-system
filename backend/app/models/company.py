from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    subscription_status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="company", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="company", cascade="all, delete-orphan")