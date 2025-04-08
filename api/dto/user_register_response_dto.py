from typing import Optional
from pydantic import BaseModel
from enums.auth_provider_enum import AuthProviderEnum

class UserRegisterResponseDTO(BaseModel):
    token: str
    refresh_token: str