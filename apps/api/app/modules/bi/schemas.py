from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


# --- Filter, Sort, Query Engine Schemas ---

class QueryFilter(BaseModel):
    field: str
    operator: Literal["EQUALS", "NOT_EQUALS", "IN", "NOT_IN", "BETWEEN", "GREATER_THAN", "LESS_THAN", "CONTAINS"]
    values: List[Any]
    scope: Literal["VISUAL", "PAGE", "REPORT", "DRILLTHROUGH"] = "REPORT"


class QuerySort(BaseModel):
    field: str
    direction: Literal["ASC", "DESC"] = "DESC"


class DrillContext(BaseModel):
    hierarchy_name: Optional[str] = None
    level: Optional[str] = None  # e.g., 'YEAR', 'QUARTER', 'MONTH', 'DAY' or 'CATEGORY', 'PRODUCT'
    current_value: Optional[str] = None
    target_entity: Optional[str] = None
    target_id: Optional[str] = None


class QueryRequest(BaseModel):
    semantic_model_id: str
    measures: List[str] = Field(default_factory=list)
    dimensions: List[str] = Field(default_factory=list)
    filters: List[QueryFilter] = Field(default_factory=list)
    sort: List[QuerySort] = Field(default_factory=list)
    limit: int = 100
    drill_context: Optional[DrillContext] = None


class QueryResultRow(BaseModel):
    dimensions: Dict[str, Any]
    measures: Dict[str, float]
    formatted_measures: Dict[str, str]
    entity_reference: Optional[Dict[str, Any]] = None


class QueryResult(BaseModel):
    semantic_model_id: str
    rows: List[Dict[str, Any]]
    total_records: int
    executed_at: str
    data_freshness: str
    is_stale: bool = False
    warning: Optional[str] = None


# --- Semantic Metadata Schemas ---

class SemanticFieldOut(BaseModel):
    id: str
    semantic_entity_id: str
    name: str
    display_name: str
    data_type: str
    field_type: str
    aggregation_default: str
    format_type: str
    is_hidden: bool

    model_config = ConfigDict(from_attributes=True)


class SemanticEntityOut(BaseModel):
    id: str
    semantic_model_id: str
    name: str
    display_name: str
    source_table: str
    description: Optional[str] = None
    fields: List[SemanticFieldOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class MetricDefinitionOut(BaseModel):
    id: str
    semantic_model_id: str
    name: str
    display_name: str
    description: Optional[str] = None
    expression: str
    format_type: str
    unit: str
    lineage_source: str
    used_in_reports_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class SemanticModelOut(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    status: str
    owner_id: str
    source_type: str
    refresh_mode: str
    last_refresh_at: Optional[datetime] = None
    last_successful_refresh_at: Optional[datetime] = None
    refresh_status: str
    created_at: datetime
    updated_at: datetime
    entities_count: int = 0
    measures_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class SemanticModelDetailOut(SemanticModelOut):
    entities: List[SemanticEntityOut] = Field(default_factory=list)
    metrics: List[MetricDefinitionOut] = Field(default_factory=list)


# --- Visual, Page, Report Schemas ---

class VisualConfig(BaseModel):
    measures: List[str] = Field(default_factory=list)
    dimensions: List[str] = Field(default_factory=list)
    sort_by: Optional[str] = None
    sort_direction: Literal["ASC", "DESC"] = "DESC"
    colors: Optional[List[str]] = None
    chart_subtitle: Optional[str] = None
    show_legend: bool = True
    comparison_enabled: bool = False
    comparison_target: Optional[float] = None
    drill_enabled: bool = False
    drill_hierarchy: Optional[List[str]] = None
    operational_link_type: Optional[str] = None  # 'CRM_ACCOUNT', 'OMS_ORDER', 'ERP_ITEM'


class VisualInteractionConfig(BaseModel):
    target_mode: Literal["FILTER", "HIGHLIGHT", "NONE"] = "FILTER"
    drillthrough_page_id: Optional[str] = None


class VisualCreate(BaseModel):
    visual_type: Literal["KPI", "LINE", "BAR", "COLUMN", "AREA", "TABLE", "MATRIX", "DONUT", "FUNNEL"]
    title: str
    configuration: VisualConfig
    position: Dict[str, Any] = Field(default_factory=dict)
    interaction_config: VisualInteractionConfig = Field(default_factory=VisualInteractionConfig)


class VisualOut(BaseModel):
    id: str
    report_page_id: str
    visual_type: str
    title: str
    configuration: Dict[str, Any]
    position: Dict[str, Any]
    interaction_config: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class ReportPageCreate(BaseModel):
    name: str
    order_index: int = 0
    page_question: Optional[str] = None
    layout: Dict[str, Any] = Field(default_factory=dict)
    default_filter_state: List[Dict[str, Any]] = Field(default_factory=list)


class ReportPageOut(BaseModel):
    id: str
    report_id: str
    name: str
    order_index: int
    page_question: Optional[str] = None
    layout: Dict[str, Any]
    default_filter_state: List[Dict[str, Any]]
    visuals: List[VisualOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ReportCreate(BaseModel):
    semantic_model_id: str
    name: str
    description: Optional[str] = None
    status: Literal["DRAFT", "PUBLISHED"] = "DRAFT"


class ReportUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["DRAFT", "PUBLISHED", "ARCHIVED"]] = None
    default_page_id: Optional[str] = None


class ReportOut(BaseModel):
    id: str
    organization_id: str
    semantic_model_id: str
    name: str
    description: Optional[str] = None
    status: str
    owner_id: str
    default_page_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    pages: List[ReportPageOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard Schemas ---

class DashboardTileOut(BaseModel):
    id: str
    dashboard_id: str
    title: str
    tile_type: str
    source_ref_id: Optional[str] = None
    configuration: Dict[str, Any]
    position: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class DashboardOut(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    is_executive: bool
    owner_id: str
    last_refreshed_at: datetime
    created_at: datetime
    updated_at: datetime
    tiles: List[DashboardTileOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# --- Bookmark & Refresh Schemas ---

class BookmarkCreate(BaseModel):
    name: str
    is_default: bool = False
    state: Dict[str, Any]  # active page, slicers, filter state


class BookmarkOut(BaseModel):
    id: str
    report_id: str
    user_id: str
    name: str
    is_default: bool
    state: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RefreshRunOut(BaseModel):
    id: str
    semantic_model_id: str
    semantic_model_name: Optional[str] = None
    status: str
    triggered_by: str
    duration_ms: int
    rows_processed: int
    error_message: Optional[str] = None
    started_at: datetime
    finished_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- BI Home Hub Schemas ---

class BIContentCard(BaseModel):
    id: str
    title: str
    type: Literal["DASHBOARD", "REPORT", "METRIC", "MODEL"]
    description: Optional[str] = None
    last_modified: str
    author: str
    is_favorite: bool = False
    status: Optional[str] = None


class BIHomeSummary(BaseModel):
    favorites: List[BIContentCard]
    recents: List[BIContentCard]
    shared_with_me: List[BIContentCard]
    data_health: Dict[str, Any]
