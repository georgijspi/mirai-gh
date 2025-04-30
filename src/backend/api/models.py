# api/models.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Literal, Union
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


class WakewordType(str, Enum):
    """Enum for wakeword types."""
    DEFAULT = "default"
    CUSTOM = "custom"


class AgentBase(BaseModel):
    """Base model for agent configuration."""

    name: str
    personality_prompt: str
    voice_speaker: str
    llm_config_uid: str
    profile_picture_path: Optional[str] = None
    custom_voice_path: Optional[str] = None
    wakeword_type: WakewordType = WakewordType.DEFAULT
    wakeword_model_path: Optional[str] = None
    built_in_wakeword: str = "Computer"  # Default built-in wakeword
    wakeword_sensitivity: float = Field(default=0.5, ge=0.0, le=1.0)


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
    wakeword_type: Optional[WakewordType] = None
    wakeword_model_path: Optional[str] = None
    built_in_wakeword: Optional[str] = None
    wakeword_sensitivity: Optional[float] = None


class AgentResponse(AgentBase):
    """Response model for agent configuration."""

    agent_uid: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    profile_picture_url: Optional[str] = None

    class Config:
        from_attributes = True


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
    prompt_path: Optional[str] = None
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


class QueryType(str, Enum):
    FACTUAL = "factual"
    TRIVIAL = "trivial"
    API_MODULE = "api_module"


class APIParamType(str, Enum):
    """Types of parameters that can be used in API module configurations."""

    CONSTANT = "constant"  # Fixed value like API keys that don't change
    VARIABLE = "variable"  # Dynamic value extracted from user query


class APIMethod(str, Enum):
    """HTTP methods for API requests."""

    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


class APIModuleParam(BaseModel):
    """Configuration for a parameter in an API module."""

    name: str  # Parameter name (e.g., "apikey", "location", "query")
    param_type: APIParamType  # Whether it's a constant or variable parameter
    value: Optional[str] = None  # Default/constant value (required for CONSTANT type)
    description: Optional[str] = None  # User-friendly description

    # For variable params, the placeholder used in trigger phrases (e.g., "{city}", "{search_term}")
    placeholder: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "name": "apikey",
                "param_type": "CONSTANT",
                "value": "2qTA4nIqnB4ZxZ0hEaR2IARCU4cJsyWM",
                "description": "API key for service authentication",
            }
        }


class APIModuleCreate(BaseModel):
    """Request model for creating a new API module."""

    name: str  # User-friendly name (e.g., "Weather API")
    description: str  # Description of what this API does
    base_url: str  # Base URL of the API
    method: APIMethod  # HTTP method
    headers: Optional[Dict[str, str]] = None  # HTTP headers
    params: List[APIModuleParam]  # Query parameters or body parameters
    body_template: Optional[str] = None  # JSON template for POST/PUT requests
    trigger_phrases: List[str]  # Phrases that activate this API module
    result_template: Optional[str] = None  # Template to format API response


class APIModuleUpdate(BaseModel):
    """Request model for updating an API module."""

    name: Optional[str] = None
    description: Optional[str] = None
    base_url: Optional[str] = None
    method: Optional[APIMethod] = None
    headers: Optional[Dict[str, str]] = None
    params: Optional[List[APIModuleParam]] = None
    body_template: Optional[str] = None
    trigger_phrases: Optional[List[str]] = None
    result_template: Optional[str] = None
    is_active: Optional[bool] = None


class APIModule(BaseModel):
    """API module configuration."""

    module_uid: str
    name: str
    description: str
    base_url: str
    method: APIMethod
    headers: Optional[Dict[str, str]] = None
    params: List[APIModuleParam]
    body_template: Optional[str] = None
    trigger_phrases: List[str]
    result_template: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class APIModuleResponse(BaseModel):
    """Response model for API module operations."""

    module: APIModule


class APIModulesListResponse(BaseModel):
    """Response model for listing API modules."""

    modules: List[APIModule]


class APIModuleExecutionResult(BaseModel):
    """Result of an API module execution."""

    module_uid: str
    module_name: str
    raw_response: Dict[str, Any]
    formatted_response: Optional[str] = None
    execution_time: float  # in seconds
    success: bool
    error_message: Optional[str] = None
    matched_trigger: Optional[str] = None  # The trigger phrase that matched
