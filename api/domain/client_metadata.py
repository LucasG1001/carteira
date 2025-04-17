from pydantic import BaseModel


class ClientMetadata(BaseModel):
    ip: str
    user_agent: str
