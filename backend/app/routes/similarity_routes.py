from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

# ✅ OPTIMIZATION: Import the singleton instance
from app.services.ai_loader import similarity_engine
from app.models.contract import Contract
from app.database import get_db

router = APIRouter(prefix="/similarity", tags=["Similarity Search"])

@router.get("/database/stats")
def get_similarity_database_stats():
    if not similarity_engine:
        return {"status": "AI Engine Offline"}
    return similarity_engine.get_database_stats()

@router.post("/search")
def search_similar_clauses(
    query: str,
    clause_type: Optional[str] = Query(None),
    top_k: int = Query(10, ge=1, le=50),
    min_similarity: float = Query(0.7, ge=0.0, le=1.0),
    risk_level: Optional[str] = Query(None)
):
    if not similarity_engine:
        raise HTTPException(status_code=503, detail="Similarity engine is not loaded")

    try:
        results = similarity_engine.find_similar_clauses(
            query_text=query,
            clause_type=clause_type,
            top_k=top_k,
            similarity_threshold=min_similarity,
            filter_by_risk=risk_level
        )
        return {"query": query, "total_results": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/compare/contracts")
async def compare_two_contracts(
    contract1_id: int,
    contract2_id: int,
    db: Session = Depends(get_db)
):
    if not similarity_engine:
        raise HTTPException(status_code=503, detail="Similarity engine is not loaded")

    contract1 = db.query(Contract).filter(Contract.id == contract1_id).first()
    contract2 = db.query(Contract).filter(Contract.id == contract2_id).first()
    
    if not contract1 or not contract2:
        raise HTTPException(status_code=404, detail="One or both contracts not found")
    
    # 1. Compare Content
    # Limit text length for performance
    text1 = contract1.raw_text[:10000] if contract1.raw_text else ""
    text2 = contract2.raw_text[:10000] if contract2.raw_text else ""

    comparison = similarity_engine.compare_contracts(text1, text2, "clauses")
    overall = similarity_engine.compare_contracts(text1, text2, "overall")
    
    return {
        "contract1": contract1.contract_name,
        "contract2": contract2.contract_name,
        "overall_comparison": overall,
        "clause_comparison": comparison,
        "risk_comparison": {
            "contract1_risk": contract1.risk_level,
            "contract2_risk": contract2.risk_level
        }
    }