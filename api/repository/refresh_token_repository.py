from data.database import get_session
from domain.refresh_token import RefreshToken


class RefreshTokenRepository:
    def save(self, refresh_token: RefreshToken):
        with get_session() as session:
            session.add(refresh_token)