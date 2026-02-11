import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contract import Contract
from app.routes.auth import get_current_user  
from app.models.user import User

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
    db: Session = Depends(get_db)
):
    """
    Uploads a PDF, extracts text, runs AI analysis (LegalBERT + XGBoost), 
    and saves the result.
    """
    # 1. Save PDF locally
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # 2. Extract Text & Entities
    extracted_text = extract_text_from_pdf(file_path)
    entities = extract_entities(extracted_text)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    # 3. AI Clause Extraction (LegalBERT)
    if nlp_classifier:
        clauses = nlp_classifier.classify_clauses(extracted_text)
    else:
        # Fallback if model failed to load (prevents crash)
        clauses = {} 

    # 4. AI Risk Analysis (XGBoost)
    risk_score = 0
    risk_level = "UNKNOWN"
    risk_reasons = []

    if risk_model:
        # Prepare data for the model
        contract_data_for_ml = {
            "raw_text": extracted_text,
            "extracted_clauses": clauses,
            "entities": entities,
            "contract_name": contract_name,
            "start_date": start_date,
            "end_date": end_date
        }
        
        # Predict
        try:
            risk_result = risk_model.predict(contract_data_for_ml)
            risk_level = risk_result["predicted_risk_level"]
            risk_score = int(risk_result["confidence"] * 100)
            
            # Extract top risk factors for UI
            if "top_contributing_features" in risk_result:
                risk_reasons = [
                    f['feature'] for f in risk_result["top_contributing_features"]
                ]
        except Exception as e:
            print(f"Risk prediction failed: {e}")

    # 5. Generate Summary
    summary = generate_contract_summary(
        contract_name=contract_name,
        entities=entities,
        clauses=clauses,
        risk_level=risk_level
    )

    # 6. Save to Database
    contract = Contract(
        vendor_id=vendor_id,
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
        status="ACTIVE"
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
def read_contracts(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- Add this dependency
):
    # If user is a VENDOR, only show their own contracts
    if current_user.role == "vendor":
        if not current_user.vendor_id:
            return [] # Should not happen, but safety check
        contracts = db.query(Contract).filter(Contract.vendor_id == current_user.vendor_id).offset(skip).limit(limit).all()
    
    # If Admin/Manager, show ALL contracts
    else:
        contracts = db.query(Contract).offset(skip).limit(limit).all()
        
    return contracts

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