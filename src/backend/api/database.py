from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pymongo.errors import ConnectionFailure

logger = logging.getLogger(__name__)

MONGO_URI = "mongodb://admin:password@localhost:27017"
DATABASE_NAME = "mirai_db"

# MongoDB client instance
client = None
db = None

async def connect_to_mongodb():
    """Connect to MongoDB database."""
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        # The ping command is used to check if the connection is established
        await client.admin.command('ping')
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
    return db 