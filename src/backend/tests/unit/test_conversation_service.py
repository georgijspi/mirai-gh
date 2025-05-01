import pytest
import uuid
import sys
import os
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

# Mock the modules that require external dependencies
sys.modules['torch'] = MagicMock()
sys.modules['torchaudio'] = MagicMock()
sys.modules['TTS'] = MagicMock()

# Now import the module
from api.services.conversation_service import (
    create_conversation,
    get_conversation,
    add_message_to_conversation,
    update_conversation,
    archive_conversation,
    get_user_conversations,
    update_message_rating,
    get_conversation_with_messages,
    get_conversation_messages,
    add_message,
)
from api.models import MessageType, MessageRating
from tests.conftest import MockCursor


# Mock database and collections for testing
@pytest.fixture
def mock_db():
    mock_collection = AsyncMock()
    mock_db = {
        "conversations": mock_collection,
        "messages": AsyncMock()
    }
    return mock_db


@pytest.fixture
def mock_agent():
    return {
        "agent_uid": str(uuid.uuid4()),
        "name": "Test Agent",
        "personality_prompt": "I'm a friendly test agent",
        "voice_speaker": "default",
        "llm_config_uid": str(uuid.uuid4()),
    }


@pytest.fixture
def sample_conversation():
    conversation_uid = str(uuid.uuid4())
    user_uid = str(uuid.uuid4())
    agent_uid = str(uuid.uuid4())
    timestamp = datetime.utcnow()
    
    return {
        "conversation_uid": conversation_uid,
        "title": "Test Conversation",
        "user_uid": user_uid,
        "agent_uid": agent_uid,
        "is_archived": False,
        "created_at": timestamp,
        "updated_at": timestamp,
        "message_count": 0
    }


@pytest.fixture
def sample_message():
    message_uid = str(uuid.uuid4())
    conversation_uid = str(uuid.uuid4())
    timestamp = datetime.utcnow()
    
    return {
        "message_uid": message_uid,
        "conversation_uid": conversation_uid,
        "content": "Hello, world!",
        "is_user": True,
        "rating": None,
        "created_at": timestamp,
        "updated_at": timestamp
    }


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_create_conversation(mock_get_db, mock_db, sample_agent):
    
    mock_get_db.return_value = mock_db
    mock_db["conversations"].insert_one = AsyncMock()
    
    # Mock the get_agent function
    with patch("api.services.conversation_service.get_agent") as mock_get_agent:
        mock_get_agent.return_value = sample_agent
        
        # Create a conversation
        user_uid = str(uuid.uuid4())
        result = await create_conversation(
            user_uid=user_uid,
            title="Test Conversation",
            agent_uid=sample_agent["agent_uid"]
        )
        
        # Verify results
        assert result["title"] == "Test Conversation"
        assert result["user_uid"] == user_uid
        assert result["agent_uid"] == sample_agent["agent_uid"]
        assert result["is_archived"] is False
        assert result["message_count"] == 0
        assert "conversation_uid" in result
        assert "created_at" in result
        assert "updated_at" in result
        
        # Verify the database was called correctly
        mock_db["conversations"].insert_one.assert_called_once()


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_get_conversation(mock_get_db, mock_db, sample_conversation):
    
    mock_get_db.return_value = mock_db
    mock_db["conversations"].find_one = AsyncMock(return_value=sample_conversation)
    
    # Get the conversation
    result = await get_conversation(sample_conversation["conversation_uid"])
    
    # Verify results
    assert result == sample_conversation
    mock_db["conversations"].find_one.assert_called_once_with(
        {"conversation_uid": sample_conversation["conversation_uid"]}
    )


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_get_conversation_not_found(mock_get_db, mock_db):

    mock_get_db.return_value = mock_db
    mock_db["conversations"].find_one = AsyncMock(return_value=None)
    
    result = await get_conversation(str(uuid.uuid4()))
    
    assert result is None


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_update_conversation(mock_get_db, mock_db, sample_conversation):

    mock_get_db.return_value = mock_db
    mock_db["conversations"].update_one = AsyncMock()
    mock_db["conversations"].update_one.return_value.modified_count = 1
    
    with patch("api.services.conversation_service.get_conversation") as mock_get_conversation:
        updated_conversation = sample_conversation.copy()
        updated_conversation["title"] = "Updated Title"
        mock_get_conversation.return_value = updated_conversation
        
        # Update the conversation
        update_data = {"title": "Updated Title"}
        result = await update_conversation(
            conversation_uid=sample_conversation["conversation_uid"],
            update_data=update_data
        )
        
        # Verify results
        assert result["title"] == "Updated Title"
        assert result["conversation_uid"] == sample_conversation["conversation_uid"]
        
        # Verify the database was called correctly
        mock_db["conversations"].update_one.assert_called_once()


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_archive_conversation(mock_get_db, mock_db, sample_conversation):
    
    mock_get_db.return_value = mock_db
    mock_db["conversations"].update_one = AsyncMock()
    mock_db["conversations"].update_one.return_value.modified_count = 1
    
    # Archive the conversation
    result = await archive_conversation(sample_conversation["conversation_uid"])
    
    # Verify results
    assert result is True
    
    # Verify the database was called correctly
    mock_db["conversations"].update_one.assert_called_once()
    # Check that is_archived was set to True
    call_args = mock_db["conversations"].update_one.call_args[0]
    assert call_args[0] == {"conversation_uid": sample_conversation["conversation_uid"]}
    assert call_args[1]["$set"]["is_archived"] is True


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_get_user_conversations(mock_get_db, mock_db):
    
    mock_get_db.return_value = mock_db
    conversations = [
        {"title": "Conversation 1"}, 
        {"title": "Conversation 2"}
    ]
    mock_cursor = MockCursor(conversations)
    mock_db["conversations"].find = MagicMock(return_value=mock_cursor)
    
    # Get user conversations
    user_uid = str(uuid.uuid4())
    result = await get_user_conversations(user_uid)
    
    # Verify results
    assert len(result) == 2
    assert result[0]["title"] == "Conversation 1"
    assert result[1]["title"] == "Conversation 2"
    
    # Verify the database was called correctly
    mock_db["conversations"].find.assert_called_once_with(
        {"user_uid": user_uid, "is_archived": False}
    )
    assert mock_cursor.sort_field == "updated_at"
    assert mock_cursor.sort_direction == -1


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
@patch("api.services.conversation_service.get_conversation")
@patch("api.services.conversation_service.get_agent")
@patch("api.services.conversation_service.generate_text")
@patch("api.services.conversation_service.generate_speech")
@patch("api.services.conversation_service.os.makedirs")
async def test_add_message_to_conversation(
    mock_makedirs,
    mock_generate_speech,
    mock_generate_text,
    mock_get_agent,
    mock_get_conversation,
    mock_get_db,
    mock_db,
    sample_conversation,
    sample_agent,
    sample_message
):
    # Setup mocks for the database
    mock_get_db.return_value = mock_db
    mock_get_conversation.return_value = sample_conversation
    mock_get_agent.return_value = sample_agent
    
    # Mock the database operations to create and update messages
    mock_db["messages"].insert_one = AsyncMock()
    mock_db["messages"].update_one = AsyncMock()
    mock_db["conversations"].update_one = AsyncMock()
    
    user_message_id = str(uuid.uuid4())
    agent_message_id = str(uuid.uuid4())
    
    with patch("uuid.uuid4") as mock_uuid:
        mock_uuid.side_effect = [
            uuid.UUID(user_message_id),
            uuid.UUID(agent_message_id)
        ]
        
        with patch("os.path.exists") as mock_path_exists:
            mock_path_exists.return_value = False
            
            # Set-up agent response generation
            user_input = "Hello, world!"
            agent_response = "This is a mock response"
            mock_generate_text.return_value = agent_response
            mock_generate_speech.return_value = "/path/to/audio.wav"
            
            # Define expected user and agent messages
            expected_user_message = {
                "message_uid": user_message_id,
                "conversation_uid": sample_conversation["conversation_uid"],
                "content": user_input,
                "is_user": True,
                "rating": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            
            expected_agent_message = {
                "message_uid": agent_message_id,
                "conversation_uid": sample_conversation["conversation_uid"],
                "content": agent_response,
                "is_user": False,
                "rating": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "voice_path": "/path/to/audio.wav"
            }
            
            # Mock get_message
            with patch("api.services.conversation_service.get_message") as mock_get_message:
                mock_get_message.side_effect = lambda mid: (
                    expected_user_message if mid == user_message_id else expected_agent_message
                )
                
                result = await add_message_to_conversation(
                    conversation_uid=sample_conversation["conversation_uid"],
                    content=user_input,
                    is_user=True
                )
                
                # Return the agent response
                assert result["content"] == agent_response
                assert result["voice_path"] == "/path/to/audio.wav"
                assert result["is_user"] is False
                
                # Verify database operations
                assert mock_db["messages"].insert_one.call_count == 2
                
                # Verify the first call was for the user message
                first_call_args = mock_db["messages"].insert_one.call_args_list[0][0][0]
                assert first_call_args["conversation_uid"] == sample_conversation["conversation_uid"]
                assert first_call_args["content"] == user_input
                assert first_call_args["is_user"] is True
                
                # Verify the second call was for the agent response
                second_call_args = mock_db["messages"].insert_one.call_args_list[1][0][0]
                assert second_call_args["conversation_uid"] == sample_conversation["conversation_uid"]
                assert second_call_args["content"] == agent_response
                assert second_call_args["is_user"] is False
                
                # Verify conversations collection was updated
                assert mock_db["conversations"].update_one.call_count == 2
                
                # Verify the agent generating functions
                mock_get_agent.assert_called_once_with(sample_conversation["agent_uid"])
                mock_generate_text.assert_called_once_with(
                    conversation_uid=sample_conversation["conversation_uid"],
                    agent=sample_agent,
                    user_message=user_input
                )
                mock_generate_speech.assert_called_once()
                mock_makedirs.assert_called()


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_update_message_rating(mock_get_db, mock_db, sample_message):

    mock_get_db.return_value = mock_db
    mock_db["messages"].update_one = AsyncMock()
    mock_db["messages"].update_one.return_value.modified_count = 1
    
    # Mock get_message function
    with patch("api.services.conversation_service.get_message") as mock_get_message:
        updated_message = sample_message.copy()
        updated_message["rating"] = MessageRating.LIKE
        mock_get_message.return_value = updated_message
        
        # Update message rating
        result = await update_message_rating(
            message_uid=sample_message["message_uid"],
            rating=MessageRating.LIKE
        )
        
        assert result["rating"] == MessageRating.LIKE
        assert result["message_uid"] == sample_message["message_uid"]
        
        # Verify the database was called correctly
        mock_db["messages"].update_one.assert_called_once_with(
            {"message_uid": sample_message["message_uid"]},
            {"$set": {"rating": MessageRating.LIKE}}
        )


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_get_conversation_with_messages(mock_get_db, mock_db, sample_conversation):

    mock_get_db.return_value = mock_db
    
    # Mock get_conversation
    with patch("api.services.conversation_service.get_conversation") as mock_get_conversation:
        mock_get_conversation.return_value = sample_conversation
        
        messages = [
            {"content": "Message 1"}, 
            {"content": "Message 2"}
        ]
        mock_cursor = MockCursor(messages)
        mock_db["messages"].find = MagicMock(return_value=mock_cursor)
        

        result = await get_conversation_with_messages(sample_conversation["conversation_uid"])
        

        assert result is not None
        assert result["conversation_uid"] == sample_conversation["conversation_uid"]
        assert "messages" in result
        assert len(result["messages"]) == 2
        assert result["messages"][0]["content"] == "Message 1"
        assert result["messages"][1]["content"] == "Message 2"
        
        # Verify database calls
        mock_get_conversation.assert_called_once_with(sample_conversation["conversation_uid"])
        mock_db["messages"].find.assert_called_once()
        assert mock_cursor.sort_field == "created_at"
        assert mock_cursor.sort_direction == 1


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
async def test_get_conversation_messages(mock_get_db, mock_db, sample_conversation):
    
    mock_get_db.return_value = mock_db
    messages = [
        {"content": "Message 1"}, 
        {"content": "Message 2"}
    ]
    mock_cursor = MockCursor(messages)
    mock_db["messages"].find = MagicMock(return_value=mock_cursor)
    
    # Get conversation messages
    result = await get_conversation_messages(sample_conversation["conversation_uid"])
    
    # Verify results
    assert len(result) == 2
    assert result[0]["content"] == "Message 1"
    assert result[1]["content"] == "Message 2"
    
    # Verify database calls
    mock_db["messages"].find.assert_called_once_with(
        {"conversation_uid": sample_conversation["conversation_uid"]}
    )
    assert mock_cursor.sort_field == "created_at"
    assert mock_cursor.sort_direction == 1


@pytest.mark.asyncio
@patch("api.services.conversation_service.get_database")
@patch("api.services.conversation_service.os.makedirs")
async def test_add_message(mock_makedirs, mock_get_db, mock_db, sample_conversation):
    
    mock_get_db.return_value = mock_db
    mock_db["messages"].insert_one = AsyncMock()
    mock_db["conversations"].update_one = AsyncMock()
    
    # Mock the get_conversation function
    with patch("api.services.conversation_service.get_conversation") as mock_get_conversation:
        mock_get_conversation.return_value = sample_conversation
        
        # Add a message
        content = "Test message"
        message_type = MessageType.USER
        result = await add_message(
            conversation_uid=sample_conversation["conversation_uid"],
            content=content,
            message_type=message_type
        )
        
        # Verify results
        assert result["conversation_uid"] == sample_conversation["conversation_uid"]
        assert result["content"] == content
        assert result["message_type"] == message_type
        assert result["rating"] == MessageRating.NONE
        assert "message_uid" in result
        assert "created_at" in result
        assert "updated_at" in result
        
        # Verify the database was called correctly
        mock_db["messages"].insert_one.assert_called_once()
        mock_db["conversations"].update_one.assert_called_once()
        mock_makedirs.assert_called_once() 