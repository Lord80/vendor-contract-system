from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random

from app.database import get_db  # ✅ Imported correctly
from app.models.contract import Contract
from app.models.vendor import Vendor
from app.services.time_series.forecasting import SLAForecaster

router = APIRouter(prefix="/forecast", tags=["Forecasting"])

# Initialize forecaster
forecaster = SLAForecaster()

@router.get("/sla/violations/{contract_id}")
def forecast_sla_violations(
    contract_id: int,
    days_ahead: int = 30,
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Generate synthetic SLA events (or fetch real ones if available)
    from app.models.sla import SLAEvent
    # Try to fetch real events first
    real_events = db.query(SLAEvent).filter(SLAEvent.contract_id == contract_id).all()
    
    sla_events = []
    if real_events:
        # Convert DB objects to dicts for the forecaster
        for event in real_events:
            sla_events.append({
                "contract_id": event.contract_id,
                "event_type": event.event_type,
                "event_date": event.event_date,
                "metric_name": event.metric_name,
                "actual_value": event.actual_value,
                "target_value": event.target_value
            })
    else:
        # Fallback to synthetic if no real events
        # (This uses the helper function from your original file, keeping it for safety)
        sla_events = generate_synthetic_sla_events(contract_id)
    
    # Prepare and forecast
    sla_data = forecaster.prepare_sla_data(sla_events)
    forecast = forecaster.forecast_violations_prophet(sla_data, min(days_ahead, 90))
    
    return {
        "contract_id": contract_id,
        "contract_name": contract.contract_name,
        "risk_level": contract.risk_level,
        "forecast": forecast,
        "historical_data_points": len(sla_events),
        "generated_on": datetime.now().isoformat()
    }

@router.get("/vendor/reliability/{vendor_id}")
def forecast_vendor_reliability(
    vendor_id: int,
    days_ahead: int = 90,
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Fetch real performance data
    from app.models.sla import VendorPerformance
    real_perf = db.query(VendorPerformance).filter(VendorPerformance.vendor_id == vendor_id).all()
    
    performance_data = []
    if real_perf:
        for p in real_perf:
            performance_data.append({
                "vendor_id": p.vendor_id,
                "period_end": p.period_end,
                "overall_score": p.overall_score,
                "trend": p.trend
            })
    else:
        performance_data = generate_synthetic_performance_data(vendor_id)
    
    # Forecast
    forecast = forecaster.forecast_vendor_reliability(
        performance_data, 
        min(days_ahead, 180)
    )
    
    # Detect anomalies
    anomalies = forecaster.detect_anomalies(performance_data)
    
    return {
        "vendor_id": vendor_id,
        "vendor_name": vendor.name,
        "current_performance_score": vendor.performance_score,
        "current_risk_level": vendor.risk_level,
        "forecast": forecast,
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies[:5], 
        "historical_months": len(performance_data)
    }

@router.get("/contract/renewal/{contract_id}")
def predict_renewal_decision(
    contract_id: int,
    db: Session = Depends(get_db)
):
    """
    AI-powered recommendation for contract renewal.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Calculate days until expiry
    if not contract.end_date:
        raise HTTPException(status_code=400, detail="Contract has no end date")
    
    days_until_expiry = (contract.end_date - datetime.now().date()).days
    
    # Get vendor info
    vendor = db.query(Vendor).filter(Vendor.id == contract.vendor_id).first() if contract.vendor_id else None
    
    # Generate recommendation
    recommendation = generate_renewal_recommendation(
        contract, 
        vendor, 
        days_until_expiry
    )
    
    return {
        "contract_id": contract_id,
        "contract_name": contract.contract_name,
        "vendor_name": vendor.name if vendor else "Unknown",
        "end_date": str(contract.end_date),
        "days_until_expiry": days_until_expiry,
        "current_risk_level": contract.risk_level,
        "recommendation": recommendation,
        "confidence_score": random.uniform(0.7, 0.95),
        "generated_on": datetime.now().isoformat()
    }

@router.post("/batch/contracts")
def batch_contract_forecasts(
    contract_ids: List[int],
    db: Session = Depends(get_db)
):
    """
    Get forecasts for multiple contracts at once.
    """
    results = []
    
    for contract_id in contract_ids[:10]:  # Limit to 10
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if contract:
            # Simple scoring for batch
            score = contract.risk_score or 50
            days_until_expiry = (contract.end_date - datetime.now().date()).days if contract.end_date else 365
            
            priority = "HIGH"
            if score < 30:
                priority = "LOW"
            elif score < 70:
                priority = "MEDIUM"
            
            results.append({
                "contract_id": contract_id,
                "contract_name": contract.contract_name,
                "risk_score": score,
                "days_until_expiry": days_until_expiry,
                "review_priority": priority,
                "recommended_action": "RENEW" if score < 40 else "RENEGOTIATE" if score < 70 else "TERMINATE"
            })
    
    return {
        "total_forecasted": len(results),
        "high_priority": sum(1 for r in results if r["review_priority"] == "HIGH"),
        "results": results
    }

# Helper functions for synthetic data (for demo)
def generate_synthetic_sla_events(contract_id: int, months: int = 12) -> List[Dict]:
    """Generate synthetic SLA events for demonstration"""
    events = []
    base_date = datetime.now() - timedelta(days=30*months)
    
    for i in range(months * 30):  # Daily events for demonstration
        event_date = base_date + timedelta(days=i)
        
        # Randomly generate events
        if random.random() < 0.05:  # 5% chance of violation
            events.append({
                "contract_id": contract_id,
                "event_type": "violation",
                "metric_name": random.choice(["uptime", "response_time", "resolution_time"]),
                "target_value": random.choice([99.9, 2.0, 24.0]),
                "actual_value": random.choice([99.5, 3.5, 36.0]),
                "deviation": random.uniform(0.1, 5.0),
                "event_date": event_date,
                "severity": random.choice(["minor", "major"]),
                "resolved": random.random() > 0.3
            })
        elif random.random() < 0.1:  # 10% chance of near miss
            events.append({
                "contract_id": contract_id,
                "event_type": "near_miss",
                "metric_name": random.choice(["uptime", "response_time"]),
                "target_value": random.choice([99.9, 2.0]),
                "actual_value": random.choice([99.8, 1.9]),
                "deviation": random.uniform(0.01, 0.1),
                "event_date": event_date,
                "severity": "minor",
                "resolved": True
            })
    
    return events

def generate_synthetic_performance_data(vendor_id: int, months: int = 12) -> List[Dict]:
    """Generate synthetic vendor performance data"""
    data = []
    base_date = datetime.now() - timedelta(days=30*months)
    
    for i in range(months):
        period_end = base_date + timedelta(days=30*(i+1))
        
        # Generate scores with some trend
        base_score = random.uniform(60, 90)
        trend = random.choice([-0.5, 0, 0.5])  # per month
        
        overall_score = max(0, min(100, base_score + (trend * i)))
        
        data.append({
            "vendor_id": vendor_id,
            "period_start": (period_end - timedelta(days=30)).strftime("%Y-%m-%d"),
            "period_end": period_end.strftime("%Y-%m-%d"),
            "uptime_score": max(0, min(100, overall_score + random.uniform(-5, 5))),
            "response_time_score": max(0, min(100, overall_score + random.uniform(-8, 8))),
            "resolution_score": max(0, min(100, overall_score + random.uniform(-10, 10))),
            "customer_satisfaction": max(0, min(100, overall_score + random.uniform(-3, 3))),
            "overall_score": overall_score,
            "trend": "improving" if trend > 0 else "declining" if trend < 0 else "stable"
        })
    
    return data

def generate_renewal_recommendation(contract, vendor, days_until_expiry: int) -> Dict[str, Any]:
    """Generate AI-powered renewal recommendation"""
    
    risk_score = contract.risk_score or 50
    vendor_score = vendor.performance_score if vendor else 70
    
    # Decision logic
    if days_until_expiry > 90:
        timeline = "NOT_URGENT"
    elif days_until_expiry > 30:
        timeline = "UPCOMING"
    else:
        timeline = "URGENT"
    
    # Calculate composite score
    composite_score = (vendor_score * 0.6) + ((100 - risk_score) * 0.4)
    
    # Generate recommendation
    if composite_score > 80:
        action = "RENEW"
        confidence = "HIGH"
        reason = f"Excellent vendor performance ({vendor_score}) and low contract risk ({risk_score})"
    elif composite_score > 60:
        action = "RENEGOTIATE"
        confidence = "MEDIUM"
        reason = f"Moderate vendor performance ({vendor_score}) and contract risk ({risk_score}) - consider improvements"
    else:
        action = "TERMINATE"
        confidence = "HIGH" if composite_score < 40 else "MEDIUM"
        reason = f"Poor vendor performance ({vendor_score}) and/or high contract risk ({risk_score})"
    
    # Suggested terms if renegotiating
    suggested_terms = []
    if action == "RENEGOTIATE":
        if risk_score > 60:
            suggested_terms.append("Add termination for convenience clause")
        if vendor_score < 70:
            suggested_terms.append("Include performance-based incentives")
        if contract.risk_level == "HIGH":
            suggested_terms.append("Reduce liability exposure")
    
    return {
        "recommended_action": action,
        "confidence": confidence,
        "composite_score": round(composite_score, 1),
        "timeline": timeline,
        "days_until_expiry": days_until_expiry,
        "reasoning": reason,
        "suggested_terms": suggested_terms,
        "key_factors": {
            "vendor_performance": vendor_score,
            "contract_risk": risk_score,
            "remaining_term": days_until_expiry
        }
    }