from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import uuid

import jwt
import config


class TokenService:
    def generate_token(self, data: Dict[str, Any]):
        to_encode = data.copy()

        expire = datetime.now() + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALHORITHM)
        return encoded_jwt

    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, config.SECRET_KEY, algorithms=config.ALHORITHM)
            if payload["exp"] > datetime.now():
                return None
            return payload
        except jwt.PyJWTError:
            return None
        
    def refresh_token(self, token: str) -> Optional[str]:
        token = str(uuid.uuid4())
        expires = datetime.now() + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)

        

