from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, JSON
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))

    contract_name = Column(String, index=True)
    start_date = Column(Date)
    end_date = Column(Date)

    raw_text = Column(Text)

    extracted_clauses = Column(JSON)
    entities = Column(JSON)
    summary = Column(Text)
    risk_score = Column(Integer)
    risk_level = Column(String)
    risk_reasons = Column(JSON)

    status = Column(String, default="ACTIVE")
