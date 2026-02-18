import os
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.contract import Contract
from app.models.sla import SLAEvent
from app.models.vendor import Vendor
from app.routes.auth import get_current_user  
from app.models.user import User
from pydantic import BaseModel
from typing import Optional, List

from app.services.pdf_service import extract_text_from_pdf
from app.services.ner_service import extract_entities
from app.services.summary_service import generate_contract_summary
from app.services.alert_service import get_contract_alerts
from app.schemas.contract_schema import ContractListResponse, ContractDetailResponse

from app.services.ai_loader import nlp_classifier, risk_model, similarity_engine

router = APIRouter(prefix="/contracts", tags=["Contracts"])

UPLOAD_DIR = "uploaded_contracts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class SLAEventCreate(BaseModel):
    metric_name: str
    value: float
    severity: str 
    financial_impact: Optional[float] = 0.0

@router.post("/upload")
def upload_contract(
    vendor_id: int = Form(...),
    contract_name: str = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Security Check: Can this user upload for this vendor?
    if current_user.role != "super_admin":
        if current_user.role == "vendor":
            # Vendors can ONLY upload for themselves
            if vendor_id != current_user.vendor_id:
                raise HTTPException(403, "You can only upload contracts for your own profile.")
        else:
            # Managers must own the vendor
            vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
            if not vendor or vendor.company_id != current_user.company_id:
                raise HTTPException(403, "Cannot upload contract for a vendor outside your company.")

    # 2. Save PDF (Optimized I/O)
    file_path = os.path.join(UPLOAD_DIR, f"{vendor_id}_{file.filename}")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception:
        raise HTTPException(500, "Failed to save uploaded file.")

    # 3. Extract Text
    extracted_text = extract_text_from_pdf(file_path)
    if not extracted_text.strip():
        # Cleanup file if empty/corrupt
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Could not extract text. File might be scanned image or empty.")

    entities = extract_entities(extracted_text)

    # 4. AI Processing
    clauses = {}
    if nlp_classifier:
        clauses = nlp_classifier.classify_clauses(extracted_text)

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
            print(f"Risk prediction warning: {e}")

    # 5. Vector Indexing (Safe Operation)
    if similarity_engine and clauses:
        try:
            # Batch these if possible in future refactors
            for c_type, texts in clauses.items():
                for text in texts:
                    similarity_engine.add_clause_to_database(
                        clause_text=text,
                        clause_type=c_type,
                        source_contract=contract_name,
                        risk_level=risk_level,
                        tags=[current_user.company.name if current_user.company else "public"]
                    )
            similarity_engine._save_data()
        except Exception as e:
            print(f"Vector DB Indexing warning: {e}")

    summary = generate_contract_summary(contract_name, entities, clauses, risk_level)

    # 6. Database Commit
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
        status="ACTIVE",
        company_id=current_user.company_id 
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    return {
        "message": "Contract processed successfully",
        "contract_id": contract.id,
        "risk_level": risk_level,
        "risk_score": risk_score
    }

@router.post("/{contract_id}/sla-event")
def record_sla_event(
    contract_id: int,
    event_data: SLAEventCreate, 
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(404, "Contract not found")

    new_event = SLAEvent(
        contract_id=contract_id,
        event_type="violation" if event_data.severity == "HIGH" else "monitoring",
        metric_name=event_data.metric_name,
        actual_value=event_data.value,
        target_value=99.9,  # ideally this should come from contract details
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

@router.get("/", response_model=List[ContractListResponse])
def read_contracts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Contract)

    # 1. Super Admin sees everything
    if current_user.role == "super_admin":
        return query.all()

    # 2. Vendor Isolation (MUST CHECK THIS FIRST)
    # Even if they have a company_id, if their role is 'vendor', restrict them.
    if current_user.role == "vendor":
        if not current_user.vendor_id:
            return [] # Edge case: Vendor user with no linked profile
        return query.filter(Contract.vendor_id == current_user.vendor_id).all()

    # 3. Company Admins & Managers
    # They see everything within their Company
    if current_user.company_id:
        return query.filter(Contract.company_id == current_user.company_id).all()

    # 4. Fallback
    return []

@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- Added Security Injection
):
    # Base query
    query = db.query(Contract)

    # 🔒 TENANT ISOLATION: Filter by Company
    if current_user.role != "super_admin":
        if current_user.company_id:
            query = query.filter(Contract.company_id == current_user.company_id)
        elif current_user.role == "vendor":
            # Vendors only see their own contracts
            query = query.filter(Contract.vendor_id == current_user.vendor_id)
    
    # Execute counts on the FILTERED query
    total = query.count()
    high = query.filter(Contract.risk_level == "HIGH").count()
    medium = query.filter(Contract.risk_level == "MEDIUM").count()
    low = query.filter(Contract.risk_level == "LOW").count()

    return {
        "total_contracts": total,
        "risk_distribution": {"HIGH": high, "MEDIUM": medium, "LOW": low}
    }

@router.get("/{contract_id}", response_model=ContractDetailResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

class ContractUpdateSchema(BaseModel):
    status: str
    new_end_date: Optional[str] = None

@router.patch("/{contract_id}/status")
def update_contract_status(
    contract_id: int, 
    update_data: ContractUpdateSchema, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if current_user.role != "super_admin":
        if contract.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Permission denied")

    contract.status = update_data.status.upper()
    
    if update_data.status.upper() == "RENEWED" and update_data.new_end_date:
        contract.end_date = update_data.new_end_date
    
    db.commit()
    db.refresh(contract)
    return contract