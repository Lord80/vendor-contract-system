def generate_contract_summary(
    contract_name: str,
    entities: dict,
    clauses: dict,
    risk_level: str
):
    parties = ", ".join(entities.get("organizations", [])[:2]) or "the involved parties"
    dates = entities.get("dates", [])
    money = entities.get("money", [])

    duration = ""
    if len(dates) >= 2:
        duration = f"from {dates[0]} to {dates[1]}"

    fee = money[0] if money else "an agreed amount"

    summary = (
        f"This contract titled '{contract_name}' is an agreement between {parties}. "
        f"It is effective {duration}. "
        f"The contract includes payment terms of {fee}, "
        f"service level obligations, and penalty provisions. "
    )

    if clauses.get("renewal"):
        summary += "The contract contains an auto-renewal clause. "

    summary += f"Overall, the contract is assessed as {risk_level} risk."

    return summary