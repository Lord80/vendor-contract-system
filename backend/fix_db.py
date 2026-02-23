# fix_db.py
from app.database import SessionLocal
from app.models.company import Company
from app.models.vendor import Vendor
from app.models.user import User
from app.models.contract import Contract
from app.models.sla import SLAEvent, VendorPerformance

def fix_contract_risk_levels():
    db = SessionLocal()
    try:
        contracts = db.query(Contract).all()
        updated_count = 0
        
        for contract in contracts:
            score = contract.risk_score or 50 # Fallback to 50 if null
            
            # Apply the strict If/Else thresholds
            if score >= 75:
                correct_level = "HIGH"
            elif score >= 40:
                correct_level = "MEDIUM"
            else:
                correct_level = "LOW"
                
            # Update the database if the label is wrong
            if contract.risk_level != correct_level:
                print(f"Updating Contract ID {contract.id}: Score {score} -> {correct_level}")
                contract.risk_level = correct_level
                updated_count += 1
                
        db.commit()
        print(f"\n✅ Successfully corrected {updated_count} contracts!")
        print("You can now safely run the ML Training API.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_contract_risk_levels()