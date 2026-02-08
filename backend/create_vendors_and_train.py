# create_vendors_and_train.py
import sys
import os
import json
import random
from datetime import datetime, timedelta

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.contract import Contract
from app.models.vendor import Vendor
from app.services.ml_models.risk_model import RiskPredictionModel

def create_sample_vendors():
    """Create sample vendors if they don't exist"""
    db = SessionLocal()
    
    sample_vendors = [
        {"name": "IT Partners LLC", "category": "IT Services", "email": "it@partners.com"},
        {"name": "Consulting Group Inc", "category": "Consulting", "email": "info@consulting.com"},
        {"name": "Service Experts Corp", "category": "Managed Services", "email": "support@experts.com"},
        {"name": "Advisory Team Ltd", "category": "Advisory", "email": "contact@advisory.com"},
        {"name": "Tech Solutions Inc", "category": "Technology", "email": "sales@techsolutions.com"}
    ]
    
    vendors_created = 0
    for vendor_data in sample_vendors:
        # Check if vendor already exists
        existing = db.query(Vendor).filter(Vendor.name == vendor_data["name"]).first()
        if not existing:
            vendor = Vendor(
                name=vendor_data["name"],
                category=vendor_data["category"],
                email=vendor_data["email"],
                performance_score=random.uniform(70, 95),
                risk_level=random.choice(["LOW", "MEDIUM", "HIGH"])
            )
            db.add(vendor)
            vendors_created += 1
    
    db.commit()
    print(f"✅ Created {vendors_created} sample vendors")
    
    # Get all vendor IDs
    vendors = db.query(Vendor).all()
    vendor_ids = [v.id for v in vendors]
    db.close()
    
    return vendor_ids

def create_synthetic_contracts(num_contracts=16, vendor_ids=None):
    """Create synthetic contracts with valid vendor IDs"""
    
    db = SessionLocal()
    
    # Get vendor IDs if not provided
    if vendor_ids is None:
        vendors = db.query(Vendor).all()
        vendor_ids = [v.id for v in vendors]
        if not vendor_ids:
            print("❌ No vendors found. Creating sample vendors first...")
            db.close()
            vendor_ids = create_sample_vendors()
            db = SessionLocal()
    
    # Templates remain the same as before...
    templates = {
        "LOW": """
        SERVICE LEVEL AGREEMENT
        
        BETWEEN: Tech Solutions Inc. ("Client") AND IT Support Co. ("Provider")
        
        ARTICLE 1: TERM AND TERMINATION
        This Agreement commences on {start_date} and continues until {end_date}.
        Either party may terminate this Agreement with thirty (30) days written notice.
        
        ARTICLE 2: SERVICES
        Provider shall deliver IT support services as described in Exhibit A.
        Service Level: 99.5% uptime guarantee.
        
        ARTICLE 3: PAYMENT TERMS
        Client shall pay $5,000 per month within thirty (30) days of invoice receipt.
        Late payments incur interest at 1.5% per month.
        
        ARTICLE 4: LIABILITY
        Each party's liability is limited to the fees paid in the preceding twelve months.
        
        ARTICLE 5: CONFIDENTIALITY
        Both parties agree to protect confidential information for three years post-termination.
        
        ARTICLE 6: GOVERNING LAW
        This Agreement is governed by California law.
        Disputes resolved through mediation in San Francisco.
        """,
        
        "MEDIUM": """
        CONSULTING SERVICES AGREEMENT
        
        PARTIES: {client} and {vendor}
        
        1. ENGAGEMENT: Consultant provides advisory services as requested.
        
        2. COMPENSATION: $200 per hour, payable net 45 days from invoice.
        
        3. TERM: One year from {start_date}, automatically renews for additional one-year periods.
        
        4. TERMINATION: Client may terminate with fifteen (15) days written notice.
        
        5. INDEMNIFICATION: Consultant indemnifies Client against third-party claims.
        
        6. INTELLECTUAL PROPERTY: Pre-existing IP remains with respective owners.
        
        7. PENALTIES: Late payments incur 2% monthly interest.
        
        8. JURISDICTION: New York courts have exclusive jurisdiction.
        
        9. NOTICES: All notices sent via certified mail.
        """,
        
        "HIGH": """
        EXCLUSIVE SERVICES AGREEMENT
        
        PARTIES: {client} ("Company") and {vendor} ("Vendor")
        
        SECTION 1: EXCLUSIVITY
        Vendor provides services exclusively to Company for duration.
        
        SECTION 2: TERM
        Five-year term from {start_date}. Early termination penalty: $50,000.
        
        SECTION 3: COMPENSATION
        $15,000 monthly, due upon receipt of invoice.
        
        SECTION 4: INTELLECTUAL PROPERTY
        All IP developed belongs to Company in perpetuity, worldwide.
        
        SECTION 5: LIABILITY
        Unlimited liability for Vendor. No cap on damages.
        
        SECTION 6: TERMINATION
        Company may terminate without cause with seven (7) days notice.
        
        SECTION 7: GOVERNING LAW
        Delaware law applies exclusively.
        
        SECTION 8: DISPUTE RESOLUTION
        Mandatory binding arbitration, Vendor bears all costs.
        
        SECTION 9: ASSIGNMENT
        Vendor may not assign this Agreement without consent.
        """
    }
    
    clients = ["Global Tech Corp", "Innovate Solutions", "Digital Transform Inc", "Cloud First Co"]
    
    print(f"Creating {num_contracts} synthetic contracts...")
    
    for i in range(num_contracts):
        # Random risk level distribution
        rand = random.random()
        if rand < 0.4:
            risk_level = "LOW"
            risk_score = random.randint(10, 35)
        elif rand < 0.75:
            risk_level = "MEDIUM"
            risk_score = random.randint(40, 65)
        else:
            risk_level = "HIGH"
            risk_score = random.randint(70, 95)
        
        # Generate dates
        start_date = datetime.now() - timedelta(days=random.randint(0, 365))
        end_date = start_date + timedelta(days=random.randint(180, 1095))
        
        # Select template and fill
        template = templates[risk_level]
        contract_text = template.format(
            client=random.choice(clients),
            vendor="Vendor",
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )
        
        # Create extracted clauses
        extracted_clauses = {
            "termination": ["Termination clause present"] if "terminat" in contract_text.lower() else [],
            "payment": ["Payment terms specified"] if any(word in contract_text.lower() for word in ["payment", "pay", "fee"]) else [],
            "sla": ["SLA mentioned"] if "uptime" in contract_text.lower() or "service level" in contract_text.lower() else [],
            "penalty": ["Penalty clause"] if "penalty" in contract_text.lower() or "interest" in contract_text.lower() else [],
            "renewal": ["Renewal clause"] if "renew" in contract_text.lower() else []
        }
        
        # Simulate entity extraction
        entities = {
            "dates": [start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"), "30 days"],
            "money": ["$5,000", "$200", "$15,000", "$50,000", "1.5%", "2%"],
            "organizations": [random.choice(clients), "Vendor"],
            "locations": ["California", "San Francisco", "New York", "Delaware"]
        }
        
        # Generate summary
        summary = f"{risk_level} risk contract between {random.choice(clients)} and Vendor. " \
                 f"Focuses on {random.choice(['IT services', 'consulting', 'exclusive partnership'])}. " \
                 f"Duration: {random.choice(['1 year', '2 years', '3 years'])}."
        
        # Pick a valid vendor ID
        vendor_id = random.choice(vendor_ids) if vendor_ids else 1
        
        # Create contract in database
        contract = Contract(
            vendor_id=vendor_id,
            contract_name=f"Synthetic {risk_level} Risk Contract {i+1}",
            start_date=start_date.date(),
            end_date=end_date.date(),
            raw_text=contract_text,
            extracted_clauses=extracted_clauses,
            entities=entities,
            summary=summary,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_reasons=[
                f"Standard {risk_level.lower()} risk template",
                f"Contains {risk_level.lower()} risk clauses"
            ],
            status=random.choice(["ACTIVE", "EXPIRED"])
        )
        
        db.add(contract)
    
    db.commit()
    print(f"✅ Added {num_contracts} synthetic contracts to database")
    
    # Verify
    total_contracts = db.query(Contract).count()
    print(f"Total contracts in database: {total_contracts}")
    
    db.close()
    return total_contracts

def train_xgboost_model():
    """Train XGBoost model on all contracts"""
    print("\n" + "="*50)
    print("TRAINING XGBOOST MODEL")
    print("="*50)
    
    db = SessionLocal()
    
    try:
        # Get all contracts for training
        contracts = db.query(Contract).all()
        print(f"Training with {len(contracts)} total contracts")
        
        if len(contracts) < 10:
            print("⚠️ Warning: Training with less than 10 contracts may affect accuracy")
        
        # Prepare training data
        training_data = []
        for contract in contracts:
            data = {
                "id": contract.id,
                "raw_text": contract.raw_text,
                "extracted_clauses": contract.extracted_clauses or {},
                "entities": contract.entities or {},
                "risk_level": contract.risk_level,
                "risk_score": contract.risk_score,
                "contract_name": contract.contract_name,
                "start_date": str(contract.start_date) if contract.start_date else None,
                "end_date": str(contract.end_date) if contract.end_date else None
            }
            training_data.append(data)
        
        # Initialize and train model
        model = RiskPredictionModel()
        
        print("\nStarting model training...")
        results = model.train(training_data, test_size=0.2)
        
        print("\n" + "="*50)
        print("MODEL TRAINING COMPLETE")
        print("="*50)
        print(f"Test Accuracy: {results['test_accuracy']:.3f}")
        print(f"Training Accuracy: {results['train_accuracy']:.3f}")
        print(f"Features: {results['feature_count']}")
        print(f"Class Distribution: {results['class_distribution']}")
        
        # Test the model
        print("\n" + "="*50)
        print("TESTING MODEL")
        print("="*50)
        
        test_cases = [
            {
                "name": "Low Risk Test",
                "text": "Agreement can be terminated with 30 days notice. Payment terms net 30 days.",
                "expected": "LOW"
            },
            {
                "name": "High Risk Test", 
                "text": "Unlimited liability for vendor. Early termination penalty of $100,000.",
                "expected": "HIGH"
            },
            {
                "name": "Medium Risk Test",
                "text": "Auto-renewal for one year terms. Late payment interest of 2% per month.",
                "expected": "MEDIUM"
            }
        ]
        
        for test in test_cases:
            prediction = model.predict({
                "raw_text": test["text"],
                "contract_name": test["name"],
                "extracted_clauses": {},
                "entities": {}
            })
            
            print(f"\n{test['name']}:")
            print(f"  Predicted: {prediction['predicted_risk_level']} (Expected: {test['expected']})")
            print(f"  Confidence: {prediction['confidence']:.2%}")
            print(f"  Model: {prediction['model_used']}")
            
            if prediction['top_contributing_features']:
                print(f"  Top Feature: {prediction['top_contributing_features'][0]['feature']}")
        
        return model
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        db.close()

def main():
    """Main execution"""
    print("🤖 XGBOOST MODEL TRAINING SETUP")
    print("="*50)
    
    # Step 1: Create vendors if needed
    vendor_ids = create_sample_vendors()
    
    # Step 2: Check current contracts
    db = SessionLocal()
    current_count = db.query(Contract).count()
    db.close()
    
    print(f"Current contracts in database: {current_count}")
    
    # Step 3: Add synthetic contracts if needed
    if current_count < 20:
        needed = 20 - current_count
        create_synthetic_contracts(needed, vendor_ids)
    else:
        print(f"✓ Sufficient contracts ({current_count}) for training")
    
    # Step 4: Train model
    model = train_xgboost_model()
    
    if model:
        print("\n" + "="*50)
        print("✅ SETUP COMPLETE")
        print("="*50)
        print("\nNext steps:")
        print("1. Test API: python test_ml.py")
        print("2. Check model info: curl http://localhost:8000/ml/model/info")
        print("3. Make predictions with trained model!")
        
        # Save model info
        info = model.get_model_info()
        with open("app/data/models/model_info.json", "w") as f:
            json.dump(info, f, indent=2)
        
        return True
    else:
        print("\n❌ Setup failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)