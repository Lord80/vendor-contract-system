import sys
import os
from datetime import date, timedelta
import random

# Setup path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.company import Company
from app.models.vendor import Vendor
from app.models.contract import Contract
from app.models.sla import SLAEvent, VendorPerformance

db = SessionLocal()

def get_or_create_company(name, admin_email, admin_name):
    company = db.query(Company).filter(Company.name == name).first()
    if not company:
        print(f"🏢 Creating Company: {name}")
        company = Company(name=name, subscription_status="ACTIVE")
        db.add(company)
        db.commit()
        db.refresh(company)
        
        # Create Admin
        user = User(
            email=admin_email,
            hashed_password=get_password_hash("password123"),
            full_name=admin_name,
            role="company_admin",
            company_id=company.id,
            is_active=True
        )
        db.add(user)
        db.commit()
    return company

def create_vendor_stack(company_id, name, email, risk_level, score):
    # 1. Create Vendor Profile
    vendor = db.query(Vendor).filter(Vendor.name == name).first()
    if not vendor:
        print(f"  🏭 Creating Vendor: {name} ({risk_level} Risk)")
        vendor = Vendor(
            name=name,
            category="Services",
            email=email,
            company_id=company_id,
            risk_level=risk_level,
            performance_score=score
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)

        # 2. Create Vendor User (The Login)
        user_email = f"contact@{name.lower().replace(' ', '')}.com"
        if not db.query(User).filter(User.email == user_email).first():
            user = User(
                email=user_email,
                hashed_password=get_password_hash("vendor123"),
                full_name=f"{name} Rep",
                role="vendor",
                vendor_id=vendor.id,
                company_id=company_id,
                is_active=True
            )
            db.add(user)
            db.commit()
            print(f"    👤 User created: {user_email} / vendor123")

        # 3. Create Dummy Contracts
        print("    📄 Generating contracts...")
        for i in range(random.randint(2, 4)):
            contract = Contract(
                contract_name=f"{name} Service Agreement {2024+i}",
                vendor_id=vendor.id,
                company_id=company_id,
                status="ACTIVE",
                start_date=date.today() - timedelta(days=random.randint(100, 500)),
                end_date=date.today() + timedelta(days=random.randint(30, 365)),
                risk_level=risk_level,
                risk_score=random.randint(80, 95) if risk_level == "HIGH" else random.randint(10, 40),
                summary="Auto-generated test contract for demonstration purposes.",
                raw_text="This is a dummy contract text used for testing the UI display."
            )
            db.add(contract)
        
        db.commit()

try:
    print("🌱 SEEDING DATABASE...")

    # --- ACME CORP DATA ---
    acme = get_or_create_company("Acme Corp", "admin@acme.com", "Alice Admin")
    
    # High Risk Vendor
    create_vendor_stack(acme.id, "FastTrack Logistics", "info@fasttrack.com", "HIGH", 45.0)
    # Low Risk Vendor
    create_vendor_stack(acme.id, "GreenLeaf Catering", "orders@greenleaf.com", "LOW", 92.0)

    # --- GLOBEX CORP DATA ---
    globex = get_or_create_company("Globex Corp", "admin@globex.com", "Globex Admin")
    
    # Medium Risk Vendor (Competitor's vendor)
    create_vendor_stack(globex.id, "Quantum Security", "secure@quantum.com", "MEDIUM", 75.0)

    print("\n✅ SEEDING COMPLETE!")
    print("------------------------------------------------")
    print("New Logins to Try:")
    print("1. Acme Manager:   admin@acme.com / securepassword123 (or password123 if newly created)")
    print("2. Globex Manager: admin@globex.com / password123")
    print("3. Vendor (FastTrack): contact@fasttracklogistics.com / vendor123")
    print("4. Vendor (Quantum):   contact@quantumsecurity.com / vendor123")
    print("------------------------------------------------")

except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()