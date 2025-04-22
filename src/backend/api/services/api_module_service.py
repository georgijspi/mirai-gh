import uuid
import logging
import os
import re
import json
import time
import httpx
import asyncio
from string import Formatter
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from ..database import get_database
from ..models import (
    APIModule,
    APIModuleParam,
    APIModuleCreate,
    APIModuleUpdate,
    APIParamType,
    APIMethod,
    APIModuleExecutionResult,
)

logger = logging.getLogger(__name__)

# Collection names
API_MODULE_COLLECTION = "api_modules"


async def create_api_module(api_module_data: APIModuleCreate) -> APIModule:
    """Create a new API module configuration."""
    db = get_database()

    module_uid = str(uuid.uuid4())
    timestamp = datetime.utcnow()

    # Create the complete module document
    module = {
        "module_uid": module_uid,
        "name": api_module_data.name,
        "description": api_module_data.description,
        "base_url": api_module_data.base_url,
        "method": api_module_data.method,
        "headers": api_module_data.headers or {},
        "params": [param.dict() for param in api_module_data.params],
        "body_template": api_module_data.body_template,
        "trigger_phrases": api_module_data.trigger_phrases,
        "result_template": api_module_data.result_template,
        "is_active": True,
        "created_at": timestamp,
        "updated_at": timestamp,
    }

    await db[API_MODULE_COLLECTION].insert_one(module)
    logger.info(f"Created new API module: {api_module_data.name}")

    return APIModule(**module)


async def get_all_api_modules(include_inactive: bool = False) -> List[APIModule]:
    """Get all API module configurations."""
    db = get_database()

    # Filter out inactive modules unless specifically requested
    query = {} if include_inactive else {"is_active": True}

    modules = await db[API_MODULE_COLLECTION].find(query).to_list(length=100)
    return [APIModule(**module) for module in modules]


async def get_api_module(module_uid: str) -> Optional[APIModule]:
    """Get API module configuration by ID."""
    db = get_database()

    module = await db[API_MODULE_COLLECTION].find_one({"module_uid": module_uid})

    if not module:
        return None

    return APIModule(**module)


async def update_api_module(
    module_uid: str, update_data: APIModuleUpdate
) -> Optional[APIModule]:
    """Update an existing API module."""
    db = get_database()

    # Convert to dict and remove None values
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}

    # Handle params specially to convert each param to dict
    if "params" in update_dict and update_dict["params"]:
        update_dict["params"] = [param.dict() for param in update_dict["params"]]

    # Add updated timestamp
    update_dict["updated_at"] = datetime.utcnow()

    result = await db[API_MODULE_COLLECTION].update_one(
        {"module_uid": module_uid}, {"$set": update_dict}
    )

    if result.modified_count == 0:
        logger.warning(f"No API module found with ID: {module_uid}")
        return None

    # Return the updated module
    return await get_api_module(module_uid)


async def delete_api_module(module_uid: str) -> bool:
    """Soft delete (deactivate) an API module."""
    db = get_database()

    result = await db[API_MODULE_COLLECTION].update_one(
        {"module_uid": module_uid},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}},
    )

    if result.modified_count == 0:
        logger.warning(f"No API module found with ID: {module_uid}")
        return False

    logger.info(f"Deactivated API module with ID: {module_uid}")
    return True


def extract_variables_from_trigger(trigger_phrase: str) -> List[str]:
    """Extract variable placeholders from a trigger phrase.

    Example: "What is the weather in {city}" -> ["city"]
    """
    # Use string.Formatter to extract named fields
    formatter = Formatter()
    fields = [
        field_name
        for _, field_name, _, _ in formatter.parse(trigger_phrase)
        if field_name
    ]
    return fields


async def find_matching_api_module(
    query: str,
) -> Tuple[Optional[APIModule], Optional[str], Optional[Dict[str, str]]]:
    """Find an API module that matches the user query.

    Returns a tuple of (matching_module, matched_trigger, extracted_variables)
    """
    modules = await get_all_api_modules()

    # Convert query to lowercase for case-insensitive matching
    query_lower = query.lower()

    logger.debug(f"Looking for API module match for query: '{query}'")
    logger.debug(f"Found {len(modules)} active API modules to check against")

    for module in modules:
        logger.debug(
            f"Checking module: {module.name} with {len(module.trigger_phrases)} trigger phrases"
        )

        for trigger in module.trigger_phrases:
            logger.debug(f"Checking trigger phrase: '{trigger}'")

            # First check if this is a template trigger with placeholders
            placeholders = extract_variables_from_trigger(trigger)

            if placeholders:
                logger.debug(f"Trigger contains placeholders: {placeholders}")
                # This is a template trigger, we need to extract variables
                # Convert trigger to regex pattern

                # First escape special regex characters
                pattern = re.escape(trigger)

                # Now replace the escaped placeholders with capture groups
                for placeholder in placeholders:
                    # The placeholder in the escaped pattern will have backslashes
                    # before the curly braces, so we need to construct it properly
                    escaped_placeholder = "\\{" + placeholder + "\\}"
                    pattern = pattern.replace(
                        escaped_placeholder, f"(?P<{placeholder}>[\\w\\s\\-\\.,]+)"
                    )

                # Make pattern case-insensitive and match whole string
                pattern = f"^{pattern}$"
                logger.debug(f"Converted trigger to regex pattern: '{pattern}'")

                # Try to match
                match = re.match(pattern, query, re.IGNORECASE)
                if match:
                    # Extract variables from match
                    variables = match.groupdict()
                    # Trim whitespace from variables
                    variables = {k: v.strip() for k, v in variables.items()}
                    logger.debug(
                        f"MATCH FOUND! Trigger: '{trigger}', Variables: {variables}"
                    )
                    return module, trigger, variables
                else:
                    logger.debug(f"No match for pattern: '{pattern}'")

            # Simple string trigger (no placeholders)
            elif trigger.lower() in query_lower:
                logger.debug(f"MATCH FOUND! Simple trigger: '{trigger}'")
                return module, trigger, {}
            else:
                logger.debug(f"No match for simple trigger: '{trigger}'")

    logger.debug(f"No matching API module found for query: '{query}'")
    return None, None, {}


async def execute_api_module(
    module: APIModule, extracted_variables: Dict[str, str]
) -> APIModuleExecutionResult:
    """Execute an API module with the given variables."""
    start_time = time.time()

    try:
        # Prepare URL, headers, and params
        url = module.base_url
        headers = module.headers or {}

        # Process parameters
        query_params = {}
        for param in module.params:
            if param.param_type == APIParamType.CONSTANT:
                # Use the constant value
                query_params[param.name] = param.value
            elif param.param_type == APIParamType.VARIABLE:
                # Look for the variable in extracted_variables
                if param.placeholder and param.placeholder in extracted_variables:
                    query_params[param.name] = extracted_variables[param.placeholder]
                else:
                    logger.warning(
                        f"Missing variable for placeholder: {param.placeholder}"
                    )

        # Prepare request body for POST/PUT/PATCH
        body = None
        if (
            module.method in [APIMethod.POST, APIMethod.PUT, APIMethod.PATCH]
            and module.body_template
        ):
            # Replace placeholders in body template
            body_template = module.body_template
            for placeholder, value in extracted_variables.items():
                body_template = body_template.replace(f"{{{placeholder}}}", value)

            # Parse the body template as JSON
            try:
                body = json.loads(body_template)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON in body template: {body_template}")
                raise ValueError("Invalid JSON in body template")

        # Make the API request
        async with httpx.AsyncClient() as client:
            response = None

            if module.method == APIMethod.GET:
                response = await client.get(url, headers=headers, params=query_params)
            elif module.method == APIMethod.POST:
                response = await client.post(
                    url, headers=headers, params=query_params, json=body
                )
            elif module.method == APIMethod.PUT:
                response = await client.put(
                    url, headers=headers, params=query_params, json=body
                )
            elif module.method == APIMethod.DELETE:
                response = await client.delete(
                    url, headers=headers, params=query_params
                )
            elif module.method == APIMethod.PATCH:
                response = await client.patch(
                    url, headers=headers, params=query_params, json=body
                )

            response.raise_for_status()

            # Parse response as JSON
            try:
                raw_response = response.json()
            except json.JSONDecodeError:
                # Return text response if not JSON
                raw_response = {"text": response.text}

        # Format the response if a template is provided
        formatted_response = None
        if module.result_template:
            # Simple string formatting for now, could be enhanced with Jinja2
            try:
                formatted_response = module.result_template.format(**raw_response)
            except (KeyError, ValueError) as e:
                logger.error(f"Error formatting API response: {e}")
                formatted_response = f"API call succeeded but result could not be formatted. Raw data: {raw_response}"

        execution_time = time.time() - start_time

        return APIModuleExecutionResult(
            module_uid=module.module_uid,
            module_name=module.name,
            raw_response=raw_response,
            formatted_response=formatted_response,
            execution_time=execution_time,
            success=True,
            error_message=None,
        )

    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Error executing API module {module.name}: {str(e)}")

        return APIModuleExecutionResult(
            module_uid=module.module_uid,
            module_name=module.name,
            raw_response={},
            formatted_response=None,
            execution_time=execution_time,
            success=False,
            error_message=str(e),
        )


async def process_api_query(query: str) -> Optional[APIModuleExecutionResult]:
    """Process a user query through API modules.

    Returns the API module execution result if a match is found, or None.
    """
    # Find a matching API module
    module, matched_trigger, extracted_variables = await find_matching_api_module(query)

    if not module:
        return None

    # Execute the API module
    result = await execute_api_module(module, extracted_variables)
    result.matched_trigger = matched_trigger

    return result
