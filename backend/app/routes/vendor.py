from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db  # ✅ Imported correctly
from app.models.vendor import Vendor
from app.models.contract import Contract
from app.services.vendor_scoring import calculate_vendor_score
from app.schemas.vendor_schema import VendorCreate

router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.post("/")
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    db_vendor = Vendor(**vendor.dict())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.get("/top")
def top_vendors(db: Session = Depends(get_db)):
    # Order by performance_score descending
    vendors = (
        db.query(Vendor)
        .order_by(Vendor.performance_score.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "vendor_id": v.id,
            "name": v.name,
            "performance_score": v.performance_score,
            "risk_level": v.risk_level
        }
        for v in vendors
    ]

@router.get("/{vendor_id}/score")
def get_vendor_score(vendor_id: int, db: Session = Depends(get_db)):
    contracts = db.query(Contract).filter(Contract.vendor_id == vendor_id).all()

    # Calculate score based on contracts
    score_data = calculate_vendor_score(contracts)

    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if vendor:
        vendor.performance_score = score_data["performance_score"]
        vendor.risk_level = score_data["vendor_risk_level"]
        db.commit()

    return {
        "vendor_id": vendor_id,
        "total_contracts": len(contracts),
        **score_data
    }