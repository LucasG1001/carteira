from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user_id
from src.modules.Goals.schemas.goal_schema import (
    GoalAddValueRequest,
    GoalCreateRequest,
    GoalResponse,
    GoalUpdateRequest,
)
from src.modules.Goals.services.goal_service import GoalService

router = APIRouter()


@router.get("/", response_model=List[GoalResponse])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = GoalService(db)
    return await service.list_goals(user_id)


@router.post("/", response_model=GoalResponse, status_code=201)
async def create_goal(
    payload: GoalCreateRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = GoalService(db)
    return await service.create_goal(user_id, payload)


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    payload: GoalUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = GoalService(db)
    return await service.update_goal(user_id, goal_id, payload)


@router.post("/{goal_id}/add", response_model=GoalResponse)
async def add_value(
    goal_id: int,
    payload: GoalAddValueRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = GoalService(db)
    return await service.add_value(user_id, goal_id, payload.amount)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = GoalService(db)
    await service.delete_goal(user_id, goal_id)
