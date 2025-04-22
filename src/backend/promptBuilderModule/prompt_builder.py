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
    def build_system_prompt(
        personality_prompt: str,
        tts_instructions: Optional[str] = None,
        rag_context: Optional[str] = None,
    ) -> str:
        """
        Build the system prompt using the agent's personality, TTS instructions, and RAG context.

        Args:
            personality_prompt: The personality prompt for the agent
            tts_instructions: Optional TTS-friendly instructions
            rag_context: Optional RAG context with search results or API module results

        Returns:
            The formatted system prompt
        """
        system_prompt = """You are an AI assistant.

## CONVERSATION CONTEXT INSTRUCTIONS
1. If the user's query appears to lack specific context (e.g., "What do you think?", "How about that?"), assume it refers to the most recent conversation points in the history.
2. Do not introduce new topics or generic responses when the query is context-less - continue the existing discussion.
3. If there is no conversation history, or if the query clearly indicates a new topic, then treat it as a fresh conversation.
4. Stay focused on the current discussion thread unless explicitly directed to a new topic.
5. Acknowledge previous points when continuing the conversation."""

        # Check if this is an API module context by looking for "API MODULE RESULT:" in the context
        if rag_context and "API MODULE RESULT:" in rag_context:
            system_prompt += f"""

## API MODULE INFORMATION
{rag_context}"""
        # Regular RAG context
        elif rag_context:
            system_prompt += f"""

## FACTUAL INFORMATION
{rag_context}"""

        system_prompt += f"""

## AGENT IDENTITY
{personality_prompt}

## RESPONSE GUIDELINES
1. Maintain your character voice while following the conversation context instructions
2. Ensure factual accuracy in your responses
3. Keep responses conversational and natural
4. If continuing a previous discussion, reference relevant points from earlier in the conversation
5. If the conversation shifts to a new topic, acknowledge the change explicitly"""

        if tts_instructions:
            system_prompt += f"""

## TTS INSTRUCTIONS
{tts_instructions}"""

        return system_prompt

    @staticmethod
    def format_message_history(messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Format conversation messages for LLM context."""
        formatted_messages = []

        for message in messages:
            role = (
                "user" if message["message_type"] == MessageType.USER else "assistant"
            )
            agent_name = None
            if (
                role == "assistant"
                and "metadata" in message
                and message["metadata"]
                and "agent_name" in message["metadata"]
            ):
                agent_name = message["metadata"]["agent_name"]

            formatted_messages.append(
                {"role": role, "content": message["content"], "agent_name": agent_name}
            )

        return formatted_messages

    @staticmethod
    def build_prompt(
        system_prompt: str, message_history: List[Dict[str, str]], current_message: str
    ) -> str:
        """Construct the complete prompt with system instructions, conversation history, and current query."""
        prompt = f"{system_prompt}\n\n"

        if message_history:
            prompt += "CONVERSATION HISTORY:\n"
            for i, message in enumerate(message_history):
                role = message["role"]
                content = message["content"]

                if (
                    role == "assistant"
                    and "agent_name" in message
                    and message["agent_name"]
                ):
                    prompt += f"[{i+1}] {message['agent_name']}: {content}\n\n"
                else:
                    prompt += f"[{i+1}] {role.capitalize()}: {content}\n\n"

            prompt += "END OF HISTORY\n\n"

        prompt += f"CURRENT QUERY: {current_message}\n\nAssistant:"

        return prompt

    @classmethod
    def create_prompt(
        cls,
        personality_prompt: str,
        messages: List[Dict[str, Any]],
        current_message: str,
        tts_instructions: Optional[str] = None,
        rag_context: Optional[str] = None,
    ) -> str:
        """Create a complete prompt combining personality, conversation history, and current query."""
        system_prompt = cls.build_system_prompt(
            personality_prompt, tts_instructions, rag_context
        )

        # Format the message history
        message_history = cls.format_message_history(messages)

        # Build the complete prompt
        return cls.build_prompt(system_prompt, message_history, current_message)
