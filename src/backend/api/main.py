from fastapi import FastAPI, APIRouter
import uvicorn
import logging
import os
from fastapi.middleware.cors import CORSMiddleware

from api.routers import tts, auth, llm, agent, conversation, statistics, global_conversation, websocket
from ttsModule.ttsModule import tts as tts_model
from api.database import connect_to_mongodb, close_mongodb_connection

# Setup basic logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MirAI API",
    description="API for MirAI Local Assistant functionalities.",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Ensure the TTS model is loaded on app startup and connect to MongoDB."""
    logger.info("Startup: Loading TTS model...")
    
    try:
        from ttsModule.ttsModule import tts
        
        if tts is None:
            logger.error("TTS model failed to load! API TTS endpoints will return errors.")
            logger.error("Check the ttsModule.py code and logs for details.")
        else:
            logger.info("TTS model loaded successfully!")
            
    except Exception as e:
        logger.error(f"Error importing TTS module: {e}")
        logger.error("API TTS endpoints will return errors.")
    
    os.makedirs("ttsModule/output", exist_ok=True)
    os.makedirs("ttsModule/voicelines/cleaned", exist_ok=True)
    os.makedirs("ttsModule/voicelines/messages", exist_ok=True)
    logger.info("Startup: Ensured required directories exist")
    
    try:
        await connect_to_mongodb()
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.warning("API will continue without database functionality")

@app.on_event("shutdown")
async def shutdown_event():
    """Close the MongoDB connection when the app shuts down."""
    await close_mongodb_connection()
    logger.info("MongoDB connection closed")

api_router = APIRouter(prefix="/mirai/api")

api_router.include_router(tts.router)
api_router.include_router(auth.router)
api_router.include_router(llm.router)
api_router.include_router(agent.router)
api_router.include_router(conversation.router)
api_router.include_router(statistics.router)
api_router.include_router(global_conversation.router)
logger.info("Included all routers under /mirai/api")

app.include_router(api_router)

# Mount WebSocket router separately to avoid CORS issues
ws_router = APIRouter(prefix="/mirai/api/ws")
ws_router.include_router(websocket.router)
app.include_router(ws_router)
logger.info("Mounted WebSocket router at /mirai/api/ws")

@app.get("/", tags=["Health Check"])
async def read_root():
    """Provides a basic health check / welcome message."""
    logger.info("Root endpoint '/' accessed.")
    return {"message": "Welcome to the MirAI API"}

if __name__ == "__main__":
    logger.info("Starting MirAI API server with uvicorn...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")