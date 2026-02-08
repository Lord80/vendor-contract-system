from app.database import engine, Base
from app.models.vendor import Vendor
from app.models.contract import Contract

Base.metadata.create_all(bind=engine)
