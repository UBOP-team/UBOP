from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------
# Legacy Schemas for Backward Compatibility
# ---------------------------------------------------------
class WorkflowRuleCreate(BaseModel):
    name: str
    event_pattern: str
    action_type: str
    action_payload: Optional[str] = "{}"
    is_active: bool = True


class WorkflowRuleResponse(BaseModel):
    id: int
    name: str
    event_pattern: str
    action_type: str
    action_payload: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowLogResponse(BaseModel):
    id: int
    rule_name: str
    event_name: str
    status: str
    output: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------
# Governed Action & Subflow Schemas
# ---------------------------------------------------------
class ActionInputField(BaseModel):
    name: str
    label: str
    type: str  # string, number, boolean, email, date, object, array
    required: bool = False
    description: Optional[str] = None
    default: Optional[Any] = None


class ActionOutputField(BaseModel):
    name: str
    label: str
    type: str
    description: Optional[str] = None


class ActionDefinitionResponse(BaseModel):
    id: str
    organization_id: str
    key: str
    name: str
    description: Optional[str] = None
    category: str
    input_schema: List[ActionInputField] = []
    output_schema: List[ActionOutputField] = []
    execution_type: str
    capability_reference: str
    connection_type_required: Optional[str] = None
    version: str
    status: str
    usage_count: int
    created_at: datetime


class SubflowDefinitionResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    input_schema: List[ActionInputField] = []
    output_schema: List[ActionOutputField] = []
    steps: List[Dict[str, Any]] = []
    active_version_id: Optional[str] = None
    draft_version_id: Optional[str] = None
    status: str
    created_at: datetime


# ---------------------------------------------------------
# Condition & Step Definition Schemas
# ---------------------------------------------------------
class ConditionRule(BaseModel):
    field_ref: str = Field(..., description="e.g. trigger.order.total or step_1.amount")
    operator: str = Field(..., description="EQUALS, NOT_EQUALS, GT, GTE, LT, LTE, CONTAINS, IS_EMPTY")
    value: Any


class ConditionGroup(BaseModel):
    operator: str = "AND"  # AND, OR
    rules: List[ConditionRule] = []


class StepDefinitionSchema(BaseModel):
    step_key: str
    step_type: str  # ACTION, CONDITION, FOR_EACH, SUBFLOW, WAIT, APPROVAL
    name: str
    action_key: Optional[str] = None
    connection_reference: Optional[str] = None
    inputs: Dict[str, Any] = Field(default_factory=dict)
    # Conditions
    condition_group: Optional[ConditionGroup] = None
    true_steps: List[Dict[str, Any]] = Field(default_factory=list)
    false_steps: List[Dict[str, Any]] = Field(default_factory=list)
    # Loops
    for_each_collection: Optional[str] = None  # e.g. trigger.order.items
    for_each_item_var: Optional[str] = "item"
    for_each_steps: List[Dict[str, Any]] = Field(default_factory=list)
    # Subflows
    subflow_id: Optional[str] = None
    subflow_inputs: Dict[str, Any] = Field(default_factory=dict)
    # Waits
    wait_type: Optional[str] = "DURATION"  # DURATION, UNTIL_DATETIME, EVENT
    wait_duration_sec: Optional[int] = 60
    wait_event_type: Optional[str] = None
    # Approvals
    approval_role: Optional[str] = "OPERATIONS_MANAGER"
    approval_timeout_sec: Optional[int] = 86400
    # Reliability
    on_error_policy: str = "FAIL_FLOW"  # FAIL_FLOW, RETRY_THEN_FAIL, CONTINUE
    timeout_seconds: int = 60
    retry_max_attempts: int = 3
    retry_backoff: str = "EXPONENTIAL"


class TriggerDefinitionSchema(BaseModel):
    trigger_type: str  # DOMAIN_EVENT, SCHEDULE, MANUAL, WEBHOOK
    event_name: Optional[str] = None  # e.g. OMS.OrderCreated
    schedule_cron: Optional[str] = None
    schedule_frequency: Optional[str] = "DAILY"  # ONCE, HOURLY, DAILY, WEEKLY
    schedule_time: Optional[str] = "08:00"
    webhook_path: Optional[str] = None
    manual_input_schema: List[ActionInputField] = Field(default_factory=list)
    conditions: Optional[ConditionGroup] = None
    enabled: bool = True


# ---------------------------------------------------------
# Flow Definition & Version Schemas
# ---------------------------------------------------------
class FlowDefinitionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "CROSS_MODULE"
    trigger: TriggerDefinitionSchema
    steps: List[StepDefinitionSchema] = Field(default_factory=list)


class FlowDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    trigger: Optional[TriggerDefinitionSchema] = None
    steps: Optional[List[StepDefinitionSchema]] = None
    status: Optional[str] = None


class FlowVersionResponse(BaseModel):
    id: str
    flow_definition_id: str
    version_number: int
    state: str  # DRAFT, PUBLISHED, SUPERSEDED
    trigger_definition: TriggerDefinitionSchema
    flow_structure: List[StepDefinitionSchema]
    created_by: str
    created_at: datetime
    published_at: Optional[datetime] = None


class FlowDefinitionResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    category: str
    owner_name: str
    status: str  # DRAFT, ACTIVE, INACTIVE, ARCHIVED
    active_version_id: Optional[str] = None
    draft_version_id: Optional[str] = None
    active_version: Optional[FlowVersionResponse] = None
    draft_version: Optional[FlowVersionResponse] = None
    last_run_at: Optional[datetime] = None
    last_run_status: Optional[str] = None
    run_count: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Flow Validation & Test Schemas
# ---------------------------------------------------------
class FlowValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []


class FlowTestRequest(BaseModel):
    trigger_type: str
    payload: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------
# Runtime Run & Step Run Schemas
# ---------------------------------------------------------
class StepRunResponse(BaseModel):
    id: str
    flow_run_id: str
    step_key: str
    step_type: str
    step_name: str
    status: str
    attempt: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    resolved_inputs: Dict[str, Any] = Field(default_factory=dict)
    outputs: Dict[str, Any] = Field(default_factory=dict)
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class FlowRunResponse(BaseModel):
    id: str
    organization_id: str
    flow_definition_id: str
    flow_version_id: str
    flow_name: str
    version_number: int
    trigger_type: str
    trigger_reference: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    current_step_key: Optional[str] = None
    error_summary: Optional[str] = None
    correlation_id: str
    step_runs: List[StepRunResponse] = Field(default_factory=list)
    created_at: datetime


# ---------------------------------------------------------
# Human Approvals
# ---------------------------------------------------------
class ApprovalDecisionRequest(BaseModel):
    decision: str  # APPROVED, REJECTED
    comment: Optional[str] = None


class ApprovalRequestResponse(BaseModel):
    id: str
    organization_id: str
    flow_run_id: str
    step_run_id: str
    flow_name: str
    approver_type: str
    approver_reference: str
    status: str
    decision: Optional[str] = None
    comment: Optional[str] = None
    entity_reference: Dict[str, Any] = Field(default_factory=dict)
    requested_at: datetime
    responded_at: Optional[datetime] = None
    responded_by: Optional[str] = None


# ---------------------------------------------------------
# Template Schemas
# ---------------------------------------------------------
class FlowTemplateResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    trigger_summary: str
    template_structure: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
