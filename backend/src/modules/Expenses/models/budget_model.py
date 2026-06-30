from sqlalchemy import Column, Float, Integer, String, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy import DateTime

from src.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("user_id", "category", name="uq_budget_user_category"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), index=True, nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
