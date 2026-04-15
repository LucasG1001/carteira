from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.core.exceptions import setup_exception_handlers

# We will import routers here later
from src.modules.Upload.upload_router import router as upload_router
from src.modules.Portfolio.portfolio_router import router as portfolio_router


app = FastAPI(
    title="Carteira B3 API",
    description="API para consolidação de carteira de investimentos da B3",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Exception Handlers
setup_exception_handlers(app)

# Include routers
app.include_router(upload_router, prefix="/api/v1/upload", tags=["Upload"])
app.include_router(portfolio_router, prefix="/api/v1/portfolio", tags=["Portfolio"])


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok"}
