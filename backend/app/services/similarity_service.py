import numpy as np
from typing import List, Dict, Any, Tuple
import json
import pickle
import os
from sentence_transformers import SentenceTransformer
import faiss
from datetime import datetime

class ContractSimilarityEngine:
    """
    Advanced similarity engine using sentence transformers and FAISS
    for fast similarity search across thousands of contracts.
    """
    
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        """
        Initialize the similarity engine.
        
        Args:
            model_name: Sentence transformer model to use
                      Options: 'all-MiniLM-L6-v2', 'paraphrase-mpnet-base-v2'
        """
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
        # FAISS index for fast similarity search
        self.index = faiss.IndexFlatL2(self.embedding_dim)
        
        # Metadata storage
        self.clause_metadata = []  # List of dictionaries with clause info
        self.clause_texts = []     # Original clause texts
        
        # Load existing database if available
        self._load_existing_data()
    
    def _load_existing_data(self):
        """Load pre-existing clause database"""
        data_dir = "app/data/embeddings"
        os.makedirs(data_dir, exist_ok=True)
        
        metadata_path = os.path.join(data_dir, "clause_metadata.json")
        embeddings_path = os.path.join(data_dir, "clause_embeddings.npy")
        texts_path = os.path.join(data_dir, "clause_texts.pkl")
        
        if os.path.exists(metadata_path) and os.path.exists(embeddings_path):
            print("Loading existing clause database...")
            
            # Load metadata
            with open(metadata_path, 'r') as f:
                self.clause_metadata = json.load(f)
            
            # Load texts
            with open(texts_path, 'rb') as f:
                self.clause_texts = pickle.load(f)
            
            # Load embeddings and rebuild FAISS index
            embeddings = np.load(embeddings_path)
            self.index = faiss.IndexFlatL2(self.embedding_dim)
            self.index.add(embeddings.astype('float32'))
            
            print(f"Loaded {len(self.clause_texts)} clauses from database")
    
    def _save_data(self):
        """Save current database to disk"""
        data_dir = "app/data/embeddings"
        os.makedirs(data_dir, exist_ok=True)
        
        # Get embeddings from FAISS index
        # Note: FAISS doesn't directly expose stored vectors, so we need to store separately
        if self.clause_texts and len(self.clause_texts) > 0:
            # Recompute embeddings for storage (or store when adding)
            embeddings = self.model.encode(self.clause_texts)
            
            np.save(os.path.join(data_dir, "clause_embeddings.npy"), embeddings)
            
            with open(os.path.join(data_dir, "clause_metadata.json"), 'w') as f:
                json.dump(self.clause_metadata, f, indent=2)
            
            with open(os.path.join(data_dir, "clause_texts.pkl"), 'wb') as f:
                pickle.dump(self.clause_texts, f)
    
    def add_clause_to_database(
        self,
        clause_text: str,
        clause_type: str,
        source_contract: str = "unknown",
        risk_level: str = "MEDIUM",
        tags: List[str] = None
    ):
        """
        Add a new clause to the similarity database.
        
        Args:
            clause_text: The actual clause text
            clause_type: Type of clause (termination, payment, etc.)
            source_contract: Where this clause came from
            risk_level: Associated risk level (LOW, MEDIUM, HIGH)
            tags: Additional tags for filtering
        """
        # Generate embedding
        embedding = self.model.encode([clause_text])[0]
        
        # Add to FAISS index
        self.index.add(embedding.reshape(1, -1).astype('float32'))
        
        # Store metadata
        self.clause_metadata.append({
            "id": len(self.clause_texts),
            "clause_type": clause_type,
            "source_contract": source_contract,
            "risk_level": risk_level,
            "tags": tags or [],
            "added_date": datetime.now().isoformat(),
            "length_chars": len(clause_text),
            "length_words": len(clause_text.split())
        })
        
        # Store original text
        self.clause_texts.append(clause_text)
        
        # Save periodically (every 100 clauses)
        if len(self.clause_texts) % 100 == 0:
            self._save_data()
        
        return len(self.clause_texts) - 1  # Return clause ID
    
    def find_similar_clauses(
        self,
        query_text: str,
        clause_type: str = None,
        top_k: int = 10,
        similarity_threshold: float = 0.7,
        filter_by_risk: str = None,
        filter_by_tags: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Find similar clauses in the database.
        
        Args:
            query_text: Text to find similar clauses for
            clause_type: Filter by clause type (optional)
            top_k: Number of results to return
            similarity_threshold: Minimum cosine similarity (0-1)
            filter_by_risk: Filter by risk level (LOW, MEDIUM, HIGH)
            filter_by_tags: Filter by tags
            
        Returns:
            List of similar clauses with metadata
        """
        if len(self.clause_texts) == 0:
            return []
        
        # Generate embedding for query
        query_embedding = self.model.encode([query_text])[0].reshape(1, -1)
        
        # Search in FAISS
        distances, indices = self.index.search(query_embedding.astype('float32'), top_k * 3)
        
        # Convert L2 distance to cosine similarity (approximate)
        # For normalized vectors: similarity ≈ 1 - distance/2
        similarities = 1 - (distances[0] / 2)
        
        results = []
        seen_texts = set()  # Avoid duplicates
        
        for idx, similarity in zip(indices[0], similarities):
            if idx >= len(self.clause_texts) or idx < 0:
                continue
            
            metadata = self.clause_metadata[idx]
            clause_text = self.clause_texts[idx]
            
            # Apply filters
            if clause_type and metadata["clause_type"] != clause_type:
                continue
            
            if filter_by_risk and metadata["risk_level"] != filter_by_risk:
                continue
            
            if filter_by_tags and not any(tag in metadata["tags"] for tag in filter_by_tags):
                continue
            
            if similarity < similarity_threshold:
                continue
            
            # Skip exact duplicates
            if clause_text in seen_texts:
                continue
            seen_texts.add(clause_text)
            
            results.append({
                "id": idx,
                "text": clause_text,
                "similarity_score": float(similarity),
                "clause_type": metadata["clause_type"],
                "risk_level": metadata["risk_level"],
                "source_contract": metadata["source_contract"],
                "tags": metadata["tags"],
                "match_type": self._get_match_type(similarity)
            })
            
            if len(results) >= top_k:
                break
        
        return results
    
    def _get_match_type(self, similarity: float) -> str:
        """Categorize match quality based on similarity score"""
        if similarity > 0.9:
            return "EXACT_MATCH"
        elif similarity > 0.8:
            return "STRONG_MATCH"
        elif similarity > 0.7:
            return "GOOD_MATCH"
        elif similarity > 0.6:
            return "PARTIAL_MATCH"
        else:
            return "WEAK_MATCH"
    
    def compare_contracts(
        self,
        contract1_text: str,
        contract2_text: str,
        compare_by: str = "clauses"
    ) -> Dict[str, Any]:
        """
        Compare two contracts and find similarities.
        
        Args:
            contract1_text: First contract text
            contract2_text: Second contract text
            compare_by: What to compare ('clauses', 'sections', 'overall')
            
        Returns:
            Similarity analysis between contracts
        """
        if compare_by == "overall":
            # Compare entire contracts
            embedding1 = self.model.encode([contract1_text])[0]
            embedding2 = self.model.encode([contract2_text])[0]
            
            similarity = float(
                np.dot(embedding1, embedding2) / 
                (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
            )
            
            return {
                "similarity_score": similarity,
                "comparison_type": "overall",
                "interpretation": self._interpret_overall_similarity(similarity)
            }
        
        elif compare_by == "clauses":
            # Compare clause by clause
            clauses1 = self._extract_clauses(contract1_text)
            clauses2 = self._extract_clauses(contract2_text)
            
            comparisons = []
            for clause1 in clauses1[:20]:  # Limit for performance
                similar = self.find_similar_clauses(clause1, top_k=1)
                if similar and similar[0]["similarity_score"] > 0.7:
                    comparisons.append({
                        "clause": clause1[:100] + "...",
                        "best_match": similar[0]["text"][:100] + "...",
                        "similarity": similar[0]["similarity_score"]
                    })
            
            avg_similarity = np.mean([c["similarity"] for c in comparisons]) if comparisons else 0
            
            return {
                "similarity_score": float(avg_similarity),
                "comparison_type": "clauses",
                "num_clauses_compared": len(comparisons),
                "clause_comparisons": comparisons[:5]  # Top 5
            }
    
    def _extract_clauses(self, text: str) -> List[str]:
        """Simple clause extraction by sentence splitting"""
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 20]
    
    def _interpret_overall_similarity(self, similarity: float) -> str:
        """Human-readable interpretation of similarity score"""
        if similarity > 0.9:
            return "Contracts are nearly identical, likely from same template"
        elif similarity > 0.7:
            return "Contracts are very similar with minor variations"
        elif similarity > 0.5:
            return "Contracts share common structure and some clauses"
        elif similarity > 0.3:
            return "Contracts have some similarities but are different"
        else:
            return "Contracts are substantially different"
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get statistics about the clause database"""
        if not self.clause_metadata:
            return {"total_clauses": 0}
        
        # Count by clause type
        clause_types = {}
        risk_levels = {}
        
        for metadata in self.clause_metadata:
            clause_type = metadata["clause_type"]
            risk_level = metadata["risk_level"]
            
            clause_types[clause_type] = clause_types.get(clause_type, 0) + 1
            risk_levels[risk_level] = risk_levels.get(risk_level, 0) + 1
        
        return {
            "total_clauses": len(self.clause_texts),
            "clause_types": clause_types,
            "risk_distribution": risk_levels,
            "database_size_mb": self._estimate_database_size()
        }
    
    def _estimate_database_size(self) -> float:
        """Estimate database size in MB"""
        total_bytes = 0
        
        # Estimate text size
        for text in self.clause_texts:
            total_bytes += len(text.encode('utf-8'))
        
        # Estimate embeddings size (float32, 384 dimensions)
        total_bytes += len(self.clause_texts) * 384 * 4
        
        return round(total_bytes / (1024 * 1024), 2)
    
    def initialize_with_sample_clauses(self):
        """Initialize database with sample clauses if empty"""
        if len(self.clause_texts) > 0:
            return  # Already initialized
        
        print("Initializing with sample clauses...")
        
        sample_clauses = [
            {
                "text": "Either party may terminate this agreement with thirty (30) days written notice.",
                "type": "termination",
                "risk": "LOW"
            },
            {
                "text": "Termination for cause requires material breach and a fifteen (15) day cure period.",
                "type": "termination",
                "risk": "LOW"
            },
            {
                "text": "This agreement may be terminated immediately for material breach without cure period.",
                "type": "termination",
                "risk": "HIGH"
            },
            {
                "text": "Payment shall be made within thirty (30) days of invoice receipt.",
                "type": "payment",
                "risk": "LOW"
            },
            {
                "text": "Late payments shall incur interest at the rate of 1.5% per month.",
                "type": "payment",
                "risk": "MEDIUM"
            },
            {
                "text": "The service provider guarantees 99.9% uptime availability.",
                "type": "sla",
                "risk": "LOW"
            },
            {
                "text": "Liquidated damages for failure to meet SLA shall be 20% of monthly fee.",
                "type": "penalty",
                "risk": "HIGH"
            },
            {
                "text": "This agreement shall automatically renew for successive one-year terms.",
                "type": "renewal",
                "risk": "MEDIUM"
            },
            {
                "text": "Each party agrees to maintain the confidentiality of proprietary information.",
                "type": "confidentiality",
                "risk": "LOW"
            },
            {
                "text": "Party A shall indemnify and hold harmless Party B from any third-party claims.",
                "type": "indemnification",
                "risk": "MEDIUM"
            }
        ]
        
        for clause in sample_clauses:
            self.add_clause_to_database(
                clause_text=clause["text"],
                clause_type=clause["type"],
                source_contract="sample_library",
                risk_level=clause["risk"],
                tags=["sample", "best_practice"]
            )
        
        self._save_data()
        print(f"Initialized with {len(sample_clauses)} sample clauses")