# MirAI - Local Assistant API

## Project Structure

- `backend/`: Backend API and services
  - `api/`: FastAPI application
  - `ttsModule/`: Text-to-Speech implementation
  - `docker/`: Docker configuration
  - `main.py`: Application entry point
  - `requirements.txt`: Python dependencies
  - `Makefile`: Build and run commands

## Quick Start Guide

- Make sure you have docker and docker compose installed
 
```bash
# Start MongoDB
cd src/backend
make db-up

# Install dependancies
make install

# Start Ollama
make ollama-up

# Run in development mode (no authentication required)
make dev-mode

# OR run with authentication required
make start
```

## System Overview

MirAI is a local assistant API with multiple capabilities:

- **Text-to-Speech (TTS)**: Generate human-like speech from text using voice cloning
- **User Authentication**: Secure API with JWT tokens and user management
- **MongoDB Integration**: User data storage and persistence

## API Endpoints

All API endpoints are prefixed with `/mirai/api/`.

### TTS Endpoints

- `POST /mirai/api/tts/generate`: Generate speech from text
  - Request: `{"text": "Your text here", "speaker": "morgan"}`
  - Response: `{"message": "Speech generation started in background", "output_filename": "output_xxx.wav"}`

- `POST /mirai/api/tts/download`: Download generated speech file
  - Request: `{"filename": "output_xxx.wav"}`
  - Response: Binary audio file (WAV)

### Authentication Endpoints

- `POST /mirai/api/auth/register`: Register a new user
  - Request: `{"email": "user@example.com", "password": "password123", "is_admin": false}`
  - Response: `{"user_uid": "uuid", "email": "user@example.com", "is_admin": false}`

- `POST /mirai/api/auth/token`: Get authentication token
  - Request: Form data with `username` and `password`
  - Response: `{"access_token": "token", "token_type": "bearer"}`

- `GET /mirai/api/auth/me`: Get current user info
  - Headers: `Authorization: Bearer <token>`
  - Response: `{"user_uid": "uuid", "email": "user@example.com", "is_admin": false}`

## Development Mode

The system can run in development mode, which bypasses authentication requirements.
To enable dev mode, set the `DEV_MODE` environment variable to `true`:

```bash
DEV_MODE=true make start
# or simply
make dev-mode
```

## MongoDB Configuration

MongoDB runs in Docker and stores user authentication data.
The default configuration uses:
- Username: admin
- Password: password
- Port: 27017

## Usage Examples

### Generating Speech (with curl)

```bash
# In development mode (no auth needed)
curl -X POST "http://localhost:8005/mirai/api/tts/generate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "speaker": "morgan"}'

# With authentication
curl -X POST "http://localhost:8005/mirai/api/tts/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"text": "Hello world", "speaker": "morgan"}'
```

### User Registration

```bash
curl -X POST "http://localhost:8005/mirai/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "is_admin": false}'
```

### Getting an Authentication Token

```bash
curl -X POST "http://localhost:8005/mirai/api/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123"
```
