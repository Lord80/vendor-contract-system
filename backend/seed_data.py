# seed_data.py

import sys
import os
from datetime import date, timedelta
import random

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.core.security import get_password_hash

# Import ALL models to register properly
from app.models.user import User
from app.models.company import Company
from app.models.vendor import Vendor
from app.models.contract import Contract
from app.models.sla import SLAEvent, VendorPerformance


# -------------------------------------------------
# ✅ SUPER ADMIN CREATION (YOUR ORIGINAL FUNCTION)
# -------------------------------------------------

def create_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "owner@platform.com").first()
        if existing:
            print("⚠️  Super Admin already exists!")
            return

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

        print("👑 Super Admin created:")
        print("   Email: owner@platform.com")
        print("   Pass:  owner123")

    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()


# -------------------------------------------------
# ENTERPRISE DATA SEEDING
# -------------------------------------------------

def seed_enterprise_data():
    db = SessionLocal()

    try:
        print("🌱 Starting Clean Enterprise Seeding...")

        companies_data = [
            ("Acme Manufacturing Ltd", "admin@acme.com"),
            ("Globex Financial Services", "admin@globex.com"),
            ("Nova Retail Pvt Ltd", "admin@novaretail.com")
        ]

        vendor_names = [
            "FastTrack Logistics",
            "Quantum Security",
            "Nimbus Cloud",
            "CreativePulse Marketing"
        ]

        for company_name, admin_email in companies_data:

            # --- COMPANY ---
            existing_company = db.query(Company).filter(Company.name == company_name).first()

            if existing_company:
                company = existing_company
                print(f"⚠️ Company already exists: {company_name}")
            else:
                company = Company(
                    name=company_name,
                    subscription_status="ACTIVE"
                )
                db.add(company)
                db.commit()
                db.refresh(company)
                print(f"🏢 Created Company: {company_name}")

            # --- COMPANY ADMIN ---
            if not db.query(User).filter(User.email == admin_email).first():
                admin = User(
                    full_name=f"{company_name} Admin",
                    email=admin_email,
                    hashed_password=get_password_hash("password123"),
                    role="company_admin",
                    company_id=company.id,
                    is_active=True
                )
                db.add(admin)
                db.commit()
                print(f"   👤 Admin Created: {admin_email}")

            # --- MANAGER ---
            manager_email = f"manager@{company_name.split()[0].lower()}.com"
            if not db.query(User).filter(User.email == manager_email).first():
                manager = User(
                    full_name="Operations Manager",
                    email=manager_email,
                    hashed_password=get_password_hash("password123"),
                    role="manager",
                    company_id=company.id,
                    is_active=True
                )
                db.add(manager)
                db.commit()
                print(f"   👤 Manager Created: {manager_email}")

            # --- VENDORS (NO CONTRACTS) ---
            for vendor_name in vendor_names:

                vendor_slug = vendor_name.lower().replace(" ", "")
                company_slug = company_name.split()[0].lower()
                unique_email = f"contact@{vendor_slug}.{company_slug}.com"

                existing_vendor = db.query(Vendor).filter(
                    Vendor.name == vendor_name,
                    Vendor.company_id == company.id
                ).first()

                if existing_vendor:
                    print(f"   ⚠️ Vendor exists: {vendor_name}")
                    continue

                vendor = Vendor(
                    name=vendor_name,
                    category="Enterprise Services",
                    email=unique_email,
                    company_id=company.id,
                    performance_score=random.uniform(60, 95),
                    risk_level="UNKNOWN"  # Let AI decide after contract upload
                )

                db.add(vendor)
                db.commit()
                db.refresh(vendor)

                print(f"   🏭 Vendor Created: {vendor_name}")

                # Vendor User Login
                vendor_user = User(
                    full_name=f"{vendor_name} Representative",
                    email=unique_email,
                    hashed_password=get_password_hash("vendor123"),
                    role="vendor",
                    vendor_id=vendor.id,
                    company_id=company.id,
                    is_active=True
                )

                db.add(vendor_user)
                db.commit()

        print("✅ Clean Seeding Complete!")
        print("👉 Now upload your real contracts through the system.")

    except Exception as e:
        print("❌ Error during seeding:", e)
        db.rollback()
    finally:
        db.close()


# -------------------------------------------------
# MAIN EXECUTION
# -------------------------------------------------

if __name__ == "__main__":
    create_admin()          # 👑 Create Super Admin
    seed_enterprise_data()  # 🌱 Seed Enterprise Data