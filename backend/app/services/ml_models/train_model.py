import logging
from sqlalchemy.orm import Session
from app.models.contract import Contract
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

def prepare_training_data_from_db(db: Session) -> List[Dict[str, Any]]:
    # ... (Keep this function exactly the same) ...
    contracts = db.query(Contract).filter(
        Contract.raw_text.isnot(None),
        Contract.risk_level.isnot(None),
        Contract.risk_level != "UNKNOWN"
    ).yield_per(100)
    
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
            "start_date": contract.start_date, 
            "end_date": contract.end_date      
        }
        training_data.append(data)
    
    logger.info(f"Prepared {len(training_data)} valid contracts for training")
    return training_data

def train_model_on_existing_data(risk_model_instance, db_session: Session) -> Optional[Dict[str, Any]]:
    if not risk_model_instance:
        logger.error("Risk model instance is None. Cannot train.")
        return None

    try:
        training_data = prepare_training_data_from_db(db_session)
        
        if len(training_data) < 10:
            logger.warning(f"Insufficient data. Need at least 10 contracts, found {len(training_data)}")
            return {"status": "skipped", "message": "Insufficient data. Need at least 10 contracts."}
        
        logger.info("Starting XGBoost model training...")
        results = risk_model_instance.train(training_data)
        
        # Check status before logging success
        if results.get("status") == "success":
            accuracy = results.get('test_accuracy', 0.0)
            logger.info(f"Training Complete. Accuracy: {accuracy:.3f}")
        else:
            logger.info(f"Training Halted: {results.get('message')}")
            
        return results
        
    except Exception as e:
        logger.error(f"Critical Training Failure: {str(e)}", exc_info=True)
        raise e