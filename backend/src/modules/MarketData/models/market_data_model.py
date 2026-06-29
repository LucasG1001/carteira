from sqlalchemy import BigInteger, Column, Date, DateTime, Float, String
from sqlalchemy.sql import func

from src.core.database import Base


class StockPrice(Base):
    __tablename__ = "stock_prices"

    ticker = Column(String(50), primary_key=True, index=True)
    date = Column(Date, primary_key=True, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class TickerInfo(Base):
    __tablename__ = "ticker_info"

    ticker = Column(String(50), primary_key=True, index=True)
    short_name = Column(String(255), nullable=True)
    long_name = Column(String(255), nullable=True)
    sector = Column(String(255), nullable=True)
    quote_type = Column(String(50), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
