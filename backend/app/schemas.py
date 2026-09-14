from datetime import datetime

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=12, max_length=128)


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime
