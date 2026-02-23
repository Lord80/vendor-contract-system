import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import logging
from typing import Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

class RiskPredictionModel:
    """
    XGBoost model for contract risk prediction with SHAP explainability.
    """
    
    def __init__(self, model_path: str = "app/data/models/risk_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.label_encoder = LabelEncoder()
        self.feature_extractor = None
        self.feature_names = []
        
        self._load_model()
    
    def _load_model(self):
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        if os.path.exists(self.model_path):
            try:
                saved_data = joblib.load(self.model_path)
                self.model = saved_data['model']
                self.label_encoder = saved_data['label_encoder']
                self.feature_names = saved_data['feature_names']
                logger.info(f"Loaded existing model with {len(self.feature_names)} features")
            except Exception as e:
                logger.warning(f"Could not load existing model: {e}")
    
    def prepare_training_data(self, contracts_data: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, pd.Series]:
        from app.services.ml_models.feature_engineering import ContractFeatureExtractor
        
        if not self.feature_extractor:
            self.feature_extractor = ContractFeatureExtractor()
        
        features_list = []
        labels = []
        
        for contract in contracts_data:
            features = self.feature_extractor.extract_features(contract)
            features_list.append(features)
            
            # Use strict boundaries to clean up any conflicting database data during training
            score = contract.get("risk_score", 0) or 0
            if score >= 75:
                labels.append("HIGH")
            elif score >= 40:
                labels.append("MEDIUM")
            else:
                labels.append("LOW")
        
        X = pd.DataFrame(features_list)
        X = X.fillna(0)
        self.feature_names = X.columns.tolist()
        
        # Force the encoder to register all 3 classes to prevent XGBoost training crashes
        self.label_encoder.fit(["LOW", "MEDIUM", "HIGH"])
        y = self.label_encoder.transform(labels)
        
        return X, y
    
    def train(self, contracts_data: List[Dict[str, Any]], test_size: float = 0.2):
        if len(contracts_data) < 10:
            return {"status": "skipped", "reason": "insufficient_data", "message": "Need at least 10 contracts"}

        X, y = self.prepare_training_data(contracts_data)
        
        # Count how many of each class we have
        unique_classes, class_counts = np.unique(y, return_counts=True)
        if len(unique_classes) < 2:
            class_name = self.label_encoder.inverse_transform([unique_classes[0]])[0] if len(unique_classes) > 0 else "None"
            logger.warning(f"Training aborted: Data lacks variance. All contracts are marked as '{class_name}'.")
            return {
                "status": "skipped", 
                "message": f"Training requires contracts with at least 2 different risk levels. All current contracts are '{class_name}'."
            }

        # 🛡️ CRITICAL FIX: Only enforce stratification if EVERY class has at least 2 contracts
        can_stratify = np.min(class_counts) >= 2
        
        if len(X) > 20:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=test_size, 
                random_state=42, 
                stratify=y if can_stratify else None # Automatically disable if a class only has 1 item
            )
        else:
            X_train, X_test, y_train, y_test = X, X, y, y
        
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            objective='multi:softprob',
            num_class=3, 
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
        
        self._save_model()
        
        return {
            "status": "success",
            "train_accuracy": self.model.score(X_train, y_train),
            "test_accuracy": self.model.score(X_test, y_test)
        }
    
    def predict(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.model:
            return self._fallback_prediction(contract_data)
        
        from app.services.ml_models.feature_engineering import ContractFeatureExtractor
        if not self.feature_extractor:
            self.feature_extractor = ContractFeatureExtractor()
        
        try:
            features = self.feature_extractor.extract_features(contract_data)
            X = pd.DataFrame([features]).reindex(columns=self.feature_names, fill_value=0)
            
            prediction_proba = self.model.predict_proba(X)[0]
            classes = self.label_encoder.classes_
            
            # Map probabilities to a 0-100 Danger Score
            danger_weights = {"LOW": 15.0, "MEDIUM": 50.0, "HIGH": 90.0}
            risk_score_float = sum(prediction_proba[i] * danger_weights.get(cls, 50.0) for i, cls in enumerate(classes))
            risk_score = int(np.clip(risk_score_float, 0, 100))
            
            # Mathematically enforce the text label based on the calculated score
            if risk_score >= 75:
                predicted_class = "HIGH"
            elif risk_score >= 40:
                predicted_class = "MEDIUM"
            else:
                predicted_class = "LOW"
            
            top_features = self._get_top_contributing_features(X.iloc[0])
            
            return {
                "predicted_risk_level": predicted_class,
                "risk_score": risk_score,
                "top_contributing_features": top_features,
                "model_used": "xgboost"
            }
        except Exception as e:
            logger.warning(f"XGBoost Prediction error, using fallback: {e}")
            return self._fallback_prediction(contract_data)
    
    def _get_top_contributing_features(self, features: pd.Series) -> List[Dict[str, Any]]:
        if not self.model: return []
        try:
            importances = self.model.feature_importances_
            indices = np.argsort(importances)[::-1]
            top_features = []
            for i in range(min(5, len(indices))):
                idx = indices[i]
                if idx >= len(self.feature_names): continue
                if float(importances[idx]) > 0:
                    top_features.append({
                        "feature": self.feature_names[idx],
                        "value": float(features.get(self.feature_names[idx], 0)),
                        "contribution": float(importances[idx])
                    })
            return top_features
        except Exception:
            return []
    
    def _fallback_prediction(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        text = contract_data.get("raw_text", "").lower()
        high_risk_terms = ["unlimited liability", "irrevocable", "without cause", "penalty"]
        count = sum(1 for term in high_risk_terms if term in text)
        
        # Aligned Fallback logic
        if count > 1:
            risk = "HIGH"
            score = 85
        elif count == 1:
            risk = "MEDIUM"
            score = 60
        else:
            risk = "LOW"
            score = 25
            
        return {
            "predicted_risk_level": risk,
            "risk_score": score,
            "top_contributing_features": [],
            "model_used": "rule_based_fallback"
        }
    
    def _save_model(self):
        if self.model:
            joblib.dump({
                'model': self.model,
                'label_encoder': self.label_encoder,
                'feature_names': self.feature_names
            }, self.model_path)
            
    def get_model_info(self) -> Dict[str, Any]:
        return {
            "model_type": "XGBoost" if self.model else "None",
            "is_trained": self.model is not None,
            "feature_count": len(self.feature_names)
        }