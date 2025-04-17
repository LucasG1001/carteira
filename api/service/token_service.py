from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from domain.client_metadata import ClientMetadata
from domain.refresh_token import RefreshToken
from enums.device_type_enum import DeviceTypeEnum
from repository.refresh_token_repository import RefreshTokenRepository
import uuid
from fastapi import HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer

import jwt
from config import settings
from service.request_service import RequestService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


class TokenService:
    def __init__(self):
        self.refresh_token_repository = RefreshTokenRepository()

    def generate_access_token(self, payload: Dict[str, Any]) -> str:
        current_time = datetime.now()
        expire_time = current_time + \
            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        payload = payload.copy()
        payload.update({"exp": expire_time, "iat": current_time})

        access_token = jwt.encode(
            payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return access_token

    def validate_access_token(self, access_token: str = Depends(oauth2_scheme)) -> str:
        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[
                                 settings.ALGORITHM])
            user_email = payload["sub"]

            exp = datetime.fromtimestamp(payload["exp"])

            if exp < datetime.now() and not user_email:
                return HTTPException(status_code=401, detail="Token inválido ou expirado")

            return user_email

        except jwt.PyJWTError:
            return HTTPException(status_code=401, detail="Token inválido ou expirado")

    def extract_request_metadata(self, request: Request) -> ClientMetadata:
        return ClientMetadata(
            ip=request.client.host,
            user_agent=request.headers.get("user-agent", "")
        )

    def generate_refresh_token(self, user_id: str, clientMetadata: ClientMetadata) -> RefreshToken:
        token = str(uuid.uuid4())
        user_agent = RequestService.get_device_type(clientMetadata.user_agent)
        expires = datetime.now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        return RefreshToken(token_hash=token,
                            user_id=user_id,
                            expires_at=expires,
                            revoked=False,
                            ip_address=clientMetadata.ip,
                            user_agent=user_agent)

    def save_refresh_token(self, refresh_token):
        self.refresh_token_repository.save(refresh_token)

    def delete_refresh_token(self, user_id: str, ip_address: str, user_agent: DeviceTypeEnum):
        self.refresh_token_repository.delete(user_id, ip_address, user_agent)
