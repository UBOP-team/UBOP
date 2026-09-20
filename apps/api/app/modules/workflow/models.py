from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from app.core.database import Base


class WorkflowRule(Base):
    """Legacy rule model for backwards compatibility"""
    __tablename__ = "wf_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    event_pattern = Column(String(100), nullable=False, index=True)
    action_type = Column(String(100), nullable=False)
    action_payload = Column(Text, default="{}", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class WorkflowLog(Base):
    """Legacy log model for backwards compatibility"""
    __tablename__ = "wf_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rule_name = Column(String(255), nullable=False)
    event_name = Column(String(100), nullable=False)
    status = Column(String(50), default="SUCCESS", nullable=False)
    output = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class FlowDefinition(Base):
    """
    Logical identity of a workflow across versions.
    Statuses: DRAFT, ACTIVE, INACTIVE, ARCHIVED
    """
    __tablename__ = "wf_flow_definitions"

    id = Column(String(100), primary_key=True)
    organization_id = Column(String(50), default="org_default", nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="CROSS_MODULE", nullable=False)
    owner_id = Column(String(50), default="1", nullable=False)
    owner_name = Column(String(100), default="Operations Team", nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, ACTIVE, INACTIVE, ARCHIVED
    active_version_id = Column(String(100), nullable=True)
    draft_version_id = Column(String(100), nullable=True)
    last_run_at = Column(DateTime, nullable=True)
    last_run_status = Column(String(50), nullable=True)  # SUCCEEDED, FAILED, RUNNING, etc.
    run_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class FlowVersion(Base):
    """
    Immutable or effectively immutable snapshot once published.
    States: DRAFT, PUBLISHED, SUPERSEDED
    """
    __tablename__ = "wf_flow_versions"

    id = Column(String(100), primary_key=True)
    flow_definition_id = Column(String(100), ForeignKey("wf_flow_definitions.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, default=1, nullable=False)
    state = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, PUBLISHED, SUPERSEDED
    trigger_definition = Column(Text, default="{}", nullable=False)  # JSON serialized TriggerDefinition
    flow_structure = Column(Text, default="[]", nullable=False)  # JSON serialized list of StepDefinitions
    created_by = Column(String(100), default="System Admin", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    published_at = Column(DateTime, nullable=True)


class ActionDefinition(Base):
    """
    Reusable catalog action metadata.
    Statuses: DRAFT, PUBLISHED, DEPRECATED
    """
    __tablename__ = "wf_actions"

    id = Column(String(100), primary_key=True)
    organization_id = Column(String(50), default="org_default", nullable=False)
    key = Column(String(100), unique=True, nullable=False)  # e.g. "crm.task.create"
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="UTILITIES", nullable=False)  # CRM, OMS, ERP, BI, NOTIFICATIONS, PROVIDERS, UTILITIES
    input_schema = Column(Text, default="[]", nullable=False)  # JSON list of field definitions
    output_schema = Column(Text, default="[]", nullable=False)  # JSON list of field definitions
    execution_type = Column(String(50), default="INTERNAL_CAPABILITY", nullable=False)  # INTERNAL_CAPABILITY, PROVIDER_CAPABILITY, WORKFLOW_UTILITY
    capability_reference = Column(String(100), nullable=False)
    connection_type_required = Column(String(100), nullable=True)  # e.g. "SHOPIFY", "SLACK", "SAP"
    version = Column(String(20), default="1.0.0", nullable=False)
    status = Column(String(50), default="PUBLISHED", nullable=False)  # DRAFT, PUBLISHED, DEPRECATED
    usage_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class SubflowDefinition(Base):
    """
    Reusable orchestration fragment without an independent trigger.
    """
    __tablename__ = "wf_subflows"

    id = Column(String(100), primary_key=True)
    organization_id = Column(String(50), default="org_default", nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    input_schema = Column(Text, default="[]", nullable=False)  # JSON list of parameter specs
    output_schema = Column(Text, default="[]", nullable=False)  # JSON list of parameter specs
    steps = Column(Text, default="[]", nullable=False)  # JSON list of steps
    active_version_id = Column(String(100), nullable=True)
    draft_version_id = Column(String(100), nullable=True)
    status = Column(String(50), default="PUBLISHED", nullable=False)  # DRAFT, PUBLISHED, DEPRECATED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class FlowRun(Base):
    """
    Runtime execution instance tracking full lifecycle.
    States: QUEUED, RUNNING, WAITING, PAUSED, SUCCEEDED, FAILED, CANCELLED
    """
    __tablename__ = "wf_flow_runs"

    id = Column(String(100), primary_key=True)
    organization_id = Column(String(50), default="org_default", nullable=False)
    flow_definition_id = Column(String(100), nullable=False)
    flow_version_id = Column(String(100), nullable=False)
    flow_name = Column(String(255), nullable=False)
    version_number = Column(Integer, default=1, nullable=False)
    trigger_type = Column(String(50), nullable=False)  # DOMAIN_EVENT, SCHEDULE, MANUAL, WEBHOOK
    trigger_reference = Column(String(255), nullable=True)  # e.g. "OMS.OrderCreated #ORD-20391"
    trigger_payload_snapshot = Column(Text, default="{}", nullable=False)
    status = Column(String(50), default="QUEUED", nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    current_step_key = Column(String(100), nullable=True)
    error_summary = Column(Text, nullable=True)
    correlation_id = Column(String(100), nullable=False)
    idempotency_key = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class StepRun(Base):
    """
    Step-level runtime execution details.
    Statuses: PENDING, RUNNING, WAITING, SUCCEEDED, FAILED, SKIPPED, CANCELLED
    """
    __tablename__ = "wf_step_runs"

    id = Column(String(100), primary_key=True)
    flow_run_id = Column(String(100), ForeignKey("wf_flow_runs.id", ondelete="CASCADE"), nullable=False)
    step_key = Column(String(100), nullable=False)
    step_type = Column(String(50), nullable=False)  # ACTION, CONDITION, FOR_EACH, SUBFLOW, WAIT, APPROVAL
    step_name = Column(String(255), nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)
    attempt = Column(Integer, default=1, nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    resolved_inputs = Column(Text, default="{}", nullable=False)  # JSON
    outputs = Column(Text, default="{}", nullable=False)  # JSON
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)


class ApprovalRequest(Base):
    """
    Human-in-the-loop approval primitive.
    Statuses: PENDING, APPROVED, REJECTED, CANCELLED, EXPIRED
    """
    __tablename__ = "wf_approval_requests"

    id = Column(String(100), primary_key=True)
    organization_id = Column(String(50), default="org_default", nullable=False)
    flow_run_id = Column(String(100), nullable=False)
    step_run_id = Column(String(100), nullable=False)
    flow_name = Column(String(255), nullable=False)
    approver_type = Column(String(50), default="ROLE", nullable=False)  # ROLE, USER, MANAGER
    approver_reference = Column(String(100), default="OPERATIONS_MANAGER", nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)
    decision = Column(String(50), nullable=True)  # APPROVED, REJECTED
    comment = Column(Text, nullable=True)
    entity_reference = Column(Text, default="{}", nullable=False)  # JSON summary of associated record
    requested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    responded_at = Column(DateTime, nullable=True)
    responded_by = Column(String(100), nullable=True)


class WaitState(Base):
    """
    Asynchronous persisted wait state.
    Types: DURATION, UNTIL_DATETIME, EVENT
    Statuses: ACTIVE, RESUMED, CANCELLED, EXPIRED
    """
    __tablename__ = "wf_wait_states"

    id = Column(String(100), primary_key=True)
    flow_run_id = Column(String(100), nullable=False)
    step_run_id = Column(String(100), nullable=False)
    wait_type = Column(String(50), default="DURATION", nullable=False)  # DURATION, UNTIL_DATETIME, EVENT
    resume_at = Column(DateTime, nullable=True)
    resume_event_type = Column(String(100), nullable=True)
    resume_correlation_key = Column(String(100), nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class FlowTemplate(Base):
    """
    Governed starter blueprints.
    """
    __tablename__ = "wf_flow_templates"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="CROSS_MODULE", nullable=False)
    trigger_summary = Column(String(255), nullable=False)
    template_structure = Column(Text, default="{}", nullable=False)  # JSON trigger & steps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
