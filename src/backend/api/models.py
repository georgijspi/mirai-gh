# api/models.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
from datetime import datetime
import uuid
import logging
import os

# --- TTS Models ---

class SynthesisRequest(BaseModel):
    """Request body model for speech synthesis."""
    text: str
    speaker: str | None = "morgan"

class SynthesisResponse(BaseModel):
    """Response model for the synthesis endpoint."""
    message: str
    output_filename: str

class TTSRequest(BaseModel):
    """Request model for TTS generation."""
    text: str
    speaker: str = "morgan"
    message_uid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_uid: Optional[str] = None

class TTSResponse(BaseModel):
    """Response model for TTS generation."""
    message: str
    file_path: str

class Voice(BaseModel):
    """Model for available voices."""
    name: str
    display_name: str

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

# User class needed for imports
class User(UserBase):
    """Full user model for database operations."""
    user_uid: str
    hashed_password: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
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

# --- LLM Models ---

class LlmConfigBase(BaseModel):
    """Base model for LLM configuration."""
    name: str
    model: str
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 40
    repeat_penalty: float = 1.1
    max_tokens: int = 4096
    presence_penalty: float = 0.0
    frequency_penalty: float = 0.0
    stop_sequences: List[str] = []
    additional_params: Dict[str, Any] = {}
    tts_instructions: str = """
When responding, please follow these guidelines for better voice readability:
1. Do not include parenthetical expressions like (smiles), (laughs), (pauses) in your text.
2. Express emotions through your words rather than through stage directions.
3. Use natural language patterns that flow well when read aloud.
4. Avoid special formatting that might be difficult to interpret in speech.
5. If you want to express actions or emotions, incorporate them into the text naturally.
For example, instead of "(laughs) That's funny", say "Haha, that's funny" or "That makes me laugh."
"""
    is_archived: bool = False

class LlmConfigCreate(LlmConfigBase):
    """Model for creating a new LLM configuration."""
    pass

class LlmConfigUpdate(BaseModel):
    """Model for updating an LLM configuration."""
    name: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    top_k: Optional[int] = None
    repeat_penalty: Optional[float] = None
    max_tokens: Optional[int] = None
    presence_penalty: Optional[float] = None
    frequency_penalty: Optional[float] = None
    stop_sequences: Optional[List[str]] = None
    additional_params: Optional[Dict[str, Any]] = None
    tts_instructions: Optional[str] = None

class LlmConfigResponse(LlmConfigBase):
    """Response model for LLM configuration."""
    config_uid: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class LlmModelInfo(BaseModel):
    """Model for LLM model information."""
    name: str
    size: int
    modified_at: str
    details: Dict[str, Any] = {}

class LlmModelListResponse(BaseModel):
    """Response model for LLM model list."""
    models: List[LlmModelInfo]

# --- Agent Models ---

class AgentBase(BaseModel):
    """Base model for agent configuration."""
    name: str
    personality_prompt: str
    voice_speaker: str
    llm_config_uid: str
    profile_picture_path: Optional[str] = None
    custom_voice_path: Optional[str] = None
    is_archived: bool = False

class AgentCreate(AgentBase):
    """Model for creating a new agent."""
    pass

class Agent(AgentBase):
    """Complete agent model with database fields."""
    agent_uid: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class AgentUpdate(BaseModel):
    """Model for updating an agent."""
    name: Optional[str] = None
    personality_prompt: Optional[str] = None
    voice_speaker: Optional[str] = None
    llm_config_uid: Optional[str] = None
    profile_picture_path: Optional[str] = None
    custom_voice_path: Optional[str] = None

class AgentResponse(AgentBase):
    """Response model for agent configuration."""
    agent_uid: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class AgentListResponse(BaseModel):
    """Response model for agent list."""
    agents: List[AgentResponse]

# --- Conversation Models ---

class MessageType(str, Enum):
    """Enum for message types."""
    USER = "user"
    AGENT = "agent"

class MessageRating(str, Enum):
    """Enum for message ratings."""
    LIKE = "like"
    DISLIKE = "dislike"
    NONE = "none"

class MessageBase(BaseModel):
    """Base model for message."""
    content: str
    message_type: MessageType
    rating: MessageRating = MessageRating.NONE
    voiceline_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class MessageCreate(MessageBase):
    """Model for creating a new message."""
    conversation_uid: str
    agent_uid: Optional[str] = None
    llm_config_uid: Optional[str] = None

class MessageResponse(MessageBase):
    """Response model for message."""
    message_uid: str
    conversation_uid: str
    agent_uid: Optional[str] = None
    llm_config_uid: Optional[str] = None
    created_at: datetime
    audio_stream_url: Optional[str] = None

class ConversationBase(BaseModel):
    """Base model for conversation."""
    title: str
    user_uid: str
    agent_uid: str
    is_archived: bool = False

class ConversationCreate(BaseModel):
    """Model for creating a new conversation."""
    title: Optional[str] = None
    agent_uid: str

class ConversationUpdate(BaseModel):
    """Model for updating a conversation."""
    title: Optional[str] = None
    is_archived: Optional[bool] = None

class ConversationResponse(ConversationBase):
    """Response model for conversation."""
    conversation_uid: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: int = 0

class ConversationListResponse(BaseModel):
    """Response model for conversation list."""
    conversations: List[ConversationResponse]

class ConversationDetailResponse(ConversationResponse):
    """Response model for detailed conversation."""
    messages: List[MessageResponse]

class SendMessageRequest(BaseModel):
    """Model for sending a message."""
    conversation_uid: str
    content: str

class RateMessageRequest(BaseModel):
    """Model for rating a message."""
    message_uid: str
    rating: MessageRating

# Global Conversation Models
class GlobalSendMessageRequest(BaseModel):
    """Model for sending a message in the global conversation."""
    content: str
    agent_uid: Optional[str] = None  # Optional: If provided, this agent will respond

class GlobalMessageResponse(MessageResponse):
    """Response model for global message."""
    # Inherits all fields from MessageResponse
    pass

class GlobalConversationResponse(BaseModel):
    """Response model for global conversation."""
    conversation_uid: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: int = 0
    messages: List[GlobalMessageResponse] = []

class GlobalMessageRateRequest(BaseModel):
    """Model for rating a message in the global conversation."""
    message_uid: str
    rating: MessageRating