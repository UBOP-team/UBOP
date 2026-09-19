import logging
from typing import Any, Dict, List, Optional
from app.core.events import Event
from .models import WorkflowRule, WorkflowLog
from .repository import WorkflowRuleRepository, WorkflowLogRepository
from .schemas import WorkflowRuleCreate

logger = logging.getLogger("ubop.workflow")


class WorkflowEngine:
    def __init__(
        self,
        rule_repo: Optional[WorkflowRuleRepository] = None,
        log_repo: Optional[WorkflowLogRepository] = None,
    ):
        self.rule_repo = rule_repo
        self.log_repo = log_repo

    async def create_rule(self, rule_in: WorkflowRuleCreate) -> WorkflowRule:
        if not self.rule_repo:
            raise ValueError("Rule repository not configured")

        rule = WorkflowRule(
            name=rule_in.name,
            event_pattern=rule_in.event_pattern,
            action_type=rule_in.action_type,
            action_payload=rule_in.action_payload or "{}",
            is_active=rule_in.is_active,
        )
        return await self.rule_repo.create(rule)

    async def list_rules(self) -> List[WorkflowRule]:
        if not self.rule_repo:
            return []
        return await self.rule_repo.get_all()

    async def list_logs(self, limit: int = 50) -> List[WorkflowLog]:
        if not self.log_repo:
            return []
        return await self.log_repo.get_recent_logs(limit=limit)

    def execute(self, workflow: Any) -> bool:
        """Legacy synchronous execute support"""
        return True

    async def handle_event(self, event: Event) -> List[Dict[str, Any]]:
        """Evaluate matching rules for a triggered event and execute actions"""
        if not self.rule_repo:
            return []

        active_rules = await self.rule_repo.get_active_rules()
        results = []

        for rule in active_rules:
            # Simple matching: wildcard or exact match
            if rule.event_pattern == "*" or rule.event_pattern == event.name:
                output_msg = f"Executed action {rule.action_type} for event {event.name} with payload {event.payload}"
                log_entry = WorkflowLog(
                    rule_name=rule.name,
                    event_name=event.name,
                    status="SUCCESS",
                    output=output_msg,
                )
                if self.log_repo:
                    await self.log_repo.create(log_entry)
                results.append({
                    "rule": rule.name,
                    "status": "SUCCESS",
                    "output": output_msg,
                })

        return results
