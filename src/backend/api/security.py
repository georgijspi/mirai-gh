from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

import logging
import os

logger = logging.getLogger(__name__)

# Dev mode flag - when True, authentication is not required
DEV_MODE = os.environ.get("DEV_MODE", "False").lower() == "true"

SECRET_KEY = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme with auto_error=False to handle dev mode
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="mirari/api/auth/token", auto_error=False)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_uid: Optional[str] = None

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(token: str) -> Dict[str, Any]:
    """Verify a JWT token and return its payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"JWT verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from the JWT token."""
    # If in dev mode, bypass authentication
    if DEV_MODE:
        logger.warning("DEV_MODE is enabled - authentication bypassed!")
        # Return a default admin user in dev mode
        return {"user_uid": "dev-admin", "email": "dev@example.com", "is_admin": True}
    
    # In production mode, check for token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify the token
    payload = await verify_token(token)
    user_uid = payload.get("sub")
    
    if user_uid is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_data = TokenData(user_uid=user_uid)
    return token_data 