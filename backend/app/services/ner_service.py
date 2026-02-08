import spacy

nlp = spacy.load("en_core_web_sm")

def extract_entities(contract_text: str):
    doc = nlp(contract_text)

    entities = {
        "dates": [],
        "money": [],
        "organizations": [],
        "locations": []
    }

    for ent in doc.ents:
        if ent.label_ == "DATE":
            entities["dates"].append(ent.text)
        elif ent.label_ == "MONEY":
            entities["money"].append(ent.text)
        elif ent.label_ == "ORG":
            entities["organizations"].append(ent.text)
        elif ent.label_ in ["GPE", "LOC"]:
            entities["locations"].append(ent.text)

    # remove duplicates
    for key in entities:
        entities[key] = list(set(entities[key]))

    return entities
