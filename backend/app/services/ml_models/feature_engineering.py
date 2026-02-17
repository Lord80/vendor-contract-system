import numpy as np
import re
from typing import Dict, List, Any
from datetime import datetime

class ContractFeatureExtractor:
    """
    Extract features from contracts for ML model training.
    Optimized for performance with pre-compiled regex.
    """
    
    def __init__(self):
        self.feature_names = []
        
        # Pre-compile regex patterns for speed
        self.sentence_split = re.compile(r'[.!?]+')
        self.number_extract = re.compile(r'\d+\.?\d*')
        self.section_header = re.compile(r'\n\d+\.')
        
        # Risk keywords
        self.risk_indicators = [
            "unlimited", "irrevocable", "perpetual", "without cause",
            "penalty", "liquidated damages", "indemnify", "hold harmless"
        ]
        
        self.definition_patterns = ["means", "shall mean", "defined as"]
        self.key_clauses = ["termination", "payment", "sla", "penalty", "renewal"]
        self.entities_types = ["dates", "money", "organizations", "locations"]

    def extract_features(self, contract_data: Dict[str, Any]) -> Dict[str, float]:
        text = contract_data.get("raw_text", "") or ""
        clauses = contract_data.get("extracted_clauses") or {}
        entities = contract_data.get("entities") or {}
        
        features = {}
        
        features.update(self._extract_text_features(text))
        features.update(self._extract_clause_features(clauses))
        features.update(self._extract_entity_features(entities))
        features.update(self._extract_structural_features(text))
        
        # Safely handle dates
        start = contract_data.get("start_date")
        end = contract_data.get("end_date")
        if start and end:
            features.update(self._extract_temporal_features(str(start), str(end)))
        else:
            features["contract_duration_days"] = 365.0
            features["contract_duration_years"] = 1.0
        
        self.feature_names = list(features.keys())
        return features
    
    def _extract_text_features(self, text: str) -> Dict[str, float]:
        features = {}
        words = text.split()
        word_count = len(words)
        
        features["text_length"] = len(text)
        features["word_count"] = word_count
        features["sentence_count"] = len(self.sentence_split.split(text))
        
        if word_count > 0:
            features["avg_word_length"] = np.mean([len(w) for w in words])
            features["avg_sentence_length"] = word_count / max(1, features["sentence_count"])
        else:
            features["avg_word_length"] = 0.0
            features["avg_sentence_length"] = 0.0
        
        text_lower = text.lower()
        for indicator in self.risk_indicators:
            features[f"contains_{indicator.replace(' ', '_')}"] = 1.0 if indicator in text_lower else 0.0
        
        return features
    
    def _extract_clause_features(self, clauses: Dict[str, List[str]]) -> Dict[str, float]:
        features = {}
        total_clauses = 0
        
        for clause_type in self.key_clauses:
            clause_list = clauses.get(clause_type, [])
            count = len(clause_list)
            features[f"has_{clause_type}_clause"] = 1.0 if count > 0 else 0.0
            features[f"{clause_type}_count"] = float(count)
            total_clauses += count
        
        features["total_clauses"] = float(total_clauses)
        return features
    
    def _extract_entity_features(self, entities: Dict[str, List[str]]) -> Dict[str, float]:
        features = {}
        
        for entity_type in self.entities_types:
            features[f"{entity_type}_count"] = float(len(entities.get(entity_type, [])))
        
        money_values = []
        if "money" in entities:
            for money_str in entities["money"]:
                numbers = self.number_extract.findall(money_str)
                if numbers:
                    money_values.extend([float(num) for num in numbers])
            
        if money_values:
            features["max_money_value"] = max(money_values)
            features["avg_money_value"] = np.mean(money_values)
        else:
            features["max_money_value"] = 0.0
            features["avg_money_value"] = 0.0
        
        return features
    
    def _extract_structural_features(self, text: str) -> Dict[str, float]:
        features = {}
        
        features["section_count"] = float(len(self.section_header.findall(text)))
        features["has_tables"] = 1.0 if ("|" in text and "---" in text) else 0.0
        
        text_lower = text.lower()
        features["definition_count"] = sum(text_lower.count(p) for p in self.definition_patterns)
        
        return features
    
    def _extract_temporal_features(self, start_date: str, end_date: str) -> Dict[str, float]:
        features = {}
        try:
            # Handle possible datetime formats or ISO strings
            start = datetime.fromisoformat(start_date) if 'T' in start_date else datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.fromisoformat(end_date) if 'T' in end_date else datetime.strptime(end_date, "%Y-%m-%d")
            
            duration_days = (end - start).days
            # Normalize negative durations
            duration_days = max(1, duration_days) 
            
            features["contract_duration_days"] = float(duration_days)
            features["contract_duration_years"] = float(duration_days / 365.25)
        except Exception:
            features["contract_duration_days"] = 365.0
            features["contract_duration_years"] = 1.0
        
        return features