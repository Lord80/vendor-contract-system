import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contract import Contract
from app.routes.auth import get_current_user  
from app.models.user import User
from pydantic import BaseModel
from typing import Optional

# --- Advanced AI Services ---
from app.services.pdf_service import extract_text_from_pdf
from app.services.ner_service import extract_entities
# We promoted LegalBERT to nlp_service.py in Phase 1
from app.services.nlp_service import LegalBERTClassifier 
from app.services.ml_models.risk_model import RiskPredictionModel
from app.services.summary_service import generate_contract_summary
from app.services.alert_service import get_contract_alerts
from app.schemas.contract_schema import ContractListResponse, ContractDetailResponse

router = APIRouter(prefix="/contracts", tags=["Contracts"])

UPLOAD_DIR = "uploaded_contracts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Initialize AI Models Globally ---
# This ensures we load the heavy models only once when the server starts
print("Loading AI Models...")
try:
    nlp_classifier = LegalBERTClassifier()
    risk_model = RiskPredictionModel()
    print("✅ AI Models Loaded Successfully.")
except Exception as e:
    print(f"⚠️ Warning: Could not load AI models. Check file paths. Error: {e}")
    nlp_classifier = None
    risk_model = None

@router.post("/upload")
async def upload_contract(
    vendor_id: int = Form(...),
    contract_name: str = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # ✅ 1. Get the logged-in user
):
    """
    Uploads a PDF, extracts text, runs AI analysis (LegalBERT + XGBoost), 
    and saves the result linked to the user's company.
    """
    
    # --- [Existing Logic: Save PDF] ---
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # --- [Existing Logic: Extract Text] ---
    extracted_text = extract_text_from_pdf(file_path)
    entities = extract_entities(extracted_text)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    # --- [Existing Logic: AI Clause Extraction] ---
    if nlp_classifier:
        clauses = nlp_classifier.classify_clauses(extracted_text)
    else:
        clauses = {} 

    # --- [Existing Logic: AI Risk Analysis] ---
    risk_score = 0
    risk_level = "UNKNOWN"
    risk_reasons = []

    if risk_model:
        contract_data_for_ml = {
            "raw_text": extracted_text,
            "extracted_clauses": clauses,
            "entities": entities,
            "contract_name": contract_name,
            "start_date": start_date,
            "end_date": end_date
        }
        
        try:
            risk_result = risk_model.predict(contract_data_for_ml)
            risk_level = risk_result["predicted_risk_level"]
            risk_score = int(risk_result["confidence"] * 100)
            
            if "top_contributing_features" in risk_result:
                risk_reasons = [
                    f['feature'] for f in risk_result["top_contributing_features"]
                ]
        except Exception as e:
            print(f"Risk prediction failed: {e}")

    # --- [Existing Logic: Generate Summary] ---
    summary = generate_contract_summary(
        contract_name=contract_name,
        entities=entities,
        clauses=clauses,
        risk_level=risk_level
    )

    # --- [Security Logic: Determine Vendor ID] ---
    # If a Vendor is uploading, force the ID to be their own (prevent spoofing)
    final_vendor_id = vendor_id
    if current_user.role == "vendor":
        final_vendor_id = current_user.vendor_id

    # --- [Updated Logic: Save to Database] ---
    contract = Contract(
        vendor_id=final_vendor_id,
        contract_name=contract_name,
        start_date=start_date,
        end_date=end_date,
        raw_text=extracted_text,
        extracted_clauses=clauses,
        entities=entities,
        summary=summary,
        risk_score=risk_score,
        risk_level=risk_level,
        risk_reasons=risk_reasons,
        status="ACTIVE",
        
        # ✅ 2. KEY CHANGE: Link Contract to the User's Company
        company_id=current_user.company_id 
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    return {
        "message": "Contract uploaded and analyzed with AI",
        "contract_id": contract.id,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "summary": summary
    }

# --- Standard Endpoints ---

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    contracts = db.query(Contract).all()
    alerts = get_contract_alerts(contracts)
    return {"total_alerts": len(alerts), "alerts": alerts}

# @router.get("/", response_model=list[ContractListResponse])
# def list_contracts(db: Session = Depends(get_db)):
#     return db.query(Contract).all()

@router.get("/", response_model=list[ContractListResponse])
def read_contracts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    # 👑 Super Admin: See ALL contracts
    if current_user.role == "super_admin":
        return db.query(Contract).all()

    # 🏢 Company Admin/Manager: See ONLY their company's contracts
    if current_user.company_id:
        return db.query(Contract).filter(Contract.company_id == current_user.company_id).all()

    # 🛑 Vendor: See ONLY their specific contracts (Existing logic)
    if current_user.role == "vendor":
        return db.query(Contract).filter(Contract.vendor_id == current_user.vendor_id).all()
        
    return []

@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    total = db.query(Contract).count()
    high = db.query(Contract).filter(Contract.risk_level == "HIGH").count()
    medium = db.query(Contract).filter(Contract.risk_level == "MEDIUM").count()
    low = db.query(Contract).filter(Contract.risk_level == "LOW").count()

    return {
        "total_contracts": total,
        "risk_distribution": {"HIGH": high, "MEDIUM": medium, "LOW": low}
    }

@router.get("/{contract_id}", response_model=ContractDetailResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        # Add a custom error response that frontend can handle
        return {"error": "Contract not found"} 
    return contract

class ContractUpdateSchema(BaseModel):
    status: str
    new_end_date: Optional[str] = None

@router.patch("/{contract_id}/status")
def update_contract_status(
    contract_id: int, 
    update_data: ContractUpdateSchema,  # <--- Use the schema here
    db: Session = Depends(get_db)
):
    print(f"Received Update: {update_data.dict()}") # Debugging Log

    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Update Status
    contract.status = update_data.status.upper()
    
    # Update Date (Only if RENEWED and date is provided)
    if update_data.status.upper() == "RENEWED" and update_data.new_end_date:
        contract.end_date = update_data.new_end_date
    
    db.commit()
    db.refresh(contract)
    return contract