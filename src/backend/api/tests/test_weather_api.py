import asyncio
import json
import os
import sys

# Add the parent directory to the Python path
sys.path.insert(
    0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
)

from api.services.api_module_service import create_api_module, process_api_query
from api.models import APIModuleCreate, APIMethod, APIParamType, APIModuleParam
from api.database import connect_to_mongodb, close_mongodb_connection


async def setup_weather_api_module():
    """Create and test a weather API module for Tomorrow.io"""

    # Connect to the database
    await connect_to_mongodb()

    # Define the API module
    weather_api = APIModuleCreate(
        name="Weather API",
        description="Get weather information from Tomorrow.io",
        base_url="https://api.tomorrow.io/v4/weather/forecast",
        method=APIMethod.GET,
        headers={},
        params=[
            APIModuleParam(
                name="location",
                param_type=APIParamType.VARIABLE,
                description="Location coordinates (latitude,longitude)",
                placeholder="location",
            ),
            APIModuleParam(
                name="apikey",
                param_type=APIParamType.CONSTANT,
                value="2qTA4nIqnB4ZxZ0hEaR2IARCU4cJsyWM",
                description="API key for the Tomorrow.io service",
            ),
        ],
        trigger_phrases=[
            "What's the weather in {location}?",
            "Get weather for {location}",
            "Weather forecast for {location}",
        ],
        result_template="""
Weather forecast for the requested location:
Current temperature: {values.temperature}°C
Feels like: {values.temperatureApparent}°C
Weather: {values.weatherCode}
Humidity: {values.humidity}%
Wind speed: {values.windSpeed} km/h
        """,
    )

    # Create the API module
    module = await create_api_module(weather_api)
    print(f"Created Weather API Module with ID: {module.module_uid}")

    # Test the API module with a sample query
    test_queries = [
        "What's the weather in 42.3478,-71.0466?",
        "Get weather for 40.7128,-74.0060",
        "Weather forecast for 51.5074,-0.1278",
    ]

    for query in test_queries:
        print(f"\nTesting query: {query}")
        result = await process_api_query(query)

        if result:
            print(f"API Module matched: {result.module_name}")
            print(f"Matched trigger: {result.matched_trigger}")
            print("API Response:")
            if result.formatted_response:
                print(result.formatted_response)
            else:
                print(
                    "Raw response:",
                    json.dumps(result.raw_response, indent=2)[:500] + "...",
                )
        else:
            print("No matching API module found for the query")

    # Close the database connection
    await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(setup_weather_api_module())
