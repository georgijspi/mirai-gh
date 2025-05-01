from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pymongo.errors import ConnectionFailure
import asyncio
import os
from typing import Dict, List, Any, Callable, Set

logger = logging.getLogger(__name__)

MONGO_URI = "mongodb://admin:password@localhost:27017"
DATABASE_NAME = "mirai_db"

# MongoDB client instance
client = None
db = None


# Simple in-memory pubsub implementation
class PubSub:
    def __init__(self):
        self.subscribers: Dict[str, Set[Callable]] = {}
        self.message_buffer: Dict[str, List[str]] = {}
        self.buffer_limit = 20

    async def publish(self, channel: str, message: str):
        """Publish a message to a channel."""
        # Store message in buffer
        if channel not in self.message_buffer:
            self.message_buffer[channel] = []

        self.message_buffer[channel].append(message)
        # Limit buffer size
        if len(self.message_buffer[channel]) > self.buffer_limit:
            self.message_buffer[channel] = self.message_buffer[channel][
                -self.buffer_limit :
            ]

        logger.info(f"Publishing message to channel: {channel}")

        if channel in self.subscribers and self.subscribers[channel]:
            for callback in list(self.subscribers[channel]):
                try:
                    await callback(message)
                except Exception as e:
                    logger.error(f"Error in pubsub callback ({channel}): {e}")
                    # Remove failed callback
                    self.subscribers[channel].remove(callback)
        else:
            logger.info(f"No subscribers for channel: {channel}")

    def subscribe(self, channel: str, callback: Callable):
        """Subscribe to a channel with a callback."""
        if channel not in self.subscribers:
            self.subscribers[channel] = set()

        self.subscribers[channel].add(callback)
        logger.info(
            f"Added subscriber to channel: {channel}, total subscribers: {len(self.subscribers[channel])}"
        )

        # Send recent messages to new subscriber
        if channel in self.message_buffer and self.message_buffer[channel]:
            for message in self.message_buffer[channel]:
                asyncio.create_task(callback(message))

        return True

    def unsubscribe(self, channel: str, callback: Callable):
        """Unsubscribe from a channel."""
        if channel in self.subscribers and callback in self.subscribers[channel]:
            self.subscribers[channel].remove(callback)
            logger.info(
                f"Removed subscriber from channel: {channel}, remaining subscribers: {len(self.subscribers[channel])}"
            )
            return True
        return False


pubsub_client = PubSub()


async def connect_to_mongodb():
    """Connect to MongoDB database."""
    global client, db

    # Check if we're in test mode
    if os.environ.get("DB_SKIP_CONNECTION", "").lower() == "true":
        logger.info("Running in test mode - skipping MongoDB connection")

        # Create a dummy db object for testing purposes
        class DummyDB:
            def __getitem__(self, collection_name):
                return None

        db = DummyDB()
        return

    try:
        client = AsyncIOMotorClient(MONGO_URI)
        # The ping command is used to check if the connection is established
        await client.admin.command("ping")
        db = client[DATABASE_NAME]
        logger.info("Successfully connected to MongoDB")
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongodb_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


def get_database():
    """Return database instance."""
    # Check if we're in test mode - tests should mock this function
    if os.environ.get("DB_SKIP_CONNECTION", "").lower() == "true":
        logger.info("Test mode: get_database returning None, should be mocked in tests")
        return None
    return db
