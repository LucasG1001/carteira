from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from domain.refresh_token import RefreshToken
from repository.refresh_token_repository import RefreshTokenRepository
import uuid
from fastapi import HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer

import jwt
from config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


class TokenService:
    def __init__(self):
        self.refresh_token_repository = RefreshTokenRepository()

    def generate_token(self, data: Dict[str, Any]):
        to_encode = data.copy()

        expire = datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire,
                         "iat": datetime.now()})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def validate_token(self, token: str = Depends(oauth2_scheme)) -> str:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=settings.ALGORITHM)
            userEmail = payload["sub"]
            if payload["exp"] > datetime.now() and not userEmail:
                return HTTPException(status_code=401, detail="Token inválido ou expirado")
            return userEmail
        except jwt.PyJWTError:
            return HTTPException(status_code=401, detail="Token inválido ou expirado")

        
    def generate_refresh_token(self, user_id: str, request: Request) -> RefreshToken:
        ip = request.client.host
        user_agent = request.headers.get('user-agent')
        token = str(uuid.uuid4())
        expires = datetime.now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        return RefreshToken(value = token, user_id= user_id, expires_at= expires, revoked= False)

    def save_refresh_token(self, refresh_token):
        self.refresh_token_repository.save(refresh_token)

