from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.vendor import Vendor
from app.models.user import User
from app.schemas.vendor_schema import VendorCreate, VendorResponse
from app.routes.auth import get_current_user
from app.services.vendor_scoring import calculate_vendor_score
from app.models.contract import Contract

router = APIRouter(prefix="/vendors", tags=["Vendors"])

# ✅ 1. Get All Vendors (Public)
# We removed 'current_user' here so the Registration Page can populate the dropdown
@router.get("/", response_model=List[VendorResponse])
def read_vendors(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
):
    """
    Fetch all vendors. 
    Public access allows users to select their employer during registration.
    """
    return db.query(Vendor).offset(skip).limit(limit).all()

# ✅ 2. Create Vendor (Protected - Auto-Link to Company)
@router.post("/", response_model=VendorResponse)
def create_vendor(
    vendor: VendorCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security: Only Admins/Managers can create vendors
    if current_user.role not in ["company_admin", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to onboard vendors")

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company to create vendors")

    # Auto-assign the creating user's Company ID
    db_vendor = Vendor(
        **vendor.dict(), 
        company_id=current_user.company_id 
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

# ✅ 3. Top Vendors (Scoped to Tenant)
@router.get("/top")
def top_vendors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Vendor)
    
    # Filter by company if not super admin
    if current_user.role != "super_admin" and current_user.company_id:
        query = query.filter(Vendor.company_id == current_user.company_id)
        
    return query.order_by(Vendor.performance_score.desc()).limit(5).all()

# ✅ 4. Calculate Score (Scoped to Tenant)
@router.get("/{vendor_id}/score")
def get_vendor_score(vendor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Fetch Vendor
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # 2. Security Check: Is this MY vendor?
    if current_user.role != "super_admin" and vendor.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied to this vendor")

    # 3. Calculate
    contracts = db.query(Contract).filter(Contract.vendor_id == vendor_id).all()
    score_data = calculate_vendor_score(contracts)

    # Update Vendor Record
    vendor.performance_score = score_data["performance_score"]
    vendor.risk_level = score_data["vendor_risk_level"]
    db.commit()

    return {
        "vendor_id": vendor_id,
        "total_contracts": len(contracts),
        **score_data
    }