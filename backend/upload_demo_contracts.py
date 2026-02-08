# upload_demo_contracts.py
import requests
import os

BASE_URL = "http://localhost:8000"

def upload_contract(file_path, vendor_id=1, contract_name=None):
    """Upload a contract PDF"""
    if contract_name is None:
        contract_name = os.path.basename(file_path).replace('.pdf', '')
    
    with open(file_path, 'rb') as f:
        files = {
            'file': (os.path.basename(file_path), f, 'application/pdf')
        }
        
        data = {
            'vendor_id': vendor_id,
            'contract_name': contract_name,
            'start_date': '2024-01-01',
            'end_date': '2025-01-01'
        }
        
        print(f"Uploading {contract_name}...")
        response = requests.post(
            f"{BASE_URL}/contracts/upload",
            files=files,
            data=data
        )
        
        if response.status_code == 200:
            print(f"  ✓ Success: {response.json().get('message', 'Uploaded')}")
            return True
        else:
            print(f"  ✗ Failed: {response.status_code} - {response.text}")
            return False

# Upload all PDFs in the current directory
print("Uploading demo contracts...")
current_dir = os.path.dirname(os.path.abspath(__file__))

pdf_files = [
    "IT_Service_Agreement_Demo.pdf",
    "IT_Service_Agreement_Demo_1.pdf", 
    "IT_Service_Agreement_Demo_2.pdf"
]

success_count = 0
for pdf_file in pdf_files:
    file_path = os.path.join(current_dir, pdf_file)
    if os.path.exists(file_path):
        if upload_contract(file_path):
            success_count += 1
    else:
        print(f"File not found: {pdf_file}")

print(f"\nUploaded {success_count} contracts successfully!")

# Now train the model
print("\nTraining ML model...")
response = requests.post(f"{BASE_URL}/ml/train")
if response.status_code == 200:
    print("Training result:", response.json())
else:
    print("Training failed:", response.status_code, response.text)