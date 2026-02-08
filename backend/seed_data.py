# backend/seed_data.py
import random
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.vendor import Vendor
from app.models.contract import Contract
from app.models.sla import SLAEvent, VendorPerformance

# 1. Create Tables
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    print("🌱 Seeding Database...")

    # --- 1. Create Vendors ---
    vendors = []
    vendor_names = ["Acme Cloud Services", "Globex IT Solutions", "Soylent Corp", "Cyberdyne Systems", "Initech Support"]
    
    for name in vendor_names:
        vendor = Vendor(
            name=name,
            category="IT Services",
            email=f"contact@{name.lower().replace(' ', '')}.com",
            performance_score=random.uniform(70, 95),
            risk_level="LOW"
        )
        db.add(vendor)
        vendors.append(vendor)
    
    db.commit()
    for v in vendors: db.refresh(v)
    print(f"✅ Created {len(vendors)} Vendors")

    # --- 2. Create Contracts ---
    contracts = []
    for vendor in vendors:
        contract = Contract(
            vendor_id=vendor.id,
            contract_name=f"{vendor.name} Service Agreement 2024",
            start_date=datetime.now() - timedelta(days=365),
            end_date=datetime.now() + timedelta(days=365),
            raw_text="Sample contract text...",
            risk_score=random.randint(10, 40),
            risk_level="LOW",
            status="ACTIVE"
        )
        db.add(contract)
        contracts.append(contract)
    
    db.commit()
    for c in contracts: db.refresh(c)
    print(f"✅ Created {len(contracts)} Contracts")

    # --- 3. Generate History for Forecasting ---
    print("⏳ Generating 6 months of historical data...")
    
    for vendor in vendors:
        # Generate 6 months of performance data (1 point per month)
        for i in range(6):
            date = datetime.now() - timedelta(days=30 * (6-i))
            perf = VendorPerformance(
                vendor_id=vendor.id,
                period_start=date,
                period_end=date + timedelta(days=30),
                uptime_score=random.uniform(90, 100),
                response_time_score=random.uniform(80, 100),
                resolution_score=random.uniform(70, 95),
                customer_satisfaction=random.uniform(4, 5) * 20,
                overall_score=random.uniform(80, 98),
                trend=random.choice(["stable", "improving"])
            )
            db.add(perf)

    for contract in contracts:
        # Generate random SLA violations (Forecasting needs these!)
        for i in range(20):
            if random.random() < 0.3: # 30% chance of event
                event_date = datetime.now() - timedelta(days=random.randint(1, 180))
                event = SLAEvent(
                    contract_id=contract.id,
                    event_type="violation",
                    metric_name="uptime",
                    target_value=99.9,
                    actual_value=99.0,
                    deviation=0.9,
                    event_date=event_date,
                    severity="MEDIUM",
                    resolved=True
                )
                db.add(event)

    db.commit()
    print("🎉 Database Seeded Successfully!")
    db.close()

if __name__ == "__main__":
    seed()