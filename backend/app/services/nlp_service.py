import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Dict, List
import re

class LegalBERTClassifier:
    def __init__(self, model_path="nlpaueb/legal-bert-base-uncased"):
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_path, 
                num_labels=10
            )
            # Use CPU for compatibility (change to CUDA if available)
            self.model.eval()
        except:
            # Fallback to rule-based if model fails to load
            self.model = None
        
        self.clause_types = [
            "termination", "payment", "sla", "penalty", "renewal",
            "confidentiality", "indemnification", "liability", 
            "governing_law", "intellectual_property"
        ]
        
    def classify_clauses(self, contract_text: str) -> Dict[str, List[str]]:
        """Classify sentences into clause types"""
        if self.model is None:
            return self._rule_based_classification(contract_text)
        
        sentences = self._split_into_sentences(contract_text)
        results = {clause_type: [] for clause_type in self.clause_types}
        
        # Process in batches for efficiency
        batch_size = 8
        for i in range(0, len(sentences), batch_size):
            batch = sentences[i:i+batch_size]
            
            inputs = self.tokenizer(
                batch, 
                return_tensors="pt", 
                padding=True, 
                truncation=True, 
                max_length=256
            )
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.softmax(outputs.logits, dim=-1)
                predicted_classes = torch.argmax(predictions, dim=-1)
                
                for j, (sentence, pred_class) in enumerate(zip(batch, predicted_classes)):
                    confidence = predictions[j][pred_class].item()
                    if confidence > 0.6:
                        clause_type = self.clause_types[pred_class]
                        results[clause_type].append(sentence)
        
        return results
    
    def _rule_based_classification(self, text: str) -> Dict[str, List[str]]:
        """Fallback rule-based classification"""
        sentences = self._split_into_sentences(text)
        results = {clause_type: [] for clause_type in self.clause_types}
        
        keyword_map = {
            "termination": ["terminate", "termination", "cancel", "end"],
            "payment": ["payment", "fee", "invoice", "payable", "amount"],
            "sla": ["service level", "uptime", "availability", "response time"],
            "penalty": ["penalty", "fine", "liquidated damages", "breach"],
            "renewal": ["renew", "renewal", "extend", "extension"],
            "confidentiality": ["confidential", "non-disclosure", "nda", "proprietary"],
            "indemnification": ["indemnify", "indemnification", "hold harmless"],
            "liability": ["liability", "damages", "warranty", "warrant"],
            "governing_law": ["governing law", "jurisdiction", "venue", "dispute"],
            "intellectual_property": ["intellectual property", "ip", "copyright", "patent"]
        }
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for clause_type, keywords in keyword_map.items():
                if any(keyword in sentence_lower for keyword in keywords):
                    results[clause_type].append(sentence)
                    break
        
        return results
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting - could use NLTK or spaCy for better results
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 10]