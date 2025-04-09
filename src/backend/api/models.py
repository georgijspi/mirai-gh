# api/models.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# --- TTS Models ---

class SynthesisRequest(BaseModel):
    """Request body model for speech synthesis."""
    text: str
    speaker: str | None = "morgan"

class SynthesisResponse(BaseModel):
    """Response model for the synthesis endpoint."""
    message: str
    output_filename: str

class FileRequest(BaseModel):
    """Request body model for endpoints needing a filename."""
    filename: str

# --- User and Authentication Models ---

class UserBase(BaseModel):
    """Base model for user information."""
    email: EmailStr
    is_admin: bool = False

class UserCreate(UserBase):
    """Model for creating a new user."""
    password: str

class UserLogin(BaseModel):
    """Model for user login."""
    email: EmailStr
    password: str

class UserResponse(UserBase):
    """Response model for user information."""
    user_uid: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    """Response model for authentication token."""
    access_token: str
    token_type: str

class StatusResponse(BaseModel):
    """Generic status response model."""
    status: str
    message: str