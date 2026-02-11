from pydantic import BaseModel, EmailStr
from typing import Optional

# For creating a user (Registration)
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "manager"  # Default role
    vendor_id: Optional[int] = None

# For logging in
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Public profile (hides password)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    vendor_id: Optional[int] = None

    class Config:
        from_attributes = True

# The Token itself
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse  # Send user info with token