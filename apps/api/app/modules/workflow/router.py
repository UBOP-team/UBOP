from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import WorkflowRuleCreate, WorkflowRuleResponse, WorkflowLogResponse
from .repository import WorkflowRuleRepository, WorkflowLogRepository
from .service import WorkflowEngine

router = APIRouter(prefix="/workflow", tags=["Workflow"])


def get_workflow_engine(db: AsyncSession = Depends(get_db)) -> WorkflowEngine:
    r_repo = WorkflowRuleRepository(db)
    l_repo = WorkflowLogRepository(db)
    return WorkflowEngine(rule_repo=r_repo, log_repo=l_repo)


@router.post("/rules", response_model=WorkflowRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule_in: WorkflowRuleCreate,
    engine: WorkflowEngine = Depends(get_workflow_engine),
):
    try:
        return await engine.create_rule(rule_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rules", response_model=List[WorkflowRuleResponse])
async def list_rules(
    engine: WorkflowEngine = Depends(get_workflow_engine),
):
    return await engine.list_rules()


@router.patch("/rules/{rule_id}", response_model=WorkflowRuleResponse)
async def toggle_rule(
    rule_id: int,
    engine: WorkflowEngine = Depends(get_workflow_engine),
):
    updated = await engine.toggle_rule(rule_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Rule not found")
    return updated


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: int,
    engine: WorkflowEngine = Depends(get_workflow_engine),
):
    success = await engine.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return None


@router.get("/logs", response_model=List[WorkflowLogResponse])
async def list_logs(
    limit: int = 50,
    engine: WorkflowEngine = Depends(get_workflow_engine),
):
    return await engine.list_logs(limit=limit)


@router.post("/execute")
async def execute_workflow(
    workflow_data: Dict[str, Any],
    engine: WorkflowEngine = Depends(get_workflow_engine),
):
    success = engine.execute(workflow_data)
    return {"status": "success" if success else "failed", "data": workflow_data}
