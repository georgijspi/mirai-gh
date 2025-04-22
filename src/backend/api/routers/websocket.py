from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
import logging
import json
import asyncio
from typing import Dict, Set, Any, List, Optional
from ..security import get_current_user, DEV_MODE
from ..database import pubsub_client

logger = logging.getLogger(__name__)

# Remove the prefix as it's already added when the router is mounted
router = APIRouter(tags=["WebSocket"])

# Store active connections
active_connections: Dict[str, Set[WebSocket]] = {"global": set()}

# Store conversation-specific connections
conversation_connections: Dict[str, Set[WebSocket]] = {}


async def broadcast_to_conversation(conversation_id: str, message: str):
    """Broadcast message to all connections for a specific conversation."""
    if conversation_id in conversation_connections:
        logger.info(
            f"Broadcasting message to {len(conversation_connections[conversation_id])} clients for conversation: {conversation_id}"
        )
        disconnected = set()
        for connection in conversation_connections[conversation_id]:
            try:
                await connection.send_text(message)
                logger.debug(
                    f"Message sent to client for conversation: {conversation_id}"
                )
            except Exception as e:
                logger.error(f"Error sending message to connection: {e}")
                disconnected.add(connection)

        for conn in disconnected:
            conversation_connections[conversation_id].remove(conn)
            logger.info(
                f"Removed disconnected client from conversation {conversation_id}"
            )
    else:
        logger.warning(f"No connections for conversation: {conversation_id}")


async def broadcast_to_global(message: str):
    """Broadcast message to all global connections."""
    if "global" not in active_connections or not active_connections["global"]:
        logger.warning("No global connections to broadcast to")
        return

    logger.info(
        f"Broadcasting message to {len(active_connections['global'])} global clients"
    )
    disconnected = set()
    for connection in active_connections["global"]:
        try:
            await connection.send_text(message)
            logger.debug("Message sent to global client")
        except Exception as e:
            logger.error(f"Error sending message to global connection: {e}")
            disconnected.add(connection)

    for conn in disconnected:
        active_connections["global"].remove(conn)
        logger.info("Removed disconnected global client")


# Subscribe to the pubsub channels
async def handle_global_message(message: str):
    """Handle a message from the global conversation pubsub channel."""
    await broadcast_to_global(message)


async def handle_conversation_message(conversation_id: str, message: str):
    """Handle a message from a conversation pubsub channel."""
    await broadcast_to_conversation(conversation_id, message)


@router.websocket("/global")
async def global_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for global conversation updates."""
    logger.info(f"WebSocket connection attempt to /ws/global from {websocket.client}")

    try:
        await websocket.accept()
        logger.info(
            f"WebSocket connection accepted for /ws/global from {websocket.client}"
        )

        # Add connection to global connections
        if "global" not in active_connections:
            active_connections["global"] = set()
        active_connections["global"].add(websocket)

        # Subscribe to global conversation messages
        pubsub_client.subscribe("global_conversation:messages", handle_global_message)
        logger.info(f"Subscribed to global conversation messages channel")

        try:
            while True:
                # Just keep the connection alive
                data = await websocket.receive_text()
                logger.debug(f"Received data from global WebSocket: {data[:100]}")
        except WebSocketDisconnect:
            # Remove connection on disconnect
            active_connections["global"].remove(websocket)
            logger.info(f"WebSocket disconnected from /ws/global: {websocket.client}")
    except Exception as e:
        logger.error(f"Error in global WebSocket endpoint: {str(e)}")
        raise


@router.websocket("/conversation/{conversation_id}")
async def conversation_websocket_endpoint(websocket: WebSocket, conversation_id: str):
    """WebSocket endpoint for conversation-specific updates."""
    logger.info(
        f"WebSocket connection attempt to /ws/conversation/{conversation_id} from {websocket.client}"
    )

    try:
        await websocket.accept()
        logger.info(
            f"WebSocket connection accepted for /ws/conversation/{conversation_id} from {websocket.client}"
        )

        # Add connection to conversation connections
        if conversation_id not in conversation_connections:
            conversation_connections[conversation_id] = set()
        conversation_connections[conversation_id].add(websocket)

        # Subscribe to conversation-specific messages
        channel = f"conversation:{conversation_id}:messages"

        async def handle_message(msg: str):
            await broadcast_to_conversation(conversation_id, msg)

        pubsub_client.subscribe(channel, handle_message)
        logger.info(f"Subscribed to conversation channel: {channel}")

        try:
            while True:
                # Just keep the connection alive
                data = await websocket.receive_text()
                logger.debug(f"Received data from conversation WebSocket: {data[:100]}")
        except WebSocketDisconnect:
            # Remove connection on disconnect
            if conversation_id in conversation_connections:
                conversation_connections[conversation_id].remove(websocket)
                logger.info(
                    f"WebSocket disconnected from /ws/conversation/{conversation_id}: {websocket.client}"
                )
                if len(conversation_connections[conversation_id]) == 0:
                    pubsub_client.unsubscribe(channel, handle_message)
                    del conversation_connections[conversation_id]
                    logger.info(f"Removed empty conversation channel: {channel}")
    except Exception as e:
        logger.error(f"Error in conversation WebSocket endpoint: {str(e)}")
        raise
