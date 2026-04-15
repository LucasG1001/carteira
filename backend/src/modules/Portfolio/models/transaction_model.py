from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from src.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(255), index=True, nullable=False)
    ticker = Column(String(50), index=True, nullable=False)
    operation_type = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=True) # Certain operations like dividends might not have a unit price
    operation_value = Column(Float, nullable=True)

    # Relationships (optional but useful if cross queries are needed)
    # upload = relationship("Upload", back_populates="transactions")
