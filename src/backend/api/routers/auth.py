from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

import logging
from pymongo.errors import DuplicateKeyError

from ..models import UserCreate, UserResponse, TokenResponse, StatusResponse
from ..security import (
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ..services.user_service import create_user, authenticate_user, get_user_by_uid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register_user(user_data: UserCreate):
    """Register a new user."""
    try:
        user = await create_user(
            email=user_data.email,
            password=user_data.password,
            is_admin=user_data.is_admin,
        )
        logger.info(f"New user registered: {user_data.email}")
        return user
    except DuplicateKeyError:
        logger.warning(f"Attempted to register duplicate email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        logger.warning(f"Failed login attempt for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["user_uid"]}, expires_delta=access_token_expires
    )

    logger.info(f"User logged in: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    # In dev mode, current_user will already contain all needed fields
    if "email" in current_user:
        logger.info("Retrieved user info in dev mode")
        return current_user

    # In normal mode, we need to get user details from the database
    user = await get_user_by_uid(current_user.user_uid)
    if not user:
        logger.error(f"User not found with UID: {current_user.user_uid}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    logger.info(f"Retrieved user info for: {user['email']}")
    return {
        "user_uid": user["user_uid"],
        "email": user["email"],
        "is_admin": user["is_admin"],
    }
