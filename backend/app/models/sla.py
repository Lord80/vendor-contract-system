from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from app.database import Base
from datetime import datetime

class SLAEvent(Base):
    __tablename__ = "sla_events"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    
    # Event details
    event_type = Column(String)  # e.g., "violation", "near_miss"
    metric_name = Column(String) # e.g., "uptime", "response_time"
    target_value = Column(Float)
    actual_value = Column(Float)
    deviation = Column(Float)
    
    # Timestamps
    event_date = Column(DateTime, default=datetime.utcnow)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Impact
    severity = Column(String)    # "LOW", "MEDIUM", "HIGH"
    financial_impact = Column(Float, nullable=True)
    resolved = Column(Boolean, default=False)

class VendorPerformance(Base):
    __tablename__ = "vendor_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    
    # Metrics
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    
    # Performance scores (0-100)
    uptime_score = Column(Float)
    response_time_score = Column(Float)
    resolution_score = Column(Float)
    customer_satisfaction = Column(Float)
    
    # Aggregates
    overall_score = Column(Float)
    trend = Column(String)       # "improving", "declining", "stable"
    
    recorded_at = Column(DateTime, default=datetime.utcnow)