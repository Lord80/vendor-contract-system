from sqlalchemy.orm import Session
from app.models.contract import Contract
from typing import List, Dict, Any, Optional

def prepare_training_data_from_db(db: Session) -> List[Dict[str, Any]]:
    """
    Fetches and prepares contract data for training.
    Optimized to fetch only necessary columns.
    """
    # Optimized query: Fetch all fields eagerly but filter at DB level
    contracts = db.query(Contract).filter(
        Contract.raw_text.isnot(None),
        Contract.risk_level.isnot(None),
        Contract.risk_level != "UNKNOWN"
    ).all()
    
    training_data = []
    for contract in contracts:
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

def train_model_on_existing_data(risk_model_instance, db_session: Session) -> Optional[Dict[str, Any]]:
    """
    Train the risk prediction model using existing contract data.
    """
    if not risk_model_instance:
        print("Risk model instance is None. Cannot train.")
        return None

    try:
        training_data = prepare_training_data_from_db(db_session)
        
        if len(training_data) < 10:
            print(f"Insufficient data. Need at least 10 contracts, found {len(training_data)}")
            return None
        
        print("Starting model training...")
        results = risk_model_instance.train(training_data)
        
        print(f"Training Complete. Accuracy: {results.get('test_accuracy', 0.0):.3f}")
        return results
        
    except Exception as e:
        print(f"Critical Training Failure: {str(e)}")
        # In a real system, you might log this to Sentry/Datadog
        raise e