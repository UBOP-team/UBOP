from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.events import event_bus
from app.modules.crm.router import router as crm_router
from app.modules.erp.router import router as erp_router
from app.modules.oms.router import router as oms_router
from app.modules.bi.router import router as bi_router
from app.modules.workflow.router import router as workflow_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    await init_db()
    yield
    # Cleanup if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


@app.get("/api/v1/events/history", tags=["Events"])
def get_events_history(limit: int = 50):
    return event_bus.get_history(limit=limit)


# Include modular routers under API v1 prefix
app.include_router(crm_router, prefix=settings.API_V1_STR)
app.include_router(erp_router, prefix=settings.API_V1_STR)
app.include_router(oms_router, prefix=settings.API_V1_STR)
app.include_router(bi_router, prefix=settings.API_V1_STR)
app.include_router(workflow_router, prefix=settings.API_V1_STR)
