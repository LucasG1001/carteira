import uuid

from sqlalchemy import Column, Integer, String, TIMESTAMP, Enum
from sqlalchemy.sql import func
from domain.base import Base
from enums.auth_provider_enum import AuthProviderEnum
from sqlalchemy.orm import relationship



class User(Base):
    __tablename__  = 'users'
    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=True)
    provider = Column(Enum(AuthProviderEnum, name='auth_provider'), nullable=False, default=AuthProviderEnum.local)
    create_at = Column(TIMESTAMP, default=func.current_timestamp(), nullable=False)
    update_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)
    refresh_token = relationship("RefreshToken", back_populates="user")