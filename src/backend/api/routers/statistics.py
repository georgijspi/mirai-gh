from fastapi import APIRouter, Depends, HTTPException, status, Query
import logging
from typing import Dict, List, Any, Optional

from ..models import StatusResponse
from ..security import get_current_user
from ..services.statistics_service import (
    get_message_counts,
    get_response_metrics,
    get_llm_performance_stats,
    get_agent_performance_stats,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get("/messages")
async def get_message_statistics(
    llm_filter: Optional[str] = Query(None, description="Filter by LLM config UID"),
    agent_filter: Optional[str] = Query(None, description="Filter by agent UID"),
) -> Dict[str, int]:
    """
    Get message statistics including likes, dislikes, and total counts.

    Args:
        llm_filter: Optional filter by LLM config UID
        agent_filter: Optional filter by agent UID

    Returns:
        Dictionary with total, likes, dislikes, and no_rating counts
    """
    return await get_message_counts(llm_filter, agent_filter)


@router.get("/metrics")
async def get_metrics(
    llm_filter: Optional[str] = Query(None, description="Filter by LLM config UID"),
    agent_filter: Optional[str] = Query(None, description="Filter by agent UID"),
) -> List[Dict[str, Any]]:
    """
    Get metrics data for response time, audio duration, and character count.

    Args:
        llm_filter: Optional filter by LLM config UID
        agent_filter: Optional filter by agent UID

    Returns:
        List of dictionaries containing response_time, audio_duration, and character_count
    """
    return await get_response_metrics(llm_filter=llm_filter, agent_filter=agent_filter)


@router.get("/llm")
async def get_llm_statistics(
    llm_filter: Optional[str] = Query(None, description="Filter by LLM config UID")
) -> List[Dict[str, Any]]:
    """
    Get LLM performance statistics.

    Args:
        llm_filter: Optional filter by LLM config UID

    Returns:
        List of dictionaries with LLM performance statistics
    """
    return await get_llm_performance_stats(llm_filter)


@router.get("/agent")
async def get_agent_statistics(
    agent_filter: Optional[str] = Query(None, description="Filter by agent UID")
) -> List[Dict[str, Any]]:
    """
    Get agent performance statistics.

    Args:
        agent_filter: Optional filter by agent UID

    Returns:
        List of dictionaries with agent performance statistics
    """
    return await get_agent_performance_stats(agent_filter)
