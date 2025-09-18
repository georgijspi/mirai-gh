# MirAI: Local Assistant

<div align="center">
  <video controls width="100%">
    <source src="docs/video-walk-through/2025-05-02%2016-49-53.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
  <p><strong>🎥 MirAI Complete System Demonstration</strong></p>
</div>

**MirAI** (未来) is an open-source, privacy-focused local smart assistant that prioritizes user data security by running entirely on local hardware. Unlike cloud-based assistants, MirAI ensures your conversations and data never leave your device, giving you complete control over your privacy.

## 🎯 Project Overview

MirAI is designed as a self-hosted alternative to commercial smart assistants like Google Assistant, Amazon Alexa, and Apple HomePod. The project addresses key concerns about data privacy while providing extensible functionality through a community-driven API module system.

### Key Features

- **🔒 Privacy-First**: All processing happens locally - no data sent to external servers
- **🎤 Voice Interaction**: Speech-to-text and text-to-speech with customizable voices
- **🧠 Local LLM Integration**: Runs large language models locally using Ollama
- **🔌 Modular API System**: Community-driven API modules for extending functionality
- **⚡ Low Latency**: Optimized for real-time voice interactions
- **🏠 Smart Home Ready**: Integration with IoT devices and home automation
- **🎨 Customizable**: Personalize voice, personality, and functionality

## 🏗️ Architecture

MirAI consists of two main components:

### Backend (Python/FastAPI)
- **FastAPI** web framework for RESTful APIs
- **MongoDB** for user data and conversation storage
- **Ollama** for local LLM inference
- **Coqui TTS** for text-to-speech synthesis
- **Picovoice** for wake word detection
- **WebSocket** support for real-time communication

### Frontend (React.js)
- **React 19** with Material-UI components
- **Tailwind CSS** for styling
- **Picovoice Web SDK** for browser-based voice processing
- **WebSocket** client for real-time backend communication
- **Responsive design** for various device types

## 🛠️ Technology Stack

### Backend Technologies
- **Python 3.8+** - Core programming language
- **FastAPI** - Modern, fast web framework for building APIs
- **Uvicorn** - ASGI server for FastAPI
- **MongoDB** - NoSQL database for data persistence
- **Motor** - Async MongoDB driver
- **JWT** - JSON Web Tokens for authentication
- **Coqui TTS** - Text-to-speech synthesis
- **Ollama** - Local LLM inference engine
- **SpaCy** - Natural language processing
- **Docker** - Containerization for easy deployment

### Frontend Technologies
- **React 19** - Frontend framework
- **Material-UI** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing
- **Picovoice Web SDK** - Voice processing in browser
- **WaveSurfer.js** - Audio visualization

### AI/ML Components
- **Local LLMs** - Various models supported via Ollama
- **Speech Recognition** - Browser-based STT
- **Text-to-Speech** - Voice cloning and synthesis
- **Wake Word Detection** - "Hey MirAI" activation
- **Natural Language Processing** - Intent recognition and processing

## 📚 Documentation

### 📋 Project Documentation
- **[Project Proposal](docs/proposal/proposal.md)** - Initial project concept and goals
- **[Functional Specification](docs/functional-spec/functional_specification.pdf)** - Detailed system requirements and specifications
- **[Technical Guide](docs/documentation/MirAI_Technical_Guide.pdf)** - Technical implementation details and architecture
- **[User Manual](docs/documentation/MirAI_UserManual.pdf)** - End-user guide and instructions

### 🎥 Demo & Walkthrough
- **[Video Walkthrough](https://youtu.be/xsxF80DVYkc)** - Complete system demonstration (5 minutes)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- Python 3.8+
- GPU with CUDA support (recommended for LLM inference)

### Backend Setup
```bash
cd src/backend

# Start MongoDB
make db-up

# Install dependencies
make install

# Start Ollama for LLM inference
make ollama-up

# Run in development mode (no authentication)
make dev-mode

# OR run with authentication
make start
```

### Frontend Setup
```bash
cd src/frontend/mirai-ui

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at:
- **Backend API**: http://localhost:8005
- **Frontend UI**: http://localhost:3000

## 🔧 Development

### Project Structure
```
src/
├── backend/                 # FastAPI backend
│   ├── api/                # API routes and services
│   ├── ttsModule/          # Text-to-speech implementation
│   ├── docker/             # Docker configuration
│   └── tests/              # Backend tests
└── frontend/
    └── mirai-ui/           # React frontend
        ├── src/
        │   ├── components/ # React components
        │   ├── pages/      # Application pages
        │   ├── services/   # API service layer
        │   └── utils/      # Utility functions
        └── public/         # Static assets
```

### Key Features Implementation

#### Voice Processing
- **Wake Word Detection**: Uses Picovoice for "Hey MirAI" activation
- **Speech-to-Text**: Browser-based Web Speech API
- **Text-to-Speech**: Coqui TTS with voice cloning capabilities

#### LLM Integration
- **Local Inference**: Ollama for running various LLM models locally
- **Model Flexibility**: Support for different model sizes based on hardware
- **Prompt Engineering**: Customizable prompt templates for different use cases

#### API Module System
- **Extensible Architecture**: Community-driven API modules
- **Plugin System**: Easy integration of new functionality
- **Marketplace**: Repository of community-contributed modules

## 🧪 Testing

### Backend Tests
```bash
cd src/backend
make test
```

### Frontend Tests
```bash
cd src/frontend/mirai-ui
npm test
npm run test:coverage
```

## 📊 System Requirements

### Minimum Requirements
- **CPU**: 4-core processor
- **RAM**: 8GB
- **Storage**: 20GB free space
- **GPU**: Integrated graphics (CPU-only inference)

### Recommended Requirements
- **CPU**: 8+ core processor
- **RAM**: 16GB+
- **Storage**: 50GB+ SSD
- **GPU**: NVIDIA GPU with 8GB+ VRAM (for optimal LLM performance)

## 🤝 Contributing

MirAI is an open-source project that welcomes contributions! Areas where you can help:

- **API Modules**: Create new functionality modules
- **Voice Models**: Contribute new TTS voices
- **Documentation**: Improve guides and tutorials
- **Bug Reports**: Help identify and fix issues
- **Feature Requests**: Suggest new capabilities

## 📄 License

This project is developed as part of a university coursework project. Please refer to the project documentation for licensing details.

## 👥 Team

- **Chee Hin Choa** (21100497) - Voice functionality, Frontend development, Community gallery
- **Georgijs Pitkevics** (19355266) - Backend API design, LLM/NLP integration, Testing
- **Supervisor**: Gareth Jones

## 🔗 Related Links

- **[Project Repository](https://github.com/your-username/2025-csc1097-mer-ai)**
- **[Issue Tracker](https://github.com/your-username/2025-csc1097-mer-ai/issues)**
- **[Documentation Wiki](https://github.com/your-username/2025-csc1097-mer-ai/wiki)**

---

*MirAI - Your privacy-focused local assistant for the future* 🌟