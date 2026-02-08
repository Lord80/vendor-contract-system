# verify_trained_model.py
import requests
import json

BASE_URL = "http://localhost:8000"

print("🔍 VERIFYING TRAINED XGBOOST MODEL")
print("="*60)

# 1. Check model info
print("\n1️⃣ MODEL INFORMATION:")
response = requests.get(f"{BASE_URL}/ml/model/info")
info = response.json()
print(json.dumps(info, indent=2))

# 2. Make a prediction
print("\n2️⃣ MAKING PREDICTION:")
test_contract = {
    "raw_text": """
    This is a service agreement between Company A and Vendor B.
    
    TERMINATION: Either party may terminate with 30 days written notice.
    PAYMENT: Invoices due within 30 days of receipt.
    LIABILITY: Limited to fees paid in preceding 12 months.
    RENEWAL: Automatic renewal for one-year terms.
    """,
    "contract_name": "Test Service Agreement",
    "extracted_clauses": {
        "termination": ["Either party may terminate with 30 days written notice"],
        "payment": ["Invoices due within 30 days of receipt"],
        "liability": ["Limited to fees paid in preceding 12 months"],
        "renewal": ["Automatic renewal for one-year terms"]
    }
}

response = requests.post(
    f"{BASE_URL}/ml/predict/risk",
    json=test_contract,
    headers={"Content-Type": "application/json"}
)

if response.status_code == 200:
    result = response.json()
    prediction = result['prediction']
    
    print(f"✅ Prediction successful!")
    print(f"   Model used: {prediction['model_used']}")
    print(f"   Risk level: {prediction['predicted_risk_level']}")
    print(f"   Confidence: {prediction['confidence']:.2%}")
    
    if prediction['model_used'] == 'xgboost':
        print("   🎉 XGBoost is ACTIVE!")
    else:
        print("   ⚠️ Still using fallback")
    
    # Show probabilities
    print(f"\n   Probabilities:")
    for risk, prob in prediction['probabilities'].items():
        print(f"   • {risk}: {prob:.2%}")
    
    # Show top features if available
    if prediction.get('top_contributing_features'):
        print(f"\n   Top contributing features:")
        for feat in prediction['top_contributing_features'][:3]:
            print(f"   • {feat['feature']}: {feat['contribution']:.4f} ({feat['direction']} risk)")
else:
    print(f"❌ Prediction failed: {response.status_code}")
    print(response.text)

# 3. Check performance
print("\n3️⃣ MODEL PERFORMANCE:")
response = requests.get(f"{BASE_URL}/ml/performance")
if response.status_code == 200:
    perf = response.json()
    if perf['status'] == 'success':
        print(f"   Accuracy: {perf['accuracy']:.2%}")
        print(f"   Correct: {perf['correct_predictions']}/{perf['total_predictions']}")
    else:
        print(f"   {perf['message']}")
else:
    print(f"   Failed to get performance: {response.status_code}")

# 4. Get explanation
print("\n4️⃣ GETTING EXPLANATION:")
if response.status_code == 200:
    explanation_data = {
        "contract_data": test_contract,
        "prediction_result": prediction if 'prediction' in locals() else None
    }
    
    response = requests.post(
        f"{BASE_URL}/ml/explain/prediction",
        json=explanation_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        explanation = response.json()
        print(f"   ✅ Explanation generated")
        print(f"   Interpretation: {explanation['explanation']['interpretation']}")
        
        if explanation['explanation']['top_features']:
            print(f"\n   Top features:")
            for feat in explanation['explanation']['top_features'][:3]:
                desc = feat.get('description', feat['feature'])
                print(f"   • {desc}")
                print(f"     Contribution: {feat['contribution']:.4f}")

print("\n" + "="*60)
print("✅ VERIFICATION COMPLETE")