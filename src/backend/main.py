#!/usr/bin/env python3
# main.py at the src level

# Import the app from the api module
from api.main import app

# This file is just an entry point to make the Makefile work
# The actual application is defined in api/main.py

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 