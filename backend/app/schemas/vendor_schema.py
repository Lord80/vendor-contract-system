from pydantic import BaseModel, ConfigDict,EmailStr
from typing import Optional

class VendorCreate(BaseModel):
    name: str
    category: str
    email: str

class VendorPublicResponse(BaseModel):
    id: int
    name: str
    category: str
    model_config = ConfigDict(from_attributes=True)

class VendorResponse(VendorCreate):
    id: int
    performance_score: float
    risk_level: str
    company_id: Optional[int] = None
    
    # ✅ NEW: Include code in response
    invite_code: Optional[str] = None 

    model_config = ConfigDict(from_attributes=True)

class VendorRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    invite_code: str 