from sqlalchemy import TIMESTAMP, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, func, UniqueConstraint
from sqlalchemy.orm import relationship
from domain.base import Base
from enums.device_type_enum import DeviceTypeEnum


class RefreshToken(Base):
    __tablename__ = 'refresh_token'

    __table_args__ = (UniqueConstraint('user_id', 'ip_address',
                      'user_agent', name='uq_id_ip_user_agent'),)

    id = Column(Integer, primary_key=True)
    token_hash = Column(String(255), unique=False, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), unique=False)
    revoked = Column(Boolean, default=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Enum(DeviceTypeEnum, name='device_type'),
                        nullable=False, default=DeviceTypeEnum.UNKNOWN)
    create_at = Column(
        TIMESTAMP, default=func.current_timestamp(), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="refresh_token")
