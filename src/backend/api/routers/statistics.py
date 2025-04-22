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


@router.get("/messages", response_model=Dict[str, Any])
async def get_message_statistics(
    llm: Optional[str] = Query(None, description="Filter by LLM config UID"),
    agent: Optional[str] = Query(None, description="Filter by agent UID"),
    current_user: dict = Depends(get_current_user),
):
    """Get statistics about messages, including likes and dislikes."""
    try:
        counts = await get_message_counts(llm_filter=llm, agent_filter=agent)
        return {"status": "success", "data": counts}
    except Exception as e:
        logger.error(f"Error getting message statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get message statistics: {str(e)}",
        )


@router.get("/metrics", response_model=Dict[str, Any])
async def get_metrics(current_user: dict = Depends(get_current_user)):
    """Get 3D metrics of response time vs TTS duration vs message character count."""
    try:
        metrics = await get_response_metrics()
        return {"status": "success", "data": metrics}
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics: {str(e)}",
        )


@router.get("/llm", response_model=Dict[str, Any])
async def get_llm_statistics(
    llm_id: Optional[str] = Query(None, description="Filter by LLM config UID"),
    current_user: dict = Depends(get_current_user),
):
    """Get performance statistics for LLM configurations."""
    try:
        stats = await get_llm_performance_stats(llm_filter=llm_id)
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Error getting LLM statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get LLM statistics: {str(e)}",
        )


@router.get("/agent", response_model=Dict[str, Any])
async def get_agent_statistics(
    agent_id: Optional[str] = Query(None, description="Filter by agent UID"),
    current_user: dict = Depends(get_current_user),
):
    """Get performance statistics for agents."""
    try:
        stats = await get_agent_performance_stats(agent_filter=agent_id)
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Error getting agent statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent statistics: {str(e)}",
        )
