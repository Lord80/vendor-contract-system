import logging
from fastapi import APIRouter, HTTPException, Depends, Body, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db 
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.ai_loader import risk_model
from app.services.ml_models.train_model import train_model_on_existing_data

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.get("/model/info")
def get_model_info(current_user: User = Depends(get_current_user)):
    if not risk_model:
        return {"status": "Model not loaded"}
    return risk_model.get_model_info()

@router.post("/predict/risk")
def predict_contract_risk(
    contract_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    if not risk_model:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Risk model not loaded")
    try:
        prediction = risk_model.predict(contract_data)
        return {"status": "success", "prediction": prediction}
    except Exception as e:
        logger.error(f"Risk prediction failed: {e}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Prediction failed during processing")

@router.post("/train")
def train_model_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["super_admin", "company_admin", "admin"]:
        logger.warning(f"Unauthorized ML training attempt by {current_user.email}")
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to trigger model retraining")

    if not risk_model:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Risk model not loaded")

    try:
        logger.info(f"ML Retraining initiated by {current_user.email}")
        result = train_model_on_existing_data(risk_model_instance=risk_model, db_session=db)
        
        # Check the exact status returned by the model
        if result and result.get("status") == "success":
            logger.info("Model retrained successfully")
            return {
                "status": "success", 
                "message": "Model retrained successfully", 
                "info": risk_model.get_model_info(),
                "metrics": {
                    "train_accuracy": result.get("train_accuracy"),
                    "test_accuracy": result.get("test_accuracy")
                }
            }
        else:
            # Safely pass the abort message back to the frontend
            reason = result.get("message", "Insufficient training data") if result else "Training aborted"
            logger.info(f"Model training skipped: {reason}")
            return {
                "status": "skipped", 
                "message": reason
            }
            
    except Exception as e:
        logger.error(f"Model training failed: {e}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Training failed due to internal error")