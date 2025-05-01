import pytest
import sys
from unittest.mock import AsyncMock, MagicMock, patch, Mock
import time
import aiohttp
import json

# Import the module
from api.services.search_service import (
    search_web,
    format_search_results_for_rag,
    clean_html,
    _search_with_searxng
)


@pytest.mark.asyncio
@patch('api.services.search_service._search_with_searxng')
async def test_search_web_with_results(mock_search_searxng):
    """Test successful web search with results."""
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
    mock_search_searxng.return_value = search_results
    
    results = await search_web("Ireland population", max_results=1)
    
    assert results == search_results
    mock_search_searxng.assert_called_once()


@pytest.mark.asyncio
@patch('api.services.search_service._search_with_searxng')
async def test_search_web_no_results_fallback(mock_search_searxng):
    """Test web search with no results from primary engines, falling back to secondary engines."""
    # No results from primary engines, but results from fallback engines
    mock_search_searxng.side_effect = [
        [],  # Primary search returns no results
        [{"title": "Ireland Population Stats", "url": "https://example.com/stats"}]  # Fallback search returns results
    ]
    
    results = await search_web("obscure query")
    
    assert len(results) == 1
    assert results[0]["title"] == "Ireland Population Stats"
    assert mock_search_searxng.call_count == 2


@pytest.mark.asyncio
@patch('api.services.search_service.time')
@patch('api.services.search_service._search_with_searxng')
async def test_search_web_cache(mock_search_searxng, mock_time):
    """Test that search results are cached and reused for identical queries."""
    mock_time.time.side_effect = [100, 100.5]  # First call and second call time
    
    # Sample search results
    search_results = [{"title": "Cached Result"}]
    mock_search_searxng.return_value = search_results
    
    # First call should perform the search
    results1 = await search_web("cached query")
    
    # Second call with the same query should use cached results
    results2 = await search_web("cached query")
    
    assert results1 == results2
    assert results1 == search_results
    
    # Verify that the actual search was only performed once
    mock_search_searxng.assert_called_once()


@pytest.mark.asyncio
@patch('api.services.search_service.aiohttp.ClientSession')
async def test_search_with_searxng_success(mock_client_session):
    """Test the internal _search_with_searxng function with successful response."""
    # Mock session
    mock_session = AsyncMock()
    mock_client_session.return_value.__aenter__.return_value = mock_session
    
    # Mock response
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.json.return_value = {
        "results": [
            {
                "title": "Test Result",
                "url": "https://example.com/test",
                "content": "<p>Test content</p>",
                "engine": "google",
                "score": 0.9
            }
        ]
    }
    mock_session.get.return_value.__aenter__.return_value = mock_response
    
    results = await _search_with_searxng("test query", 1, ["google"])
    
    assert len(results) == 1
    assert results[0]["title"] == "Test Result"
    assert results[0]["content"] == "Test content"  # HTML should be cleaned
    assert results[0]["score"] == 0.9


@pytest.mark.asyncio
@patch('api.services.search_service.aiohttp.ClientSession')
async def test_search_with_searxng_error_fallback(mock_client_session):
    """Test that _search_with_searxng falls back to a simpler request on error."""
    # SMock session
    mock_session = AsyncMock()
    mock_client_session.return_value.__aenter__.return_value = mock_session
    
    # First request fails with an error
    mock_error_resp = AsyncMock()
    mock_error_resp.status = 200
    mock_error_resp.json.side_effect = json.JSONDecodeError("Invalid JSON", "{", 0)
    
    # Second fallbackrequest succeeds
    mock_success_resp = AsyncMock()
    mock_success_resp.status = 200
    mock_success_resp.json.return_value = {
        "results": [
            {
                "title": "Fallback Result",
                "url": "https://example.com/fallback",
                "content": "Fallback content",
                "engine": "duckduckgo",
                "score": 0.8
            }
        ]
    }
    
    # Mock returns error first, then success
    mock_session.get.return_value.__aenter__.side_effect = [
        mock_error_resp,  # First call with headers fails
        mock_success_resp  # Second call without headers succeeds
    ]
    
    results = await _search_with_searxng("fallback query", 1, ["duckduckgo"])
    
    assert len(results) == 1
    assert results[0]["title"] == "Fallback Result"
    assert results[0]["content"] == "Fallback content"
    assert mock_session.get.call_count == 2


def test_clean_html():
    """Test HTML cleaning function."""
    html_content = "<p>This is <b>bold</b> text with a <a href='https://example.com'>link</a>.</p>"
    clean_result = clean_html(html_content)
    
    assert clean_result == "This is bold text with a link ." or clean_result == "This is bold text with a link."
    
    # Test with plain text (no HTML)
    plain_text = "This is just plain text."
    assert clean_html(plain_text) == plain_text
    
    # Test with complex HTML
    complex_html = """
    <div class="result">
        <h2>Title</h2>
        <div class="snippet">
            <p>This is a snippet with <em>formatting</em> and
               <script>alert('bad script');</script>
               some other content.
            </p>
        </div>
    </div>
    """
    clean_complex = clean_html(complex_html)
    assert "Title" in clean_complex
    assert "formatting" in clean_complex
    assert "content" in clean_complex
    assert "alert" not in clean_complex  # Script content should be removed


@pytest.mark.asyncio
async def test_format_search_results_for_rag():
    """Test formatting search results for RAG."""
    # Sample search results
    search_results = [
        {
            "title": "Population of Ireland",
            "url": "https://example.com/ireland-population",
            "content": "The population of Ireland is approximately 5 million people.",
            "source": "Wikipedia",
            "score": 0.95
        },
        {
            "title": "Ireland Demographics",
            "url": "https://example.com/demographics",
            "content": "Ireland has experienced population growth in recent years.",
            "source": "Census Bureau",
            "score": 0.85
        }
    ]
    
    # Format the results
    formatted = await format_search_results_for_rag(search_results)
    
    # Verify the formatted output
    assert "Search Results:" in formatted
    assert "1. Population of Ireland" in formatted
    assert "https://example.com/ireland-population" in formatted
    assert "2. Ireland Demographics" in formatted
    assert "https://example.com/demographics" in formatted
    
    # Test with no results
    empty_formatted = await format_search_results_for_rag([])
    assert "No search results were found" in empty_formatted 