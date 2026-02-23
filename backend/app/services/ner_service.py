import spacy
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# Load spaCy model with safe fallback
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("⚠️ 'en_core_web_sm' not found. Downloading...")
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Set max length to 2 million characters safely (approx 500 pages)
nlp.max_length = 2000000 

def extract_entities(contract_text: str) -> Dict[str, List[str]]:
    """
    Extract Named Entities (Dates, Money, Orgs) using spaCy.
    Safely handles empty text and deduplicates results.
    """
    if not contract_text or not isinstance(contract_text, str):
        return {"dates": [], "money": [], "organizations": [], "locations": []}

    # Truncate text if it exceeds the max length to prevent OOM errors
    if len(contract_text) > nlp.max_length:
        logger.warning(f"Contract text too long ({len(contract_text)} chars). Truncating for NER.")
        contract_text = contract_text[:nlp.max_length]

    try:
        doc = nlp(contract_text)
    except Exception as e:
        logger.error(f"spaCy NER processing failed: {e}")
        return {"dates": [], "money": [], "organizations": [], "locations": []}

    entities = {
        "dates": set(),
        "money": set(),
        "organizations": set(),
        "locations": set()
    }

    for ent in doc.ents:
        # Clean text: remove newlines, tabs, and extra spaces
        clean_text = " ".join(ent.text.split())
        
        # Skip garbage entities (too short or just punctuation)
        if len(clean_text) < 2:
            continue

        if ent.label_ == "DATE":
            entities["dates"].add(clean_text)
        elif ent.label_ == "MONEY":
            entities["money"].add(clean_text)
        elif ent.label_ == "ORG":
            entities["organizations"].add(clean_text)
        elif ent.label_ in ["GPE", "LOC"]:
            entities["locations"].add(clean_text)

    # Convert sets back to sorted lists for predictable JSON serialization
    return {k: sorted(list(v)) for k, v in entities.items()}