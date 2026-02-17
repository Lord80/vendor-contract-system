from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.services.ai_loader import similarity_engine
from app.models.contract import Contract
from app.database import get_db

router = APIRouter(prefix="/similarity", tags=["Similarity Search"])

@router.get("/database/stats")
def get_stats():
    if not similarity_engine:
        return {"status": "AI Engine Offline"}
    return similarity_engine.get_database_stats()

@router.post("/search")
def search_clauses(
    query: str,
    clause_type: Optional[str] = Query(None),
    top_k: int = 10,
    min_similarity: float = 0.7
):
    if not similarity_engine:
        raise HTTPException(503, "Similarity engine offline")

    try:
        results = similarity_engine.find_similar_clauses(
            query_text=query,
            clause_type=clause_type,
            top_k=top_k,
            similarity_threshold=min_similarity
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(500, f"Search failed: {str(e)}")

@router.post("/compare/contracts")
def compare_contracts(
    contract1_id: int,
    contract2_id: int,
    db: Session = Depends(get_db)
):
    if not similarity_engine:
        raise HTTPException(503, "Similarity engine offline")

    c1 = db.query(Contract).filter(Contract.id == contract1_id).first()
    c2 = db.query(Contract).filter(Contract.id == contract2_id).first()
    
    if not c1 or not c2:
        raise HTTPException(404, "One or both contracts not found")
    
    # Compare
    text1 = c1.raw_text[:15000] if c1.raw_text else ""
    text2 = c2.raw_text[:15000] if c2.raw_text else ""

    return {
        "contract1": c1.contract_name,
        "contract2": c2.contract_name,
        "overall_comparison": similarity_engine.compare_contracts(text1, text2, "overall"),
        "clause_comparison": similarity_engine.compare_contracts(text1, text2, "clauses"),
        "risk_comparison": {
            "contract1_risk": c1.risk_level,
            "contract2_risk": c2.risk_level
        }
    }