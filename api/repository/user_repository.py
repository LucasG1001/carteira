from data.database import get_session
from domain.user import User


class UserRepository:
    def save(self, new_user: User):
        with get_session() as session:
            session.add(new_user)

    def get_user_by_email(self, email: str) -> User | None:
        with get_session() as session:
            user = session.query(User).filter_by(email = email).first()

            if(user):
                return User(email = user.email, password = user.password)

