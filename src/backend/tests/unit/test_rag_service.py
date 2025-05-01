import pytest
import sys
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

# Mock the modules that require external dependencies
sys.modules['spacy'] = MagicMock()
sys.modules['nltk'] = MagicMock()

# Now import the module
from api.services.rag_service import (
    process_query_with_rag,
    augment_conversation_context,
    QueryType
)

@pytest.fixture
def sample_conversation_messages():
    """Sample conversation messages for testing RAG."""
    conversation_uid = str(uuid.uuid4())
    return [
        {
            "conversation_uid": conversation_uid,
            "message_uid": str(uuid.uuid4()),
            "content": "Hello, how are you?",
            "message_type": "user",
            "created_at": datetime.utcnow(),
        },
        {
            "conversation_uid": conversation_uid,
            "message_uid": str(uuid.uuid4()),
            "content": "I'm doing well, thank you for asking. How can I help you today?",
            "message_type": "assistant",
            "created_at": datetime.utcnow(),
        }
    ]


@pytest.mark.asyncio
@patch('api.services.rag_service.analyze_query')
@patch('api.services.rag_service.extract_search_terms')
@patch('api.services.rag_service.search_web')
@patch('api.services.rag_service.format_search_results_for_rag')
@patch('api.services.rag_service.check_api_module_match')
async def test_process_query_with_rag_general(
    mock_api_match, mock_format_results, mock_search, mock_extract_terms, mock_analyze
):
    """Test process_query_with_rag with a general query that doesn't need RAG."""
    
    mock_api_match.return_value = {"matched": False}
    mock_analyze.return_value = {"query_type": QueryType.GENERAL, "factual_score": 0, "opinion_score": 5}
    
    # Call function
    result = await process_query_with_rag("How are you feeling today?")
    
    # Verify result
    assert result["query_type"] == QueryType.GENERAL
    assert result["using_rag"] is False
    assert result["search_context"] == ""
    assert len(result["search_results"]) == 0
    
    # Verify search wasn't called for a general query
    mock_search.assert_not_called()
    mock_format_results.assert_not_called()


@pytest.mark.asyncio
@patch('api.services.rag_service.analyze_query')
@patch('api.services.rag_service.extract_search_terms')
@patch('api.services.rag_service.search_web')
@patch('api.services.rag_service.format_search_results_for_rag')
@patch('api.services.rag_service.check_api_module_match')
async def test_process_query_with_rag_trivia(
    mock_api_match, mock_format_results, mock_search, mock_extract_terms, mock_analyze
):
    """Test process_query_with_rag with a trivia query that needs RAG."""
    
    mock_api_match.return_value = {"matched": False}
    mock_analyze.return_value = {"query_type": QueryType.TRIVIA, "factual_score": 8, "opinion_score": 0}
    mock_extract_terms.return_value = "Ireland population"
    
    # Sample search results
    search_results = [
        {
            "title": "Population of Ireland",
            "url": "https://example.com/ireland-population",
            "content": "The population of Ireland is approximately 5 million people.",
            "source": "Wikipedia",
            "score": 0.95
        }
    ]
    mock_search.return_value = search_results
    
    # Sample formatted results
    formatted_results = "Search Results:\n\n1. Population of Ireland\n   URL: https://example.com/ireland-population\n   Summary: The population of Ireland is approximately 5 million people.\n\n"
    mock_format_results.return_value = formatted_results
    

    result = await process_query_with_rag("What is the population of Ireland?")
    
    
    assert result["query_type"] == QueryType.TRIVIA
    assert result["using_rag"] is True
    assert result["search_context"] == formatted_results
    assert len(result["search_results"]) == 1
    assert result["search_terms"] == "Ireland population"
    
    # Verify that search functions were called
    mock_extract_terms.assert_called_once()
    mock_search.assert_called_once()
    mock_format_results.assert_called_once()


@pytest.mark.asyncio
@patch('api.services.rag_service.check_api_module_match')
async def test_process_query_with_api_module(mock_api_match):
    """Test process_query_with_rag with a query that matches an API module."""
    
    api_module_result = {
        "matched": True,
        "module_name": "weather",
        "location": "Dublin",
        "formatted_response": "The current weather in Dublin is 15°C and partly cloudy."
    }
    mock_api_match.return_value = api_module_result
    
    
    result = await process_query_with_rag("What's the weather like in Dublin today?")
    
    
    assert result["query_type"] == QueryType.TRIVIA  # API module queries are treated as trivia
    assert result["using_rag"] is False
    assert result["using_api_module"] is True
    assert result["api_module_result"] == api_module_result


@pytest.mark.asyncio
@patch('api.services.rag_service.process_query_with_rag')
async def test_augment_conversation_context_no_rag(mock_process_query, sample_conversation_messages):
    """Test augmenting conversation context with a general query that doesn't need RAG."""
    
    mock_process_query.return_value = {
        "original_query": "How are you feeling today?",
        "query_type": QueryType.GENERAL,
        "using_rag": False,
        "search_context": "",
        "search_results": []
    }
    
    
    result = await augment_conversation_context(sample_conversation_messages, "How are you feeling today?")
    
    
    assert result["rag_applied"] is False
    assert "system_message" not in result
    assert result["query_type"] == QueryType.GENERAL


@pytest.mark.asyncio
@patch('api.services.rag_service.process_query_with_rag')
async def test_augment_conversation_context_with_rag(mock_process_query, sample_conversation_messages):
    """Test augmenting conversation context with a trivia query that needs RAG."""
    # Sample search context
    search_context = "Search Results:\n\n1. Population of Ireland\n   URL: https://example.com/ireland-population\n   Summary: The population of Ireland is approximately 5 million people.\n\n"
    
    mock_process_query.return_value = {
        "original_query": "What is the population of Ireland?",
        "query_type": QueryType.TRIVIA,
        "using_rag": True,
        "search_context": search_context,
        "search_results": [{"title": "Population of Ireland"}],
        "search_terms": "Ireland population"
    }
    
    result = await augment_conversation_context(sample_conversation_messages, "What is the population of Ireland?")
    
    assert result["rag_applied"] is True
    assert "system_message" in result
    assert result["query_type"] == QueryType.TRIVIA
    assert "search_results" in result
    assert len(result["search_results"]) == 1
    assert "search_terms" in result
    assert result["search_terms"] == "Ireland population"


@pytest.mark.asyncio
@patch('api.services.rag_service.process_query_with_rag')
async def test_augment_conversation_context_with_api_module(mock_process_query, sample_conversation_messages):
    """Test augmenting conversation context with a query that matches an API module."""
    # Sample API module result
    api_module_result = {
        "matched": True,
        "module_name": "weather",
        "location": "Dublin",
        "formatted_response": "The current weather in Dublin is 15°C and partly cloudy."
    }
    
    mock_process_query.return_value = {
        "original_query": "What's the weather like in Dublin today?",
        "query_type": QueryType.TRIVIA,
        "using_rag": False,
        "using_api_module": True,
        "api_module_result": api_module_result,
        "search_context": "",
        "search_results": []
    }
    
    result = await augment_conversation_context(sample_conversation_messages, "What's the weather like in Dublin today?")
    
    assert result["rag_applied"] is False
    assert result["api_module_applied"] is True
    assert "system_message" in result
    assert "API MODULE RESULT:" in result["system_message"]["content"]
    assert result["query_type"] == QueryType.TRIVIA
    assert "api_module_result" in result
    assert result["api_module_result"] == api_module_result 