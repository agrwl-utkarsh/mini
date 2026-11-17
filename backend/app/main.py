from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging

from app.config import settings
from app.api import repo_router, files_router, chat_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting RepoSense API...")
    yield
    # Shutdown
    logger.info("Shutting down RepoSense API...")


app = FastAPI(
    title="RepoSense API",
    description="AI-powered codebase understanding platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
raw_origins = [o.strip() for o in settings.FRONTEND_URL.split(",") if o.strip()]
for default_origin in ["http://localhost:5173", "http://localhost:3000"]:
    if default_origin not in raw_origins:
        raw_origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=raw_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(repo_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "reposense-api"}


@app.get("/")
async def root():
    return {
        "name": "RepoSense API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )