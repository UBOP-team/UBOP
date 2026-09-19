from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from .models import WorkflowRule, WorkflowLog


class WorkflowRuleRepository(BaseRepository[WorkflowRule]):
    def __init__(self, session: AsyncSession):
        super().__init__(WorkflowRule, session)

    async def get_active_rules(self) -> List[WorkflowRule]:
        res = await self.session.execute(select(WorkflowRule).filter(WorkflowRule.is_active.is_(True)))
        return list(res.scalars().all())


class WorkflowLogRepository(BaseRepository[WorkflowLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(WorkflowLog, session)

    async def get_recent_logs(self, limit: int = 50) -> List[WorkflowLog]:
        res = await self.session.execute(select(WorkflowLog).order_by(WorkflowLog.id.desc()).limit(limit))
        return list(res.scalars().all())
