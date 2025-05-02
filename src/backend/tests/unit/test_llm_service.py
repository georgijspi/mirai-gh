import pytest
import sys
from unittest.mock import AsyncMock, MagicMock, patch
import uuid
from datetime import datetime

from api.services.llm_service import (
    create_llm_config,
    get_llm_config,
    get_all_llm_configs,
    update_llm_config,
    archive_llm_config,
)


@pytest.mark.asyncio
@patch("api.services.llm_service.get_database")
async def test_create_llm_config(mock_get_database):
    """Test creating a new LLM configuration."""
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_get_database.return_value = mock_db

    result = await create_llm_config(
        name="Test LLM Config", model="llama3", temperature=0.8, max_tokens=2048
    )

    assert result["name"] == "Test LLM Config"
    assert result["model"] == "llama3"
    assert result["temperature"] == 0.8
    assert result["max_tokens"] == 2048
    assert "config_uid" in result
    assert "created_at" in result
    assert result["is_archived"] is False

    mock_collection.insert_one.assert_called_once()


@pytest.mark.asyncio
@patch("api.services.llm_service.get_database")
async def test_get_llm_config(mock_get_database):
    """Test getting an LLM configuration by ID."""
    config_uid = str(uuid.uuid4())
    mock_config = {
        "config_uid": config_uid,
        "name": "Test LLM Config",
        "model": "llama3",
        "temperature": 0.8,
        "max_tokens": 2048,
        "is_archived": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.find_one.return_value = mock_config
    mock_db.__getitem__.return_value = mock_collection
    mock_get_database.return_value = mock_db

    result = await get_llm_config(config_uid)

    assert result == mock_config

    mock_collection.find_one.assert_called_once_with({"config_uid": config_uid})


@pytest.mark.asyncio
@patch("api.services.llm_service.get_database")
async def test_get_all_llm_configs(mock_get_database):
    """Test getting all LLM configurations."""
    config1_uid = str(uuid.uuid4())
    config2_uid = str(uuid.uuid4())

    mock_configs = [
        {
            "config_uid": config1_uid,
            "name": "Test LLM Config 1",
            "model": "llama3",
            "temperature": 0.8,
            "max_tokens": 2048,
            "is_archived": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "config_uid": config2_uid,
            "name": "Test LLM Config 2",
            "model": "mixtral",
            "temperature": 0.7,
            "max_tokens": 4096,
            "is_archived": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    ]

    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=mock_configs)

    mock_collection = AsyncMock()
    mock_collection.find = MagicMock(return_value=mock_cursor)

    mock_db = MagicMock()
    mock_db.__getitem__ = MagicMock(return_value=mock_collection)

    mock_get_database.return_value = mock_db

    results = await get_all_llm_configs()

    assert len(results) == 2
    assert results[0]["config_uid"] == config1_uid
    assert results[1]["config_uid"] == config2_uid

    mock_collection.find.assert_called_once_with({"is_archived": False})
    mock_cursor.to_list.assert_called_once_with(length=100)


@pytest.mark.asyncio
@patch("api.services.llm_service.get_database")
@patch("api.services.llm_service.get_llm_config")
async def test_update_llm_config(mock_get_llm_config, mock_get_database):
    """Test updating an LLM configuration."""
    config_uid = str(uuid.uuid4())

    update_data = {"name": "Updated LLM Config", "temperature": 0.9}

    updated_config = {
        "config_uid": config_uid,
        "name": "Updated LLM Config",
        "model": "llama3",
        "temperature": 0.9,
        "max_tokens": 2048,
        "is_archived": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.update_one.return_value = AsyncMock(modified_count=1)
    mock_db.__getitem__.return_value = mock_collection
    mock_get_database.return_value = mock_db

    mock_get_llm_config.return_value = updated_config

    result = await update_llm_config(config_uid, update_data)

    assert result == updated_config

    mock_collection.update_one.assert_called_once()
    mock_get_llm_config.assert_called_once_with(config_uid)


@pytest.mark.asyncio
@patch("api.services.llm_service.get_database")
async def test_archive_llm_config(mock_get_database):
    """Test archiving an LLM configuration."""
    config_uid = str(uuid.uuid4())

    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.update_one.return_value = AsyncMock(modified_count=1)
    mock_db.__getitem__.return_value = mock_collection
    mock_get_database.return_value = mock_db

    result = await archive_llm_config(config_uid)

    assert result is True

    expected_filter = {"config_uid": config_uid}
    mock_collection.update_one.assert_called_once()
    args, kwargs = mock_collection.update_one.call_args
    assert args[0] == expected_filter
    assert "$set" in args[1]
    assert "is_archived" in args[1]["$set"]
    assert args[1]["$set"]["is_archived"] is True
