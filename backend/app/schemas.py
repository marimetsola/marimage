from datetime import datetime

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime


class ImageResponse(BaseModel):
    id: int
    original_filename: str
    mime_type: str
    file_size: int
    uploaded_at: datetime
    url: str
    thumbnail_url: str
