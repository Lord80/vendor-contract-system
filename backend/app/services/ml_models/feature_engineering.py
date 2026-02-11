import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple
import re
from datetime import datetime

class ContractFeatureExtractor:
    """
    Extract features from contracts for ML model training.
    """
    
    def __init__(self):
        self.feature_names = []
        
    def extract_features(self, contract_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract numeric features from contract data.
        
        Args:
            contract_data: Dictionary containing contract text and metadata
            
        Returns:
            Dictionary of feature names and values
        """
        text = contract_data.get("raw_text", "")
        clauses = contract_data.get("extracted_clauses", {})
        entities = contract_data.get("entities", {})
        
        features = {}
        
        # 1. Text-based features
        features.update(self._extract_text_features(text))
        
        # 2. Clause-based features
        features.update(self._extract_clause_features(clauses))
        
        # 3. Entity-based features
        features.update(self._extract_entity_features(entities))
        
        # 4. Structural features
        features.update(self._extract_structural_features(text))
        
        # 5. Temporal features (if dates available)
        if "start_date" in contract_data and "end_date" in contract_data:
            features.update(self._extract_temporal_features(
                contract_data["start_date"],
                contract_data["end_date"]
            ))
        
        self.feature_names = list(features.keys())
        return features
    
    def _extract_text_features(self, text: str) -> Dict[str, float]:
        """Extract features from raw text"""
        features = {}
        
        # Basic text statistics
        features["text_length"] = len(text)
        features["word_count"] = len(text.split())
        features["sentence_count"] = len(re.split(r'[.!?]+', text))
        
        # Complexity measures
        if features["word_count"] > 0:
            features["avg_word_length"] = np.mean([len(word) for word in text.split()])
            features["avg_sentence_length"] = features["word_count"] / max(1, features["sentence_count"])
        
        # Risk indicator words
        risk_indicators = [
            "unlimited", "irrevocable", "perpetual", "without cause",
            "penalty", "liquidated damages", "indemnify", "hold harmless"
        ]
        
        text_lower = text.lower()
        for indicator in risk_indicators:
            features[f"contains_{indicator.replace(' ', '_')}"] = 1.0 if indicator in text_lower else 0.0
        
        return features
    
    def _extract_clause_features(self, clauses: Dict[str, List[str]]) -> Dict[str, float]:
        """Extract features from extracted clauses"""
        features = {}
        
        # Presence of key clauses
        key_clauses = ["termination", "payment", "sla", "penalty", "renewal"]
        for clause_type in key_clauses:
            features[f"has_{clause_type}_clause"] = 1.0 if clauses.get(clause_type) else 0.0
            if clause_type in clauses:
                features[f"{clause_type}_count"] = float(len(clauses[clause_type]))
        
        # Clause complexity
        total_clauses = sum(len(clause_list) for clause_list in clauses.values())
        features["total_clauses"] = float(total_clauses)
        
        return features
    
    def _extract_entity_features(self, entities: Dict[str, List[str]]) -> Dict[str, float]:
        """Extract features from named entities"""
        features = {}
        
        # Entity counts
        for entity_type in ["dates", "money", "organizations", "locations"]:
            if entity_type in entities:
                features[f"{entity_type}_count"] = float(len(entities[entity_type]))
            else:
                features[f"{entity_type}_count"] = 0.0
        
        # Financial entities
        if "money" in entities:
            money_values = []
            for money_str in entities["money"]:
                # Extract numeric values from money strings
                numbers = re.findall(r'\d+\.?\d*', money_str)
                if numbers:
                    money_values.extend([float(num) for num in numbers])
            
            if money_values:
                features["max_money_value"] = max(money_values)
                features["avg_money_value"] = np.mean(money_values)
        
        return features
    
    def _extract_structural_features(self, text: str) -> Dict[str, float]:
        """Extract structural features"""
        features = {}
        
        # Section count (assuming sections start with numbers like "1.", "2.")
        section_count = len(re.findall(r'\n\d+\.', text))
        features["section_count"] = float(section_count)
        
        # Table presence
        features["has_tables"] = 1.0 if ("|" in text or "---" in text) else 0.0
        
        # Definition count
        definition_patterns = ["means", "shall mean", "defined as"]
        definition_count = sum(text.lower().count(pattern) for pattern in definition_patterns)
        features["definition_count"] = float(definition_count)
        
        return features
    
    def _extract_temporal_features(self, start_date: str, end_date: str) -> Dict[str, float]:
        """Extract features from dates"""
        features = {}
        
        try:
            start = datetime.strptime(str(start_date), "%Y-%m-%d")
            end = datetime.strptime(str(end_date), "%Y-%m-%d")
            
            duration_days = (end - start).days
            features["contract_duration_days"] = float(duration_days)
            features["contract_duration_years"] = float(duration_days / 365.25)
            
        except:
            features["contract_duration_days"] = 365.0  # Default 1 year
            features["contract_duration_years"] = 1.0
        
        return features
    
    def get_feature_names(self) -> List[str]:
        """Get list of feature names"""
        return self.feature_names