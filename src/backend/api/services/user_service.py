import uuid
import logging
from typing import Optional, Dict, Any

from pymongo.errors import DuplicateKeyError
from api.database import get_database
from api.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)

# Collection
USERS_COLLECTION = "users"


# Service functions
async def create_user(
    email: str, password: str, is_admin: bool = False
) -> Dict[str, Any]:
    """Create a new user in the database."""
    db = get_database()

    # Check if user already exists
    existing_user = await db[USERS_COLLECTION].find_one({"email": email})
    if existing_user:
        logger.warning(f"Attempted to create duplicate user: {email}")
        raise DuplicateKeyError(f"User with email {email} already exists")

    # Create new user
    user_uid = str(uuid.uuid4())
    hashed_password = get_password_hash(password)

    user_data = {
        "user_uid": user_uid,
        "email": email,
        "hashed_password": hashed_password,
        "is_admin": is_admin,
    }

    await db[USERS_COLLECTION].insert_one(user_data)
    logger.info(f"Created new user: {email}")

    # Return user data without the password hash
    del user_data["hashed_password"]
    return user_data


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get a user by email."""
    db = get_database()
    user = await db[USERS_COLLECTION].find_one({"email": email})
    return user


async def get_user_by_uid(user_uid: str) -> Optional[Dict[str, Any]]:
    """Get a user by ID."""
    db = get_database()
    user = await db[USERS_COLLECTION].find_one({"user_uid": user_uid})
    return user


async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user with email and password."""
    user = await get_user_by_email(email)

    if not user:
        logger.warning(f"Login attempt with non-existent email: {email}")
        return None

    if not verify_password(password, user["hashed_password"]):
        logger.warning(f"Failed login attempt for user: {email}")
        return None

    # Return user data without the password hash
    user_data = {k: v for k, v in user.items() if k != "hashed_password"}
    return user_data
