from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import BusinessException
from src.modules.Goals.models.goal_model import Goal
from src.modules.Goals.repositories.goal_repository import GoalRepository
from src.modules.Goals.schemas.goal_schema import (
    GoalCreateRequest,
    GoalResponse,
    GoalUpdateRequest,
)


class GoalService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = GoalRepository(session)

    async def list_goals(self, user_id: str) -> List[GoalResponse]:
        goals = await self.repository.get_all_by_user(user_id)
        return [GoalResponse.model_validate(goal) for goal in goals]

    async def create_goal(self, user_id: str, payload: GoalCreateRequest) -> GoalResponse:
        goal = Goal(
            user_id=user_id,
            name=payload.name.strip(),
            target_amount=round(payload.target_amount, 2),
            saved_amount=0.0,
            deadline=payload.deadline,
            icon=payload.icon,
        )
        goal = await self.repository.create(goal)
        await self.session.commit()
        await self.session.refresh(goal)
        return GoalResponse.model_validate(goal)

    async def update_goal(self, user_id: str, goal_id: int, payload: GoalUpdateRequest) -> GoalResponse:
        goal = await self.repository.get_by_id(goal_id, user_id)
        if not goal:
            raise BusinessException(404, "Meta não encontrada")

        data = payload.model_dump(exclude_unset=True)
        if "name" in data and data["name"] is not None:
            goal.name = data["name"].strip()
        if "target_amount" in data and data["target_amount"] is not None:
            goal.target_amount = round(data["target_amount"], 2)
        if "saved_amount" in data and data["saved_amount"] is not None:
            goal.saved_amount = round(data["saved_amount"], 2)
        if "deadline" in data:
            goal.deadline = data["deadline"]
        if "icon" in data:
            goal.icon = data["icon"]

        await self.session.commit()
        await self.session.refresh(goal)
        return GoalResponse.model_validate(goal)

    async def add_value(self, user_id: str, goal_id: int, amount: float) -> GoalResponse:
        goal = await self.repository.get_by_id(goal_id, user_id)
        if not goal:
            raise BusinessException(404, "Meta não encontrada")
        goal.saved_amount = round((goal.saved_amount or 0.0) + amount, 2)
        await self.session.commit()
        await self.session.refresh(goal)
        return GoalResponse.model_validate(goal)

    async def delete_goal(self, user_id: str, goal_id: int) -> None:
        goal = await self.repository.get_by_id(goal_id, user_id)
        if not goal:
            raise BusinessException(404, "Meta não encontrada")
        await self.repository.delete(goal)
        await self.session.commit()
