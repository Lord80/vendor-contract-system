from pydantic import BaseModel, ConfigDict
from typing import Optional

class VendorCreate(BaseModel):
    name: str
    category: str
    email: str

# Minimal schema for public dropdowns (Security Fix)
class VendorPublicResponse(BaseModel):
    id: int
    name: str
    category: str
    
    model_config = ConfigDict(from_attributes=True)

# Full schema for authenticated users
class VendorResponse(VendorCreate):
    id: int
    performance_score: float
    risk_level: str
    company_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)