from datetime import date as date_type, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GoalCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    target_amount: float = Field(gt=0)
    deadline: Optional[date_type] = None
    icon: Optional[str] = Field(default=None, max_length=30)


class GoalUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    target_amount: Optional[float] = Field(default=None, gt=0)
    saved_amount: Optional[float] = Field(default=None, ge=0)
    deadline: Optional[date_type] = None
    icon: Optional[str] = Field(default=None, max_length=30)


class GoalAddValueRequest(BaseModel):
    amount: float = Field(gt=0)


class GoalResponse(BaseModel):
    id: int
    user_id: str
    name: str
    target_amount: float
    saved_amount: float
    deadline: Optional[date_type] = None
    icon: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
