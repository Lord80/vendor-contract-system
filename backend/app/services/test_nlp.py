import sys
import os

# Ensure we can import from app root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import LegalBERTClassifier
from app.services.ner_service import extract_entities

if __name__ == "__main__":
    print("\n--- 🧪 Testing AI Services ---\n")
    
    # 1. Test NLP
    print("1. Loading NLP Model...")
    classifier = LegalBERTClassifier()
    
    sample_text = """
    This Agreement shall commence on January 1, 2024 and continue for a period of one year.
    The Provider shall pay a penalty of $500 for every hour of downtime.
    Either party may terminate this agreement with 30 days written notice.
    Confidential Information includes all business secrets of Acme Corp.
    """
    
    print(f"\n📝 Analyzing Text:\n{sample_text.strip()}\n")
    
    clauses = classifier.classify_clauses(sample_text)
    print("🔍 Identified Clauses:")
    for k, v in clauses.items():
        if v:
            print(f"  - {k.upper()}: {len(v)} sentences")

    # 2. Test NER
    print("\n2. Extracting Entities...")
    entities = extract_entities(sample_text)
    print("🔍 Extracted Entities:", entities)
    
    print("\n✅ Test Complete.")