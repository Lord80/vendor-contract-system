# backend/app/services/ml_models/risk_model.py
import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

class RiskPredictionModel:
    """
    XGBoost model for contract risk prediction.
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
            except:
                print("Could not load existing model, will train new one")
    
    def prepare_training_data(self, contracts_data: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare training data from contract records.
        
        Args:
            contracts_data: List of contract dictionaries with risk labels
            
        Returns:
            Tuple of (X_features, y_labels)
        """
        from .feature_engineering import ContractFeatureExtractor
        
        if not self.feature_extractor:
            self.feature_extractor = ContractFeatureExtractor()
        
        features_list = []
        labels = []
        
        for contract in contracts_data:
            # Extract features
            features = self.feature_extractor.extract_features(contract)
            features_list.append(features)
            
            # Get label (risk_level should be in contract data)
            if "risk_level" in contract:
                labels.append(contract["risk_level"])
            elif "risk_score" in contract:
                # Convert score to level
                score = contract["risk_score"]
                if score >= 70:
                    labels.append("HIGH")
                elif score >= 40:
                    labels.append("MEDIUM")
                else:
                    labels.append("LOW")
        
        # Convert to DataFrame
        X = pd.DataFrame(features_list)
        self.feature_names = X.columns.tolist()
        
        # Encode labels
        y = self.label_encoder.fit_transform(labels)
        
        return X, y
    
    def train(self, contracts_data: List[Dict[str, Any]], test_size: float = 0.2):
        """
        Train the XGBoost model.
        
        Args:
            contracts_data: List of contract dictionaries
            test_size: Proportion of data to use for testing
        """
        print(f"Training model with {len(contracts_data)} contracts...")
        
        # Prepare data
        X, y = self.prepare_training_data(contracts_data)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}")
        
        # Train XGBoost model
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
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
        
        # Evaluate
        train_accuracy = self.model.score(X_train, y_train)
        test_accuracy = self.model.score(X_test, y_test)
        
        print(f"Training accuracy: {train_accuracy:.3f}")
        print(f"Test accuracy: {test_accuracy:.3f}")
        
        # Detailed evaluation
        y_pred = self.model.predict(X_test)
        
        print("\nClassification Report:")
        print(classification_report(
            y_test, y_pred,
            target_names=self.label_encoder.classes_
        ))
        
        # Feature importance
        self._analyze_feature_importance(X)
        
        # Save model
        self._save_model()
        
        return {
            "train_accuracy": train_accuracy,
            "test_accuracy": test_accuracy,
            "feature_count": len(self.feature_names),
            "class_distribution": dict(zip(*np.unique(y, return_counts=True)))
        }
    
    def _analyze_feature_importance(self, X: pd.DataFrame):
        """Analyze and print feature importance"""
        if self.model:
            importance = self.model.feature_importances_
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': importance
            }).sort_values('importance', ascending=False)
            
            print("\nTop 10 Most Important Features:")
            print(feature_importance.head(10).to_string(index=False))
    
    def predict(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict risk for a single contract.
        
        Args:
            contract_data: Contract dictionary
            
        Returns:
            Dictionary with prediction and confidence
        """
        if not self.model:
            return self._fallback_prediction(contract_data)
        
        # Extract features
        from .feature_engineering import ContractFeatureExtractor
        if not self.feature_extractor:
            self.feature_extractor = ContractFeatureExtractor()
        
        features = self.feature_extractor.extract_features(contract_data)
        
        # Ensure all expected features are present
        X = pd.DataFrame([features])
        X = X.reindex(columns=self.feature_names, fill_value=0)
        
        # Predict
        prediction_proba = self.model.predict_proba(X)[0]
        prediction_idx = np.argmax(prediction_proba)
        
        # Get probabilities for each class
        probabilities = {}
        for i, class_name in enumerate(self.label_encoder.classes_):
            probabilities[class_name] = float(prediction_proba[i])
        
        predicted_class = self.label_encoder.inverse_transform([prediction_idx])[0]
        confidence = float(prediction_proba[prediction_idx])
        
        # Get top contributing features
        top_features = self._get_top_contributing_features(X.iloc[0])
        
        return {
            "predicted_risk_level": predicted_class,
            "confidence": confidence,
            "probabilities": probabilities,
            "top_contributing_features": top_features,
            "model_used": "xgboost",
            "prediction_timestamp": datetime.now().isoformat()
        }
    
    def _get_top_contributing_features(self, features: pd.Series) -> List[Dict[str, Any]]:
        """Get top features contributing to prediction"""
        if not self.model:
            return []
        
        # Get SHAP values if available, otherwise use feature importance
        try:
            import shap
            
            # Create SHAP explainer
            explainer = shap.TreeExplainer(self.model)
            
            # Convert features to DataFrame with correct shape
            features_df = features.to_frame().T
            
            # Get SHAP values - handle different formats
            shap_values = explainer.shap_values(features_df)
            
            # Handle different SHAP output formats
            if isinstance(shap_values, list):
                # Multi-class: get values for predicted class
                prediction_idx = np.argmax(self.model.predict_proba(features_df)[0])
                if prediction_idx < len(shap_values):
                    shap_vals = shap_values[prediction_idx][0]  # First sample
                else:
                    shap_vals = shap_values[0][0] if shap_values else []
            elif hasattr(shap_values, 'values'):
                # SHAP Explanation object
                shap_vals = shap_values.values[0]
            elif isinstance(shap_values, np.ndarray):
                # Raw numpy array
                shap_vals = shap_values[0]
            else:
                shap_vals = []
            
            # Get top features by absolute SHAP value
            contribs = []
            for i, feature_name in enumerate(self.feature_names):
                if i < len(shap_vals):
                    # Convert to scalar if it's an array
                    if isinstance(shap_vals[i], np.ndarray):
                        shap_value = float(shap_vals[i][0]) if len(shap_vals[i]) > 0 else 0.0
                    else:
                        shap_value = float(shap_vals[i])
                    
                    # Get feature value
                    feature_value = float(features[feature_name]) if feature_name in features else 0.0
                    
                    contribs.append({
                        "feature": feature_name,
                        "value": feature_value,
                        "contribution": shap_value,
                        "direction": "increases" if shap_value > 0 else "decreases"
                    })
            
            # Sort by absolute contribution
            contribs.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            
        except (ImportError, Exception) as e:
            # Fallback to feature importance
            print(f"SHAP failed, using feature importance: {e}")
            if hasattr(self.model, 'feature_importances_'):
                contribs = []
                for i, (feature_name, importance) in enumerate(
                    zip(self.feature_names, self.model.feature_importances_)
                ):
                    if importance > 0:
                        feature_value = float(features[feature_name]) if feature_name in features else 0.0
                        contribs.append({
                            "feature": feature_name,
                            "value": feature_value,
                            "contribution": float(importance),
                            "direction": "positive"  # Can't determine without SHAP
                        })
                contribs.sort(key=lambda x: x["contribution"], reverse=True)
            else:
                contribs = []
        
        return contribs[:5]  # Top 5
    
    def _fallback_prediction(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback prediction when model is not trained"""
        # Simple rule-based fallback
        text = contract_data.get("raw_text", "").lower()
        
        high_risk_terms = ["unlimited liability", "irrevocable", "perpetual", "without cause"]
        low_risk_terms = ["30 days notice", "mutual agreement", "cure period"]
        
        high_count = sum(1 for term in high_risk_terms if term in text)
        low_count = sum(1 for term in low_risk_terms if term in text)
        
        if high_count > low_count:
            predicted = "HIGH"
            confidence = 0.6
        elif low_count > high_count:
            predicted = "LOW"
            confidence = 0.6
        else:
            predicted = "MEDIUM"
            confidence = 0.5
        
        return {
            "predicted_risk_level": predicted,
            "confidence": confidence,
            "probabilities": {predicted: confidence},
            "top_contributing_features": [],
            "model_used": "rule_based_fallback",
            "prediction_timestamp": datetime.now().isoformat()
        }
    
    def _save_model(self):
        """Save model to disk"""
        if self.model:
            save_data = {
                'model': self.model,
                'label_encoder': self.label_encoder,
                'feature_names': self.feature_names,
                'saved_at': datetime.now().isoformat()
            }
            
            joblib.dump(save_data, self.model_path)
            print(f"Model saved to {self.model_path}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        if self.model:
            return {
                "model_type": "XGBoost",
                "feature_count": len(self.feature_names),
                "classes": self.label_encoder.classes_.tolist(),
                "is_trained": True,
                "model_path": self.model_path
            }
        else:
            return {
                "model_type": "None",
                "is_trained": False
            }