from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class WorkflowRuleBase(BaseModel):
    name: str
    event_pattern: str
    action_type: str
    action_payload: Optional[str] = "{}"
    is_active: bool = True


class WorkflowRuleCreate(WorkflowRuleBase):
    pass


class WorkflowRuleResponse(WorkflowRuleBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkflowLogResponse(BaseModel):
    id: int
    rule_name: str
    event_name: str
    status: str
    output: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
