import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company_schema import CompanyCreate, CompanyResponse
from app.routes.auth import get_current_user
from app.core.security import get_password_hash 

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/companies", tags=["Companies"])

@router.post("/", response_model=CompanyResponse)
def create_company(
    company_data: CompanyCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security Check
    if current_user.role != "super_admin":
        logger.warning(f"Unauthorized company creation attempt by {current_user.email}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Super Admin can create companies")

    # Check for duplicates
    if db.query(Company).filter(Company.name == company_data.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company name already taken")

    if db.query(User).filter(User.email == company_data.admin_email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin email already in use")

    try:
        # Atomic Transaction Start
        new_company = Company(name=company_data.name)
        db.add(new_company)
        db.flush() # Generates the ID without committing transaction

        new_admin = User(
            email=company_data.admin_email,
            full_name=company_data.admin_name,
            hashed_password=get_password_hash(company_data.admin_password),
            role="company_admin",
            company_id=new_company.id, # Link using the flushed ID
            is_active=True
        )
        db.add(new_admin)
        
        # Commit everything together
        db.commit()
        db.refresh(new_company)
        logger.info(f"Successfully created new tenant company: {new_company.name}")
        return new_company

    except Exception as e:
        db.rollback() # Failsafe: Revert both company and admin creation
        logger.error(f"Failed to create company {company_data.name}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database transaction failed")

@router.get("/", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """
    Publicly list all companies (Tenants).
    Used for user registration dropdowns.
    Only returns non-sensitive info defined in CompanyResponse schema.
    """
    return db.query(Company).all()