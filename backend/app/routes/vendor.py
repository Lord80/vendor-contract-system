from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.vendor import Vendor
from app.models.user import User
from app.models.contract import Contract
from app.schemas.vendor_schema import VendorCreate, VendorResponse, VendorPublicResponse
from app.routes.auth import get_current_user
from app.services.vendor_scoring import calculate_vendor_score

router = APIRouter(prefix="/vendors", tags=["Vendors"])

# ✅ OPTIMIZED: Return specific fields to avoid data leakage
@router.get("/", response_model=List[VendorPublicResponse])
def read_vendors(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
):
    """
    Public access for registration dropdowns. 
    Only returns ID, Name, and Category. Sensitive data masked.
    """
    return db.query(Vendor.id, Vendor.name, Vendor.category).offset(skip).limit(limit).all()

# ✅ SECURED: Only company admins/managers can create
@router.post("/", response_model=VendorResponse)
def create_vendor(
    vendor: VendorCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["company_admin", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to onboard vendors")

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company to create vendors")

    db_vendor = Vendor(
        **vendor.dict(), 
        company_id=current_user.company_id 
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.get("/top")
def top_vendors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Vendor)
    
    if current_user.role != "super_admin" and current_user.company_id:
        query = query.filter(Vendor.company_id == current_user.company_id)
        
    return query.order_by(Vendor.performance_score.desc()).limit(5).all()

@router.get("/{vendor_id}/score")
def get_vendor_score(vendor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if current_user.role != "super_admin" and vendor.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied to this vendor")

    # Optimization: Only load necessary columns
    contracts = db.query(Contract).filter(Contract.vendor_id == vendor_id).all()
    score_data = calculate_vendor_score(contracts)

    # Only write to DB if the score actually changes to reduce write locks
    if abs(vendor.performance_score - score_data["performance_score"]) > 0.01:
        vendor.performance_score = score_data["performance_score"]
        vendor.risk_level = score_data["vendor_risk_level"]
        db.commit()

    return {
        "vendor_id": vendor_id,
        "total_contracts": len(contracts),
        **score_data
    }