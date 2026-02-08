from app.services.nlp_service import LegalBERTClassifier

def test_classifier():
    print("Loading AI Model...")
    classifier = LegalBERTClassifier()
    
    sample_text = """
    Either party may terminate this Agreement by providing 60 days notice.
    The Client shall pay a monthly fee of Rs 150000.
    System uptime must be maintained at 99.5%.
    Failure to meet SLA will result in a penalty of 5%.
    This Agreement shall be renewed automatically for one year.
    """
    
    print("\nAnalyzing Text...")
    clauses = classifier.classify_clauses(sample_text)
    
    print("\n--- RESULTS ---")
    for clause_type, sentences in clauses.items():
        if sentences:
            print(f"\n{clause_type.upper()}:")
            for s in sentences:
                print(f"- {s}")

if __name__ == "__main__":
    test_classifier()