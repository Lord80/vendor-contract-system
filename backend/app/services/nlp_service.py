import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Dict, List
import spacy
import logging

logger = logging.getLogger(__name__)

class LegalBERTClassifier:
    def __init__(self, model_path="nlpaueb/legal-bert-base-uncased"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"🔹 NLP Service running on: {self.device}")

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_path, 
                num_labels=10
            ).to(self.device)
            self.model.eval()
        except Exception as e:
            logger.error(f"❌ Failed to load LegalBERT: {e}")
            self.model = None
        
        # Load spaCy for better sentence splitting
        try:
            self.nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger"])
        except:
            self.nlp = None

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
        batch_size = 16 # Increased batch size
        for i in range(0, len(sentences), batch_size):
            batch = sentences[i:i+batch_size]
            if not batch: continue
            
            try:
                inputs = self.tokenizer(
                    batch, 
                    return_tensors="pt", 
                    padding=True, 
                    truncation=True, 
                    max_length=128 # Reduced max_length for speed (clauses usually short)
                ).to(self.device)
                
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    predictions = torch.softmax(outputs.logits, dim=-1)
                    predicted_classes = torch.argmax(predictions, dim=-1)
                    
                    for j, (sentence, pred_class) in enumerate(zip(batch, predicted_classes)):
                        confidence = predictions[j][pred_class].item()
                        # Thresholding
                        if confidence > 0.75: # Stricter threshold
                            clause_type = self.clause_types[min(pred_class.item(), len(self.clause_types)-1)]
                            results[clause_type].append(sentence)
            except Exception as e:
                logger.warning(f"Batch processing failed: {e}")
        
        return results
    
    def _rule_based_classification(self, text: str) -> Dict[str, List[str]]:
        """Fallback rule-based classification"""
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
        """Split text into sentences using spaCy if available, else robust regex"""
        if self.nlp:
            # Increase limit for large docs
            self.nlp.max_length = len(text) + 1000
            doc = self.nlp(text)
            return [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 15]
        
        # Fallback Regex (Handles Mr., Dr., etc. better than simple split)
        import re
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
        return [s.strip() for s in sentences if len(s.strip()) > 15]