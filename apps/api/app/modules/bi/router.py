from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

from .schemas import (
    QueryRequest,
    QueryResult,
    ReportCreate,
    ReportUpdate,
    BookmarkCreate,
    BIHomeSummary,
    BIContentCard,
)
from .service import (
    AnalyticsService,
    AnalyticsQueryService,
    SemanticModelService,
    ReportService,
    DashboardService,
    RefreshService,
)

router = APIRouter(prefix="/bi", tags=["BI & Analytics"])


def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(session=db)


def get_query_service(db: AsyncSession = Depends(get_db)) -> AnalyticsQueryService:
    return AnalyticsQueryService(session=db)


def get_model_service(db: AsyncSession = Depends(get_db)) -> SemanticModelService:
    return SemanticModelService(session=db)


def get_report_service(db: AsyncSession = Depends(get_db)) -> ReportService:
    return ReportService(session=db)


def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    return DashboardService(session=db)


def get_refresh_service(db: AsyncSession = Depends(get_db)) -> RefreshService:
    return RefreshService(session=db)


# --- BI Home Hub ---

@router.get("/home", response_model=BIHomeSummary)
async def get_bi_home(
    model_service: SemanticModelService = Depends(get_model_service),
    report_service: ReportService = Depends(get_report_service),
    dash_service: DashboardService = Depends(get_dashboard_service),
    refresh_service: RefreshService = Depends(get_refresh_service),
):
    models = await model_service.list_models()
    reports = await report_service.list_reports()
    dashboards = await dash_service.list_dashboards()
    runs = await refresh_service.list_runs()

    favs = [
        BIContentCard(
            id="dash_exec_cockpit",
            title="Executive Commerce Cockpit",
            type="DASHBOARD",
            description="One-page curated operational monitor for C-suite.",
            last_modified="Today 10:30 UTC",
            author="Enterprise Admin",
            is_favorite=True,
            status="ACTIVE",
        ),
        BIContentCard(
            id="rep_sales_performance",
            title="Sales Performance & Channel Analytics",
            type="REPORT",
            description="Multi-page exploratory analysis with cross-filtering.",
            last_modified="Today 10:15 UTC",
            author="Analytics Team",
            is_favorite=True,
            status="PUBLISHED",
        ),
    ]

    recents = [
        BIContentCard(
            id=r["id"],
            title=r["name"],
            type="REPORT",
            description=r.get("description"),
            last_modified="Today",
            author="Analytics Team",
            is_favorite=False,
            status=r.get("status"),
        )
        for r in reports
    ] + [
        BIContentCard(
            id=d["id"],
            title=d["name"],
            type="DASHBOARD",
            description=d.get("description"),
            last_modified="Today",
            author="Enterprise Admin",
            is_favorite=False,
            status="ACTIVE",
        )
        for d in dashboards
    ]

    # Stale calculation
    stale_count = sum(1 for m in models if m.get("refresh_status") == "STALE")
    healthy_count = sum(1 for m in models if m.get("refresh_status") == "SUCCEEDED")

    return BIHomeSummary(
        favorites=favs,
        recents=recents[:5],
        shared_with_me=recents[:2],
        data_health={
            "total_models": len(models),
            "healthy_count": healthy_count,
            "stale_count": stale_count,
            "recent_runs": runs[:3],
            "last_synced_at": "10:30 UTC",
        },
    )


# --- Governed Query API ---

@router.post("/query", response_model=QueryResult)
async def execute_bi_query(
    req: QueryRequest,
    service: AnalyticsQueryService = Depends(get_query_service),
):
    return await service.execute_query(req)


# --- Semantic Models & Metrics ---

@router.get("/semantic-models", response_model=List[Dict[str, Any]])
async def list_semantic_models(
    service: SemanticModelService = Depends(get_model_service),
):
    return await service.list_models()


@router.get("/semantic-models/{model_id}", response_model=Dict[str, Any])
async def get_semantic_model_detail(
    model_id: str,
    service: SemanticModelService = Depends(get_model_service),
):
    model = await service.get_model_detail(model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"Semantic Model '{model_id}' not found.")
    return model


@router.post("/semantic-models/{model_id}/refresh", response_model=Dict[str, Any])
async def refresh_semantic_model(
    model_id: str,
    trigger_type: str = Query(default="MANUAL"),
    service: RefreshService = Depends(get_refresh_service),
):
    return await service.trigger_refresh(model_id, trigger_type=trigger_type)


@router.get("/metrics", response_model=List[Dict[str, Any]])
async def list_governed_metrics(
    service: SemanticModelService = Depends(get_model_service),
):
    return await service.list_metrics()


# --- Reports & Pages ---

@router.get("/reports", response_model=List[Dict[str, Any]])
async def list_reports(
    service: ReportService = Depends(get_report_service),
):
    return await service.list_reports()


@router.post("/reports", response_model=Dict[str, Any], status_code=201)
async def create_report(
    data: ReportCreate,
    service: ReportService = Depends(get_report_service),
):
    return await service.create_report(data)


@router.get("/reports/{report_id}", response_model=Dict[str, Any])
async def get_report_detail(
    report_id: str,
    service: ReportService = Depends(get_report_service),
):
    rep = await service.get_report(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
    return rep


@router.patch("/reports/{report_id}", response_model=Dict[str, Any])
async def update_report(
    report_id: str,
    data: ReportUpdate,
    service: ReportService = Depends(get_report_service),
):
    rep = await service.update_report(report_id, data)
    if not rep:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
    return rep


@router.post("/reports/{report_id}/publish", response_model=Dict[str, Any])
async def publish_report(
    report_id: str,
    service: ReportService = Depends(get_report_service),
):
    rep = await service.publish_report(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
    return rep


@router.get("/reports/{report_id}/bookmarks", response_model=List[Dict[str, Any]])
async def list_report_bookmarks(
    report_id: str,
    service: ReportService = Depends(get_report_service),
):
    return await service.list_bookmarks(report_id)


@router.post("/reports/{report_id}/bookmarks", response_model=Dict[str, Any], status_code=201)
async def create_report_bookmark(
    report_id: str,
    data: BookmarkCreate,
    service: ReportService = Depends(get_report_service),
):
    return await service.add_bookmark(report_id, data)


# --- Dashboards ---

@router.get("/dashboards", response_model=List[Dict[str, Any]])
async def list_dashboards(
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.list_dashboards()


@router.get("/dashboards/{dashboard_id}", response_model=Dict[str, Any])
async def get_dashboard_detail(
    dashboard_id: str,
    service: DashboardService = Depends(get_dashboard_service),
):
    dash = await service.get_dashboard(dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail=f"Dashboard '{dashboard_id}' not found.")
    return dash


# --- Data Refresh Audit Runs ---

@router.get("/refresh-runs", response_model=List[Dict[str, Any]])
async def list_refresh_runs(
    service: RefreshService = Depends(get_refresh_service),
):
    return await service.list_runs()


# --- Legacy Backward Compatible Endpoints ---

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
