from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class SLAEvent(Base):
    __tablename__ = "sla_events"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), index=True, nullable=False)
    
    # Event details
    event_type = Column(String, index=True)  # e.g., "violation", "near_miss"
    metric_name = Column(String)             # e.g., "uptime", "response_time"
    target_value = Column(Float, default=0.0)
    actual_value = Column(Float, default=0.0)
    deviation = Column(Float, default=0.0)
    
    # Timestamps
    event_date = Column(DateTime, default=datetime.utcnow, index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Impact
    severity = Column(String, default="LOW")    # "LOW", "MEDIUM", "HIGH"
    financial_impact = Column(Float, nullable=True, default=0.0)
    resolved = Column(Boolean, default=False)

    # Relationships
    # We use backref here because 'sla_events' is likely NOT defined in Contract model yet.
    contract = relationship("Contract", backref="sla_events")

    # Index for time-series queries
    __table_args__ = (
        Index('ix_sla_contract_date', 'contract_id', 'event_date'),
    )

class VendorPerformance(Base):
    __tablename__ = "vendor_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), index=True, nullable=False)
    
    # Metrics Period
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Performance scores (0-100)
    uptime_score = Column(Float, default=0.0)
    response_time_score = Column(Float, default=0.0)
    resolution_score = Column(Float, default=0.0)
    customer_satisfaction = Column(Float, default=0.0)
    
    # Aggregates
    overall_score = Column(Float, default=0.0)
    trend = Column(String)       # "improving", "declining", "stable"
    
    recorded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # ✅ FIX: Changed from 'backref' to 'back_populates' to match the Vendor model
    vendor = relationship("Vendor", back_populates="performance_history")