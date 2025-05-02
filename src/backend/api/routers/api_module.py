from fastapi import APIRouter, Depends, HTTPException, status, Query
import logging
from typing import Optional, List, Dict, Any
import json

from ..models import (
    APIModuleCreate,
    APIModuleUpdate,
    APIModule,
    APIModuleResponse,
    APIModulesListResponse,
    APIModuleExecutionResult,
    StatusResponse,
)
from ..security import get_current_user
from ..services.api_module_service import (
    create_api_module,
    get_api_module,
    get_all_api_modules,
    update_api_module,
    delete_api_module,
    process_api_query,
    execute_api_module,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api-modules", tags=["API Modules"])


@router.post("", response_model=APIModuleResponse)
async def create_new_api_module(
    api_module_data: APIModuleCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new API module configuration."""
    try:
        module = await create_api_module(api_module_data)
        return {"module": module}
    except Exception as e:
        logger.error(f"Error creating API module: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create API module: {str(e)}",
        )


@router.get("", response_model=APIModulesListResponse)
async def get_api_modules(
    include_inactive: bool = False, current_user: dict = Depends(get_current_user)
):
    """Get all API module configurations."""
    try:
        modules = await get_all_api_modules(include_inactive)
        return {"modules": modules}
    except Exception as e:
        logger.error(f"Error fetching API modules: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch API modules: {str(e)}",
        )


@router.get("/{module_uid}", response_model=APIModuleResponse)
async def get_api_module_by_id(
    module_uid: str, current_user: dict = Depends(get_current_user)
):
    """Get an API module configuration by ID."""
    try:
        module = await get_api_module(module_uid)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"API module with ID {module_uid} not found",
            )
        return {"module": module}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching API module: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch API module: {str(e)}",
        )


@router.put("/{module_uid}", response_model=APIModuleResponse)
async def update_api_module_by_id(
    module_uid: str,
    update_data: APIModuleUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update an API module configuration."""
    try:
        module = await update_api_module(module_uid, update_data)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"API module with ID {module_uid} not found",
            )
        return {"module": module}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating API module: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update API module: {str(e)}",
        )


@router.delete("/{module_uid}", response_model=StatusResponse)
async def delete_api_module_by_id(
    module_uid: str, current_user: dict = Depends(get_current_user)
):
    """Soft delete (deactivate) an API module."""
    try:
        success = await delete_api_module(module_uid)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"API module with ID {module_uid} not found",
            )
        return {
            "status": "success",
            "message": f"API module with ID {module_uid} has been deactivated",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting API module: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete API module: {str(e)}",
        )


@router.post("/test", response_model=APIModuleExecutionResult)
async def test_api_module(
    module_uid: str,
    variables: Optional[Dict[str, str]] = None,
    current_user: dict = Depends(get_current_user),
):
    """Test an API module with provided variables."""
    try:
        module = await get_api_module(module_uid)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"API module with ID {module_uid} not found",
            )

        # Use empty dict if no variables provided
        variables = variables or {}

        # Execute the module
        result = await execute_api_module(module, variables)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing API module: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test API module: {str(e)}",
        )


@router.post("/process-query")
async def process_query(
    query: str = Query(..., description="The user query to process"),
    current_user: dict = Depends(get_current_user),
):
    """Process a user query through available API modules."""
    try:
        result = await process_api_query(query)

        if not result:
            return {
                "found": False,
                "message": "No matching API module found for the query",
            }

        return {
            "found": True,
            "result": result,
            "matched_trigger": result.matched_trigger,
        }
    except Exception as e:
        logger.error(f"Error processing query through API modules: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {str(e)}",
        )
