import sys
import os

# Add the current directory to the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.core.security import get_password_hash 

# ✅ CRITICAL: Import ALL models to register them with SQLAlchemy
# This fixes the "failed to locate a name" errors
from app.models.user import User
from app.models.company import Company
from app.models.vendor import Vendor
from app.models.contract import Contract  # <--- Added this
from app.models.sla import SLAEvent, VendorPerformance # <--- Added for completeness

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing = db.query(User).filter(User.email == "owner@platform.com").first()
        if existing:
            print("⚠️  Admin already exists!")
            return

        # Create Super Admin
        super_admin = User(
            full_name="Platform Owner",
            email="owner@platform.com",
            hashed_password=get_password_hash("owner123"), 
            role="super_admin",
            company_id=None,
            vendor_id=None,
            is_active=True
        )

        db.add(super_admin)
        db.commit()
        print("✅ Super Admin created successfully:")
        print("   Email: owner@platform.com")
        print("   Pass:  owner123")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()