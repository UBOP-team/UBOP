from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
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
    SubflowDefinitionResponse,
    WorkflowLogResponse,
    WorkflowRuleCreate,
    WorkflowRuleResponse,
)
from .service import WorkflowEngine, WorkflowService

router = APIRouter(prefix="/workflow", tags=["Workflow Automation"])


async def get_wf_service(db: AsyncSession = Depends(get_db)) -> WorkflowService:
    svc = WorkflowService(db)
    await svc.ensure_seed_data()
    return svc


# -------------------------------------------------------------
# Reusable Action & Subflow Catalog
# -------------------------------------------------------------
@router.get("/actions", response_model=List[ActionDefinitionResponse])
async def list_actions(
    category: Optional[str] = None,
    svc: WorkflowService = Depends(get_wf_service),
):
    """List governed, reusable catalog actions."""
    return await svc.list_actions(category=category)


@router.get("/subflows", response_model=List[SubflowDefinitionResponse])
async def list_subflows(
    svc: WorkflowService = Depends(get_wf_service),
):
    """List reusable orchestration subflows."""
    return await svc.list_subflows()


@router.get("/templates", response_model=List[FlowTemplateResponse])
async def list_templates(
    svc: WorkflowService = Depends(get_wf_service),
):
    """List enterprise blueprint flow templates."""
    return await svc.list_templates()


# -------------------------------------------------------------
# Flow Definition & Designer Lifecycle
# -------------------------------------------------------------
@router.get("/flows", response_model=List[FlowDefinitionResponse])
async def list_flows(
    status: Optional[str] = None,
    category: Optional[str] = None,
    svc: WorkflowService = Depends(get_wf_service),
):
    """List flows with active and draft version states."""
    return await svc.list_flows(status=status, category=category)


@router.post("/flows", response_model=FlowDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_flow(
    flow_in: FlowDefinitionCreate,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Create a new automation flow in DRAFT state."""
    try:
        return await svc.create_flow(flow_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/flows/{flow_id}", response_model=FlowDefinitionResponse)
async def get_flow(
    flow_id: str,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Retrieve full details of a flow."""
    flow = await svc.get_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow


@router.patch("/flows/{flow_id}", response_model=FlowDefinitionResponse)
async def update_flow_draft(
    flow_id: str,
    flow_in: FlowDefinitionUpdate,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Update or autosave draft flow configuration."""
    try:
        return await svc.update_flow_draft(flow_id, flow_in)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/flows/{flow_id}/versions", response_model=List[FlowVersionResponse])
async def list_flow_versions(
    flow_id: str,
    svc: WorkflowService = Depends(get_wf_service),
):
    """List immutable version history for a flow."""
    return await svc.list_flow_versions(flow_id)


@router.post("/flows/{flow_id}/validate", response_model=FlowValidationResult)
async def validate_flow(
    flow_id: str,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Perform static validation on flow structure, references, and connections."""
    try:
        return await svc.validate_flow(flow_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/flows/{flow_id}/activate", response_model=FlowDefinitionResponse)
async def activate_flow(
    flow_id: str,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Publish draft version and activate the flow."""
    try:
        return await svc.activate_flow_draft(flow_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/flows/{flow_id}/deactivate", response_model=FlowDefinitionResponse)
async def deactivate_flow(
    flow_id: str,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Deactivate flow without terminating active runs."""
    try:
        return await svc.deactivate_flow(flow_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/flows/{flow_id}/test", response_model=FlowRunResponse)
async def test_flow(
    flow_id: str,
    test_req: FlowTestRequest,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Execute pre-activation test in sandbox and produce execution details."""
    try:
        return await svc.run_flow_test(flow_id, test_req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/flows/{flow_id}/run", response_model=FlowRunResponse)
async def run_flow_live(
    flow_id: str,
    payload: Optional[Dict[str, Any]] = None,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Execute active flow version in live runtime (creating real approvals and domain effects)."""
    try:
        body = payload or {}
        trigger_type = body.get("trigger_type", "MANUAL")
        actual_payload = body.get("payload") if ("payload" in body and isinstance(body["payload"], dict)) else body
        return await svc.execute_flow_run(
            flow_id=flow_id,
            trigger_type=trigger_type,
            payload=actual_payload,
            user_name="Interactive Operator",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# Runtime Execution & Diagnostics
# -------------------------------------------------------------
@router.get("/runs", response_model=List[FlowRunResponse])
async def list_flow_runs(
    status: Optional[str] = None,
    flow_id: Optional[str] = None,
    limit: int = 50,
    svc: WorkflowService = Depends(get_wf_service),
):
    """List runtime executions with status filter and durations."""
    return await svc.list_flow_runs(status=status, flow_id=flow_id, limit=limit)


@router.get("/runs/{run_id}", response_model=FlowRunResponse)
async def get_flow_run(
    run_id: str,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Retrieve full ServiceNow-style execution details and step metrics."""
    run = await svc.get_flow_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/runs/{run_id}/cancel", response_model=FlowRunResponse)
async def cancel_flow_run(
    run_id: str,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Cancel a running or waiting workflow execution."""
    try:
        return await svc.cancel_flow_run(run_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/runs/{run_id}/retry", response_model=FlowRunResponse)
async def retry_flow_run(
    run_id: str,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Safely retry failed steps with idempotency protection."""
    try:
        return await svc.retry_flow_run(run_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# Human-in-the-Loop Approvals Inbox
# -------------------------------------------------------------
@router.get("/approvals", response_model=List[ApprovalRequestResponse])
async def list_approvals(
    status: Optional[str] = None,
    svc: WorkflowService = Depends(get_wf_service),
):
    """List pending and historical workflow approval requests."""
    return await svc.list_approvals(status=status)


@router.post("/approvals/{approval_id}/decide", response_model=ApprovalRequestResponse)
async def decide_approval(
    approval_id: str,
    decision_req: ApprovalDecisionRequest,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Approve or reject a pending workflow request to resume execution."""
    try:
        return await svc.decide_approval(approval_id, decision_req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/approvals/{approval_id}/approve", response_model=ApprovalRequestResponse)
async def approve_request(
    approval_id: str,
    comment: Optional[str] = None,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Convenience shortcut to approve a request."""
    return await svc.decide_approval(approval_id, ApprovalDecisionRequest(decision="APPROVED", comment=comment))


@router.post("/approvals/{approval_id}/reject", response_model=ApprovalRequestResponse)
async def reject_request(
    approval_id: str,
    comment: Optional[str] = None,
    svc: WorkflowService = Depends(get_wf_service),
):
    """Convenience shortcut to reject a request."""
    return await svc.decide_approval(approval_id, ApprovalDecisionRequest(decision="REJECTED", comment=comment))


# -------------------------------------------------------------
# Legacy Compatibility Endpoints
# -------------------------------------------------------------
legacy_engine = WorkflowEngine()


@router.post("/rules", response_model=WorkflowRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(rule_in: WorkflowRuleCreate):
    try:
        return await legacy_engine.create_rule(rule_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rules", response_model=List[WorkflowRuleResponse])
async def list_rules():
    return await legacy_engine.list_rules()


@router.patch("/rules/{rule_id}", response_model=WorkflowRuleResponse)
async def toggle_rule(rule_id: int):
    updated = await legacy_engine.toggle_rule(rule_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Rule not found")
    return updated


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: int):
    success = await legacy_engine.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return None


@router.get("/logs", response_model=List[WorkflowLogResponse])
async def list_logs(limit: int = 50):
    return await legacy_engine.list_logs(limit=limit)


@router.post("/execute")
async def execute_workflow(workflow_data: Dict[str, Any]):
    success = legacy_engine.execute(workflow_data)
    return {"status": "success" if success else "failed", "data": workflow_data}
