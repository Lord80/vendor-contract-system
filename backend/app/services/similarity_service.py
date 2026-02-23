import numpy as np
from typing import List, Dict, Any, Optional
import json
import pickle
import os
import shutil
import faiss
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ContractSimilarityEngine:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self.index = None
        
        self.clause_metadata: List[Dict] = []
        self.clause_texts: List[str] = []
        
        self.data_dir = "app/data/embeddings"
        self.metadata_path = os.path.join(self.data_dir, "clause_metadata.json")
        self.embeddings_path = os.path.join(self.data_dir, "clause_embeddings.npy")
        self.texts_path = os.path.join(self.data_dir, "clause_texts.pkl")
        
        self._is_initialized = False

    def _initialize_model(self):
        if not self.model:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(self.model_name)
                self.embedding_dim = self.model.get_sentence_embedding_dimension()
                self.index = faiss.IndexFlatIP(self.embedding_dim)
                self._load_existing_data()
                self._is_initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize Similarity Engine: {e}")
                raise e

    def _load_existing_data(self):
        if os.path.exists(self.metadata_path) and os.path.exists(self.embeddings_path):
            try:
                with open(self.metadata_path, 'r') as f:
                    self.clause_metadata = json.load(f)
                with open(self.texts_path, 'rb') as f:
                    self.clause_texts = pickle.load(f)
                embeddings = np.load(self.embeddings_path)
                if self.index:
                    self.index.reset()
                    self.index.add(embeddings.astype('float32'))
                logger.info(f"✅ Loaded {len(self.clause_texts)} clauses into Vector DB")
            except Exception as e:
                logger.error(f"Could not load existing embeddings: {e}")

    def _save_data(self):
        """Safely saves FAISS data, avoiding Windows File Lock errors"""
        os.makedirs(self.data_dir, exist_ok=True)
        if not self.clause_texts: return
        
        try:
            embeddings = self.model.encode(self.clause_texts)
            faiss.normalize_L2(embeddings)
            
            # 🛡️ THE FIX: Open a file object first so numpy doesn't silently add an extra ".npy"
            with open(self.embeddings_path + ".tmp", 'wb') as f:
                np.save(f, embeddings)
                
            with open(self.metadata_path + ".tmp", 'w') as f:
                json.dump(self.clause_metadata, f, indent=2)
            with open(self.texts_path + ".tmp", 'wb') as f:
                pickle.dump(self.clause_texts, f)
                
            # Safe replace for Windows
            def safe_replace(src, dst):
                if os.path.exists(dst):
                    try:
                        os.remove(dst)
                    except PermissionError:
                        pass # Windows file lock fallback
                shutil.move(src, dst)

            safe_replace(self.embeddings_path + ".tmp", self.embeddings_path)
            safe_replace(self.metadata_path + ".tmp", self.metadata_path)
            safe_replace(self.texts_path + ".tmp", self.texts_path)
            
        except Exception as e:
            logger.error(f"❌ Failed to save Vector DB: {e}", exc_info=True)

    def add_clause_to_database(self, clause_text: str, clause_type: str, source_contract: str = "unknown", risk_level: str = "MEDIUM", tags: List[str] = None):
        self._initialize_model()
        clause_text = clause_text.strip()
        if not clause_text: return -1

        embedding = self.model.encode([clause_text])
        faiss.normalize_L2(embedding)
        self.index.add(embedding.astype('float32'))
        
        self.clause_metadata.append({
            "id": len(self.clause_texts),
            "clause_type": clause_type,
            "source_contract": source_contract,
            "risk_level": risk_level,
            "tags": tags or [],
            "added_date": datetime.now().isoformat(),
            "length_chars": len(clause_text)
        })
        self.clause_texts.append(clause_text)
        return len(self.clause_texts) - 1

    def find_similar_clauses(self, query_text: str, clause_type: Optional[str] = None, top_k: int = 10, similarity_threshold: float = 0.7, filter_by_risk: Optional[str] = None) -> List[Dict[str, Any]]:
        self._initialize_model()
        if not self.clause_texts: return []

        query_embedding = self.model.encode([query_text])
        faiss.normalize_L2(query_embedding)
        distances, indices = self.index.search(query_embedding.astype('float32'), top_k * 5)
        
        results = []
        seen_texts = set()
        
        for idx, score in zip(indices[0], distances[0]):
            if idx < 0 or idx >= len(self.clause_texts): continue
            similarity = float(score)
            if similarity < similarity_threshold: continue
            
            meta = self.clause_metadata[idx]
            text = self.clause_texts[idx]
            
            if clause_type and meta["clause_type"] != clause_type: continue
            if filter_by_risk and meta["risk_level"] != filter_by_risk: continue
            if text in seen_texts: continue
            seen_texts.add(text)
            
            results.append({
                "text": text,
                "similarity_score": round(similarity, 3),
                "clause_type": meta["clause_type"],
                "risk_level": meta["risk_level"],
                "source_contract": meta["source_contract"],
                "match_type": self._get_match_type(similarity)
            })
            if len(results) >= top_k: break
        return results

    # ✅ FIXED: Full Implementation of 1:1 Contract Comparison
    def compare_contracts(self, text1: str, text2: str, compare_by: str = "clauses") -> Dict[str, Any]:
        self._initialize_model()
        
        # 1. Overall Semantic Comparison
        if compare_by == "overall":
            emb1 = self.model.encode([text1])
            emb2 = self.model.encode([text2])
            faiss.normalize_L2(emb1)
            faiss.normalize_L2(emb2)
            similarity = float(np.dot(emb1, emb2.T)[0][0])
            return {
                "similarity_score": round(similarity, 3),
                "comparison_type": "overall",
                "interpretation": self._interpret_similarity(similarity)
            }
        
        # 2. Detailed Clause-by-Clause Comparison
        elif compare_by == "clauses":
            # Extract clauses on the fly
            clauses1 = self._extract_clauses(text1)
            clauses2 = self._extract_clauses(text2)
            
            if not clauses1 or not clauses2:
                return {
                    "similarity_score": 0.0,
                    "comparison_type": "clauses",
                    "num_clauses_compared": 0,
                    "clause_comparisons": []
                }

            # Create a temporary index for Contract 2
            emb2 = self.model.encode(clauses2)
            faiss.normalize_L2(emb2)
            temp_index = faiss.IndexFlatIP(self.embedding_dim)
            temp_index.add(emb2.astype('float32'))

            comparisons = []
            
            # Compare first 20 clauses of Contract 1 against ALL of Contract 2
            for c1_text in clauses1[:20]: 
                emb1 = self.model.encode([c1_text])
                faiss.normalize_L2(emb1)
                
                # Search for best match in Contract 2
                D, I = temp_index.search(emb1.astype('float32'), 1)
                
                sim = float(D[0][0])
                best_match_idx = I[0][0]
                
                # Only keep relevant matches
                if sim > 0.6: 
                    best_match_text = clauses2[best_match_idx]
                    comparisons.append({
                        "clause": c1_text,
                        "best_match": best_match_text,
                        "similarity": round(sim, 3)
                    })

            avg_sim = sum(c['similarity'] for c in comparisons) / len(comparisons) if comparisons else 0

            return {
                "similarity_score": round(avg_sim, 3),
                "comparison_type": "clauses",
                "num_clauses_compared": len(comparisons),
                "clause_comparisons": comparisons
            }
            
        return {}

    def _extract_clauses(self, text: str) -> List[str]:
        """Split text into clause-like chunks"""
        # Split by periods, but keep chunks substantial (>30 chars)
        chunks = re.split(r'(?<=[.!?])\s+', text)
        return [c.strip() for c in chunks if len(c.strip()) > 30]

    def _get_match_type(self, score: float) -> str:
        if score > 0.95: return "EXACT"
        if score > 0.85: return "VERY_STRONG"
        if score > 0.75: return "STRONG"
        return "MODERATE"

    def _interpret_similarity(self, score: float) -> str:
        if score > 0.9: return "Identical Templates"
        if score > 0.7: return "High Similarity"
        if score > 0.5: return "Structural Similarity"
        return "Different Content"

    def get_database_stats(self) -> Dict[str, Any]:
        return {
            "total_clauses": len(self.clause_texts),
            "is_initialized": self._is_initialized,
            "backend": "FAISS IndexFlatIP"
        }