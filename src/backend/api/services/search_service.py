import logging
import aiohttp
import json
from typing import Dict, List, Any, Optional
import asyncio
import re
from bs4 import BeautifulSoup
import html

# Initialize logger
logger = logging.getLogger(__name__)

# SearXNG configuration
SEARXNG_URL = "http://localhost:8080"
SEARXNG_ENDPOINT = "/search"
MAX_RESULTS = 5
DEFAULT_CATEGORIES = ["general", "news"]
# Use multiple search engines for better results
DEFAULT_ENGINES = ["brave", "google", "bing", "duckduckgo", "yahoo"]
# Set a longer timeout for multi-engine searches
DEFAULT_TIMEOUT = 15

async def search_web(query: str, max_results: int = MAX_RESULTS) -> List[Dict[str, Any]]:
    """Search the web using SearXNG for a given query."""
    logger.info(f"Performing web search for: {query}")
    
    results = await _search_with_searxng(query, max_results)
    
    if not results:
        logger.warning(f"Search returned no results for query: {query}")
        return []
    
    return results
    
async def _search_with_searxng(query: str, max_results: int) -> List[Dict[str, Any]]:
    """Search using SearXNG with multiple engines."""
    search_url = f"{SEARXNG_URL}{SEARXNG_ENDPOINT}"
    
    params = {
        "q": query,
        "format": "json",
        "categories": ",".join(DEFAULT_CATEGORIES),
        "engines": ",".join(DEFAULT_ENGINES),
        "num_results": max_results * 3,
        "time_range": "year",
        "language": "en",
        "safesearch": 0
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": f"{SEARXNG_URL}/",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": f"{SEARXNG_URL}",
        "DNT": "1",
        "Connection": "keep-alive",
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            logger.info(f"Making search request to {search_url} with params: {params}")
            async with session.get(search_url, params=params, headers=headers, timeout=DEFAULT_TIMEOUT) as response:
                if response.status != 200:
                    response_text = await response.text()
                    logger.error(f"SearXNG request failed with status {response.status}: {response_text}")
                    
                    # Try a plain GET request without headers if the first attempt fails
                    logger.info("Attempting fallback request without custom headers")
                    async with session.get(search_url, params=params, timeout=DEFAULT_TIMEOUT) as fallback_response:
                        if fallback_response.status != 200:
                            logger.error(f"Fallback request also failed with status {fallback_response.status}")
                            return []
                        data = await fallback_response.json()
                else:
                    data = await response.json()
                
                results = data.get("results", [])
                logger.info(f"Raw search results count: {len(results)}")
                
                # Process and clean results
                processed_results = []
                # Sort results by score (descending) to get the most relevant first
                sorted_results = sorted(results, key=lambda x: x.get("score", 0), reverse=True)
                
                # Take the best results up to max_results
                for result in sorted_results[:max_results]:
                    content = result.get("content", "")
                    if content:
                        content = clean_html(content)
                    
                    processed_results.append({
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "content": content,
                        "source": result.get("engine", ""),
                        "score": result.get("score", 0)
                    })
                
                logger.info(f"Retrieved {len(processed_results)} search results for query: {query}")
                return processed_results
    except asyncio.TimeoutError:
        logger.error(f"Search request timeout for query: {query}")
        return []
    except Exception as e:
        logger.error(f"Error searching the web for query '{query}': {str(e)}")
        return []

def clean_html(content: str) -> str:
    """Clean HTML content from search results."""
    # Handle case where content is already plain text
    if not re.search(r'<[^>]+>', content):
        return content
    
    # Parse HTML and extract text
    try:
        soup = BeautifulSoup(content, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        text = html.unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    except Exception as e:
        logger.warning(f"Failed to clean HTML content: {str(e)}")
        # Fallback: Strip HTML tags with regex
        text = re.sub(r'<[^>]+>', '', content)
        text = html.unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

async def format_search_results_for_rag(results: List[Dict[str, Any]]) -> str:
    """Format search results for inclusion in a prompt."""
    if not results:
        return "No relevant search results found."
    
    formatted_text = "Search Results:\n\n"
    
    for i, result in enumerate(results, 1):
        formatted_text += f"{i}. {result['title']}\n"
        formatted_text += f"   URL: {result['url']}\n"
        if result.get('content'):
            content = result['content']
            # Truncate content if it's too long
            if len(content) > 300:
                content = content[:297] + "..."
            formatted_text += f"   Summary: {content}\n"
        formatted_text += "\n"
    
    return formatted_text 