from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.company import Company
from app.models.vendor import Vendor
from app.schemas.user_schema import UserCreate, UserResponse, Token

# ✅ FIX: Import 'settings' for config, and only functions from 'security'
from app.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # ✅ FIX: Use settings.SECRET_KEY and settings.ALGORITHM
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Email Uniqueness Check
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Role Validation & Integrity Checks
    if user.role in ["super_admin", "company_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Admins must be created by the Super Admin.")

    if user.role == "manager":
        if not user.company_id:
            raise HTTPException(status_code=400, detail="Managers must be linked to a company.")
        # Validate Company Exists
        if not db.query(Company).filter(Company.id == user.company_id).first():
            raise HTTPException(status_code=404, detail="Company not found.")

    if user.role == "vendor":
        if not user.vendor_id:
            raise HTTPException(status_code=400, detail="Vendor users must link to a vendor profile.")
        # Validate Vendor Exists
        vendor = db.query(Vendor).filter(Vendor.id == user.vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor profile not found.")
        # Auto-link vendor user to the vendor's company for easier querying
        user.company_id = vendor.company_id

    # 3. Create User
    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name,
        role=user.role,
        vendor_id=user.vendor_id,
        company_id=user.company_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ✅ FIX: Use settings.ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = create_access_token(
        data={
            "sub": user.email, 
            "role": user.role, 
            "id": user.id,
            "company_id": user.company_id
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@router.get("/users/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "super_admin":
        return db.query(User).offset(skip).limit(limit).all()
    
    if current_user.role in ["company_admin", "admin"]:
        if not current_user.company_id:
            return []
        return db.query(User).filter(User.company_id == current_user.company_id).offset(skip).limit(limit).all()

    raise HTTPException(status_code=403, detail="Not authorized to view users")

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "super_admin":
        db.delete(user_to_delete)
        db.commit()
        return {"message": "User deleted"}

    if current_user.role in ["company_admin", "admin"]:
        if user_to_delete.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Cannot delete users from other companies")
        
        if user_to_delete.role in ["company_admin", "admin", "super_admin"]:
            raise HTTPException(status_code=403, detail="Cannot delete other admins")

        db.delete(user_to_delete)
        db.commit()
        return {"message": "User deleted"}

    raise HTTPException(status_code=403, detail="Not authorized")