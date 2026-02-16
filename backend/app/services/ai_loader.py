# backend/app/services/ai_loader.py
import sys

print("⏳ Initializing AI Services... (This may take a moment)")

try:
    from app.services.nlp_service import LegalBERTClassifier
    nlp_classifier = LegalBERTClassifier()
    print("✅ LegalBERT Loaded")
except Exception as e:
    print(f"⚠️ LegalBERT Failed: {e}")
    nlp_classifier = None

try:
    from app.services.ml_models.risk_model import RiskPredictionModel
    risk_model = RiskPredictionModel()
    print("✅ XGBoost Risk Model Loaded")
except Exception as e:
    print(f"⚠️ Risk Model Failed: {e}")
    risk_model = None

try:
    from app.services.similarity_service import ContractSimilarityEngine
    similarity_engine = ContractSimilarityEngine()
    print("✅ Vector Database (FAISS) Loaded")
except Exception as e:
    print(f"⚠️ Similarity Engine Failed: {e}")
    similarity_engine = None

print("🚀 AI System Ready.")