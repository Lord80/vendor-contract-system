from datetime import date

def get_contract_alerts(contracts, days_threshold=30):
    alerts = []

    today = date.today()

    for contract in contracts:
        # Expiry alert
        if contract.end_date:
            days_left = (contract.end_date - today).days
            if days_left <= days_threshold:
                alerts.append({
                    "type": "EXPIRY",
                    "contract_id": contract.id,
                    "message": f"Contract '{contract.contract_name}' expires in {days_left} days"
                })

        # High-risk contract alert
        if contract.risk_level == "HIGH":
            alerts.append({
                "type": "HIGH_RISK",
                "contract_id": contract.id,
                "message": f"Contract '{contract.contract_name}' is HIGH risk"
            })

    return alerts
