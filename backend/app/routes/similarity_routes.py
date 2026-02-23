import logging
from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.services.ai_loader import similarity_engine
from app.models.contract import Contract
from app.models.user import User
from app.routes.auth import get_current_user
from app.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/similarity", tags=["Similarity Search"])

@router.get("/database/stats")
def get_stats(current_user: User = Depends(get_current_user)):
    if not similarity_engine:
        return {"status": "AI Engine Offline"}
    return similarity_engine.get_database_stats()

@router.post("/search")
def search_clauses(
    query: str,
    clause_type: Optional[str] = Query(None),
    top_k: int = 10,
    min_similarity: float = 0.7,
    current_user: User = Depends(get_current_user)
):
    if not similarity_engine:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Similarity engine offline")

    try:
        # Note: In a fully strict multi-tenant environment, you would also pass 
        # current_user.company.name to the similarity_engine to filter the vector search.
        results = similarity_engine.find_similar_clauses(
            query_text=query,
            clause_type=clause_type,
            top_k=top_k,
            similarity_threshold=min_similarity
        )
        return {"results": results}
    except Exception as e:
        logger.error(f"Vector search failed: {e}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Search failed during processing")

@router.post("/compare/contracts")
def compare_contracts(
    contract1_id: int,
    contract2_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not similarity_engine:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Similarity engine offline")

    c1 = db.query(Contract).filter(Contract.id == contract1_id).first()
    c2 = db.query(Contract).filter(Contract.id == contract2_id).first()
    
    if not c1 or not c2:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "One or both contracts not found")
    
    # 🔒 Tenant Isolation: Verify ownership before comparing
    if current_user.role != "super_admin":
        if c1.company_id != current_user.company_id or c2.company_id != current_user.company_id:
            logger.warning(f"Unauthorized comparison attempt by {current_user.email} on contracts {contract1_id} and {contract2_id}")
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied. Contracts belong to another tenant.")
    
    try:
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
    except Exception as e:
        logger.error(f"Contract comparison failed: {e}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Comparison failed to process")