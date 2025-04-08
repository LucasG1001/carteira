from typing import Optional
from pydantic import BaseModel

class UserRegisterResponseDTO(BaseModel):
    token: str
    refresh_token: str