import pytest
import sys
from unittest.mock import AsyncMock, MagicMock, patch, Mock
import time
import json

# Import the module
from api.services.search_service import (
    format_search_results_for_rag,
    clean_html
)


@pytest.mark.asyncio
@patch('api.services.search_service.search_web')
async def test_search_web_mock(mock_search_web):
    """Test that search_web can be mocked properly."""
    # Sample search results
    search_results = [
        {
            "title": "Test Result",
            "url": "https://example.com/test",
            "content": "Test content",
            "source": "search_engine",
            "score": 0.9
        }
    ]
    
    # Configure the mock to return our test results
    mock_search_web.return_value = search_results
    
    # Directly call the mocked function
    results = await mock_search_web("test query")
    
    # Verify the mock works
    assert results == search_results
    mock_search_web.assert_called_once_with("test query")


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