from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .service import AnalyticsService

router = APIRouter(prefix="/bi", tags=["BI & Analytics"])


def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(session=db)


@router.get("/revenue-report", response_model=Dict[str, Any])
async def get_revenue_report(
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.revenue_report()


@router.get("/kpis", response_model=Dict[str, Any])
async def get_kpis(
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.kpi_summary()


@router.get("/sales-trend", response_model=List[Dict[str, Any]])
async def get_sales_trend(
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.sales_trend()
