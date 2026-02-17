import spacy
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# Load spaCy model with fallback
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("⚠️ 'en_core_web_sm' not found. Downloading...")
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def extract_entities(contract_text: str) -> Dict[str, List[str]]:
    """
    Extract Named Entities (Dates, Money, Orgs) using spaCy.
    """
    # Increase max length for large contracts to prevent errors
    nlp.max_length = 2000000 
    
    doc = nlp(contract_text)

    entities = {
        "dates": set(),
        "money": set(),
        "organizations": set(),
        "locations": set()
    }

    for ent in doc.ents:
        # Clean text: remove newlines and extra spaces
        clean_text = ent.text.strip().replace('\n', ' ')
        
        if not clean_text:
            continue

        if ent.label_ == "DATE":
            entities["dates"].add(clean_text)
        elif ent.label_ == "MONEY":
            entities["money"].add(clean_text)
        elif ent.label_ == "ORG":
            entities["organizations"].add(clean_text)
        elif ent.label_ in ["GPE", "LOC"]:
            entities["locations"].add(clean_text)

    # Convert sets back to lists for JSON serialization
    return {k: list(v) for k, v in entities.items()}