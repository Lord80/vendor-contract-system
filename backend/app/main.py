from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base

# Route Imports
from app.routes import auth, contract, vendor, company
from app.routes.similarity_routes import router as similarity_router
from app.routes.ml_routes import router as ml_router
from app.routes.forecasting_routes import router as forecasting_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # In production, use Alembic for migrations instead of create_all
    if settings.DEBUG:
        Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="AI Vendor & Contract Management System",
    version="3.0.0",
    description="Enterprise Multi-Tenant System with LegalBERT & XGBoost",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Registration
app.include_router(auth.router)
app.include_router(company.router)
app.include_router(vendor.router)
app.include_router(contract.router)
app.include_router(similarity_router)
app.include_router(ml_router)
app.include_router(forecasting_router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "system": "VendorAI Enterprise",
        "version": "3.0.0",
        "features": ["Multi-Tenant", "RBAC", "Vector Search", "Risk ML"]
    }