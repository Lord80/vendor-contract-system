from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date

class ContractCreate(BaseModel):
    vendor_id: int
    contract_name: str
    start_date: date
    end_date: date

class ContractResponse(ContractCreate):
    id: int
    status: str
    risk_score: Optional[int] = 0  # ✅ Made Optional

    class Config:
        from_attributes = True

class ContractListResponse(BaseModel):
    id: int
    vendor_id: int
    contract_name: str
    status: Optional[str] = "ACTIVE"
    risk_level: Optional[str] = "UNKNOWN"
    risk_score: Optional[int] = 0
    summary: Optional[str] = "No summary available"

    class Config:
        from_attributes = True

class ContractDetailResponse(BaseModel):
    id: int
    contract_name: str
    raw_text: Optional[str] = ""
    extracted_clauses: Optional[Dict[str, Any]] = {}
    entities: Optional[Dict[str, Any]] = {}
    risk_score: Optional[int] = 0
    risk_level: Optional[str] = "UNKNOWN"
    risk_reasons: Optional[List[str]] = []
    summary: Optional[str] = "No summary available"

    class Config:
        from_attributes = True