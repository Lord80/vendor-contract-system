from app.database import SessionLocal
from app.models.company import Company
from app.models.vendor import Vendor
from app.models.user import User
from app.models.contract import Contract
from app.models.sla import SLAEvent, VendorPerformance

def teach_model_low_risk():
    db = SessionLocal()
    try:
        # Find the new safe contracts that scored in the 40s/50s
        safe_contracts = db.query(Contract).filter(Contract.risk_score < 60).all()
        updated_count = 0
        
        for contract in safe_contracts:
            print(f"Correcting '{contract.contract_name}' from {contract.risk_score} -> 20 (LOW)")
            contract.risk_score = 20
            contract.risk_level = "LOW"
            updated_count += 1
                
        db.commit()
        print(f"\n✅ Successfully taught the database that {updated_count} contracts are LOW risk!")
        print("You can now click 'Train Model' to make the AI smarter.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    teach_model_low_risk()