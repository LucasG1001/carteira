from typing import Optional
from pydantic import BaseModel

class AuthResponseDTO(BaseModel):
    token: str
    refresh_token: str