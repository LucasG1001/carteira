from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UploadResponse(BaseModel):
    id: int
    filename: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
