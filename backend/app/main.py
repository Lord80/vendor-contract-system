from fastapi import FastAPI
from app.routes import auth, contract, vendor, company
from app.routes.similarity_routes import router as similarity_router
from app.routes.ml_routes import router as ml_router
from app.routes import auth
from app.models import user
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes.forecasting_routes import router as forecasting_router


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Powered Vendor & Contract Management System",
    version="2.2.0",
    description="Enhanced with LegalBERT, similarity matching, and ML risk prediction"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(vendor.router)
app.include_router(contract.router)
app.include_router(company.router)
app.include_router(similarity_router)
app.include_router(ml_router)
app.include_router(forecasting_router)

@app.get("/")
def root():
    return {
        "message": "AI Vendor & Contract Management System API is running",
        "version": "2.2.0",
        "features": [
            "Contract upload & analysis",
            "Vendor management",
            "Enhanced NLP with LegalBERT",
            "Similarity search engine",
            "XGBoost risk prediction",
            "Explainable AI insights"
        ],
        "ml_ready": True
    }