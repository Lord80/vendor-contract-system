from app.database import engine, Base
# Import ALL models so Base knows about them
from app.models.company import Company
from app.models.user import User
from app.models.vendor import Vendor
from app.models.contract import Contract
from app.models.sla import SLAEvent, VendorPerformance
from app.models.embedding import ClauseEmbedding

print("⚠️  Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("🚀 Creating new Multi-Tenant tables...")
Base.metadata.create_all(bind=engine)

print("✅ Database reset complete!")