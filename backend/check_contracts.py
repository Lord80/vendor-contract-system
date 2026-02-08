# check_contracts.py
from app.database import SessionLocal
from app.models.contract import Contract

db = SessionLocal()
contract_count = db.query(Contract).count()
contracts_with_text = db.query(Contract).filter(Contract.raw_text.isnot(None)).count()
contracts_with_risk = db.query(Contract).filter(Contract.risk_level.isnot(None)).count()

print(f"Total contracts in database: {contract_count}")
print(f"Contracts with extracted text: {contracts_with_text}")
print(f"Contracts with risk analysis: {contracts_with_risk}")

# Show sample contracts
if contract_count > 0:
    print("\nSample contracts:")
    contracts = db.query(Contract).limit(3).all()
    for contract in contracts:
        print(f"\n- ID: {contract.id}, Name: {contract.contract_name}")
        print(f"  Risk: {contract.risk_level} ({contract.risk_score})")
        print(f"  Text length: {len(contract.raw_text) if contract.raw_text else 0} chars")
        if contract.raw_text:
            print(f"  Preview: {contract.raw_text[:100]}...")

db.close()