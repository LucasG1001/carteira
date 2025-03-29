import uuid

from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
Base = declarative_base()


class User(Base):
    __tablename__  = 'users'
    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    create_at = Column(TIMESTAMP, default=func.current_timestamp(), nullable=False)
    update_at = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)
