import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contract import Contract
from app.models.sla import SLAEvent
from app.routes.auth import get_current_user  
from app.models.user import User
from pydantic import BaseModel
from typing import Optional, List

# --- Advanced AI Services ---
from app.services.pdf_service import extract_text_from_pdf
from app.services.ner_service import extract_entities
from app.services.summary_service import generate_contract_summary
from app.services.alert_service import get_contract_alerts
from app.schemas.contract_schema import ContractListResponse, ContractDetailResponse

# ✅ IMPORT SINGLETONS (Do not re-initialize them here!)
from app.services.ai_loader import nlp_classifier, risk_model, similarity_engine

router = APIRouter(prefix="/contracts", tags=["Contracts"])

UPLOAD_DIR = "uploaded_contracts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Pydantic Models for Local Endpoints ---
class SLAEventCreate(BaseModel):
    metric_name: str
    value: float
    severity: str  # "LOW", "MEDIUM", "HIGH"
    financial_impact: Optional[float] = 0.0

# --- Routes ---

@router.post("/upload")
async def upload_contract(
    vendor_id: int = Form(...),
    contract_name: str = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a PDF, extracts text, runs AI analysis, indexes clauses, and saves result.
    """
    
    # 1. Save PDF
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # 2. Extract Text
    extracted_text = extract_text_from_pdf(file_path)
    entities = extract_entities(extracted_text)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    # 3. AI Clause Extraction (Using Singleton)
    clauses = {}
    if nlp_classifier:
        clauses = nlp_classifier.classify_clauses(extracted_text)

    # 4. AI Risk Analysis (Using Singleton)
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
                risk_reasons = [f['feature'] for f in risk_result["top_contributing_features"]]
        except Exception as e:
            print(f"Risk prediction failed: {e}")

    # 5. ✅ CRITICAL FIX: Index Clauses into Vector DB for Similarity Search
    if similarity_engine and clauses:
        try:
            for c_type, texts in clauses.items():
                for text in texts:
                    similarity_engine.add_clause_to_database(
                        clause_text=text,
                        clause_type=c_type,
                        source_contract=contract_name,
                        risk_level=risk_level,
                        tags=[current_user.company.name if current_user.company else "public"]
                    )
            # Force save index
            similarity_engine._save_data()
            print(f"✅ Indexed {sum(len(v) for v in clauses.values())} clauses for search.")
        except Exception as e:
            print(f"⚠️ Failed to index clauses: {e}")

    # 6. Generate Summary
    summary = generate_contract_summary(
        contract_name=contract_name,
        entities=entities,
        clauses=clauses,
        risk_level=risk_level
    )

    # 7. Security: Vendor Link
    final_vendor_id = vendor_id
    if current_user.role == "vendor":
        final_vendor_id = current_user.vendor_id

    # 8. Save to Database
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
        company_id=current_user.company_id 
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    return {
        "message": "Contract uploaded, analyzed, and indexed successfully",
        "contract_id": contract.id,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "summary": summary
    }

# --- Standard Endpoints ---

@router.post("/{contract_id}/sla-event")
def record_sla_event(
    contract_id: int,
    event_data: SLAEventCreate, 
    db: Session = Depends(get_db)
):
    """
    Record a real-world performance event (e.g. server down) to train the forecasting model.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(404, "Contract not found")

    new_event = SLAEvent(
        contract_id=contract_id,
        event_type="violation" if event_data.severity == "HIGH" else "monitoring",
        metric_name=event_data.metric_name,
        actual_value=event_data.value,
        # Default target values for demo purposes
        target_value=99.9 if "uptime" in event_data.metric_name else 0.0, 
        severity=event_data.severity,
        financial_impact=event_data.financial_impact
    )
    db.add(new_event)
    db.commit()
    return {"message": "SLA Event Recorded", "id": new_event.id}

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    contracts = db.query(Contract).all()
    alerts = get_contract_alerts(contracts)
    return {"total_alerts": len(alerts), "alerts": alerts}

@router.get("/", response_model=list[ContractListResponse])
def read_contracts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 👑 Super Admin: See ALL
    if current_user.role == "super_admin":
        return db.query(Contract).all()

    # 🏢 Company Admin/Manager: See ONLY company's
    if current_user.company_id:
        return db.query(Contract).filter(Contract.company_id == current_user.company_id).all()

    # 🛑 Vendor: See ONLY their own
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
        return {"error": "Contract not found"} 
    return contract

class ContractUpdateSchema(BaseModel):
    status: str
    new_end_date: Optional[str] = None

@router.patch("/{contract_id}/status")
def update_contract_status(
    contract_id: int, 
    update_data: ContractUpdateSchema, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # ✅ Require Auth
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # 🔒 SECURITY CHECK: Multi-Tenant Isolation
    if current_user.role != "super_admin":
        if contract.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="You do not have permission to modify this contract.")

    # Update Status
    contract.status = update_data.status.upper()
    
    if update_data.status.upper() == "RENEWED" and update_data.new_end_date:
        contract.end_date = update_data.new_end_date
    
    db.commit()
    db.refresh(contract)
    return contract

