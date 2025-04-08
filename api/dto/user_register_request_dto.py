from typing import Optional
from pydantic import BaseModel
from enums.auth_provider_enum import AuthProviderEnum

class UserRegisterRequestDTO(BaseModel):
    email: str
    password: str
    provider: Optional[AuthProviderEnum] = None