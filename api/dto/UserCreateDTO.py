from pydantic import BaseModel

class UserCreateDTO(BaseModel):
    email: str
    password: str