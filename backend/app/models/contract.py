from sqlalchemy import Column, Integer, String, Date, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_name = Column(String, index=True)
    
    # Indexes added for faster filtering
    vendor_id = Column(Integer, ForeignKey("vendors.id"), index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    raw_text = Column(Text, nullable=True)
    extracted_clauses = Column(JSON, nullable=True)
    entities = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="LOW")
    risk_reasons = Column(JSON, nullable=True)
    status = Column(String, default="ACTIVE")

    company = relationship("Company", back_populates="contracts")
    vendor_profile = relationship("Vendor", back_populates="contracts")