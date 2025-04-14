import logging
from typing import List, Dict, Any, Optional

from api.models import MessageType

logger = logging.getLogger(__name__)

class PromptBuilder:
    """
    Prompt Builder for LLM interactions.
    Constructs prompts based on conversation context and agent personality.
    """
    
    @staticmethod
    def build_system_prompt(personality_prompt: str, tts_instructions: Optional[str] = None) -> str:
        """
        Build the system prompt using the agent's personality and TTS instructions.
        
        Args:
            personality_prompt: The personality prompt for the agent
            tts_instructions: Optional TTS-friendly instructions
            
        Returns:
            The formatted system prompt
        """
        system_prompt = f"""You are an AI assistant with the following personality:

{personality_prompt}

Please respond to the user's message in a way that is consistent with this personality.
Keep your responses conversational and natural.
"""
        
        # Add TTS instructions if provided
        if tts_instructions:
            system_prompt += f"""

{tts_instructions}
"""
        
        return system_prompt
    
    @staticmethod
    def format_message_history(messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Format message history for the LLM context.
        
        Args:
            messages: List of message objects from the database
            
        Returns:
            List of formatted messages for LLM context
        """
        formatted_messages = []
        
        for message in messages:
            role = "user" if message["message_type"] == MessageType.USER else "assistant"
            
            # Check if agent name exists in metadata for agent messages
            agent_name = None
            if role == "assistant" and "metadata" in message and message["metadata"] and "agent_name" in message["metadata"]:
                agent_name = message["metadata"]["agent_name"]
            
            formatted_messages.append({
                "role": role,
                "content": message["content"],
                "agent_name": agent_name
            })
        
        return formatted_messages
    
    @staticmethod
    def build_prompt(
        system_prompt: str, 
        message_history: List[Dict[str, str]], 
        current_message: str
    ) -> str:
        """
        Build the complete prompt for Ollama API.
        
        Args:
            system_prompt: The system prompt
            message_history: The formatted message history
            current_message: The current user message
            
        Returns:
            The complete prompt
        """
        prompt = f"{system_prompt}\n\n"
        
        # Add message history
        for message in message_history:
            role = message["role"]
            content = message["content"]
            
            # If it's an assistant message and has an agent name, include it
            if role == "assistant" and "agent_name" in message and message["agent_name"]:
                prompt += f"{message['agent_name']}: {content}\n\n"
            else:
                prompt += f"{role.capitalize()}: {content}\n\n"
        
        # Add current message
        prompt += f"User: {current_message}\n\nAssistant:"
        
        return prompt
    
    @classmethod
    def create_prompt(
        cls, 
        personality_prompt: str, 
        messages: List[Dict[str, Any]], 
        current_message: str,
        tts_instructions: Optional[str] = None
    ) -> str:
        """
        Create a prompt for the LLM, using the agent's personality and the conversation history.
        
        Args:
            personality_prompt: The personality prompt for the agent
            messages: The message history for the conversation
            current_message: The current user message
            tts_instructions: Optional TTS-friendly instructions
            
        Returns:
            The complete prompt for the LLM
        """
        system_prompt = cls.build_system_prompt(personality_prompt, tts_instructions)
        message_history = cls.format_message_history(messages)
        prompt = cls.build_prompt(system_prompt, message_history, current_message)
        
        logger.debug(f"Generated prompt: {prompt}")
        return prompt 