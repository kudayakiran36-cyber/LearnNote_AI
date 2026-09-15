from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import auth, notes, progress, quiz, revision, settings as settings_api
from app.core.config import settings
from app.core.database import SessionLocal, create_tables
from app.services.seed_service import seed_demo_accounts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("learnnote")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan events."""
    logger.info("Initializing LearnNote AI backend...")
    # Ensure all tables exist in database
    create_tables()

    # Seed the 3 demo accounts (Python Demo, Data Demo, CS Demo)
    db = SessionLocal()
    try:
        seed_demo_accounts(db)
    except Exception as e:
        logger.error(f"Error seeding demo accounts: {e}")
    finally:
        db.close()

    logger.info("LearnNote AI backend initialized successfully.")
    yield
    logger.info("Shutting down LearnNote AI backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="LearnNote AI - Personal Web-Based AI Learning Workspace Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler for uncaught server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Register Routers
app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(quiz.router)
app.include_router(progress.router)
app.include_router(revision.router)
app.include_router(settings_api.router)


@app.get("/")
def root():
    """Root health and API status."""
    return {
        "app": settings.PROJECT_NAME,
        "status": "healthy",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health")
def health_check():
    """Standard health check endpoint for Render deployment monitoring."""
    return {"status": "ok"}
