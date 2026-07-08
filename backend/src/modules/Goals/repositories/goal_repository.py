from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.modules.Goals.models.goal_model import Goal


class GoalRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_by_user(self, user_id: str) -> list[Goal]:
        stmt = select(Goal).where(Goal.user_id == user_id).order_by(Goal.created_at.asc(), Goal.id.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, goal_id: int, user_id: str) -> Goal | None:
        stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, goal: Goal) -> Goal:
        self.session.add(goal)
        await self.session.flush()
        return goal

    async def delete(self, goal: Goal) -> None:
        await self.session.delete(goal)
        await self.session.flush()
