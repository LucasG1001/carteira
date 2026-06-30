from datetime import date as date_type, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ExpenseType = Literal["expense", "income"]
RecurrenceType = Literal["monthly", "weekly", "yearly"]


class ExpenseCreateRequest(BaseModel):
    type: ExpenseType = "expense"
    amount: float = Field(gt=0)
    category: str = Field(min_length=1, max_length=100)
    subcategory: Optional[str] = Field(default=None, max_length=50)
    date: date_type
    description: Optional[str] = Field(default=None, max_length=255)
    payment_method: Optional[str] = Field(default=None, max_length=30)
    installments: int = Field(default=1, ge=1, le=120)
    is_recurring: bool = False
    recurrence: Optional[RecurrenceType] = None
    place: Optional[str] = Field(default=None, max_length=150)
    address: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    tags: Optional[str] = Field(default=None, max_length=255)


class ExpenseUpdateRequest(BaseModel):
    type: Optional[ExpenseType] = None
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    subcategory: Optional[str] = Field(default=None, max_length=50)
    date: Optional[date_type] = None
    description: Optional[str] = Field(default=None, max_length=255)
    payment_method: Optional[str] = Field(default=None, max_length=30)
    installments: Optional[int] = Field(default=None, ge=1, le=120)
    is_recurring: Optional[bool] = None
    recurrence: Optional[RecurrenceType] = None
    place: Optional[str] = Field(default=None, max_length=150)
    address: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    tags: Optional[str] = Field(default=None, max_length=255)


class ExpenseResponse(BaseModel):
    id: int
    user_id: str
    type: ExpenseType
    amount: float
    category: str
    subcategory: Optional[str] = None
    date: date_type
    description: Optional[str] = None
    payment_method: Optional[str] = None
    installments: int
    is_recurring: bool
    recurrence: Optional[str] = None
    place: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MonthlyExpensePoint(BaseModel):
    month: str
    income: float
    expense: float
    balance: float


class CategoryTotal(BaseModel):
    category: str
    total: float


class BudgetItem(BaseModel):
    category: str
    amount: float

    model_config = ConfigDict(from_attributes=True)


class BudgetUpdateRequest(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    amount: float = Field(ge=0)


class ExpenseSummaryResponse(BaseModel):
    user_id: str
    entries: List[ExpenseResponse]
    current_month: str
    month_income: float
    month_expense: float
    month_balance: float
    avg_monthly_expense: float
    avg_monthly_income: float
    monthly: List[MonthlyExpensePoint]
    by_category: List[CategoryTotal]
    by_subcategory: List[CategoryTotal]
    month_by_category: List[CategoryTotal]
    budgets: List[BudgetItem]
