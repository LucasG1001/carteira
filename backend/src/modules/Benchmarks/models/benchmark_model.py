from sqlalchemy import Column, Date, DateTime, Float, String
from sqlalchemy.sql import func

from src.core.database import Base


class BenchmarkRate(Base):
    __tablename__ = "benchmark_rates"

    series = Column(String(20), primary_key=True)
    date = Column(Date, primary_key=True)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
