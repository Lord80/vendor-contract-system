from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db 
from app.services.ai_loader import risk_model
from app.services.ml_models.train_model import train_model_on_existing_data

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.get("/model/info")
def get_model_info():
    if not risk_model:
        return {"status": "Model not loaded"}
    return risk_model.get_model_info()

@router.post("/predict/risk")
def predict_contract_risk(contract_data: Dict[str, Any] = Body(...)):
    if not risk_model:
        raise HTTPException(503, "Risk model not loaded")
    try:
        prediction = risk_model.predict(contract_data)
        return {"status": "success", "prediction": prediction}
    except Exception as e:
        raise HTTPException(500, f"Prediction failed: {str(e)}")

@router.post("/train")
def train_model_endpoint(db: Session = Depends(get_db)):
    if not risk_model:
        raise HTTPException(503, "Risk model not loaded")

    try:
        # Pass singleton instance to update in-memory after training
        result = train_model_on_existing_data(risk_model_instance=risk_model, db_session=db)
        
        if result:
            return {
                "status": "success", 
                "message": "Model retrained successfully", 
                "info": risk_model.get_model_info()
            }
        else:
            return {"status": "skipped", "message": "Insufficient training data (need 10+ contracts)"}
    except Exception as e:
        raise HTTPException(500, detail=f"Training failed: {str(e)}")