from datetime import date
from typing import List, Dict, Any

def get_contract_alerts(contracts: List[Any], days_threshold: int = 30) -> List[Dict[str, Any]]:
    """
    Generate alerts for expiring or high-risk contracts.
    """
    alerts = []
    today = date.today()

    for contract in contracts:
        # 1. Expiry Alert
        if contract.end_date:
            days_left = (contract.end_date - today).days
            
            # Check for expired contracts too
            if days_left < 0:
                alerts.append({
                    "type": "EXPIRED",
                    "contract_id": contract.id,
                    "severity": "HIGH",
                    "message": f"Contract '{contract.contract_name}' expired {abs(days_left)} days ago"
                })
            elif days_left <= days_threshold:
                alerts.append({
                    "type": "EXPIRY",
                    "contract_id": contract.id,
                    "severity": "MEDIUM" if days_left > 7 else "HIGH",
                    "message": f"Contract '{contract.contract_name}' expires in {days_left} days"
                })

        # 2. Risk Alert
        if contract.risk_level == "HIGH":
            alerts.append({
                "type": "HIGH_RISK",
                "contract_id": contract.id,
                "severity": "HIGH",
                "message": f"Contract '{contract.contract_name}' is flagged as HIGH risk"
            })

    return alerts