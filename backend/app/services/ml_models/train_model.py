# backend/app/services/ml_models/train_model.py
import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.contract import Contract
from .risk_model import RiskPredictionModel
import json
from typing import List, Dict, Any


def prepare_training_data_from_db(db: Session) -> List[Dict[str, Any]]:
    """
    Prepare training data from contracts in database.
    """
    contracts = db.query(Contract).all()
    
    training_data = []
    for contract in contracts:
        # Only use contracts that have been analyzed
        if contract.raw_text and contract.risk_level:
            data = {
                "id": contract.id,
                "raw_text": contract.raw_text,
                "extracted_clauses": contract.extracted_clauses or {},
                "entities": contract.entities or {},
                "risk_level": contract.risk_level,
                "risk_score": contract.risk_score,
                "contract_name": contract.contract_name,
                "start_date": str(contract.start_date) if contract.start_date else None,
                "end_date": str(contract.end_date) if contract.end_date else None
            }
            training_data.append(data)
    
    print(f"Prepared {len(training_data)} contracts for training")
    return training_data

def train_model_on_existing_data():
    """
    Train the risk prediction model using existing contract data.
    """
    db = SessionLocal()
    
    try:
        # Get training data
        training_data = prepare_training_data_from_db(db)
        
        if len(training_data) < 10:
            print(f"Need at least 10 contracts for training, found {len(training_data)}")
            print("Upload more contracts with the /contracts/upload endpoint first")
            return None
        
        # Train model
        model = RiskPredictionModel()
        results = model.train(training_data)
        
        print("\n" + "="*50)
        print("Model Training Complete!")
        print(f"Test Accuracy: {results['test_accuracy']:.3f}")
        print(f"Classes: {model.label_encoder.classes_}")
        print("="*50)
        
        return model
        
    except Exception as e:
        print(f"Training failed: {e}")
        raise
    finally:
        db.close()

# Command-line interface
if __name__ == "__main__":
    print("Starting model training...")
    model = train_model_on_existing_data()
    
    if model:
        # Test the model
        test_contract = {
            "raw_text": "This agreement may be terminated by either party with 30 days written notice. Payment terms are net 30 days.",
            "extracted_clauses": {
                "termination": ["terminated by either party with 30 days written notice"],
                "payment": ["Payment terms are net 30 days"]
            },
            "entities": {
                "dates": ["30 days"],
                "money": []
            },
            "risk_level": "LOW",
            "contract_name": "Test Contract"
        }
        
        prediction = model.predict(test_contract)
        print("\nTest Prediction:")
        print(json.dumps(prediction, indent=2))