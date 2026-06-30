from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from src.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), index=True, nullable=False)
    type = Column(String(10), nullable=False, default="expense")
    description = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    subcategory = Column(String(50), nullable=True)
    date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(30), nullable=True)
    installments = Column(Integer, nullable=False, default=1)
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurrence = Column(String(20), nullable=True)
    place = Column(String(150), nullable=True)
    address = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
