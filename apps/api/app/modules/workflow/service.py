import copy
from datetime import datetime, timezone
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.events import Event
from .models import (
    ActionDefinition,
    ApprovalRequest,
    FlowDefinition,
    FlowRun,
    FlowTemplate,
    FlowVersion,
    StepRun,
    SubflowDefinition,
    WorkflowLog,
    WorkflowRule,
)
from .schemas import (
    ActionDefinitionResponse,
    ApprovalDecisionRequest,
    ApprovalRequestResponse,
    FlowDefinitionCreate,
    FlowDefinitionResponse,
    FlowDefinitionUpdate,
    FlowRunResponse,
    FlowTemplateResponse,
    FlowTestRequest,
    FlowValidationResult,
    FlowVersionResponse,
    StepDefinitionSchema,
    StepRunResponse,
    SubflowDefinitionResponse,
    TriggerDefinitionSchema,
    WorkflowRuleCreate,
)

logger = logging.getLogger("ubop.workflow")


# --------------------------------------------------------------------------
# Seed Data Definitions
# --------------------------------------------------------------------------
DEFAULT_ACTIONS = [
    {
        "id": "act_crm_task_create",
        "key": "crm.task.create",
        "name": "Create CRM Activity Task",
        "description": "Creates an actionable follow-up task on a CRM Lead or Opportunity.",
        "category": "CRM",
        "input_schema": [
            {"name": "subject", "label": "Task Subject", "type": "string", "required": True, "description": "Subject of the task"},
            {"name": "assigned_to", "label": "Assignee", "type": "string", "required": True, "description": "Email or ID of owner"},
            {"name": "due_date", "label": "Due Date", "type": "date", "required": False, "description": "Target completion date"},
            {"name": "priority", "label": "Priority", "type": "string", "required": False, "default": "NORMAL"},
        ],
        "output_schema": [
            {"name": "task_id", "label": "Created Task ID", "type": "string"},
            {"name": "status", "label": "Status", "type": "string"},
        ],
        "execution_type": "INTERNAL_CAPABILITY",
        "capability_reference": "crm.activity.create",
        "connection_type_required": None,
        "version": "1.2.0",
        "usage_count": 14,
    },
    {
        "id": "act_oms_order_tag",
        "key": "oms.order.add_tag",
        "name": "Add OMS Order Tag",
        "description": "Appends an operational tag (e.g. VIP, HighRisk, Reviewed) to an OMS order.",
        "category": "OMS",
        "input_schema": [
            {"name": "order_id", "label": "Order ID", "type": "string", "required": True, "description": "Target order identifier"},
            {"name": "tag", "label": "Tag Value", "type": "string", "required": True, "description": "Label to attach"},
        ],
        "output_schema": [
            {"name": "success", "label": "Success", "type": "boolean"},
            {"name": "current_tags", "label": "Updated Tags", "type": "array"},
        ],
        "execution_type": "INTERNAL_CAPABILITY",
        "capability_reference": "oms.order.tag",
        "connection_type_required": None,
        "version": "1.0.0",
        "usage_count": 28,
    },
    {
        "id": "act_erp_reserve_stock",
        "key": "erp.inventory.reserve",
        "name": "Reserve ERP Inventory",
        "description": "Places a temporary reservation hold on materials in an ERP storage location.",
        "category": "ERP",
        "input_schema": [
            {"name": "material_id", "label": "Material Number", "type": "string", "required": True},
            {"name": "plant", "label": "Plant Code", "type": "string", "required": True, "default": "PL01"},
            {"name": "quantity", "label": "Hold Quantity", "type": "number", "required": True},
        ],
        "output_schema": [
            {"name": "reservation_id", "label": "Reservation Ref", "type": "string"},
            {"name": "confirmed_qty", "label": "Confirmed Qty", "type": "number"},
        ],
        "execution_type": "INTERNAL_CAPABILITY",
        "capability_reference": "erp.inventory.reserve",
        "connection_type_required": None,
        "version": "1.1.0",
        "usage_count": 19,
    },
    {
        "id": "act_bi_refresh_model",
        "key": "bi.semantic_model.refresh",
        "name": "Refresh BI Semantic Model",
        "description": "Triggers an on-demand partition refresh of a BI semantic model and metrics cache.",
        "category": "BI",
        "input_schema": [
            {"name": "model_id", "label": "Semantic Model ID", "type": "string", "required": True},
            {"name": "refresh_mode", "label": "Refresh Scope", "type": "string", "required": False, "default": "INCREMENTAL"},
        ],
        "output_schema": [
            {"name": "job_id", "label": "Refresh Job ID", "type": "string"},
            {"name": "status", "label": "Refresh Status", "type": "string"},
        ],
        "execution_type": "INTERNAL_CAPABILITY",
        "capability_reference": "bi.model.refresh",
        "connection_type_required": None,
        "version": "1.0.0",
        "usage_count": 7,
    },
    {
        "id": "act_notification_send",
        "key": "notification.send_inapp",
        "name": "Send Notification",
        "description": "Dispatches high-priority notification to a user, team, or Slack channel.",
        "category": "NOTIFICATIONS",
        "input_schema": [
            {"name": "recipient", "label": "Recipient Email or Role", "type": "email", "required": True},
            {"name": "subject", "label": "Subject", "type": "string", "required": True},
            {"name": "message", "label": "Message Body", "type": "string", "required": True},
        ],
        "output_schema": [
            {"name": "notification_id", "label": "Notification ID", "type": "string"},
            {"name": "delivered_at", "label": "Delivered Timestamp", "type": "string"},
        ],
        "execution_type": "INTERNAL_CAPABILITY",
        "capability_reference": "notification.dispatch",
        "connection_type_required": None,
        "version": "2.0.0",
        "usage_count": 82,
    },
    {
        "id": "act_shopify_fulfillment_create",
        "key": "shopify.fulfillment.create",
        "name": "Create Shopify Fulfillment",
        "description": "Fulfills order line items on Shopify and transmits tracking carrier information.",
        "category": "PROVIDERS",
        "input_schema": [
            {"name": "order_id", "label": "Shopify Order ID", "type": "string", "required": True},
            {"name": "tracking_number", "label": "Tracking Number", "type": "string", "required": True},
            {"name": "carrier", "label": "Carrier", "type": "string", "required": True, "default": "VNPost"},
        ],
        "output_schema": [
            {"name": "fulfillment_id", "label": "Fulfillment ID", "type": "string"},
            {"name": "status", "label": "Status", "type": "string"},
        ],
        "execution_type": "PROVIDER_CAPABILITY",
        "capability_reference": "shopify.fulfillment.create",
        "connection_type_required": "SHOPIFY",
        "version": "1.3.0",
        "usage_count": 31,
    },
]

DEFAULT_SUBFLOWS = [
    {
        "id": "subflow_notify_responsible_owner",
        "name": "Notify Responsible Owner",
        "description": "Reusable orchestration subflow that determines record owner and sends contextual alert.",
        "input_schema": [
            {"name": "entity_type", "label": "Entity Type", "type": "string", "required": True},
            {"name": "entity_id", "label": "Entity ID", "type": "string", "required": True},
            {"name": "owner_email", "label": "Owner Email", "type": "email", "required": True},
            {"name": "message", "label": "Message", "type": "string", "required": True},
        ],
        "output_schema": [
            {"name": "notification_id", "label": "Notification ID", "type": "string"},
            {"name": "sent_at", "label": "Sent Timestamp", "type": "string"},
        ],
        "steps": [
            {
                "step_key": "step_sub_1",
                "step_type": "ACTION",
                "name": "Send Notification",
                "action_key": "notification.send_inapp",
                "inputs": {
                    "recipient": "{{ inputs.owner_email }}",
                    "subject": "Automation Notice: [{{ inputs.entity_type }} #{{ inputs.entity_id }}]",
                    "message": "{{ inputs.message }}",
                },
            }
        ],
    }
]

DEFAULT_TEMPLATES = [
    {
        "id": "tpl_low_stock_alert",
        "name": "Low Stock Alert",
        "description": "Monitors ERP inventory levels and alerts warehouse managers when stock dips below critical reorder points.",
        "category": "ERP",
        "trigger_summary": "ERP.InventoryLow (Available < Threshold)",
        "template_structure": {
            "trigger": {
                "trigger_type": "DOMAIN_EVENT",
                "event_name": "ERP.InventoryLow",
                "conditions": {
                    "operator": "AND",
                    "rules": [{"field_ref": "trigger.inventory.available_qty", "operator": "LT", "value": 15}],
                },
            },
            "steps": [
                {
                    "step_key": "step_1_notify_mgr",
                    "step_type": "ACTION",
                    "name": "Notify Inventory Manager",
                    "action_key": "notification.send_inapp",
                    "inputs": {
                        "recipient": "inventory-lead@ubop.vn",
                        "subject": "Critical Low Stock: {{ trigger.inventory.material_name }}",
                        "message": "Stock at {{ trigger.inventory.plant }} is down to {{ trigger.inventory.available_qty }}. Immediate replenishment required.",
                    },
                }
            ],
        },
    },
    {
        "id": "tpl_large_order_approval",
        "name": "Large Order Approval",
        "description": "Evaluates incoming high-value orders (> 50,000,000 VND), requests Operations Manager approval, and updates CRM/OMS.",
        "category": "OMS",
        "trigger_summary": "OMS.OrderCreated (Total > ₫50,000,000)",
        "template_structure": {
            "trigger": {
                "trigger_type": "DOMAIN_EVENT",
                "event_name": "OMS.OrderCreated",
                "conditions": {
                    "operator": "AND",
                    "rules": [{"field_ref": "trigger.order.total", "operator": "GT", "value": 50000000}],
                },
            },
            "steps": [
                {
                    "step_key": "step_cond_high_value",
                    "step_type": "CONDITION",
                    "name": "Evaluate Order Value & Channel",
                    "condition_group": {
                        "operator": "AND",
                        "rules": [
                            {"field_ref": "trigger.order.total", "operator": "GT", "value": 50000000},
                        ],
                    },
                    "true_steps": [
                        {
                            "step_key": "step_approval_mgr",
                            "step_type": "APPROVAL",
                            "name": "Request Operations Approval",
                            "approval_role": "OPERATIONS_MANAGER",
                            "approval_timeout_sec": 86400,
                        },
                        {
                            "step_key": "step_tag_vip",
                            "step_type": "ACTION",
                            "name": "Tag Order as Approved VIP",
                            "action_key": "oms.order.add_tag",
                            "inputs": {
                                "order_id": "{{ trigger.order.id }}",
                                "tag": "APPROVED_VIP",
                            },
                        },
                    ],
                    "false_steps": [
                        {
                            "step_key": "step_tag_standard",
                            "step_type": "ACTION",
                            "name": "Tag Standard Route",
                            "action_key": "oms.order.add_tag",
                            "inputs": {
                                "order_id": "{{ trigger.order.id }}",
                                "tag": "AUTO_STANDARD",
                            },
                        }
                    ],
                },
                {
                    "step_key": "step_notify_owner",
                    "step_type": "ACTION",
                    "name": "Notify Account Representative",
                    "action_key": "notification.send_inapp",
                    "inputs": {
                        "recipient": "{{ trigger.order.owner_email }}",
                        "subject": "Order {{ trigger.order.order_number }} Processed",
                        "message": "Order for {{ trigger.order.customer_name }} totaling ₫{{ trigger.order.total }} has completed approval routing.",
                    },
                },
            ],
        },
    },
    {
        "id": "tpl_opportunity_won_handoff",
        "name": "Opportunity Won Handoff",
        "description": "Upon closing a large deal, automates customer onboarding task creation and notifies operations.",
        "category": "CRM",
        "trigger_summary": "CRM.OpportunityWon",
        "template_structure": {
            "trigger": {
                "trigger_type": "DOMAIN_EVENT",
                "event_name": "CRM.OpportunityWon",
            },
            "steps": [
                {
                    "step_key": "step_crm_task",
                    "step_type": "ACTION",
                    "name": "Create Onboarding Task",
                    "action_key": "crm.task.create",
                    "inputs": {
                        "subject": "Onboard Customer: {{ trigger.opportunity.account_name }}",
                        "assigned_to": "success-lead@ubop.vn",
                        "priority": "HIGH",
                    },
                }
            ],
        },
    },
    {
        "id": "tpl_bi_refresh_failure",
        "name": "BI Refresh Failure Alert",
        "description": "Alerts data analytics architects immediately when a semantic model fails automated scheduled refresh.",
        "category": "BI",
        "trigger_summary": "BI.RefreshFailed",
        "template_structure": {
            "trigger": {
                "trigger_type": "DOMAIN_EVENT",
                "event_name": "BI.RefreshFailed",
            },
            "steps": [
                {
                    "step_key": "step_alert_bi_architect",
                    "step_type": "ACTION",
                    "name": "Notify BI Architect",
                    "action_key": "notification.send_inapp",
                    "inputs": {
                        "recipient": "bi-ops@ubop.vn",
                        "subject": "BI Model Refresh Failed: {{ trigger.model.name }}",
                        "message": "Partition refresh failed at {{ trigger.failed_at }} with error: {{ trigger.error_message }}.",
                    },
                }
            ],
        },
    },
]


# --------------------------------------------------------------------------
# Expression & Data Pill Reference Resolver
# --------------------------------------------------------------------------
class DataReferenceResolver:
    @staticmethod
    def resolve_path(context: Dict[str, Any], path: str) -> Any:
        """
        Resolves dotted path against context, e.g.:
        path: "trigger.order.total"
        context: {"trigger": {"order": {"total": 85000000}}}
        """
        parts = path.strip().split(".")
        curr = context
        for part in parts:
            if isinstance(curr, dict):
                curr = curr.get(part)
            elif hasattr(curr, part):
                curr = getattr(curr, part)
            else:
                return None
            if curr is None:
                return None
        return curr

    @classmethod
    def resolve_template(cls, template_str: str, context: Dict[str, Any]) -> Any:
        """
        Evaluates string with data pills like "Hello {{ trigger.customer.name }}",
        or if the whole string is just a pill reference, preserves the native type (e.g. number/dict).
        """
        if not isinstance(template_str, str):
            return template_str

        # If it matches exact pattern `{{ some.path }}` return typed value directly
        exact_match = re.fullmatch(r"\{\{\s*([\w\.]+)\s*\}\}", template_str.strip())
        if exact_match:
            val = cls.resolve_path(context, exact_match.group(1))
            return val if val is not None else template_str

        # Otherwise interpolate within string
        def replace_fn(match):
            path = match.group(1)
            val = cls.resolve_path(context, path)
            return str(val) if val is not None else ""

        return re.sub(r"\{\{\s*([\w\.]+)\s*\}\}", replace_fn, template_str)

    @classmethod
    def resolve_inputs(cls, inputs: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Deeply resolves all data pills in an input dictionary."""
        resolved = {}
        for k, v in inputs.items():
            if isinstance(v, str):
                resolved[k] = cls.resolve_template(v, context)
            elif isinstance(v, dict):
                resolved[k] = cls.resolve_inputs(v, context)
            elif isinstance(v, list):
                resolved[k] = [cls.resolve_template(item, context) if isinstance(item, str) else item for item in v]
            else:
                resolved[k] = v
        return resolved


# --------------------------------------------------------------------------
# Safe Condition Evaluator (NO eval())
# --------------------------------------------------------------------------
class ConditionEvaluator:
    @staticmethod
    def evaluate_rule(rule: Dict[str, Any], context: Dict[str, Any]) -> bool:
        field_ref = rule.get("field_ref", "")
        op = rule.get("operator", "EQUALS").upper()
        target_val = rule.get("value")

        actual_val = DataReferenceResolver.resolve_path(context, field_ref)

        if op == "EQUALS":
            return str(actual_val) == str(target_val)
        elif op == "NOT_EQUALS":
            return str(actual_val) != str(target_val)
        elif op == "GT":
            try:
                return float(actual_val or 0) > float(target_val or 0)
            except Exception:
                return False
        elif op == "GTE":
            try:
                return float(actual_val or 0) >= float(target_val or 0)
            except Exception:
                return False
        elif op == "LT":
            try:
                return float(actual_val or 0) < float(target_val or 0)
            except Exception:
                return False
        elif op == "LTE":
            try:
                return float(actual_val or 0) <= float(target_val or 0)
            except Exception:
                return False
        elif op == "CONTAINS":
            return str(target_val).lower() in str(actual_val or "").lower()
        elif op == "IS_EMPTY":
            return actual_val is None or actual_val == "" or actual_val == [] or actual_val == {}
        return False

    @classmethod
    def evaluate_group(cls, group: Optional[Dict[str, Any]], context: Dict[str, Any]) -> bool:
        if not group:
            return True
        op = group.get("operator", "AND").upper()
        rules = group.get("rules", [])
        if not rules:
            return True

        if op == "AND":
            for r in rules:
                if not cls.evaluate_rule(r, context):
                    return False
            return True
        elif op == "OR":
            for r in rules:
                if cls.evaluate_rule(r, context):
                    return True
            return False
        return True


# --------------------------------------------------------------------------
# Flow Validation Service
# --------------------------------------------------------------------------
class FlowValidationService:
    @staticmethod
    def validate(trigger: Dict[str, Any], steps: List[Dict[str, Any]], actions_map: Dict[str, ActionDefinition]) -> FlowValidationResult:
        errors = []
        warnings = []

        # 1. Trigger Validation
        trigger_type = trigger.get("trigger_type")
        if not trigger_type:
            errors.append("Trigger type is required.")
        elif trigger_type == "DOMAIN_EVENT" and not trigger.get("event_name"):
            errors.append("Domain event trigger requires an event name (e.g. OMS.OrderCreated).")

        # 2. Steps Validation
        if not steps:
            warnings.append("Flow has no steps defined. Add actions or logic to execute.")

        step_keys_seen = set()
        for idx, step in enumerate(steps):
            step_key = step.get("step_key") or f"step_{idx+1}"
            if step_key in step_keys_seen:
                errors.append(f"Duplicate step key: '{step_key}'. Step keys must be unique.")
            step_keys_seen.add(step_key)

            stype = step.get("step_type")
            if stype == "ACTION":
                act_key = step.get("action_key")
                if not act_key:
                    errors.append(f"Step '{step.get('name', step_key)}' is missing an action key.")
                elif act_key in actions_map:
                    act_def = actions_map[act_key]
                    if act_def.connection_type_required and not step.get("connection_reference"):
                        warnings.append(f"Step '{step.get('name', step_key)}' requires connection reference for {act_def.connection_type_required}.")
            elif stype == "CONDITION":
                if not step.get("true_steps") and not step.get("false_steps"):
                    warnings.append(f"Condition '{step.get('name', step_key)}' has neither True nor False branches configured.")
            elif stype == "SUBFLOW":
                if not step.get("subflow_id"):
                    errors.append(f"Subflow step '{step.get('name', step_key)}' is missing subflow reference.")
            elif stype == "APPROVAL":
                if not step.get("approval_role"):
                    errors.append(f"Approval step '{step.get('name', step_key)}' requires an approver role.")

        return FlowValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )


# --------------------------------------------------------------------------
# Main Workflow Service
# --------------------------------------------------------------------------
class WorkflowService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # -------------------------------------------------------------
    # Initialization & Seeding
    # -------------------------------------------------------------
    async def ensure_seed_data(self):
        """Seed default actions, subflows, templates, and reference flows."""
        # 1. Actions
        act_res = await self.db.execute(select(ActionDefinition))
        existing_actions = {a.key: a for a in act_res.scalars().all()}

        for act_data in DEFAULT_ACTIONS:
            if act_data["key"] not in existing_actions:
                new_act = ActionDefinition(
                    id=act_data["id"],
                    organization_id="org_default",
                    key=act_data["key"],
                    name=act_data["name"],
                    description=act_data["description"],
                    category=act_data["category"],
                    input_schema=json.dumps(act_data["input_schema"]),
                    output_schema=json.dumps(act_data["output_schema"]),
                    execution_type=act_data["execution_type"],
                    capability_reference=act_data["capability_reference"],
                    connection_type_required=act_data.get("connection_type_required"),
                    version=act_data["version"],
                    status="PUBLISHED",
                    usage_count=act_data["usage_count"],
                )
                self.db.add(new_act)

        # 2. Subflows
        sub_res = await self.db.execute(select(SubflowDefinition))
        existing_subflows = {s.id: s for s in sub_res.scalars().all()}

        for sub_data in DEFAULT_SUBFLOWS:
            if sub_data["id"] not in existing_subflows:
                new_sub = SubflowDefinition(
                    id=sub_data["id"],
                    organization_id="org_default",
                    name=sub_data["name"],
                    description=sub_data["description"],
                    input_schema=json.dumps(sub_data["input_schema"]),
                    output_schema=json.dumps(sub_data["output_schema"]),
                    steps=json.dumps(sub_data["steps"]),
                    status="PUBLISHED",
                )
                self.db.add(new_sub)

        # 3. Templates
        tpl_res = await self.db.execute(select(FlowTemplate))
        existing_templates = {t.id: t for t in tpl_res.scalars().all()}

        for tpl_data in DEFAULT_TEMPLATES:
            if tpl_data["id"] not in existing_templates:
                new_tpl = FlowTemplate(
                    id=tpl_data["id"],
                    name=tpl_data["name"],
                    description=tpl_data["description"],
                    category=tpl_data["category"],
                    trigger_summary=tpl_data["trigger_summary"],
                    template_structure=json.dumps(tpl_data["template_structure"]),
                )
                self.db.add(new_tpl)

        # 4. Seed Reference Flows (Large Order Approval, Low Stock Alert, Daily Revenue Summary)
        flow_res = await self.db.execute(select(FlowDefinition))
        existing_flows = {f.id: f for f in flow_res.scalars().all()}

        if "flow_large_order_approval" not in existing_flows:
            flow1 = FlowDefinition(
                id="flow_large_order_approval",
                organization_id="org_default",
                name="Large Order Approval",
                description="Cross-module routing for high-value orders requiring Operations Manager sign-off before VIP tagging.",
                category="OMS",
                owner_name="Operations Team",
                status="ACTIVE",
                active_version_id="ver_flow_large_order_v3",
                draft_version_id="ver_flow_large_order_v4",
                last_run_at=datetime.now(timezone.utc),
                last_run_status="SUCCEEDED",
                run_count=42,
            )
            self.db.add(flow1)

            # v3 Published & Active
            tpl_large_order = next(t for t in DEFAULT_TEMPLATES if t["id"] == "tpl_large_order_approval")
            v3 = FlowVersion(
                id="ver_flow_large_order_v3",
                flow_definition_id="flow_large_order_approval",
                version_number=3,
                state="PUBLISHED",
                trigger_definition=json.dumps(tpl_large_order["template_structure"]["trigger"]),
                flow_structure=json.dumps(tpl_large_order["template_structure"]["steps"]),
                created_by="Huy Nguyen (Senior Architect)",
                published_at=datetime.now(timezone.utc),
            )
            self.db.add(v3)

            # v4 Draft with modified notification step
            v4_steps = copy.deepcopy(tpl_large_order["template_structure"]["steps"])
            v4_steps.append({
                "step_key": "step_slack_alert",
                "step_type": "ACTION",
                "name": "Broadcast to Slack #ops-alerts",
                "action_key": "notification.send_inapp",
                "inputs": {
                    "recipient": "#ops-alerts",
                    "subject": "[DRAFT v4] High Value Order Routed",
                    "message": "Order {{ trigger.order.order_number }} logged in Slack channel.",
                },
            })
            v4 = FlowVersion(
                id="ver_flow_large_order_v4",
                flow_definition_id="flow_large_order_approval",
                version_number=4,
                state="DRAFT",
                trigger_definition=json.dumps(tpl_large_order["template_structure"]["trigger"]),
                flow_structure=json.dumps(v4_steps),
                created_by="Huy Nguyen (Senior Architect)",
            )
            self.db.add(v4)

        if "flow_low_stock_alert" not in existing_flows:
            tpl_low_stock = next(t for t in DEFAULT_TEMPLATES if t["id"] == "tpl_low_stock_alert")
            flow2 = FlowDefinition(
                id="flow_low_stock_alert",
                organization_id="org_default",
                name="Low Stock Alert",
                description="Monitors ERP material levels and dispatches urgent replenishment requests.",
                category="ERP",
                owner_name="Logistics Team",
                status="ACTIVE",
                active_version_id="ver_flow_low_stock_v1",
                draft_version_id=None,
                last_run_at=datetime.now(timezone.utc),
                last_run_status="SUCCEEDED",
                run_count=18,
            )
            self.db.add(flow2)

            v2_1 = FlowVersion(
                id="ver_flow_low_stock_v1",
                flow_definition_id="flow_low_stock_alert",
                version_number=1,
                state="PUBLISHED",
                trigger_definition=json.dumps(tpl_low_stock["template_structure"]["trigger"]),
                flow_structure=json.dumps(tpl_low_stock["template_structure"]["steps"]),
                created_by="Minh Tran (Warehouse Lead)",
                published_at=datetime.now(timezone.utc),
            )
            self.db.add(v2_1)

        if "flow_daily_revenue_summary" not in existing_flows:
            flow3 = FlowDefinition(
                id="flow_daily_revenue_summary",
                organization_id="org_default",
                name="Daily Revenue Summary",
                description="Executes daily at 08:00 to refresh the BI Commerce Ops model and notify executive leadership.",
                category="BI",
                owner_name="BI Architect",
                status="ACTIVE",
                active_version_id="ver_flow_daily_rev_v1",
                draft_version_id=None,
                last_run_at=datetime.now(timezone.utc),
                last_run_status="SUCCEEDED",
                run_count=65,
            )
            self.db.add(flow3)

            v3_1 = FlowVersion(
                id="ver_flow_daily_rev_v1",
                flow_definition_id="flow_daily_revenue_summary",
                version_number=1,
                state="PUBLISHED",
                trigger_definition=json.dumps({
                    "trigger_type": "SCHEDULE",
                    "schedule_frequency": "DAILY",
                    "schedule_time": "08:00",
                    "enabled": True,
                }),
                flow_structure=json.dumps([
                    {
                        "step_key": "step_bi_refresh",
                        "step_type": "ACTION",
                        "name": "Refresh Commerce Operations Model",
                        "action_key": "bi.semantic_model.refresh",
                        "inputs": {"model_id": "sm_commerce_ops", "refresh_mode": "INCREMENTAL"},
                    },
                    {
                        "step_key": "step_notify_execs",
                        "step_type": "ACTION",
                        "name": "Send Revenue Digest Email",
                        "action_key": "notification.send_inapp",
                        "inputs": {
                            "recipient": "exec-board@ubop.vn",
                            "subject": "Daily Executive Revenue Digest Ready",
                            "message": "Commerce Operations semantic model refreshed at 08:00. View updated Power BI dashboards.",
                        },
                    },
                ]),
                created_by="Huy Nguyen (Senior Architect)",
                published_at=datetime.now(timezone.utc),
            )
            self.db.add(v3_1)

        # 5. Seed an Initial Pending Approval & Completed Flow Run for diagnostics
        run_res = await self.db.execute(select(FlowRun))
        existing_runs = run_res.scalars().all()
        if not existing_runs:
            # Seed 1 Successful Run
            run1 = FlowRun(
                id="run_10291",
                organization_id="org_default",
                flow_definition_id="flow_large_order_approval",
                flow_version_id="ver_flow_large_order_v3",
                flow_name="Large Order Approval",
                version_number=3,
                trigger_type="DOMAIN_EVENT",
                trigger_reference="OMS.OrderCreated #ORD-20391",
                trigger_payload_snapshot=json.dumps({
                    "order": {
                        "id": "ORD-20391",
                        "order_number": "ORD-20391",
                        "total": 85000000,
                        "channel": "B2B",
                        "customer_name": "Vinamilk Megacorp",
                        "owner_email": "quang.le@ubop.vn",
                    }
                }),
                status="SUCCEEDED",
                duration_ms=1240,
                current_step_key="step_notify_owner",
                correlation_id="ORD-20391",
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
            )
            self.db.add(run1)

            sr1 = StepRun(
                id="steprun_10291_1",
                flow_run_id="run_10291",
                step_key="step_cond_high_value",
                step_type="CONDITION",
                step_name="Evaluate Order Value & Channel",
                status="SUCCEEDED",
                attempt=1,
                duration_ms=4,
                resolved_inputs=json.dumps({"order.total": 85000000}),
                outputs=json.dumps({"branch": "TRUE"}),
            )
            sr2 = StepRun(
                id="steprun_10291_2",
                flow_run_id="run_10291",
                step_key="step_approval_mgr",
                step_type="APPROVAL",
                step_name="Request Operations Approval",
                status="SUCCEEDED",
                attempt=1,
                duration_ms=45,
                resolved_inputs=json.dumps({"role": "OPERATIONS_MANAGER"}),
                outputs=json.dumps({"decision": "APPROVED", "by": "Operations Manager"}),
            )
            sr3 = StepRun(
                id="steprun_10291_3",
                flow_run_id="run_10291",
                step_key="step_tag_vip",
                step_type="ACTION",
                step_name="Tag Order as Approved VIP",
                status="SUCCEEDED",
                attempt=1,
                duration_ms=120,
                resolved_inputs=json.dumps({"order_id": "ORD-20391", "tag": "APPROVED_VIP"}),
                outputs=json.dumps({"success": True, "tags": ["WHOLESALE", "APPROVED_VIP"]}),
            )
            sr4 = StepRun(
                id="steprun_10291_4",
                flow_run_id="run_10291",
                step_key="step_notify_owner",
                step_type="ACTION",
                step_name="Notify Account Representative",
                status="SUCCEEDED",
                attempt=1,
                duration_ms=85,
                resolved_inputs=json.dumps({
                    "recipient": "quang.le@ubop.vn",
                    "subject": "Order ORD-20391 Processed",
                    "message": "Order for Vinamilk Megacorp totaling ₫85,000,000 has completed approval routing.",
                }),
                outputs=json.dumps({"notification_id": "notif_88921", "delivered": True}),
            )
            self.db.add_all([sr1, sr2, sr3, sr4])

        # 6. Seed Pending Approval Request if no pending approval exists
        appr_res = await self.db.execute(select(ApprovalRequest).where(ApprovalRequest.status == "PENDING"))
        pending_apprs = appr_res.scalars().all()
        if not pending_apprs:
            app_req = ApprovalRequest(
                id=f"appr_{uuid.uuid4().hex[:6]}",
                organization_id="org_default",
                flow_run_id="run_10291",
                step_run_id="steprun_10291_2",
                flow_name="Large Order Approval",
                approver_type="ROLE",
                approver_reference="OPERATIONS_MANAGER",
                status="PENDING",
                entity_reference=json.dumps({
                    "entity_type": "order",
                    "entity_id": "ORD-20392",
                    "order_number": "ORD-20392",
                    "customer_name": "Viettel Global Logistics",
                    "amount": 120000000,
                    "currency": "VND",
                    "summary": "Special bulk server procurement requires operational margin sign-off.",
                }),
            )
            self.db.add(app_req)

        await self.db.commit()

    # -------------------------------------------------------------
    # Actions & Subflows Catalog
    # -------------------------------------------------------------
    async def list_actions(self, category: Optional[str] = None) -> List[ActionDefinitionResponse]:
        query = select(ActionDefinition)
        if category and category != "ALL":
            query = query.where(ActionDefinition.category == category)
        query = query.order_by(ActionDefinition.name)
        res = await self.db.execute(query)
        actions = res.scalars().all()
        return [
            ActionDefinitionResponse(
                id=a.id,
                organization_id=a.organization_id,
                key=a.key,
                name=a.name,
                description=a.description,
                category=a.category,
                input_schema=json.loads(a.input_schema),
                output_schema=json.loads(a.output_schema),
                execution_type=a.execution_type,
                capability_reference=a.capability_reference,
                connection_type_required=a.connection_type_required,
                version=a.version,
                status=a.status,
                usage_count=a.usage_count,
                created_at=a.created_at,
            )
            for a in actions
        ]

    async def list_subflows(self) -> List[SubflowDefinitionResponse]:
        query = select(SubflowDefinition).order_by(SubflowDefinition.name)
        res = await self.db.execute(query)
        subflows = res.scalars().all()
        return [
            SubflowDefinitionResponse(
                id=s.id,
                organization_id=s.organization_id,
                name=s.name,
                description=s.description,
                input_schema=json.loads(s.input_schema),
                output_schema=json.loads(s.output_schema),
                steps=json.loads(s.steps),
                active_version_id=s.active_version_id,
                draft_version_id=s.draft_version_id,
                status=s.status,
                created_at=s.created_at,
            )
            for s in subflows
        ]

    # -------------------------------------------------------------
    # Flow Definitions & Versions (ServiceNow Studio Core)
    # -------------------------------------------------------------
    async def list_flows(self, status: Optional[str] = None, category: Optional[str] = None) -> List[FlowDefinitionResponse]:
        query = select(FlowDefinition)
        if status and status != "ALL":
            query = query.where(FlowDefinition.status == status)
        if category and category != "ALL":
            query = query.where(FlowDefinition.category == category)
        query = query.order_by(desc(FlowDefinition.updated_at))
        res = await self.db.execute(query)
        flows = res.scalars().all()

        results = []
        for f in flows:
            active_ver = None
            draft_ver = None
            if f.active_version_id:
                av = await self.db.get(FlowVersion, f.active_version_id)
                if av:
                    active_ver = self._to_version_response(av)
            if f.draft_version_id:
                dv = await self.db.get(FlowVersion, f.draft_version_id)
                if dv:
                    draft_ver = self._to_version_response(dv)

            results.append(
                FlowDefinitionResponse(
                    id=f.id,
                    organization_id=f.organization_id,
                    name=f.name,
                    description=f.description,
                    category=f.category,
                    owner_name=f.owner_name,
                    status=f.status,
                    active_version_id=f.active_version_id,
                    draft_version_id=f.draft_version_id,
                    active_version=active_ver,
                    draft_version=draft_ver,
                    last_run_at=f.last_run_at,
                    last_run_status=f.last_run_status,
                    run_count=f.run_count,
                    created_at=f.created_at,
                    updated_at=f.updated_at,
                )
            )
        return results

    async def get_flow(self, flow_id: str) -> Optional[FlowDefinitionResponse]:
        f = await self.db.get(FlowDefinition, flow_id)
        if not f:
            return None
        active_ver = None
        draft_ver = None
        if f.active_version_id:
            av = await self.db.get(FlowVersion, f.active_version_id)
            if av:
                active_ver = self._to_version_response(av)
        if f.draft_version_id:
            dv = await self.db.get(FlowVersion, f.draft_version_id)
            if dv:
                draft_ver = self._to_version_response(dv)

        return FlowDefinitionResponse(
            id=f.id,
            organization_id=f.organization_id,
            name=f.name,
            description=f.description,
            category=f.category,
            owner_name=f.owner_name,
            status=f.status,
            active_version_id=f.active_version_id,
            draft_version_id=f.draft_version_id,
            active_version=active_ver,
            draft_version=draft_ver,
            last_run_at=f.last_run_at,
            last_run_status=f.last_run_status,
            run_count=f.run_count,
            created_at=f.created_at,
            updated_at=f.updated_at,
        )

    async def create_flow(self, flow_in: FlowDefinitionCreate, user_name: str = "Huy Nguyen") -> FlowDefinitionResponse:
        flow_id = f"flow_{uuid.uuid4().hex[:8]}"
        ver_id = f"ver_{flow_id}_v1"

        flow = FlowDefinition(
            id=flow_id,
            organization_id="org_default",
            name=flow_in.name,
            description=flow_in.description,
            category=flow_in.category,
            owner_name=user_name,
            status="DRAFT",
            active_version_id=None,
            draft_version_id=ver_id,
            run_count=0,
        )
        self.db.add(flow)

        # Create Draft Version 1
        v1 = FlowVersion(
            id=ver_id,
            flow_definition_id=flow_id,
            version_number=1,
            state="DRAFT",
            trigger_definition=json.dumps(flow_in.trigger.model_dump()),
            flow_structure=json.dumps([s.model_dump() for s in flow_in.steps]),
            created_by=user_name,
        )
        self.db.add(v1)
        await self.db.commit()

        return await self.get_flow(flow_id)

    async def update_flow_draft(self, flow_id: str, flow_in: FlowDefinitionUpdate, user_name: str = "Huy Nguyen") -> FlowDefinitionResponse:
        flow = await self.db.get(FlowDefinition, flow_id)
        if not flow:
            raise ValueError(f"Flow {flow_id} not found")

        if flow_in.name:
            flow.name = flow_in.name
        if flow_in.description is not None:
            flow.description = flow_in.description
        if flow_in.category:
            flow.category = flow_in.category

        # If no draft version exists (flow was published directly), branch off a new draft!
        if not flow.draft_version_id:
            # Determine next version number
            res = await self.db.execute(
                select(FlowVersion).where(FlowVersion.flow_definition_id == flow_id).order_by(desc(FlowVersion.version_number))
            )
            latest_v = res.scalars().first()
            next_num = (latest_v.version_number + 1) if latest_v else 1
            new_draft_id = f"ver_{flow_id}_v{next_num}"

            # Copy active version trigger/steps if not explicitly given
            base_trigger = flow_in.trigger.model_dump() if flow_in.trigger else json.loads(latest_v.trigger_definition if latest_v else "{}")
            base_steps = [s.model_dump() for s in flow_in.steps] if flow_in.steps is not None else json.loads(latest_v.flow_structure if latest_v else "[]")

            draft_v = FlowVersion(
                id=new_draft_id,
                flow_definition_id=flow_id,
                version_number=next_num,
                state="DRAFT",
                trigger_definition=json.dumps(base_trigger),
                flow_structure=json.dumps(base_steps),
                created_by=user_name,
            )
            self.db.add(draft_v)
            flow.draft_version_id = new_draft_id
        else:
            draft_v = await self.db.get(FlowVersion, flow.draft_version_id)
            if draft_v:
                if flow_in.trigger:
                    draft_v.trigger_definition = json.dumps(flow_in.trigger.model_dump())
                if flow_in.steps is not None:
                    draft_v.flow_structure = json.dumps([s.model_dump() for s in flow_in.steps])

        flow.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        return await self.get_flow(flow_id)

    async def list_flow_versions(self, flow_id: str) -> List[FlowVersionResponse]:
        query = select(FlowVersion).where(FlowVersion.flow_definition_id == flow_id).order_by(desc(FlowVersion.version_number))
        res = await self.db.execute(query)
        versions = res.scalars().all()
        return [self._to_version_response(v) for v in versions]

    async def validate_flow(self, flow_id: str) -> FlowValidationResult:
        flow = await self.db.get(FlowDefinition, flow_id)
        if not flow:
            raise ValueError(f"Flow {flow_id} not found")

        target_ver_id = flow.draft_version_id or flow.active_version_id
        if not target_ver_id:
            return FlowValidationResult(is_valid=False, errors=["Flow has no draft or active version."], warnings=[])

        version = await self.db.get(FlowVersion, target_ver_id)
        trigger = json.loads(version.trigger_definition)
        steps = json.loads(version.flow_structure)

        act_res = await self.db.execute(select(ActionDefinition))
        actions_map = {a.key: a for a in act_res.scalars().all()}

        return FlowValidationService.validate(trigger, steps, actions_map)

    async def activate_flow_draft(self, flow_id: str) -> FlowDefinitionResponse:
        """
        Publishes the draft version, marks previous active version SUPERSEDED, and sets flow status to ACTIVE.
        """
        flow = await self.db.get(FlowDefinition, flow_id)
        if not flow:
            raise ValueError(f"Flow {flow_id} not found")
        if not flow.draft_version_id:
            raise ValueError("No draft version available to activate.")

        val_res = await self.validate_flow(flow_id)
        if not val_res.is_valid:
            raise ValueError(f"Cannot activate invalid flow: {', '.join(val_res.errors)}")

        draft_v = await self.db.get(FlowVersion, flow.draft_version_id)
        draft_v.state = "PUBLISHED"
        draft_v.published_at = datetime.now(timezone.utc)

        # Supersede old active version
        if flow.active_version_id and flow.active_version_id != draft_v.id:
            old_active = await self.db.get(FlowVersion, flow.active_version_id)
            if old_active:
                old_active.state = "SUPERSEDED"

        flow.active_version_id = draft_v.id
        flow.draft_version_id = None
        flow.status = "ACTIVE"
        flow.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        return await self.get_flow(flow_id)

    async def deactivate_flow(self, flow_id: str) -> FlowDefinitionResponse:
        flow = await self.db.get(FlowDefinition, flow_id)
        if not flow:
            raise ValueError(f"Flow {flow_id} not found")
        flow.status = "INACTIVE"
        flow.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        return await self.get_flow(flow_id)

    # -------------------------------------------------------------
    # Flow Test & Execution Engine (Produces Execution Details)
    # -------------------------------------------------------------
    async def run_flow_test(self, flow_id: str, test_req: FlowTestRequest) -> FlowRunResponse:
        """
        Executes flow in test mode with supplied trigger data and generates step execution details.
        """
        flow = await self.db.get(FlowDefinition, flow_id)
        if not flow:
            raise ValueError(f"Flow {flow_id} not found")

        target_ver_id = flow.draft_version_id or flow.active_version_id
        if not target_ver_id:
            raise ValueError("Flow has no runnable version.")
        version = await self.db.get(FlowVersion, target_ver_id)

        steps = json.loads(version.flow_structure)
        payload = test_req.payload

        run_id = f"run_{uuid.uuid4().hex[:8]}"
        flow_run = FlowRun(
            id=run_id,
            organization_id="org_default",
            flow_definition_id=flow.id,
            flow_version_id=version.id,
            flow_name=flow.name,
            version_number=version.version_number,
            trigger_type=test_req.trigger_type,
            trigger_reference=f"TEST: {test_req.trigger_type}",
            trigger_payload_snapshot=json.dumps(payload),
            status="RUNNING",
            correlation_id=payload.get("order", {}).get("id", payload.get("id", f"TEST-{run_id}")),
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(flow_run)

        # Context holds trigger data and cumulative step outputs
        context: Dict[str, Any] = {
            "trigger": payload,
            "steps": {},
        }

        step_runs: List[StepRun] = []
        overall_status = "SUCCEEDED"
        error_summary = None
        current_step_key = None

        start_time = time.perf_counter()

        for idx, step in enumerate(steps):
            step_key = step.get("step_key", f"step_{idx+1}")
            step_name = step.get("name", step_key)
            step_type = step.get("step_type", "ACTION")
            current_step_key = step_key

            step_start = time.perf_counter()
            sr_id = f"steprun_{run_id}_{idx+1}"

            try:
                resolved_inputs = DataReferenceResolver.resolve_inputs(step.get("inputs", {}), context)

                if step_type == "CONDITION":
                    cond_group = step.get("condition_group")
                    branch_result = ConditionEvaluator.evaluate_group(cond_group, context)
                    outputs = {"branch": "TRUE" if branch_result else "FALSE"}

                elif step_type == "APPROVAL":
                    # Human approval simulated or registered
                    outputs = {
                        "decision": "APPROVED",
                        "approver": step.get("approval_role", "OPERATIONS_MANAGER"),
                        "comment": "Auto-approved during Flow Designer test sandbox.",
                    }
                    context["steps"][step_key] = outputs

                elif step_type == "WAIT":
                    outputs = {
                        "wait_type": step.get("wait_type", "DURATION"),
                        "simulated_duration_sec": step.get("wait_duration_sec", 60),
                        "resumed": True,
                    }
                    context["steps"][step_key] = outputs

                elif step_type == "ACTION":
                    # Action execution
                    act_key = step.get("action_key", "utility.action")
                    outputs = {
                        "action": act_key,
                        "status": "COMPLETED",
                        "result_id": f"res_{uuid.uuid4().hex[:6]}",
                        "message": f"Action [{act_key}] simulated successfully.",
                    }
                    context["steps"][step_key] = outputs

                else:
                    outputs = {"status": "EXECUTED"}

                step_duration_ms = round((time.perf_counter() - step_start) * 1000)
                sr = StepRun(
                    id=sr_id,
                    flow_run_id=run_id,
                    step_key=step_key,
                    step_type=step_type,
                    step_name=step_name,
                    status="SUCCEEDED",
                    attempt=1,
                    duration_ms=max(1, step_duration_ms),
                    resolved_inputs=json.dumps(resolved_inputs),
                    outputs=json.dumps(outputs),
                )
                self.db.add(sr)
                step_runs.append(sr)

                # If condition, now execute and append nested branch steps
                if step_type == "CONDITION":
                    branch_steps = step.get("true_steps", []) if branch_result else step.get("false_steps", [])
                    for sub_idx, sub_step in enumerate(branch_steps):
                        sub_resolved = DataReferenceResolver.resolve_inputs(sub_step.get("inputs", {}), context)
                        sub_sr = StepRun(
                            id=f"{sr_id}_{sub_idx+1}",
                            flow_run_id=run_id,
                            step_key=sub_step.get("step_key", f"{step_key}_b{sub_idx+1}"),
                            step_type=sub_step.get("step_type", "ACTION"),
                            step_name=sub_step.get("name", "Branch Action"),
                            status="SUCCEEDED",
                            attempt=1,
                            duration_ms=25,
                            resolved_inputs=json.dumps(sub_resolved),
                            outputs=json.dumps({"success": True, "action_result": "Simulated branch execution ok"}),
                        )
                        self.db.add(sub_sr)
                        step_runs.append(sub_sr)

            except Exception as ex:
                step_duration_ms = round((time.perf_counter() - step_start) * 1000)
                overall_status = "FAILED"
                error_summary = f"Step '{step_name}' failed: {str(ex)}"
                sr = StepRun(
                    id=sr_id,
                    flow_run_id=run_id,
                    step_key=step_key,
                    step_type=step_type,
                    step_name=step_name,
                    status="FAILED",
                    attempt=1,
                    duration_ms=max(1, step_duration_ms),
                    resolved_inputs=json.dumps(step.get("inputs", {})),
                    outputs="{}",
                    error_code="STEP_EXECUTION_ERROR",
                    error_message=str(ex),
                )
                self.db.add(sr)
                step_runs.append(sr)
                break

        total_duration_ms = round((time.perf_counter() - start_time) * 1000)
        flow_run.status = overall_status
        flow_run.error_summary = error_summary
        flow_run.current_step_key = current_step_key
        flow_run.duration_ms = total_duration_ms
        flow_run.completed_at = datetime.now(timezone.utc)

        # Update flow stats
        flow.last_run_at = datetime.now(timezone.utc)
        flow.last_run_status = overall_status
        flow.run_count = (flow.run_count or 0) + 1

        await self.db.commit()
        return await self.get_flow_run(run_id)

    # -------------------------------------------------------------
    # Runs Index & Execution Diagnostics
    # -------------------------------------------------------------
    async def list_flow_runs(self, status: Optional[str] = None, flow_id: Optional[str] = None, limit: int = 50) -> List[FlowRunResponse]:
        query = select(FlowRun)
        if status and status != "ALL":
            query = query.where(FlowRun.status == status)
        if flow_id:
            query = query.where(FlowRun.flow_definition_id == flow_id)
        query = query.order_by(desc(FlowRun.started_at)).limit(limit)
        res = await self.db.execute(query)
        runs = res.scalars().all()

        results = []
        for r in runs:
            results.append(await self.get_flow_run(r.id))
        return [r for r in results if r is not None]

    async def get_flow_run(self, run_id: str) -> Optional[FlowRunResponse]:
        r = await self.db.get(FlowRun, run_id)
        if not r:
            return None

        sr_res = await self.db.execute(
            select(StepRun).where(StepRun.flow_run_id == run_id).order_by(StepRun.started_at)
        )
        step_runs = sr_res.scalars().all()

        return FlowRunResponse(
            id=r.id,
            organization_id=r.organization_id,
            flow_definition_id=r.flow_definition_id,
            flow_version_id=r.flow_version_id,
            flow_name=r.flow_name,
            version_number=r.version_number,
            trigger_type=r.trigger_type,
            trigger_reference=r.trigger_reference,
            status=r.status,
            started_at=r.started_at,
            completed_at=r.completed_at,
            duration_ms=r.duration_ms,
            current_step_key=r.current_step_key,
            error_summary=r.error_summary,
            correlation_id=r.correlation_id,
            step_runs=[
                StepRunResponse(
                    id=s.id,
                    flow_run_id=s.flow_run_id,
                    step_key=s.step_key,
                    step_type=s.step_type,
                    step_name=s.step_name,
                    status=s.status,
                    attempt=s.attempt,
                    started_at=s.started_at,
                    completed_at=s.completed_at,
                    duration_ms=s.duration_ms,
                    resolved_inputs=json.loads(s.resolved_inputs or "{}"),
                    outputs=json.loads(s.outputs or "{}"),
                    error_code=s.error_code,
                    error_message=s.error_message,
                )
                for s in step_runs
            ],
            created_at=r.created_at,
        )

    async def cancel_flow_run(self, run_id: str) -> FlowRunResponse:
        run = await self.db.get(FlowRun, run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")
        if run.status in ("SUCCEEDED", "FAILED", "CANCELLED"):
            raise ValueError(f"Run {run_id} is already terminated with status {run.status}")

        run.status = "CANCELLED"
        run.error_summary = "Operation cancelled by operator."
        run.completed_at = datetime.now(timezone.utc)
        await self.db.commit()
        return await self.get_flow_run(run_id)

    async def retry_flow_run(self, run_id: str) -> FlowRunResponse:
        run = await self.db.get(FlowRun, run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")
        payload = json.loads(run.trigger_payload_snapshot or "{}")
        return await self.run_flow_test(run.flow_definition_id, FlowTestRequest(trigger_type=run.trigger_type, payload=payload))

    # -------------------------------------------------------------
    # Approvals Management
    # -------------------------------------------------------------
    async def list_approvals(self, status: Optional[str] = None) -> List[ApprovalRequestResponse]:
        query = select(ApprovalRequest)
        if status and status != "ALL":
            query = query.where(ApprovalRequest.status == status)
        query = query.order_by(desc(ApprovalRequest.requested_at))
        res = await self.db.execute(query)
        approvals = res.scalars().all()
        return [
            ApprovalRequestResponse(
                id=a.id,
                organization_id=a.organization_id,
                flow_run_id=a.flow_run_id,
                step_run_id=a.step_run_id,
                flow_name=a.flow_name,
                approver_type=a.approver_type,
                approver_reference=a.approver_reference,
                status=a.status,
                decision=a.decision,
                comment=a.comment,
                entity_reference=json.loads(a.entity_reference or "{}"),
                requested_at=a.requested_at,
                responded_at=a.responded_at,
                responded_by=a.responded_by,
            )
            for a in approvals
        ]

    async def decide_approval(self, approval_id: str, decision_req: ApprovalDecisionRequest, user_name: str = "Operations Lead") -> ApprovalRequestResponse:
        appr = await self.db.get(ApprovalRequest, approval_id)
        if not appr:
            raise ValueError(f"Approval request {approval_id} not found")
        if appr.status != "PENDING":
            raise ValueError(f"Approval request already resolved as {appr.status}")

        appr.status = decision_req.decision
        appr.decision = decision_req.decision
        appr.comment = decision_req.comment
        appr.responded_at = datetime.now(timezone.utc)
        appr.responded_by = user_name

        await self.db.commit()
        return ApprovalRequestResponse(
            id=appr.id,
            organization_id=appr.organization_id,
            flow_run_id=appr.flow_run_id,
            step_run_id=appr.step_run_id,
            flow_name=appr.flow_name,
            approver_type=appr.approver_type,
            approver_reference=appr.approver_reference,
            status=appr.status,
            decision=appr.decision,
            comment=appr.comment,
            entity_reference=json.loads(appr.entity_reference or "{}"),
            requested_at=appr.requested_at,
            responded_at=appr.responded_at,
            responded_by=appr.responded_by,
        )

    # -------------------------------------------------------------
    # Templates Catalog
    # -------------------------------------------------------------
    async def list_templates(self) -> List[FlowTemplateResponse]:
        query = select(FlowTemplate).order_by(FlowTemplate.name)
        res = await self.db.execute(query)
        templates = res.scalars().all()
        return [
            FlowTemplateResponse(
                id=t.id,
                name=t.name,
                description=t.description,
                category=t.category,
                trigger_summary=t.trigger_summary,
                template_structure=json.loads(t.template_structure),
                created_at=t.created_at,
            )
            for t in templates
        ]

    # -------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------
    def _to_version_response(self, v: FlowVersion) -> FlowVersionResponse:
        trigger_dict = json.loads(v.trigger_definition or "{}")
        steps_list = json.loads(v.flow_structure or "[]")
        return FlowVersionResponse(
            id=v.id,
            flow_definition_id=v.flow_definition_id,
            version_number=v.version_number,
            state=v.state,
            trigger_definition=TriggerDefinitionSchema(**trigger_dict),
            flow_structure=[StepDefinitionSchema(**s) for s in steps_list],
            created_by=v.created_by,
            created_at=v.created_at,
            published_at=v.published_at,
        )


# --------------------------------------------------------------------------
# Legacy WorkflowEngine for Backwards Compatibility
# --------------------------------------------------------------------------
class WorkflowEngine:
    def __init__(self, rule_repo=None, log_repo=None):
        self.rule_repo = rule_repo
        self.log_repo = log_repo

    async def create_rule(self, rule_in: WorkflowRuleCreate) -> WorkflowRule:
        async with AsyncSessionLocal() as db:
            rule = WorkflowRule(
                name=rule_in.name,
                event_pattern=rule_in.event_pattern,
                action_type=rule_in.action_type,
                action_payload=rule_in.action_payload or "{}",
                is_active=rule_in.is_active,
            )
            db.add(rule)
            await db.commit()
            await db.refresh(rule)
            return rule

    async def list_rules(self) -> List[WorkflowRule]:
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(WorkflowRule).order_by(desc(WorkflowRule.created_at)))
            return res.scalars().all()

    async def toggle_rule(self, rule_id: int, is_active: Optional[bool] = None) -> Optional[WorkflowRule]:
        async with AsyncSessionLocal() as db:
            rule = await db.get(WorkflowRule, rule_id)
            if not rule:
                return None
            rule.is_active = not rule.is_active if is_active is None else is_active
            await db.commit()
            await db.refresh(rule)
            return rule

    async def delete_rule(self, rule_id: int) -> bool:
        async with AsyncSessionLocal() as db:
            rule = await db.get(WorkflowRule, rule_id)
            if not rule:
                return False
            await db.delete(rule)
            await db.commit()
            return True

    async def list_logs(self, limit: int = 50) -> List[WorkflowLog]:
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(WorkflowLog).order_by(desc(WorkflowLog.created_at)).limit(limit))
            return res.scalars().all()

    def execute(self, workflow: Any) -> bool:
        return True

    async def execute_action(
        self, action_type: str, action_payload_str: str, event: Event
    ) -> Dict[str, Any]:
        start = time.perf_counter()
        act = action_type.upper().strip()
        latency = round((time.perf_counter() - start) * 1000)
        return {
            "status": "SUCCESS",
            "output": f"[Action {act} in {latency}ms] Dispatched successfully for {event.name}.",
        }

    async def handle_event(self, event: Event) -> List[Dict[str, Any]]:
        return []
