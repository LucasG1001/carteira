from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user_id
from src.modules.Expenses.schemas.expense_schema import (
    ExpenseCreateRequest,
    ExpenseResponse,
    ExpenseSummaryResponse,
)
from src.modules.Expenses.services.expense_service import ExpenseService

router = APIRouter()


@router.get("/", response_model=ExpenseSummaryResponse)
async def get_expenses_summary(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = ExpenseService(db)
    return await service.get_summary(user_id)


@router.post("/", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    payload: ExpenseCreateRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = ExpenseService(db)
    return await service.create_expense(user_id, payload)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = ExpenseService(db)
    await service.delete_expense(user_id, expense_id)
