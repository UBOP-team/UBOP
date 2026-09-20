from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from app.core.database import Base


class SemanticModel(Base):
    __tablename__ = "bi_semantic_models"

    id = Column(String(100), primary_key=True)
    organization_id = Column(String(50), default="default", nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)  # DRAFT, ACTIVE, DEPRECATED
    owner_id = Column(String(50), default="1", nullable=False)
    source_type = Column(String(50), default="COMPOSITE", nullable=False)  # OMS, CRM, ERP, COMPOSITE
    refresh_mode = Column(String(50), default="EVENT_DRIVEN", nullable=False)  # SCHEDULED, MANUAL, EVENT_DRIVEN
    last_refresh_at = Column(DateTime, nullable=True)
    last_successful_refresh_at = Column(DateTime, nullable=True)
    refresh_status = Column(String(50), default="SUCCEEDED", nullable=False)  # NEVER_RUN, QUEUED, RUNNING, SUCCEEDED, FAILED, STALE
    row_policy_config = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class SemanticEntity(Base):
    __tablename__ = "bi_semantic_entities"

    id = Column(String(100), primary_key=True)
    semantic_model_id = Column(String(100), ForeignKey("bi_semantic_models.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    source_table = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)


class SemanticField(Base):
    __tablename__ = "bi_semantic_fields"

    id = Column(String(100), primary_key=True)
    semantic_entity_id = Column(String(100), ForeignKey("bi_semantic_entities.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    data_type = Column(String(50), default="STRING", nullable=False)  # STRING, NUMBER, DATE, BOOLEAN
    field_type = Column(String(50), default="DIMENSION", nullable=False)  # DIMENSION, MEASURE, DATE, IDENTIFIER
    aggregation_default = Column(String(50), default="NONE", nullable=False)  # SUM, AVG, COUNT, MIN, MAX, NONE
    format_type = Column(String(50), default="STRING", nullable=False)  # CURRENCY, PERCENTAGE, INTEGER, DECIMAL, DATE, STRING
    is_hidden = Column(Boolean, default=False, nullable=False)


class MetricDefinition(Base):
    __tablename__ = "bi_metric_definitions"

    id = Column(String(100), primary_key=True)
    semantic_model_id = Column(String(100), ForeignKey("bi_semantic_models.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    expression = Column(String(255), nullable=False)
    format_type = Column(String(50), default="CURRENCY", nullable=False)
    unit = Column(String(50), default="VND", nullable=False)
    lineage_source = Column(String(255), default="OMS Orders", nullable=False)


class Report(Base):
    __tablename__ = "bi_reports"

    id = Column(String(100), primary_key=True)
    organization_id = Column(String(50), default="default", nullable=False)
    semantic_model_id = Column(String(100), ForeignKey("bi_semantic_models.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="PUBLISHED", nullable=False)  # DRAFT, PUBLISHED, ARCHIVED
    owner_id = Column(String(50), default="1", nullable=False)
    default_page_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    published_at = Column(DateTime, nullable=True)


class ReportPage(Base):
    __tablename__ = "bi_report_pages"

    id = Column(String(100), primary_key=True)
    report_id = Column(String(100), ForeignKey("bi_reports.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    page_question = Column(Text, nullable=True)
    layout_json = Column(Text, default="{}", nullable=False)
    default_filter_state_json = Column(Text, default="[]", nullable=False)


class ReportVisual(Base):
    __tablename__ = "bi_report_visuals"

    id = Column(String(100), primary_key=True)
    report_page_id = Column(String(100), ForeignKey("bi_report_pages.id", ondelete="CASCADE"), nullable=False)
    visual_type = Column(String(50), nullable=False)  # KPI, LINE, BAR, COLUMN, AREA, TABLE, MATRIX, DONUT, FUNNEL
    title = Column(String(255), nullable=False)
    configuration_json = Column(Text, default="{}", nullable=False)
    position_json = Column(Text, default="{}", nullable=False)
    interaction_config_json = Column(Text, default="{}", nullable=False)


class Dashboard(Base):
    __tablename__ = "bi_dashboards"

    id = Column(String(100), primary_key=True)
    organization_id = Column(String(50), default="default", nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_executive = Column(Boolean, default=True, nullable=False)
    owner_id = Column(String(50), default="1", nullable=False)
    last_refreshed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class DashboardTile(Base):
    __tablename__ = "bi_dashboard_tiles"

    id = Column(String(100), primary_key=True)
    dashboard_id = Column(String(100), ForeignKey("bi_dashboards.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    tile_type = Column(String(50), default="METRIC_CARD", nullable=False)  # METRIC_CARD, REPORT_VISUAL, SAVED_QUERY
    source_ref_id = Column(String(100), nullable=True)
    configuration_json = Column(Text, default="{}", nullable=False)
    position_json = Column(Text, default="{}", nullable=False)


class AnalyticalBookmark(Base):
    __tablename__ = "bi_analytical_bookmarks"

    id = Column(String(100), primary_key=True)
    report_id = Column(String(100), ForeignKey("bi_reports.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(50), default="current_user", nullable=False)
    name = Column(String(255), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    state_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class RefreshRun(Base):
    __tablename__ = "bi_refresh_runs"

    id = Column(String(100), primary_key=True)
    semantic_model_id = Column(String(100), ForeignKey("bi_semantic_models.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="SUCCEEDED", nullable=False)  # QUEUED, RUNNING, SUCCEEDED, FAILED, STALE
    triggered_by = Column(String(50), default="EVENT", nullable=False)  # EVENT, MANUAL, SCHEDULE
    duration_ms = Column(Integer, default=120, nullable=False)
    rows_processed = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    finished_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class BIReadModelProjection(Base):
    __tablename__ = "bi_read_model_projections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain = Column(String(50), nullable=False)  # OMS, CRM, ERP, CROSS_DOMAIN
    record_id = Column(String(100), nullable=False)
    date_key = Column(String(10), nullable=False)  # YYYY-MM-DD
    year = Column(Integer, nullable=False)
    quarter = Column(String(5), nullable=False)  # Q1, Q2, Q3, Q4
    month = Column(String(20), nullable=False)  # Jan, Feb, etc.
    month_num = Column(Integer, nullable=False)
    channel = Column(String(100), nullable=True)  # Shopify, Direct B2B, Amazon Marketplace
    category = Column(String(100), nullable=True)  # Hardware, Cloud Licenses, Networking, Services
    customer_segment = Column(String(100), nullable=True)  # Tier-1 Strategic, Mid-Market, Emerging
    region = Column(String(100), nullable=True)  # North America, EMEA, APAC, Vietnam
    metric_revenue = Column(Float, default=0.0, nullable=False)
    metric_cost = Column(Float, default=0.0, nullable=False)
    metric_quantity = Column(Integer, default=0, nullable=False)
    metric_order_count = Column(Integer, default=0, nullable=False)
    metric_open_pipeline = Column(Float, default=0.0, nullable=False)
    metric_inventory_units = Column(Integer, default=0, nullable=False)
    entity_reference_json = Column(Text, default="{}", nullable=False)
