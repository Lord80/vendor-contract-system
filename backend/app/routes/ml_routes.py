from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json

from app.database import get_db  # ✅ Imported correctly
from app.models.contract import Contract
from app.services.ml_models.risk_model import RiskPredictionModel
from app.services.ml_models.train_model import train_model_on_existing_data

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

# Initialize model
risk_model = RiskPredictionModel()

@router.get("/model/info")
def get_model_info():
    """Get information about the current ML model"""
    return risk_model.get_model_info()

@router.post("/predict/risk")
def predict_contract_risk(
    contract_data: Dict[str, Any] = Body(...)
):
    try:
        prediction = risk_model.predict(contract_data)
        return {
            "status": "success",
            "prediction": prediction
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/predict/batch")
def predict_batch_contracts(
    contracts: List[Dict[str, Any]] = Body(...)
):
    try:
        predictions = []
        for contract in contracts:
            prediction = risk_model.predict(contract)
            predictions.append({
                "contract_name": contract.get("contract_name", "Unknown"),
                "prediction": prediction
            })
        
        return {
            "status": "success",
            "total_contracts": len(predictions),
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

@router.post("/train")
def train_model_endpoint(db: Session = Depends(get_db)):
    """
    Train the ML model on existing contract data.
    """
    try:
        # Note: train_model_on_existing_data uses its own session logic internally
        # but for consistency we could pass the db session in future refactors.
        result = train_model_on_existing_data()
        
        if result:
            return {
                "status": "success",
                "message": "Model trained successfully",
                "model_info": risk_model.get_model_info()
            }
        else:
            return {
                "status": "failed",
                "message": "Not enough training data. Upload more contracts first."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.get("/performance")
def get_model_performance(db: Session = Depends(get_db)):
    """
    Evaluate model performance on existing contracts.
    """
    contracts = db.query(Contract).filter(
        Contract.raw_text.isnot(None),
        Contract.risk_level.isnot(None)
    ).all()
    
    if len(contracts) < 5:
        return {
            "status": "insufficient_data",
            "message": f"Need at least 5 contracts for evaluation, found {len(contracts)}"
        }
    
    correct = 0
    total = 0
    confusion = {"HIGH": {}, "MEDIUM": {}, "LOW": {}}
    
    for contract in contracts:
        contract_data = {
            "raw_text": contract.raw_text,
            "extracted_clauses": contract.extracted_clauses or {},
            "entities": contract.entities or {},
            "contract_name": contract.contract_name,
            "start_date": str(contract.start_date) if contract.start_date else None,
            "end_date": str(contract.end_date) if contract.end_date else None
        }
        
        try:
            prediction = risk_model.predict(contract_data)
            predicted = prediction["predicted_risk_level"]
            actual = contract.risk_level
            
            if actual not in confusion[predicted]:
                confusion[predicted][actual] = 0
            confusion[predicted][actual] += 1
            
            if predicted == actual:
                correct += 1
            total += 1
            
        except Exception:
            continue
    
    accuracy = correct / total if total > 0 else 0
    
    return {
        "status": "success",
        "accuracy": accuracy,
        "correct_predictions": correct,
        "total_predictions": total,
        "confusion_matrix": confusion,
        "model_info": risk_model.get_model_info()
    }