# test_similarity.py
import requests
import json

BASE_URL = "http://localhost:8000"

def test_similarity_features():
    print("Testing Similarity Engine Features...")
    print("=" * 50)
    
    # 1. Get database stats
    print("\n1. Database Statistics:")
    response = requests.get(f"{BASE_URL}/similarity/database/stats")
    print(f"Status: {response.status_code}")
    stats = response.json()
    print(f"Stats: {json.dumps(stats, indent=2)}")
    
    # 2. Search for similar clauses
    print("\n2. Searching for similar clauses:")
    search_data = {
        "query": "termination with 30 days notice",
        "top_k": 5
    }
    response = requests.post(
        f"{BASE_URL}/similarity/search",
        json=search_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Search Status: {response.status_code}")
    
    try:
        results = response.json()
        # Check the actual response structure
        print(f"Response keys: {list(results.keys())}")
        
        # Try different possible response structures
        if "total_results" in results:
            print(f"Found {results['total_results']} similar clauses")
        elif "results" in results:
            print(f"Found {len(results['results'])} similar clauses")
        elif "data" in results:
            print(f"Found {len(results['data'])} similar clauses")
        else:
            print(f"Full response: {json.dumps(results, indent=2)}")
        
        # Show first 3 results if available
        if "results" in results and results["results"]:
            for i, result in enumerate(results["results"][:3], 1):
                print(f"  {i}. {result.get('text', 'No text')[:80]}...")
                print(f"     Score: {result.get('similarity_score', 'N/A')}")
                print(f"     Type: {result.get('clause_type', 'N/A')}")
                print(f"     Risk: {result.get('risk_level', 'N/A')}")
        elif "data" in results and results["data"]:
            for i, result in enumerate(results["data"][:3], 1):
                print(f"  {i}. {str(result)[:80]}...")
                
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Raw response: {response.text}")
    
    # 3. Test health endpoint
    print("\n3. Testing health endpoint:")
    response = requests.get(f"{BASE_URL}/similarity/health")
    print(f"Health: {response.json()}")
    
    # 4. Test compare texts endpoint
    print("\n4. Testing text comparison:")
    compare_data = {
        "text1": "Payment shall be made within 30 days",
        "text2": "Invoice payment due in 30 days from receipt"
    }
    response = requests.post(
        f"{BASE_URL}/similarity/compare/texts",
        json=compare_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"Compare Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Comparison: {json.dumps(response.json(), indent=2)}")
    
    # 5. List contracts first to get IDs
    print("\n5. Getting contracts for comparison:")
    response = requests.get(f"{BASE_URL}/contracts/")
    if response.status_code == 200:
        contracts = response.json()
        print(f"Found {len(contracts)} contracts")
        
        if len(contracts) >= 2:
            contract1_id = contracts[0]['id']
            contract2_id = contracts[1]['id']
            
            print(f"\n6. Comparing contracts {contract1_id} and {contract2_id}:")
            response = requests.post(
                f"{BASE_URL}/similarity/compare/contracts",
                params={
                    "contract1_id": contract1_id,
                    "contract2_id": contract2_id
                }
            )
            
            if response.status_code == 200:
                comparison = response.json()
                print(f"Comparison successful!")
                print(f"Contract 1: {comparison.get('contract1', 'N/A')}")
                print(f"Contract 2: {comparison.get('contract2', 'N/A')}")
                if 'overall_comparison' in comparison:
                    sim_score = comparison['overall_comparison'].get('similarity_score', 0)
                    print(f"Similarity: {sim_score:.2%}")
            else:
                print(f"Comparison failed: {response.status_code}")
                print(f"Response: {response.text}")
        else:
            print("Need at least 2 contracts to compare. Upload some contracts first.")
    else:
        print(f"Failed to get contracts: {response.status_code}")
    
    print("\n" + "=" * 50)
    print("✅ Similarity engine test completed!")

if __name__ == "__main__":
    test_similarity_features()