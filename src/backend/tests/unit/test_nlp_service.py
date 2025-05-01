import pytest
import sys
from unittest.mock import AsyncMock, MagicMock, patch
import json

# Mock the modules that require external dependencies
sys.modules['spacy'] = MagicMock()
sys.modules['nltk'] = MagicMock()

# Now import the module
from api.services.nlp_service import (
    analyze_query,
    extract_search_terms,
    check_api_module_match,
    QueryType
)


@pytest.mark.asyncio
async def test_analyze_query_factual():
    """Test that a factual query is correctly identified."""
    # Mock the spaCy Doc object
    mock_doc = MagicMock()
    mock_doc.ents = []
    mock_doc.noun_chunks = []
    
    # Mock token objects
    mock_token1 = MagicMock()
    mock_token1.pos_ = "NOUN"
    mock_token1.is_stop = False
    mock_token1.text = "population"
    
    mock_token2 = MagicMock()
    mock_token2.pos_ = "VERB"
    mock_token2.is_stop = False
    mock_token2.text = "is"
    
    mock_doc.__iter__.return_value = [mock_token1, mock_token2]
    
    with patch('api.services.nlp_service.nlp', return_value=mock_doc):
        # Test a factual query
        result = await analyze_query("What is the population of Ireland?")
        
        # This should be identified as a trivia query
        assert result["query_type"] == QueryType.TRIVIA
        assert "factual_score" in result
        assert result["factual_score"] > 0


@pytest.mark.asyncio
async def test_analyze_query_general():
    """Test that a general query is correctly identified."""
    # Mock the spaCy Doc object
    mock_doc = MagicMock()
    mock_doc.ents = []
    mock_doc.noun_chunks = []
    
    # Mock token objects
    mock_token1 = MagicMock()
    mock_token1.pos_ = "NOUN"
    mock_token1.is_stop = False
    mock_token1.text = "movie"
    
    mock_token2 = MagicMock()
    mock_token2.pos_ = "VERB"
    mock_token2.is_stop = False
    mock_token2.text = "like"
    
    mock_doc.__iter__.return_value = [mock_token1, mock_token2]
    
    with patch('api.services.nlp_service.nlp', return_value=mock_doc):
        # Test an opinion-based query
        result = await analyze_query("What kind of movies do you like?")
        
        # This should be identified as a general query
        assert result["query_type"] == QueryType.GENERAL
        assert "opinion_score" in result
        assert result["factual_score"] < result["opinion_score"]


@pytest.mark.asyncio
async def test_extract_search_terms_simple():
    """Test extracting search terms from a simple query."""
    
    mock_analysis = {
        "query_type": QueryType.TRIVIA,
        "is_follow_up": False,
        "entities": [{"text": "Ireland"}, {"text": "population"}],
        "noun_chunks": ["Ireland", "population"],
        "important_nouns": ["Ireland", "population"]
    }
    
    with patch('api.services.nlp_service.analyze_query', return_value=mock_analysis):
        result = await extract_search_terms("What is the population of Ireland?")
        
        # The result should contain the main search terms
        assert "Ireland" in result
        assert "population" in result


@pytest.mark.asyncio
async def test_extract_search_terms_follow_up():
    """Test extracting search terms from a follow-up query with previous context."""
    # Mock the analysis function
    mock_analysis = {
        "query_type": QueryType.TRIVIA,
        "is_follow_up": True,
        "entities": [],
        "noun_chunks": ["it"],
        "important_nouns": []
    }
    
    with patch('api.services.nlp_service.analyze_query', return_value=mock_analysis):
        # Test with previous search context
        prev_search_terms = "Ireland population"
        result = await extract_search_terms("How has it changed in recent years?", prev_search_terms)
        
        # The result should contain both previous context and new terms
        assert "Ireland" in result
        assert "population" in result
        assert "changed" in result
        assert "recent years" in result or "recent" in result


@pytest.mark.asyncio
async def test_check_api_module_match_no_match():
    """Test when no API module matches the query."""
    # Test query that doesn't match any API module
    result = await check_api_module_match("What is the capital of France?")
    
    assert result["matched"] is False
    assert result["module_name"] is None


@pytest.mark.asyncio
@patch('api.services.nlp_service.check_weather_match')
async def test_check_api_module_match_weather(mock_weather_match):
    """Test a weather-related query matching the weather API module."""
    mock_weather_match.return_value = {
        "matched": True,
        "location": "Dublin",
        "confidence": 0.95
    }
    
    # Test a query that should match the weather module
    result = await check_api_module_match("Weather forecast for Dublin")
    
    assert result["matched"] is True
    assert result["module_name"] == "weather"
    assert "location" in result
    assert result["location"] == "Dublin" 