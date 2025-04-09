.PHONY: install start clean help db-up db-down dev-mode ollama-up ollama-down

# Default target
.DEFAULT_GOAL := help

help:
	@echo "Makefile for MirAI FastAPI Application"
	@echo ""
	@echo "Usage:"
	@echo "  make install      Install dependencies into a virtual environment (.venv)"
	@echo "  make start        Start the FastAPI server"
	@echo "  make db-up        Start MongoDB using Docker"
	@echo "  make db-down      Stop MongoDB Docker container"
	@echo "  make ollama-up    Start Ollama LLM container with CUDA support"
	@echo "  make ollama-down  Stop Ollama LLM container"
	@echo "  make dev-mode     Start server in development mode (no auth required)"
	@echo "  make clean        Clean up temporary files and virtual environment"
	@echo ""

install:
	@echo ">>> Creating virtual environment and installing dependencies..."
	@python3 -m venv .venv
	@.venv/bin/pip install --upgrade pip
	@.venv/bin/pip install -r requirements.txt
	@echo ">>> Dependencies installed successfully."

start:
	@echo ">>> Starting FastAPI server on port 8005..."
	@.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload

db-up:
	@echo ">>> Starting MongoDB using Docker..."
	@cd docker && docker compose up -d mongodb
	@echo ">>> MongoDB started on port 27017"

db-down:
	@echo ">>> Stopping MongoDB Docker container..."
	@cd docker && docker compose stop mongodb
	@echo ">>> MongoDB stopped"

ollama-up:
	@echo ">>> Starting Ollama LLM with CUDA support..."
	@cd docker && docker compose up -d ollama
	@echo ">>> Ollama started on port 11434"

ollama-down:
	@echo ">>> Stopping Ollama Docker container..."
	@cd docker && docker compose stop ollama
	@echo ">>> Ollama stopped"

dev-mode:
	@echo ">>> Starting FastAPI server in development mode (no auth required)..."
	@DEV_MODE=true .venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload

clean:
	@echo ">>> Cleaning project..."
	@rm -rf .venv
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
	@echo ">>> Clean finished."