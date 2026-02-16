from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Valid Roles: 'super_admin', 'company_admin', 'manager', 'vendor'
    role = Column(String, default="manager")

    # Relationships
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    vendor_profile = relationship("Vendor", backref="users")

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company = relationship("Company", back_populates="users")