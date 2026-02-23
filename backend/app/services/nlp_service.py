import torch
from transformers import pipeline
from typing import Dict, List
import spacy
import logging
import re

logger = logging.getLogger(__name__)

class LegalBERTClassifier:
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        logger.info(f"🔹 NLP Service running on device ID: {self.device}")

        self.clause_types = [
            "termination", "payment", "sla", "penalty", "renewal",
            "confidentiality", "indemnification", "liability", 
            "governing_law", "intellectual_property"
        ]

        try:
            # 🛡️ THE FIX: Load an intelligent Zero-Shot Classifier instead of an untrained base model
            self.classifier = pipeline(
                "zero-shot-classification", 
                model="facebook/bart-large-mnli", 
                device=self.device
            )
        except Exception as e:
            logger.error(f"❌ Failed to load AI Classifier: {e}", exc_info=True)
            self.classifier = None
        
        # Load spaCy safely
        try:
            self.nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer", "attribute_ruler"])
        except OSError:
            logger.warning("spaCy model not found. Using regex fallback.")
            self.nlp = None
        
    def classify_clauses(self, contract_text: str) -> Dict[str, List[str]]:
        """Classify sentences into clause types using Zero-Shot AI"""
        # Fallback to Regex if the heavy AI failed to load
        if self.classifier is None:
            return self._rule_based_classification(contract_text)
        
        sentences = self._split_into_sentences(contract_text)
        results = {clause_type: [] for clause_type in self.clause_types}
        
        batch_size = 16 
        try:
            for i in range(0, len(sentences), batch_size):
                batch = sentences[i:i+batch_size]
                if not batch: continue
                
                try:
                    # 🛡️ THE FIX: Let the pipeline do the heavy lifting
                    predictions = self.classifier(
                        batch,
                        candidate_labels=self.clause_types,
                        multi_label=False # We want the single best matching clause type
                    )
                    
                    # If batch is size 1, pipeline returns a dict instead of a list
                    if isinstance(predictions, dict):
                        predictions = [predictions]
                        
                    for j, prediction in enumerate(predictions):
                        best_label = prediction['labels'][0]
                        best_score = prediction['scores'][0]
                        
                        # 0.60 is a strong confidence threshold for Zero-Shot models
                        if best_score > 0.60:
                            results[best_label].append(batch[j])
                            
                except Exception as e:
                    logger.warning(f"Batch processing failed: {e}")
                    
        finally:
            # Prevent Out-Of-Memory (OOM) errors on sequential contract uploads
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
        return results
    
    def _rule_based_classification(self, text: str) -> Dict[str, List[str]]:
        sentences = self._split_into_sentences(text)
        results = {clause_type: [] for clause_type in self.clause_types}
        
        keyword_map = {
            "termination": ["terminate", "termination", "cancel", "end date"],
            "payment": ["payment", "fee", "invoice", "payable", "currency"],
            "sla": ["service level", "uptime", "availability", "response time"],
            "penalty": ["penalty", "liquidated damages", "breach of contract"],
            "renewal": ["automatic renewal", "extend the term", "renewal period"],
            "confidentiality": ["confidential information", "non-disclosure", "proprietary"],
            "indemnification": ["indemnify", "hold harmless", "defend"],
            "liability": ["limitation of liability", "liable for", "consequential damages"],
            "governing_law": ["governed by", "jurisdiction", "venue"],
            "intellectual_property": ["intellectual property", "ownership rights", "patent", "copyright"]
        }
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for clause_type, keywords in keyword_map.items():
                if any(k in sentence_lower for k in keywords):
                    results[clause_type].append(sentence)
                    break 
        return results
    
    def _split_into_sentences(self, text: str) -> List[str]:
        if self.nlp:
            self.nlp.max_length = len(text) + 1000
            doc = self.nlp(text)
            return [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 15]
        
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s', text)
        return [s.strip() for s in sentences if len(s.strip()) > 15]