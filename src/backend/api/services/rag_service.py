import logging
from typing import Dict, List, Any
import asyncio
import re

from .nlp_service import analyze_query, extract_search_terms, QueryType
from .search_service import search_web, format_search_results_for_rag

# Initialize logger
logger = logging.getLogger(__name__)

# Configuration
MAX_SEARCH_RESULTS = 5
CONTEXT_LENGTH_LIMIT = 2000
# Cache for previous search terms
PREVIOUS_SEARCH_TERMS = {}

# Safety filter bypass patterns
CORRECTION_PATTERNS = [
    r"(?i)\bi\s+need\s+to\s+correct\s+you",
    r"(?i)\bthat's\s+not\s+correct",
    r"(?i)\bthat's\s+wrong",
    r"(?i)\byou're\s+incorrect",
    r"(?i)\bactually,",
    r"(?i)\bfactually,"
]

async def process_query_with_rag(query: str, conversation_uid: str = None) -> Dict[str, Any]:
    """Process a user query with RAG if needed."""
    logger.info(f"Processing query with potential RAG: {query}")
    
    # Check if this is a correction message
    is_correction = any(re.search(pattern, query) for pattern in CORRECTION_PATTERNS)
    
    # Get previous search terms if available
    prev_search_terms = None
    if conversation_uid and conversation_uid in PREVIOUS_SEARCH_TERMS:
        prev_search_terms = PREVIOUS_SEARCH_TERMS[conversation_uid]
        logger.info(f"Found previous search terms for conversation {conversation_uid}: {prev_search_terms}")
    
    # For corrections, skip full analysis if we have previous search terms
    if is_correction and prev_search_terms:
        logger.info(f"Detected correction message, using previous search terms: {prev_search_terms}")
        
        # Extract correction details from the query
        # Add additional terms for this correction
        search_terms = f"{prev_search_terms} correction"
        
        PREVIOUS_SEARCH_TERMS[conversation_uid] = search_terms
            
        # Set up result with correction context
        result = {
            "original_query": query,
            "query_type": QueryType.TRIVIA,
            "enhanced_prompt": query,
            "search_context": "",
            "search_results": [],
            "using_rag": True,
            "is_correction": True,
            "search_terms": search_terms
        }
        
        # Perform web search
        search_results = await search_web(search_terms, max_results=MAX_SEARCH_RESULTS)
        
        if search_results:
            # Format search results for inclusion in prompt
            search_context = await format_search_results_for_rag(search_results)
            
            # Truncate if too long
            if len(search_context) > CONTEXT_LENGTH_LIMIT:
                search_context = search_context[:CONTEXT_LENGTH_LIMIT] + "...\n(Search results truncated due to length)"
            
            result.update({
                "search_context": search_context,
                "search_results": search_results
            })
            
            logger.info(f"Enhanced prompt created with {len(search_results)} search results for correction")
        else:
            logger.warning(f"No search results found for correction: {query}")
        
        return result
    
    # Analyze the query to determine if it needs RAG
    analysis = await analyze_query(query)
    query_type = analysis["query_type"]
    
    # Initialize result
    result = {
        "original_query": query,
        "query_type": query_type,
        "enhanced_prompt": query,
        "search_context": "",
        "search_results": [],
        "using_rag": False,
        "search_terms": None
    }
    
    # If it's a trivia query, augment with search results
    if query_type == QueryType.TRIVIA:
        logger.info(f"Query identified as trivia type, applying RAG: {query}")
        
        # Extract search terms from the query with previous context
        search_terms = await extract_search_terms(query, prev_search_terms)
        logger.info(f"Extracted search terms: {search_terms}")
        
        # Store these search terms for future reference
        if conversation_uid:
            PREVIOUS_SEARCH_TERMS[conversation_uid] = search_terms
            
        # Save in result
        result["search_terms"] = search_terms
        
        # Perform web search
        search_results = await search_web(search_terms, max_results=MAX_SEARCH_RESULTS)
        
        if search_results:
            # Format search results for inclusion in prompt
            search_context = await format_search_results_for_rag(search_results)
            
            # Truncate if too long
            if len(search_context) > CONTEXT_LENGTH_LIMIT:
                search_context = search_context[:CONTEXT_LENGTH_LIMIT] + "...\n(Search results truncated due to length)"
            
            result.update({
                "enhanced_prompt": query,
                "search_context": search_context,
                "search_results": search_results,
                "using_rag": True
            })
            
            logger.info(f"Enhanced prompt created with {len(search_results)} search results")
        else:
            logger.warning(f"No search results found for query: {query}")
    else:
        logger.info(f"Query identified as general type, no RAG applied: {query}")
    
    return result

async def augment_conversation_context(conversation_messages: List[Dict[str, Any]], current_message: str) -> Dict[str, Any]:
    """Analyze the current message and augment the conversation context with RAG if needed."""
    # Extract conversation_uid if available
    conversation_uid = None
    is_global_conversation = False
    
    if conversation_messages and len(conversation_messages) > 0:
        if "conversation_uid" in conversation_messages[0]:
            conversation_uid = conversation_messages[0]["conversation_uid"]
            # Check if this is a global conversation
            if conversation_uid == "global":
                is_global_conversation = True
    
    # Process the current message
    rag_result = await process_query_with_rag(current_message, conversation_uid)
    
    # If we're using RAG, prepare the augmented context
    if rag_result["using_rag"]:
        logger.info("Adding RAG context to conversation")
        
        # Check if this is a correction message
        is_correction = rag_result.get("is_correction", False)
        
        # Different format for global vs individual conversations
        if is_global_conversation:
            # For global conversation, make the facts very direct and clear
            # Special handling for corrections
            if is_correction:
                system_message = {
                    "role": "system",
                    "content": f"""FACTUAL INFORMATION FOR CORRECTION:

{rag_result['search_context']}

INSTRUCTIONS FOR CORRECTION:
1. Acknowledge that you were mistaken without using headers like "## CORRECTION" or "CORRECTION:"
2. Provide the correct information naturally as if you're having a conversation
3. Be clear and accurate with the corrected information while staying in character
4. Do not use formatting markers, disclaimers, or prefixes in your response
5. Begin your response directly with the correction in a conversational tone
6. Do not apologize excessively - simply correct the information naturally

For example, start with something like: "You're right. The Nobel Prize in Physics 2023 was actually awarded to..." or "Thank you for the correction. The actual winners were..."
"""
                }
            else:
                system_message = {
                    "role": "system",
                    "content": f"""FACTUAL INFORMATION:

{rag_result['search_context']}

INSTRUCTIONS:
1. Use these facts to answer the user's question: "{current_message}"
2. Present this information as known facts while staying in character
3. Be clear, accurate, and concise with factual information 
4. Do not refer to search results or sources in your response
5. Respond directly to the question without disclaimers or warnings unless the user explicitly asks about harmful content
6. Do not use headings, labels, or prefixes (like "ANSWER:" or "FACT:") in your response

Note: If the user is correcting previously provided information, acknowledge the correction and provide the accurate information."""
                }
        else:
            # For individual conversations, use our standard approach
            # Identify if this is a follow-up question
            follow_up_indicators = ["though", "then", "still", "instead", "rather", "actually", "anyway", "btw", "but"]
            previous_context_references = ["it", "that", "this", "those", "these", "they", "them", "their"]
            
            is_follow_up = any(word in current_message.lower().split() for word in follow_up_indicators + previous_context_references)
            
            # Extract previous question context if it's a follow-up
            previous_context = ""
            if is_follow_up and len(conversation_messages) >= 2:
                # Search for the previous exchange to provide context
                for i in range(len(conversation_messages) - 1, 0, -1):
                    if conversation_messages[i]["message_type"] == "agent" and i > 0 and conversation_messages[i-1]["message_type"] == "user":
                        previous_context = f"""Previous user question: "{conversation_messages[i-1]['content']}"
Previous response: "{conversation_messages[i]['content']}"

"""
                        break
            
            # Special handling for corrections in individual conversations
            if is_correction:
                system_message = {
                    "role": "system",
                    "content": f"""FACTUAL INFORMATION FOR CORRECTION:

{rag_result['search_context']}

CURRENT QUESTION: "{current_message}"

{previous_context if previous_context else ""}INSTRUCTIONS FOR CORRECTION:
1. Acknowledge that you were mistaken without using headers like "## CORRECTION" or "CORRECTION:"
2. Provide the correct information naturally as if you're having a conversation
3. Be clear and accurate with the corrected information while staying in character
4. Do not use formatting markers, disclaimers, or prefixes in your response
5. Begin your response directly with the correction in a conversational tone
6. Do not apologize excessively - simply correct the information naturally"""
                }
            else:
                system_message = {
                    "role": "system",
                    "content": f"""FACTUAL INFORMATION:

{rag_result['search_context']}

CURRENT QUESTION: "{current_message}"

{previous_context if previous_context else ""}INSTRUCTIONS:
1. Use the factual information provided to answer the current question
2. Stay in character while providing accurate information
3. Be direct and helpful in your response
4. Do not refer to search results or sources in your response
5. Do not use headings, labels, or prefixes (like "ANSWER:" or "FACT:") in your response"""
                }
        
        # Return the augmented context with system message
        return {
            "rag_applied": True,
            "system_message": system_message,
            "query_type": rag_result["query_type"],
            "search_results": rag_result["search_results"],
            "search_terms": rag_result.get("search_terms")
        }
    
    # If not using RAG, return basic information
    return {
        "rag_applied": False,
        "system_message": None,
        "query_type": rag_result["query_type"],
        "search_results": [],
        "search_terms": rag_result.get("search_terms")
    } 