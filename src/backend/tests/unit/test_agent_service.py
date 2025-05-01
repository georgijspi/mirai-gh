import pytest
import sys
from unittest.mock import AsyncMock, MagicMock, patch
import uuid
from datetime import datetime

from api.services.agent_service import (
    create_agent,
    get_agent,
    get_all_agents,
    update_agent,
    delete_agent,
)


@pytest.mark.asyncio
@patch("api.services.agent_service.get_database")
@patch("api.services.agent_service.get_llm_config")
async def test_create_agent(mock_get_llm_config, mock_get_database):
    """Test creating a new agent."""
    mock_get_llm_config.return_value = {"llm_config_uid": "test-llm-config"}

    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_get_database.return_value = mock_db

    result = await create_agent(
        name="Test Agent",
        personality_prompt="I am a test agent",
        voice_speaker="test-voice",
        llm_config_uid="test-llm-config",
    )

    assert result["name"] == "Test Agent"
    assert result["personality_prompt"] == "I am a test agent"
    assert result["voice_speaker"] == "test-voice"
    assert result["llm_config_uid"] == "test-llm-config"
    assert "agent_uid" in result
    assert "created_at" in result

    mock_collection.insert_one.assert_called_once()


@pytest.mark.asyncio
@patch("api.services.agent_service.get_database")
async def test_get_agent(mock_get_database):
    """Test getting an agent by ID."""
    agent_uid = str(uuid.uuid4())
    mock_agent = {
        "agent_uid": agent_uid,
        "name": "Test Agent",
        "personality_prompt": "I am a test agent",
        "voice_speaker": "test-voice",
        "llm_config_uid": "test-llm-config",
        "profile_picture_path": "/path/to/picture.jpg",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.find_one.return_value = mock_agent
    mock_db.__getitem__.return_value = mock_collection
    mock_get_database.return_value = mock_db

    result = await get_agent(agent_uid)

    assert result == {
        **mock_agent,
        "profile_picture_url": f"/agent/{agent_uid}/profile-picture",
    }

    mock_collection.find_one.assert_called_once_with({"agent_uid": agent_uid})


@pytest.mark.asyncio
@patch("api.services.agent_service.get_database")
async def test_get_all_agents(mock_get_database):
    """Test getting all agents."""
    agent1_uid = str(uuid.uuid4())
    agent2_uid = str(uuid.uuid4())

    mock_agents = [
        {
            "agent_uid": agent1_uid,
            "name": "Test Agent 1",
            "personality_prompt": "I am test agent 1",
            "voice_speaker": "test-voice-1",
            "llm_config_uid": "test-llm-config",
            "profile_picture_path": "/path/to/picture1.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "agent_uid": agent2_uid,
            "name": "Test Agent 2",
            "personality_prompt": "I am test agent 2",
            "voice_speaker": "test-voice-2",
            "llm_config_uid": "test-llm-config",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    ]

    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=mock_agents)

    mock_collection = AsyncMock()
    mock_collection.find = MagicMock(return_value=mock_cursor)

    mock_db = MagicMock()
    mock_db.__getitem__ = MagicMock(return_value=mock_collection)

    mock_get_database.return_value = mock_db

    results = await get_all_agents()

    assert len(results) == 2
    assert results[0]["agent_uid"] == agent1_uid
    assert results[0]["profile_picture_url"] == f"/agent/{agent1_uid}/profile-picture"
    assert results[1]["agent_uid"] == agent2_uid
    assert "profile_picture_url" not in results[1]

    mock_collection.find.assert_called_once_with({})
    mock_cursor.to_list.assert_called_once_with(length=100)


@pytest.mark.asyncio
@patch("api.services.agent_service.get_database")
@patch("api.services.agent_service.get_agent")
async def test_update_agent(mock_get_agent, mock_get_database):
    """Test updating an agent."""
    agent_uid = str(uuid.uuid4())

    update_data = {
        "name": "Updated Agent",
        "personality_prompt": "I am an updated agent",
    }

    updated_agent = {
        "agent_uid": agent_uid,
        "name": "Updated Agent",
        "personality_prompt": "I am an updated agent",
        "voice_speaker": "test-voice",
        "llm_config_uid": "test-llm-config",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.update_one.return_value = AsyncMock(modified_count=1)
    mock_db.__getitem__.return_value = mock_collection
    mock_get_database.return_value = mock_db

    mock_get_agent.return_value = updated_agent

    result = await update_agent(agent_uid, update_data)

    assert result == updated_agent

    mock_collection.update_one.assert_called_once()
    mock_get_agent.assert_called_once_with(agent_uid)


@pytest.mark.asyncio
@patch("api.services.agent_service.get_database")
@patch("api.services.agent_service.get_agent")
@patch("api.services.agent_service.os.path.exists")
@patch("api.services.agent_service.shutil.rmtree")
async def test_delete_agent(
    mock_rmtree, mock_exists, mock_get_agent, mock_get_database
):
    """Test deleting an agent."""
    agent_uid = str(uuid.uuid4())

    mock_agent = {
        "agent_uid": agent_uid,
        "name": "Test Agent",
        "personality_prompt": "I am a test agent",
        "voice_speaker": "test-voice",
        "llm_config_uid": "test-llm-config",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.delete_one.return_value = AsyncMock(deleted_count=1)
    mock_db.__getitem__.return_value = mock_collection
    mock_get_database.return_value = mock_db

    mock_get_agent.return_value = mock_agent

    mock_exists.return_value = True

    result = await delete_agent(agent_uid)

    assert result is True

    mock_collection.delete_one.assert_called_once_with({"agent_uid": agent_uid})
    mock_rmtree.assert_called_once()
