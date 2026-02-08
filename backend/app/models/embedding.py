from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, ForeignKey
from app.database import Base
from datetime import datetime

class ClauseEmbedding(Base):
    __tablename__ = "clause_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    clause_text = Column(Text, nullable=False)
    clause_type = Column(String, index=True)
    
    # embedding = Column(JSON)
    
    # Metadata
    source_contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    # risk_level = Column(String, default="MEDIUM")
    tags = Column(JSON, default=list)
    
    # Statistics
    similarity_count = Column(Integer, default=0)
    average_similarity = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# class ContractSimilarity(Base):
#     __tablename__ = "contract_similarities"
    
#     id = Column(Integer, primary_key=True, index=True)
#     contract1_id = Column(Integer, ForeignKey("contracts.id"))
#     contract2_id = Column(Integer, ForeignKey("contracts.id"))
    
#     similarity_score = Column(Float)
#     comparison_type = Column(String)
    
#     # Which clauses contributed to similarity
#     matching_clauses = Column(JSON)
    
#     created_at = Column(DateTime, default=datetime.utcnow)