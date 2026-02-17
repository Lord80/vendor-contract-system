import sys
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIServices:
    """
    Singleton manager for AI models to ensure they are loaded only once.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIServices, cls).__new__(cls)
            cls._instance.nlp_classifier = None
            cls._instance.risk_model = None
            cls._instance.similarity_engine = None
            cls._instance.load_models()
        return cls._instance

    def load_models(self):
        logger.info("⏳ Initializing AI Services... (This may take a moment)")
        start_time = time.time()

        # 1. Load NLP Classifier
        try:
            from app.services.nlp_service import LegalBERTClassifier
            self.nlp_classifier = LegalBERTClassifier()
            logger.info("✅ LegalBERT Loaded")
        except Exception as e:
            logger.error(f"⚠️ LegalBERT Failed: {e}")

        # 2. Load Risk Model
        try:
            from app.services.ml_models.risk_model import RiskPredictionModel
            self.risk_model = RiskPredictionModel()
            logger.info("✅ XGBoost Risk Model Loaded")
        except Exception as e:
            logger.error(f"⚠️ Risk Model Failed: {e}")

        # 3. Load Vector DB
        try:
            from app.services.similarity_service import ContractSimilarityEngine
            self.similarity_engine = ContractSimilarityEngine()
            logger.info("✅ Vector Database (FAISS) Loaded")
        except Exception as e:
            logger.error(f"⚠️ Similarity Engine Failed: {e}")

        elapsed = time.time() - start_time
        logger.info(f"🚀 AI System Ready in {elapsed:.2f}s")

# Initialize Singleton
ai_services = AIServices()

# Export variables for backward compatibility with existing imports
nlp_classifier = ai_services.nlp_classifier
risk_model = ai_services.risk_model
similarity_engine = ai_services.similarity_engine