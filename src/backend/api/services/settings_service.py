import logging
from typing import Dict, Optional
from api.database import get_database

logger = logging.getLogger(__name__)

# Collection
SETTINGS_COLLECTION = "settings"
PICOVOICE_ACCESS_KEY = "picovoice_access_key"

async def get_picovoice_access_key() -> Optional[str]:
    """Get Picovoice access key."""
    db = get_database()
    setting = await db[SETTINGS_COLLECTION].find_one({"key": PICOVOICE_ACCESS_KEY})
    return setting["value"] if setting else None

async def set_picovoice_access_key(access_key: str) -> Dict[str, str]:
    """Set Picovoice access key."""
    db = get_database()
    
    # Upsert the setting
    result = await db[SETTINGS_COLLECTION].update_one(
        {"key": PICOVOICE_ACCESS_KEY}, 
        {"$set": {"value": access_key}}, 
        upsert=True
    )
    
    if result.modified_count > 0 or result.upserted_id:
        logger.info("Picovoice access key updated")
        return {"key": PICOVOICE_ACCESS_KEY, "value": access_key}
    else:
        logger.warning("Failed to update Picovoice access key")
        raise ValueError("Failed to update Picovoice access key") 