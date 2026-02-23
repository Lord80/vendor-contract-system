import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.vendor import Vendor
from app.models.user import User
from app.models.contract import Contract
from app.schemas.vendor_schema import VendorCreate, VendorResponse, VendorPublicResponse
from app.routes.auth import get_current_user
from app.services.vendor_scoring import calculate_vendor_score

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.get("/", response_model=List[VendorPublicResponse])
def read_vendors(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch vendors with strict Tenant Isolation."""
    query = db.query(Vendor)
    
    # 🔒 Tenant Isolation
    if current_user.role != "super_admin":
        if not current_user.company_id:
            return []
        query = query.filter(Vendor.company_id == current_user.company_id)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=VendorResponse)
def create_vendor(
    vendor: VendorCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["company_admin", "admin", "manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to onboard vendors")

    if not current_user.company_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User must belong to a company to create vendors")

    try:
        db_vendor = Vendor(
            **vendor.dict(), 
            company_id=current_user.company_id 
        )
        db.add(db_vendor)
        db.commit()
        db.refresh(db_vendor)
        logger.info(f"Vendor {db_vendor.name} created by {current_user.email}")
        return db_vendor
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create vendor: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create vendor profile")

@router.get("/top")
def top_vendors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Vendor)
    
    # 🔒 Tenant Isolation
    if current_user.role != "super_admin":
        if not current_user.company_id:
            return []
        query = query.filter(Vendor.company_id == current_user.company_id)
        
    return query.order_by(Vendor.performance_score.desc()).limit(5).all()

@router.get("/{vendor_id}/score")
def get_vendor_score(vendor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    
    if not vendor: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
        
    # 🔒 Tenant Isolation: Prevent spying on other companies' vendors
    if current_user.role != "super_admin" and vendor.company_id != current_user.company_id:
        logger.warning(f"User {current_user.email} attempted to view score of unauthorized vendor {vendor_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this vendor's score")
    
    contracts = db.query(Contract).filter(Contract.vendor_id == vendor_id).all()
    score_data = calculate_vendor_score(contracts)
    
    # Only commit to database if the score has actually changed
    try:
        if abs(vendor.performance_score - score_data["performance_score"]) > 0.01:
            vendor.performance_score = score_data["performance_score"]
            vendor.risk_level = score_data["vendor_risk_level"]
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update score for vendor {vendor_id}: {e}")
        # We don't raise an exception here because we can still return the calculated score

    return {"vendor_id": vendor_id, "total_contracts": len(contracts), **score_data}