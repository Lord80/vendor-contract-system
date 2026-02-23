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
    
    # 1. Contract Risk Component (0-100, where 100 is Low Risk / Safe)
    if not contracts:
        contract_score = 50.0 # Neutral start for new vendors
    else:
        # Convert risk scores (usually 0-100 where 100 is High Risk) to Safety Score
        total_risk = sum(getattr(c, 'risk_score', 50) for c in contracts)
        avg_risk = total_risk / len(contracts)
        contract_score = max(0.0, min(100.0, 100.0 - avg_risk))

    # 2. Performance Component (0-100)
    if not performance_records:
        perf_score = 75.0 # Benefit of doubt for vendors with no SLA violations yet
    else:
        scores = [getattr(p, 'overall_score', 75) for p in performance_records]
        perf_score = sum(scores) / len(scores) if scores else 75.0

    # 3. Composite Calculation (Weighted Average)
    final_score = (contract_score * 0.4) + (perf_score * 0.6)
    final_score = round(max(0.0, min(100.0, final_score)), 1)
    
    # Determine Risk Level based on Final Score
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