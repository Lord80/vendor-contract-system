from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    email = Column(String, unique=False) 
    performance_score = Column(Float, default=0.0)
    risk_level = Column(String, default="LOW")

    # ✅ NEW: Multi-Tenant Link
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    company = relationship("Company", back_populates="vendors")