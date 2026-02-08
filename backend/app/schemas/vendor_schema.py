from pydantic import BaseModel

class VendorCreate(BaseModel):
    name: str
    category: str
    email: str

class VendorResponse(VendorCreate):
    id: int
    performance_score: float
    # risk_score: float
    risk_level: str

    class Config:
        from_attributes = True
