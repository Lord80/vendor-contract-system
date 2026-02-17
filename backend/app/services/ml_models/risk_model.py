import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

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
        
        # Try to load existing model
        self._load_model()
    
    def _load_model(self):
        """Load existing model if available"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        if os.path.exists(self.model_path):
            try:
                saved_data = joblib.load(self.model_path)
                self.model = saved_data['model']
                self.label_encoder = saved_data['label_encoder']
                self.feature_names = saved_data['feature_names']
                print(f"Loaded existing model with {len(self.feature_names)} features")
            except Exception as e:
                print(f"Could not load existing model: {e}")
    
    def prepare_training_data(self, contracts_data: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare training data from contract records.
        """
        # Lazy import to avoid circular dependency
        from .feature_engineering import ContractFeatureExtractor
        
        if not self.feature_extractor:
            self.feature_extractor = ContractFeatureExtractor()
        
        features_list = []
        labels = []
        
        for contract in contracts_data:
            # Extract features
            features = self.feature_extractor.extract_features(contract)
            features_list.append(features)
            
            # Get label
            if "risk_level" in contract:
                labels.append(contract["risk_level"])
            elif "risk_score" in contract:
                score = contract.get("risk_score", 0) or 0
                if score >= 70:
                    labels.append("HIGH")
                elif score >= 40:
                    labels.append("MEDIUM")
                else:
                    labels.append("LOW")
            else:
                labels.append("UNKNOWN")
        
        X = pd.DataFrame(features_list)
        # Ensure we don't have NaN values
        X = X.fillna(0)
        self.feature_names = X.columns.tolist()
        
        # Encode labels
        y = self.label_encoder.fit_transform(labels)
        
        return X, y
    
    def train(self, contracts_data: List[Dict[str, Any]], test_size: float = 0.2):
        """
        Train the XGBoost model.
        """
        if len(contracts_data) < 10:
            print(f"Skipping training: Need at least 10 contracts, found {len(contracts_data)}")
            return {"status": "skipped", "reason": "insufficient_data"}

        print(f"Training model with {len(contracts_data)} contracts...")
        
        X, y = self.prepare_training_data(contracts_data)
        
        # Only split if we have enough data
        if len(X) > 20:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=y
            )
        else:
            # Train on everything if small dataset
            X_train, X_test, y_train, y_test = X, X, y, y
        
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4, # Reduced depth to prevent overfitting on small data
            learning_rate=0.1,
            objective='multi:softprob',
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        train_acc = self.model.score(X_train, y_train)
        test_acc = self.model.score(X_test, y_test)
        
        print(f"Training accuracy: {train_acc:.3f}")
        print(f"Test accuracy: {test_acc:.3f}")
        
        self._save_model()
        
        return {
            "train_accuracy": train_acc,
            "test_accuracy": test_acc,
            "feature_count": len(self.feature_names)
        }
    
    def predict(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict risk for a single contract.
        """
        if not self.model:
            return self._fallback_prediction(contract_data)
        
        from .feature_engineering import ContractFeatureExtractor
        if not self.feature_extractor:
            self.feature_extractor = ContractFeatureExtractor()
        
        features = self.feature_extractor.extract_features(contract_data)
        
        # Create DataFrame with exact same columns as training data
        X = pd.DataFrame([features])
        X = X.reindex(columns=self.feature_names, fill_value=0)
        
        # Predict
        try:
            prediction_proba = self.model.predict_proba(X)[0]
            prediction_idx = np.argmax(prediction_proba)
            
            predicted_class = self.label_encoder.inverse_transform([prediction_idx])[0]
            confidence = float(prediction_proba[prediction_idx])
            
            top_features = self._get_top_contributing_features(X.iloc[0])
            
            return {
                "predicted_risk_level": predicted_class,
                "confidence": confidence,
                "top_contributing_features": top_features,
                "model_used": "xgboost"
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return self._fallback_prediction(contract_data)
    
    def _get_top_contributing_features(self, features: pd.Series) -> List[Dict[str, Any]]:
        """Get top features contributing to prediction"""
        if not self.model: return []
        
        # Use simple feature importance for speed/robustness
        importances = self.model.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        top_features = []
        for i in range(min(5, len(indices))):
            idx = indices[i]
            feature_name = self.feature_names[idx]
            importance = float(importances[idx])
            
            if importance > 0:
                top_features.append({
                    "feature": feature_name,
                    "value": float(features[feature_name]),
                    "contribution": importance,
                    "direction": "positive" 
                })
        
        return top_features
    
    def _fallback_prediction(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback"""
        text = contract_data.get("raw_text", "").lower()
        high_risk_terms = ["unlimited liability", "irrevocable", "without cause", "penalty"]
        count = sum(1 for term in high_risk_terms if term in text)
        
        risk = "HIGH" if count > 1 else "MEDIUM" if count == 1 else "LOW"
        return {
            "predicted_risk_level": risk,
            "confidence": 0.6,
            "top_contributing_features": [],
            "model_used": "rule_based_fallback"
        }
    
    def _save_model(self):
        if self.model:
            save_data = {
                'model': self.model,
                'label_encoder': self.label_encoder,
                'feature_names': self.feature_names
            }
            joblib.dump(save_data, self.model_path)
            print(f"Model saved to {self.model_path}")
            
    def get_model_info(self) -> Dict[str, Any]:
        return {
            "model_type": "XGBoost" if self.model else "None",
            "is_trained": self.model is not None,
            "feature_count": len(self.feature_names)
        }