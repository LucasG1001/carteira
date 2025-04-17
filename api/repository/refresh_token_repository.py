from sqlalchemy import delete
from data.database import get_session
from domain.refresh_token import RefreshToken
from enums.device_type_enum import DeviceTypeEnum


class RefreshTokenRepository:
    def save(self, refresh_token: RefreshToken):
        with get_session() as session:
            session.add(refresh_token)

    def delete(self, user_id: str, ip_address: str, user_agent: DeviceTypeEnum, ) -> bool:
        with get_session() as session:
            result = session.query(RefreshToken).filter(
                user_id == user_id and user_agent == user_agent and ip_address == ip_address).delete()
            return result > 0
