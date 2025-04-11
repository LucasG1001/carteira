from sqlalchemy import TIMESTAMP, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from domain.base import Base
from enums.device_type_enum import DeviceTypeEnum

class RefreshToken(Base):
    __tablename__ = 'refresh_token'

    id = Column(Integer, primary_key=True)
    value = Column(String, unique=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    revoked = Column(Boolean, default=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Enum(DeviceTypeEnum, name='auth_provider'), nullable=False, default=DeviceTypeEnum.UNKOWN)
    create_at = Column(TIMESTAMP, default=func.current_timestamp(), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
    user = relationship("User", back_populates="refresh_token")