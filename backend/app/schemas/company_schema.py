from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 1. To Create a Company
class CompanyCreate(BaseModel):
    name: str
    admin_email: str
    admin_name: str
    admin_password: str

# 2. To Return Company Data
class CompanyResponse(BaseModel):
    id: int
    name: str
    subscription_status: str
    created_at: datetime

    class Config:
        from_attributes = True