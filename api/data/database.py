from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator
from domain.user import Base as UserBase
import os



DATABASE_URL = "postgresql://docker:docker@localhost/carteira"
engine = create_engine(DATABASE_URL)
UserBase.metadata.create_all(engine)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()