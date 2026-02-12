from sqlalchemy.orm import Session
from app.database import SessionLocal

# ✅ IMPORT ALL MODELS so SQLAlchemy knows they exist
from app.models.user import User
from app.models.vendor import Vendor  
from app.models.company import Company
from app.models.contract import Contract 

from app.core.security import get_password_hash 

def create_admin():
    db = SessionLocal()

    # Check if admin already exists
    existing = db.query(User).filter(User.email == "owner@platform.com").first()
    if existing:
        print("Admin already exists!")
        return

    # Create Super Admin (No Company ID)
    super_admin = User(
        full_name="Platform Owner",
        email="owner@platform.com",
        hashed_password=get_password_hash("owner123"), 
        role="super_admin",
        company_id=None, # ✅ Not linked to any specific tenant
        is_active=True
    )

    db.add(super_admin)
    db.commit()
    print("✅ Super Admin created:")
    print("   Email: owner@platform.com")
    print("   Pass:  owner123")
    print("   Role:  super_admin")

if __name__ == "__main__":
    create_admin()