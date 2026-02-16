from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- Dependency: Get Current User ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- 1. Register (Restricted to Manager/Vendor) ---
@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Security: Prevent self-registration of Admins
    if user.role in ["super_admin", "company_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Admins must be created by the Super Admin.")

    # 2. Validation: Managers MUST belong to a company
    if user.role == "manager" and not user.company_id:
        raise HTTPException(status_code=400, detail="Managers must be linked to a company.")

    # 3. Check if email exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 4. Create User
    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name,
        role=user.role,
        vendor_id=user.vendor_id,
        company_id=user.company_id # ✅ Managers now linked to Company
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# --- 2. Login ---
@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create Token with Role & Company Info
    access_token = create_access_token(
        data={
            "sub": user.email, 
            "role": user.role, 
            "id": user.id,
            "company_id": user.company_id
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

# --- 3. List Users (Scoped) ---
@router.get("/users/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 👑 Super Admin: Sees EVERYONE
    if current_user.role == "super_admin":
        return db.query(User).offset(skip).limit(limit).all()
    
    # 🏢 Company Admin: Sees ONLY their company employees
    if current_user.role in ["company_admin", "admin"]:
        if not current_user.company_id:
            return []
        return db.query(User).filter(User.company_id == current_user.company_id).offset(skip).limit(limit).all()

    raise HTTPException(status_code=403, detail="Not authorized to view users")

# --- 4. Delete User (Scoped) ---
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    # 👑 Super Admin Logic
    if current_user.role == "super_admin":
        db.delete(user_to_delete)
        db.commit()
        return {"message": "User deleted"}

    # 🏢 Company Admin Logic
    if current_user.role in ["company_admin", "admin"]:
        # Rule 1: Can only delete users in SAME company
        if user_to_delete.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Cannot delete users from other companies")
        
        # Rule 2: Cannot delete other Admins (optional safety)
        if user_to_delete.role in ["company_admin", "admin", "super_admin"]:
            raise HTTPException(status_code=403, detail="Cannot delete other admins")

        db.delete(user_to_delete)
        db.commit()
        return {"message": "User deleted"}

    raise HTTPException(status_code=403, detail="Not authorized")