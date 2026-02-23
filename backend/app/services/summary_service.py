from typing import Dict, Any, List

def generate_contract_summary(
    contract_name: str,
    entities: Dict[str, List[str]],
    clauses: Dict[str, Any],
    risk_level: str
) -> str:
    """
    Generate a human-readable summary from extracted data safely.
    """
    # Safe access to entities with defaults
    orgs = entities.get("organizations", [])
    parties = ", ".join(orgs[:2]) if orgs else "the involved parties"
    
    dates = entities.get("dates", [])
    money = entities.get("money", [])

    # Construct Duration Sentence Safely
    duration = "for an unspecified duration"
    if len(dates) >= 2:
        duration = f"effective from {dates[0]} to {dates[1]}"
    elif len(dates) == 1:
        duration = f"effective starting {dates[0]}"

    # Construct Payment Sentence Safely
    fee_text = f"financial terms involving {money[0]}" if money else "an unspecified consideration"
    
    # Clause Highlights
    highlight_clauses = []
    if clauses.get("renewal"): highlight_clauses.append("auto-renewal")
    if clauses.get("penalty"): highlight_clauses.append("penalties")
    if clauses.get("sla") or clauses.get("service_level"): highlight_clauses.append("SLA obligations")
    if clauses.get("termination"): highlight_clauses.append("termination clauses")
    
    clause_text = ""
    if highlight_clauses:
        clause_text = f" It specifically includes provisions for {', '.join(highlight_clauses)}."

    # Final Assembly
    summary = (
        f"This agreement ('{contract_name}') is between {parties}. "
        f"It is {duration}. "
        f"The agreement outlines {fee_text}.{clause_text} "
        f"The AI risk assessment classifies this contract as **{risk_level}** risk."
    )

    return summary