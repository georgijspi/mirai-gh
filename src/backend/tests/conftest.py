import pytest
import os
import uuid
import sys
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure modules that require external libraries are mocked
sys.modules['torch'] = MagicMock()
sys.modules['torchaudio'] = MagicMock()
sys.modules['TTS'] = MagicMock()

# Set test environment variable to skip database connections
os.environ["DB_SKIP_CONNECTION"] = "true"


class MockCursor:
    """Mock for AsyncIOMotorCursor that has sort and to_list methods."""
    def __init__(self, items=None):
        self.items = items or []
        self.sort_field = None
        self.sort_direction = None

    async def to_list(self, length=None):
        """Return the items as a list."""
        return self.items[:length] if length else self.items

    def sort(self, field, direction=1):
        """Mock sort method."""
        self.sort_field = field
        self.sort_direction = direction
        return self


@pytest.fixture
def mock_db():
    """Mock database with conversations and messages collections."""
    conversations = AsyncMock()
    messages = AsyncMock()
    agents = AsyncMock()
    users = AsyncMock()
    llm_configs = AsyncMock()
    settings = AsyncMock()
    
    mock_db = {
        "conversations": conversations,
        "messages": messages,
        "agents": agents,
        "users": users,
        "llm_configs": llm_configs,
        "settings": settings,
    }
    return mock_db


@pytest.fixture
def mock_cursor():
    """Return a MockCursor instance for testing."""
    return MockCursor()


@pytest.fixture
def sample_user():
    """Sample user data for testing."""
    return {
        "user_uid": str(uuid.uuid4()),
        "email": "test@example.com",
        "hashed_password": "hashed_password",
        "is_active": True,
        "is_superuser": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }


@pytest.fixture
def sample_agent():
    """Sample agent data for testing."""
    return {
        "agent_uid": str(uuid.uuid4()),
        "name": "Test Agent",
        "description": "Test agent for unit testing",
        "avatar_url": "https://example.com/avatar.png",
        "custom_voice_path": None,
        "llm_config_uid": str(uuid.uuid4()),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "voice_id": "en_us_001",
        "system_prompt": "You are a test assistant for unit testing.",
    }


@pytest.fixture
def sample_conversation(sample_agent):
    """Sample conversation data for testing."""
    return {
        "conversation_uid": str(uuid.uuid4()),
        "title": "Test Conversation",
        "user_uid": str(uuid.uuid4()),
        "agent_uid": sample_agent["agent_uid"],
        "is_archived": False,
        "message_count": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }


@pytest.fixture
def sample_message(sample_conversation):
    """Sample message data for testing."""
    from api.models import MessageType, MessageRating
    
    return {
        "message_uid": str(uuid.uuid4()),
        "conversation_uid": sample_conversation["conversation_uid"],
        "content": "Hello, world!",
        "message_type": MessageType.USER,
        "rating": MessageRating.NONE,
        "audio_path": None,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }


@pytest.fixture(autouse=True)
def patch_database():
    """Patch the database connection."""
    with patch("api.database.client"), patch("api.database.db"):
        yield 