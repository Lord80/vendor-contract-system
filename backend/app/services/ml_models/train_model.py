from sqlalchemy.orm import Session
from app.models.contract import Contract
from typing import List, Dict, Any

def prepare_training_data_from_db(db: Session) -> List[Dict[str, Any]]:
    contracts = db.query(Contract).all()
    
    training_data = []
    for contract in contracts:
        # Only use contracts that have been analyzed and have a verified risk level
        if contract.raw_text and contract.risk_level and contract.risk_level != "UNKNOWN":
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
    
    print(f"Prepared {len(training_data)} valid contracts for training")
    return training_data

def train_model_on_existing_data(risk_model_instance, db_session: Session):
    """
    Train the risk prediction model using existing contract data.
    """
    try:
        # Get training data
        training_data = prepare_training_data_from_db(db_session)
        
        if len(training_data) < 10:
            print(f"Need at least 10 contracts for training, found {len(training_data)}")
            return None
        
        # Train model
        results = risk_model_instance.train(training_data)
        
        print("\n" + "="*50)
        print("Model Training Complete!")
        print(f"Test Accuracy: {results['test_accuracy']:.3f}")
        print("="*50)
        
        return results
        
    except Exception as e:
        print(f"Training failed: {e}")
        raise