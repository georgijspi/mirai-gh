import logging
from typing import Dict, List, Any, Tuple, Optional
from ..database import get_database
from ..models import MessageType, MessageRating

logger = logging.getLogger(__name__)

async def get_message_counts(llm_filter: Optional[str] = None, agent_filter: Optional[str] = None) -> Dict[str, int]:
    """
    Get total message counts, including likes and dislikes.
    
    Args:
        llm_filter: Optional filter by LLM config UID
        agent_filter: Optional filter by agent UID
        
    Returns:
        Dictionary with total, likes, and dislikes counts
    """
    db = get_database()
    
    pipeline = []
    
    # Add filters if provided
    match_stage = {}
    if llm_filter:
        match_stage["llm_config_uid"] = llm_filter
    if agent_filter:
        match_stage["agent_uid"] = agent_filter
    
    # Only include agent messages in the rating stats
    match_stage["message_type"] = MessageType.AGENT
    
    if match_stage:
        pipeline.append({"$match": match_stage})
    
    # Group by rating and count
    pipeline.append({
        "$group": {
            "_id": "$rating",
            "count": {"$sum": 1}
        }
    })
    
    results = await db.messages.aggregate(pipeline).to_list(length=None)
    
    counts = {
        "total": 0,
        "likes": 0,
        "dislikes": 0,
        "no_rating": 0
    }
    
    # Count total agent messages only (exclude user messages)
    total_query = {"message_type": MessageType.AGENT}
    if llm_filter:
        total_query["llm_config_uid"] = llm_filter
    if agent_filter:
        total_query["agent_uid"] = agent_filter
    
    counts["total"] = await db.messages.count_documents(total_query)
    
    for result in results:
        if result["_id"] == MessageRating.LIKE:
            counts["likes"] = result["count"]
        elif result["_id"] == MessageRating.DISLIKE:
            counts["dislikes"] = result["count"]
        elif result["_id"] == MessageRating.NONE:
            counts["no_rating"] = result["count"]
    
    return counts

async def get_response_metrics() -> List[Dict[str, Any]]:
    """
    Get 3D array of response time vs TTS duration vs message character count.
    
    Returns:
        List of dictionaries containing response_time, audio_duration, and character_count
    """
    db = get_database()
    
    # Prepare and execute database query
    query = {
        "message_type": MessageType.AGENT,
        "metadata.response_time": {"$exists": True},
        "metadata.audio_duration": {"$exists": True}
    }
    
    projection = {
        "metadata.response_time": 1,
        "metadata.audio_duration": 1,
        "content": 1,
        "agent_uid": 1,
        "llm_config_uid": 1,
        "_id": 0
    }
    
    cursor = db.messages.find(query, projection)
    messages = await cursor.to_list(length=None)
    
    # Transform the results
    metrics = []
    for message in messages:
        try:
            # Extract metadata
            metadata = message.get("metadata", {})
            response_time = float(metadata.get("response_time", 0))
            audio_duration = float(metadata.get("audio_duration", 0))
            
            # Count characters
            content = message.get("content", "")
            char_count = len(content)
            
            # Add to metrics
            metrics.append({
                "response_time": response_time,
                "audio_duration": audio_duration,
                "char_count": char_count,
                "agent_uid": message.get("agent_uid"),
                "llm_config_uid": message.get("llm_config_uid")
            })
        except (ValueError, TypeError, KeyError) as e:
            logger.warning(f"Error processing message metrics: {e}")
            continue
    
    return metrics

async def get_llm_performance_stats(llm_filter: Optional[str] = None) -> Dict[str, Any]:
    """
    Get performance statistics for LLM configurations.
    
    Args:
        llm_filter: Optional filter by LLM config UID
        
    Returns:
        Dictionary with LLM performance statistics
    """
    db = get_database()
    
    match_stage = {
        "message_type": MessageType.AGENT,
        "metadata.response_time": {"$exists": True}
    }
    
    if llm_filter:
        match_stage["llm_config_uid"] = llm_filter
    
    # Aggregation pipeline
    pipeline = [
        {"$match": match_stage},
        {"$group": {
            "_id": "$llm_config_uid",
            "avg_response_time": {"$avg": {"$toDouble": "$metadata.response_time"}},
            "max_response_time": {"$max": {"$toDouble": "$metadata.response_time"}},
            "min_response_time": {"$min": {"$toDouble": "$metadata.response_time"}},
            "avg_audio_duration": {"$avg": {"$toDouble": "$metadata.audio_duration"}},
            "avg_char_count": {"$avg": {"$strLenCP": "$content"}},
            "message_count": {"$sum": 1}
        }}
    ]
    
    results = await db.messages.aggregate(pipeline).to_list(length=None)
    
    return results

async def get_agent_performance_stats(agent_filter: Optional[str] = None) -> Dict[str, Any]:
    """
    Get performance statistics for agents.
    
    Args:
        agent_filter: Optional filter by agent UID
        
    Returns:
        Dictionary with agent performance statistics
    """
    db = get_database()
    
    match_stage = {
        "message_type": MessageType.AGENT,
        "metadata.response_time": {"$exists": True}
    }
    
    if agent_filter:
        match_stage["agent_uid"] = agent_filter
    
    # Aggregation pipeline
    pipeline = [
        {"$match": match_stage},
        {"$group": {
            "_id": "$agent_uid",
            "avg_response_time": {"$avg": {"$toDouble": "$metadata.response_time"}},
            "max_response_time": {"$max": {"$toDouble": "$metadata.response_time"}},
            "min_response_time": {"$min": {"$toDouble": "$metadata.response_time"}},
            "avg_audio_duration": {"$avg": {"$toDouble": "$metadata.audio_duration"}},
            "avg_char_count": {"$avg": {"$strLenCP": "$content"}},
            "message_count": {"$sum": 1},
            "like_count": {
                "$sum": {
                    "$cond": [{"$eq": ["$rating", MessageRating.LIKE]}, 1, 0]
                }
            },
            "dislike_count": {
                "$sum": {
                    "$cond": [{"$eq": ["$rating", MessageRating.DISLIKE]}, 1, 0]
                }
            }
        }}
    ]
    
    results = await db.messages.aggregate(pipeline).to_list(length=None)
    
    return results 