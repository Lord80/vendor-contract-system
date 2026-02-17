from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class ClauseEmbedding(Base):
    __tablename__ = "clause_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    clause_text = Column(Text, nullable=False)
    clause_type = Column(String, index=True)
    
    # Vector embedding stored as JSON (Postgres) or specialized vector type if using pgvector extension
    # embedding = Column(JSON) 
    
    source_contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True, index=True)
    tags = Column(JSON, default=list)
    
    # Statistics for usage analysis
    similarity_count = Column(Integer, default=0)
    average_similarity = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contract = relationship("Contract", backref="embeddings")

    # Composite index for faster filtering during vector search
    __table_args__ = (
        Index('ix_clause_type_contract', 'clause_type', 'source_contract_id'),
    )