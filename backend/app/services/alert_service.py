from datetime import date
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

def get_contract_alerts(contracts: List[Any], days_threshold: int = 30) -> List[Dict[str, Any]]:
    """
    Generate alerts for expiring or high-risk contracts.
    Ignores contracts that are already terminated, renewed, or inactive.
    """
    alerts = []
    today = date.today()

    # Define statuses that don't need alerts
    inactive_statuses = ["TERMINATED", "RENEWED", "CANCELED", "INACTIVE"]

    for contract in contracts:
        status = getattr(contract, "status", "ACTIVE").upper()
        
        # Skip alerts for contracts we don't care about anymore
        if status in inactive_statuses:
            continue

        # 1. Expiry Alert
        end_date = getattr(contract, "end_date", None)
        if end_date:
            try:
                days_left = (end_date - today).days
                
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
            except Exception as e:
                logger.warning(f"Error calculating dates for contract {contract.id}: {e}")

        # 2. Risk Alert
        if getattr(contract, "risk_level", "UNKNOWN") == "HIGH":
            alerts.append({
                "type": "HIGH_RISK",
                "contract_id": contract.id,
                "severity": "HIGH",
                "message": f"Contract '{contract.contract_name}' is flagged as HIGH risk"
            })

    # Sort alerts: HIGH severity first, then by type
    alerts.sort(key=lambda x: (0 if x["severity"] == "HIGH" else 1, x["type"]))
    
    return alerts