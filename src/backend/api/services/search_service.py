import logging
import aiohttp
import json
from typing import Dict, List, Any, Optional
import asyncio
import re
from bs4 import BeautifulSoup
import html
import time

logger = logging.getLogger(__name__)

# Configuration
SEARXNG_URL = "http://localhost:8080"
SEARXNG_ENDPOINT = "/search"
MAX_RESULTS = 5
DEFAULT_CATEGORIES = ["general", "news"]
DEFAULT_ENGINES = ["brave", "google", "bing", "duckduckgo", "qwant", "yahoo"]
FALLBACK_ENGINES = ["wikipedia", "qwant", "brave", "duckduckgo"]
DEFAULT_TIMEOUT = 15
MAX_RETRIES = 3
RETRY_DELAY = 2

SEARCH_CACHE = {}
CACHE_EXPIRY = 3600  # 1 hour in seconds

async def search_web(query: str, max_results: int = MAX_RESULTS) -> List[Dict[str, Any]]:
    """Search the web using SearXNG for a given query."""
    logger.info(f"Performing web search for: {query}")
    
    cache_key = f"{query}_{max_results}"
    current_time = time.time()
    if cache_key in SEARCH_CACHE:
        cache_time, results = SEARCH_CACHE[cache_key]
        if current_time - cache_time < CACHE_EXPIRY:
            logger.info(f"Using cached search results for: {query}")
            return results
    
    # Try full engine set first
    results = await _search_with_searxng(query, max_results, DEFAULT_ENGINES)
    
    # If no results or error, try with fallback engines
    if not results:
        logger.warning(f"Primary search failed for query: {query}. Trying fallback engines...")
        results = await _search_with_searxng(query, max_results, FALLBACK_ENGINES)
    
    if results:
        SEARCH_CACHE[cache_key] = (current_time, results)
        
    return results

async def _search_with_searxng(query: str, max_results: int, engines: List[str]) -> List[Dict[str, Any]]:
    """Search using SearXNG with specified engines and retry logic."""
    search_url = f"{SEARXNG_URL}{SEARXNG_ENDPOINT}"
    
    params = {
        "q": query,
        "format": "json",
        "categories": ",".join(DEFAULT_CATEGORIES),
        "engines": ",".join(engines),
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
    
    results = []
    retries = 0
    
    while retries < MAX_RETRIES and not results:
        try:
            async with aiohttp.ClientSession() as session:
                logger.info(f"Making search request to {search_url} with engines: {engines} (attempt {retries+1}/{MAX_RETRIES})")
                
                try:
                    async with session.get(search_url, params=params, headers=headers, timeout=DEFAULT_TIMEOUT) as response:
                        if response.status == 200:
                            data = await response.json()
                            results = data.get("results", [])
                        else:
                            response_text = await response.text()
                            logger.warning(f"SearXNG response status {response.status}: {response_text}")
                            raise aiohttp.ClientResponseError(
                                request_info=response.request_info,
                                history=response.history,
                                status=response.status,
                                message=f"SearXNG request failed: {response_text}",
                                headers=response.headers
                            )
                except (aiohttp.ClientError, json.JSONDecodeError) as e:
                    logger.warning(f"Error with headers, trying without: {str(e)}")
                    async with session.get(search_url, params=params, timeout=DEFAULT_TIMEOUT) as fallback_response:
                        if fallback_response.status == 200:
                            data = await fallback_response.json()
                            results = data.get("results", [])
                        else:
                            logger.warning(f"Fallback request also failed with status {fallback_response.status}")
                            raise aiohttp.ClientResponseError(
                                request_info=fallback_response.request_info,
                                history=fallback_response.history,
                                status=fallback_response.status,
                                message="Fallback request failed",
                                headers=fallback_response.headers
                            )
                
                if results:
                    logger.info(f"Raw search results count: {len(results)}")
                    
                    processed_results = []
                    sorted_results = sorted(results, key=lambda x: x.get("score", 0), reverse=True)
                    
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
                
        except Exception as e:
            logger.error(f"Search attempt {retries+1} failed: {str(e)}")
        
        retries += 1
        if retries < MAX_RETRIES:
            await asyncio.sleep(RETRY_DELAY * retries)  # Exponential backoff
    
    return []

def clean_html(content: str) -> str:
    """Clean HTML content from search results."""
    # Handle case where content is already plain text
    if not re.search(r'<[^>]+>', content):
        return content
    
    try:
        soup = BeautifulSoup(content, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        text = html.unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    except Exception as e:
        logger.warning(f"Failed to clean HTML content: {str(e)}")
        text = re.sub(r'<[^>]+>', '', content)
        text = html.unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

async def format_search_results_for_rag(results: List[Dict[str, Any]]) -> str:
    """Format search results for inclusion in a prompt."""
    if not results:
        return "No search results were found. The information provided below is limited and may not be current or accurate."
    
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