def calculate_vendor_score(contracts: list):
    if not contracts:
        return {
            "vendor_risk_level": "UNKNOWN",
            "average_risk_score": 0,
            "performance_score": 0
        }

    total_risk = sum(c.risk_score for c in contracts)
    avg_risk = total_risk / len(contracts)

    # Vendor risk level
    if avg_risk >= 70:
        vendor_risk = "HIGH"
    elif avg_risk >= 40:
        vendor_risk = "MEDIUM"
    else:
        vendor_risk = "LOW"

    # Performance score (inverse of risk)
    performance_score = max(0, 100 - avg_risk)

    return {
        "vendor_risk_level": vendor_risk,
        "average_risk_score": round(avg_risk, 2),
        "performance_score": round(performance_score, 2)
    }
