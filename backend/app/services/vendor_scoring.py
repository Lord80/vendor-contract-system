from typing import List, Dict, Any

def calculate_vendor_score(
    contracts: List[Any], 
    performance_records: List[Any] = None
) -> Dict[str, Any]:
    """
    Calculate a composite Vendor Score based on:
    1. Contract Risk (40% Weight) - Are their legal terms risky?
    2. Operational Performance (60% Weight) - Do they actually deliver?
    """
    
    # 1. Contract Risk Component (0-100, where 100 is Low Risk)
    if not contracts:
        contract_score = 50.0 # Neutral start
        avg_risk = 0
    else:
        # Convert risk scores (usually 0-100 where 100 is High Risk) to Safety Score
        # If risk_score is High (e.g. 90), Safety is 10.
        total_risk = sum(c.risk_score for c in contracts)
        avg_risk = total_risk / len(contracts)
        contract_score = max(0, 100 - avg_risk)

    # 2. Performance Component (0-100)
    # If no performance data exists, we assume neutral/good standing (75) to give benefit of doubt
    if not performance_records:
        perf_score = 75.0
    else:
        # Weighted average of recent performance
        # (Assuming performance_records have an 'overall_score' attribute)
        scores = [p.overall_score for p in performance_records]
        perf_score = sum(scores) / len(scores)

    # 3. Composite Calculation
    # We weight Performance higher than Contract Terms because execution matters more
    final_score = (contract_score * 0.4) + (perf_score * 0.6)
    
    # Rounding
    final_score = round(final_score, 1)
    
    # Determine Risk Level based on Score
    if final_score >= 80:
        vendor_risk = "LOW"
    elif final_score >= 50:
        vendor_risk = "MEDIUM"
    else:
        vendor_risk = "HIGH"

    return {
        "vendor_risk_level": vendor_risk,
        "performance_score": final_score,
        "contract_safety_score": round(contract_score, 1),
        "operational_score": round(perf_score, 1),
        "contract_count": len(contracts)
    }