import sys
import io

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base

# Route Imports
from app.routes import auth, contract, vendor, company
from app.routes.similarity_routes import router as similarity_router
from app.routes.ml_routes import router as ml_router
from app.routes.forecasting_routes import router as forecasting_router

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Enterprise AI System...")
    if settings.DEBUG:
        Base.metadata.create_all(bind=engine)
    yield
    # Shutdown (Frees up memory and connections)
    logger.info("Shutting down system, disposing database engine...")
    engine.dispose()

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

# --- GLOBAL EXCEPTION HANDLERS ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Prevents the server from crashing and returns clean JSON to React."""
    logger.error(f"Unhandled Exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred. Please try again later."}
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