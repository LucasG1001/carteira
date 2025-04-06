from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from domain.base import Base

class RefreshToken(Base):
    __tablename__ = 'refresh_token'

    id = Column(Integer, primary_key=True)
    value = Column(String, unique=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    expires_at = Column(DateTime)
    revoked = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="refresh_token")