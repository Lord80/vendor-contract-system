from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import secrets

def generate_invite_code():
    """Generates a secure, short code like 'X7B-9Q2'"""
    return secrets.token_urlsafe(4).upper().replace("_", "X").replace("-", "Y")

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    email = Column(String, index=True) 
    
    # ✅ NEW: Secret Invite Code
    invite_code = Column(String, unique=True, default=generate_invite_code)
    
    performance_score = Column(Float, default=0.0)
    risk_level = Column(String, default="LOW")

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    
    company = relationship("Company", back_populates="vendors")
    contracts = relationship("Contract", back_populates="vendor_profile")
    performance_history = relationship("VendorPerformance", back_populates="vendor")