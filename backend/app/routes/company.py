from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company_schema import CompanyCreate, CompanyResponse
from app.routes.auth import get_current_user
from app.core.security import get_password_hash 

router = APIRouter(prefix="/companies", tags=["Companies"])

# 1. Create a New Company (Super Admin Only)
@router.post("/", response_model=CompanyResponse)
def create_company(
    company_data: CompanyCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security Check
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can create companies")

    # Check if company name exists
    if db.query(Company).filter(Company.name == company_data.name).first():
        raise HTTPException(status_code=400, detail="Company name already taken")

    # Check if admin email exists (prevent duplicate user emails)
    if db.query(User).filter(User.email == company_data.admin_email).first():
        raise HTTPException(status_code=400, detail="Admin email already in use")

    try:
        # Atomic Transaction Start
        # 1. Create Company
        new_company = Company(name=company_data.name)
        db.add(new_company)
        db.flush() # Flush generates the ID without committing transaction

        # 2. Create Company Admin User
        new_admin = User(
            email=company_data.admin_email,
            full_name=company_data.admin_name,
            hashed_password=get_password_hash(company_data.admin_password),
            role="company_admin",
            company_id=new_company.id, # Link using the flushed ID
            is_active=True
        )
        db.add(new_admin)
        
        # Commit everything together. If this fails, EVERYTHING rolls back.
        db.commit()
        db.refresh(new_company)
        return new_company

    except Exception as e:
        db.rollback() # Ensure database stays clean on error
        raise HTTPException(status_code=500, detail=f"Failed to create company: {str(e)}")

@router.get("/", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """
    Publicly list all companies (Tenants).
    Used for user registration dropdowns.
    Only returns non-sensitive info defined in CompanyResponse schema.
    """
    return db.query(Company).all()