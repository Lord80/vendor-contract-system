from app.services.nlp_service import LegalBERTClassifier

if __name__ == "__main__":
    print("Loading AI Model...")
    classifier = LegalBERTClassifier()
    
    sample_text = "This Agreement may be terminated by either party with 30 days written notice."
    
    print(f"\nAnalyzing: '{sample_text}'")
    results = classifier.classify_clauses(sample_text)
    print("Result:", results)