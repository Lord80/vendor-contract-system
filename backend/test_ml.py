# test_ml.py
import requests
import json

BASE_URL = "http://localhost:8000"

def test_ml_features():
    print("Testing ML Features...")
    print("=" * 50)
    
    # 1. Get model info
    print("\n1. Model Information:")
    response = requests.get(f"{BASE_URL}/ml/model/info")
    print(f"Status: {response.status_code}")
    print(f"Info: {json.dumps(response.json(), indent=2)}")
    
    # 2. Test prediction
    print("\n2. Testing risk prediction:")
    
    test_contract = {
        "raw_text": """
        This Service Agreement is made between Company A and Vendor B.
        
        TERMINATION: Either party may terminate this agreement with 30 days written notice.
        
        PAYMENT: All invoices shall be paid within 30 days of receipt.
        
        LIABILITY: Each party's liability shall be limited to the fees paid under this agreement.
        
        This agreement shall commence on January 1, 2024 and end on December 31, 2024.
        """,
        "contract_name": "Test Service Agreement",
        "extracted_clauses": {
            "termination": ["Either party may terminate this agreement with 30 days written notice"],
            "payment": ["All invoices shall be paid within 30 days of receipt"],
            "liability": ["Each party's liability shall be limited to the fees paid under this agreement"]
        },
        "entities": {
            "dates": ["January 1, 2024", "December 31, 2024", "30 days"],
            "organizations": ["Company A", "Vendor B"],
            "money": []
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/ml/predict/risk",
        json=test_contract,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"Prediction successful!")
        prediction = result["prediction"]
        print(f"Predicted Risk: {prediction['predicted_risk_level']}")
        print(f"Confidence: {prediction['confidence']:.2%}")
        print(f"Model: {prediction['model_used']}")
        
        # 3. Get explanation
        print("\n3. Getting explanation:")
        response = requests.post(
            f"{BASE_URL}/ml/explain/prediction",
            json={
                "contract_data": test_contract,
                "prediction_result": prediction
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            explanation = response.json()
            print(f"Explanation: {explanation['explanation']['interpretation']}")
            
            if explanation['explanation']['top_features']:
                print("\nTop Features:")
                for feature in explanation['explanation']['top_features'][:3]:
                    print(f"  - {feature['feature']}: {feature['description']}")
    
    # 4. Check model performance
    print("\n4. Model Performance:")
    response = requests.get(f"{BASE_URL}/ml/performance")
    if response.status_code == 200:
        perf = response.json()
        if perf['status'] == 'success':
            print(f"Accuracy: {perf['accuracy']:.2%}")
            print(f"Correct: {perf['correct_predictions']}/{perf['total_predictions']}")
    
    print("\n" + "=" * 50)
    print("✅ ML Features Test Completed!")

if __name__ == "__main__":
    test_ml_features()