from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    email = Column(String, unique=True)

    performance_score = Column(Float, default=0.0)
    risk_level = Column(String, default="UNKNOWN")
