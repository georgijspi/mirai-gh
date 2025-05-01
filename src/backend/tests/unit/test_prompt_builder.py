import pytest
import sys
from unittest.mock import MagicMock

# Import the module
from promptBuilderModule.prompt_builder import PromptBuilder
from api.models import MessageType


def test_build_system_prompt_basic():
    """Test building a basic system prompt without RAG or TTS instructions."""
    personality_prompt = "You are a friendly assistant named Morgan."
    
    # Basic system prompt
    system_prompt = PromptBuilder.build_system_prompt(personality_prompt)
    
    # Verify result
    assert "You are an AI assistant" in system_prompt
    assert "AGENT IDENTITY" in system_prompt
    assert personality_prompt in system_prompt
    assert "RESPONSE GUIDELINES" in system_prompt
    
    # Verify RAG and TTS sections are not included
    assert "FACTUAL INFORMATION" not in system_prompt
    assert "API MODULE INFORMATION" not in system_prompt
    assert "TTS INSTRUCTIONS" not in system_prompt


def test_build_system_prompt_with_rag():
    """Test building a system prompt with RAG context."""
    personality_prompt = "You are a helpful assistant named Morgan."
    rag_context = "The population of Ireland is approximately 5 million people."
    
    # Build a system prompt with RAG context
    system_prompt = PromptBuilder.build_system_prompt(
        personality_prompt=personality_prompt,
        rag_context=rag_context
    )
    
    # Verify result
    assert "You are an AI assistant" in system_prompt
    assert "AGENT IDENTITY" in system_prompt
    assert personality_prompt in system_prompt
    assert "RESPONSE GUIDELINES" in system_prompt
    
    # Verify RAG section
    assert "FACTUAL INFORMATION" in system_prompt
    assert rag_context in system_prompt
    
    # Verify TTS section not included
    assert "TTS INSTRUCTIONS" not in system_prompt


def test_build_system_prompt_with_api_module():
    """Test building a system prompt with API module context."""
    personality_prompt = "You are a helpful assistant named Morgan."
    api_module_context = "API MODULE RESULT: The current weather in Dublin is 15°C and partly cloudy."
    
    # System prompt with API module context
    system_prompt = PromptBuilder.build_system_prompt(
        personality_prompt=personality_prompt,
        rag_context=api_module_context
    )
    
    # Verify the result
    assert "You are an AI assistant" in system_prompt
    assert "AGENT IDENTITY" in system_prompt
    assert personality_prompt in system_prompt
    assert "RESPONSE GUIDELINES" in system_prompt
    
    # Verify API MODULE section included
    assert "API MODULE INFORMATION" in system_prompt
    assert api_module_context in system_prompt
    
    # Verify standard RAG section not included
    assert "FACTUAL INFORMATION" not in system_prompt
    
    # Verify TTS section not included
    assert "TTS INSTRUCTIONS" not in system_prompt


def test_build_system_prompt_with_tts():
    """Test building a system prompt with TTS instructions."""
    personality_prompt = "You are a helpful assistant named Morgan."
    tts_instructions = "Speak clearly and use contractions for a natural voice."
    
    # Build system prompt with TTS instructions
    system_prompt = PromptBuilder.build_system_prompt(
        personality_prompt=personality_prompt,
        tts_instructions=tts_instructions
    )
    
    # Verify the result
    assert "You are an AI assistant" in system_prompt
    assert "AGENT IDENTITY" in system_prompt
    assert personality_prompt in system_prompt
    assert "RESPONSE GUIDELINES" in system_prompt
    
    # Verify TTS section included
    assert "TTS INSTRUCTIONS" in system_prompt
    assert tts_instructions in system_prompt
    
    # Verify RAG section not included
    assert "FACTUAL INFORMATION" not in system_prompt
    assert "API MODULE INFORMATION" not in system_prompt


def test_build_system_prompt_with_all_options():
    """Test building a system prompt with all options (RAG, TTS, etc.)."""
    personality_prompt = "You are a helpful assistant named Morgan."
    tts_instructions = "Speak clearly and use contractions for a natural voice."
    rag_context = "The population of Ireland is approximately 5 million people."
    
    # Build system prompt with all options
    system_prompt = PromptBuilder.build_system_prompt(
        personality_prompt=personality_prompt,
        tts_instructions=tts_instructions,
        rag_context=rag_context
    )
    
    # Verify result
    assert "You are an AI assistant" in system_prompt
    assert "AGENT IDENTITY" in system_prompt
    assert personality_prompt in system_prompt
    assert "RESPONSE GUIDELINES" in system_prompt
    
    # Verify RAG section included
    assert "FACTUAL INFORMATION" in system_prompt
    assert rag_context in system_prompt
    
    # Verify TTS section included
    assert "TTS INSTRUCTIONS" in system_prompt
    assert tts_instructions in system_prompt


def test_format_message_history():
    """Test formatting message history."""
    # Sample messages
    messages = [
        {
            "message_uid": "1",
            "content": "Hello, how are you?",
            "message_type": MessageType.USER,
            "metadata": None
        },
        {
            "message_uid": "2",
            "content": "I'm doing well, thank you for asking!",
            "message_type": MessageType.ASSISTANT,
            "metadata": {"agent_name": "Morgan"}
        }
    ]
    
    # Format message history
    formatted = PromptBuilder.format_message_history(messages)
    
    # Verify result
    assert len(formatted) == 2
    assert formatted[0]["role"] == "user"
    assert formatted[0]["content"] == "Hello, how are you?"
    assert formatted[0]["agent_name"] is None
    
    assert formatted[1]["role"] == "assistant"
    assert formatted[1]["content"] == "I'm doing well, thank you for asking!"
    assert formatted[1]["agent_name"] == "Morgan"


def test_build_prompt():
    """Test building a complete prompt."""
    system_prompt = "You are an AI assistant. Be helpful and concise."
    
    # Sample message history
    message_history = [
        {"role": "user", "content": "Hello, who are you?", "agent_name": None},
        {"role": "assistant", "content": "I'm an AI assistant here to help you.", "agent_name": "Morgan"}
    ]
    
    current_message = "What can you help me with?"
    
    # Build the complete prompt
    prompt = PromptBuilder.build_prompt(system_prompt, message_history, current_message)
    
    assert system_prompt in prompt
    assert "CONVERSATION HISTORY:" in prompt
    assert "Hello, who are you?" in prompt
    assert "I'm an AI assistant here to help you." in prompt
    assert "Morgan:" in prompt
    assert "CURRENT QUERY: What can you help me with?" in prompt
    assert prompt.endswith("Assistant:")


def test_create_prompt():
    """Test the full prompt creation process."""
    personality_prompt = "You are a helpful assistant named Morgan."
    
    # Sample messages
    messages = [
        {
            "message_uid": "1",
            "content": "Hello, how are you?",
            "message_type": MessageType.USER,
            "metadata": None
        },
        {
            "message_uid": "2",
            "content": "I'm doing well, thank you for asking!",
            "message_type": MessageType.ASSISTANT,
            "metadata": {"agent_name": "Morgan"}
        }
    ]
    
    current_message = "What can you help me with?"
    
    # Optional components
    tts_instructions = "Speak clearly and naturally."
    rag_context = "Morgan is an AI assistant designed to help with various tasks."
    
    # Create full prompt
    prompt = PromptBuilder.create_prompt(
        personality_prompt=personality_prompt,
        messages=messages,
        current_message=current_message,
        tts_instructions=tts_instructions,
        rag_context=rag_context
    )
    
    # Verify result
    assert "You are an AI assistant" in prompt
    assert "AGENT IDENTITY" in prompt
    assert personality_prompt in prompt
    assert "FACTUAL INFORMATION" in prompt
    assert rag_context in prompt
    assert "TTS INSTRUCTIONS" in prompt
    assert tts_instructions in prompt
    assert "CONVERSATION HISTORY:" in prompt
    assert "Hello, how are you?" in prompt
    assert "I'm doing well, thank you for asking!" in prompt
    assert "Morgan:" in prompt
    assert "CURRENT QUERY: What can you help me with?" in prompt
    assert prompt.endswith("Assistant:") 