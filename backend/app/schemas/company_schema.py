from pydantic import BaseModel, ConfigDict
from datetime import datetime

class CompanyCreate(BaseModel):
    name: str
    admin_email: str
    admin_name: str
    admin_password: str

class CompanyResponse(BaseModel):
    id: int
    name: str
    subscription_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)