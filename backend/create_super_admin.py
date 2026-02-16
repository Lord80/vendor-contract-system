from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash 

def create_admin():
    db = SessionLocal()
    try:
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
            company_id=None, # ✅ Correct: Not linked to any specific tenant
            is_active=True
        )

        db.add(super_admin)
        db.commit()
        print("✅ Super Admin created:")
        print("   Email: owner@platform.com")
        print("   Pass:  owner123")
        print("   Role:  super_admin")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close() # ✅ Always close the connection

if __name__ == "__main__":
    create_admin()


# i want that the vendor should be only with view only access 

# they should be individually register not linked to any company or anything for now 

# they should just be able to access there own contracts and its details