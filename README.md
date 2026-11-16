# RepoSense

AI-powered codebase understanding platform. Enter a public GitHub repository URL to analyze its structure, explore files, and get intelligent explanations.

## Features

- **Repository Analysis**: Clone and analyze any public GitHub repository
- **Interactive File Explorer**: Browse repository structure with syntax-aware tree view
- **Code Viewer**: View files with syntax highlighting (Prism.js)
- **AI File Explanations**: Get detailed explanations of files with functions, classes, and imports
- **Code Assistant**: Ask questions about the codebase with contextual references
- **Dark Developer Theme**: Premium dark UI with blue/cyan accents

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Python 3.11+ + FastAPI
- **AI**: Google Gemini 1.5 Flash (optional, with fallback)
- **Repository Access**: GitPython
- **Code Analysis**: AST parsing + regex for multiple languages

## Prerequisites

- Python 3.11+
- Node.js 18+
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/agrwl-utkarsh/mini.git
cd mini
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env and add your Gemini API key (optional)
# GEMINI_API_KEY=your_key_here

# Start backend server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### 4. Open the app

Navigate to `http://localhost:5173` in your browser.

## Configuration

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | (empty - uses fallback) |
| `REPO_BASE_PATH` | Base directory for cloned repos | `/tmp/reposense` |
| `MAX_REPO_SIZE_MB` | Maximum repository size | `500` |
| `CLONE_TIMEOUT_SECONDS` | Git clone timeout | `60` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to `backend/.env` as `GEMINI_API_KEY`

**Note**: The app works without an API key using a rule-based fallback that extracts functions, classes, and imports from the code.

## Project Structure

```
mini/
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # Business logic
│   │   │   ├── git_service.py      # Repository cloning
│   │   │   ├── scanner.py          # Directory scanning
│   │   │   ├── analyzer.py         # Code analysis (AST)
│   │   │   ├── explainer.py        # File explanations
│   │   │   └── assistant.py        # Q&A with context
│   │   ├── utils/         # Utilities
│   │   ├── config.py      # Settings
│   │   └── main.py        # FastAPI entry point
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── layout/    # Layout components
│   │   │   ├── landing/   # Landing page
│   │   │   ├── dashboard/ # Dashboard & summary
│   │   │   ├── explorer/  # File tree
│   │   │   ├── viewer/    # Code viewer & tabs
│   │   │   ├── explainer/ # AI explanations
│   │   │   ├── assistant/ # Chat panel
│   │   │   └── ui/        # UI primitives
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utilities
│   │   └── styles/        # CSS styles
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/repos/analyze` | Start repository analysis |
| `GET` | `/api/v1/repos/{id}/status` | Check analysis status |
| `GET` | `/api/v1/repos/{id}/tree` | Get file tree |
| `GET` | `/api/v1/repos/{id}/files/{path}` | Get file content |
| `POST` | `/api/v1/repos/{id}/explain` | Explain a file |
| `POST` | `/api/v1/repos/{id}/ask` | Ask a question |
| `DELETE` | `/api/v1/repos/{id}` | Clean up repository |

## Supported Languages

The code analyzer supports extraction of functions, classes, and imports for:

- Python, JavaScript, TypeScript, React (JSX/TSX)
- Java, Go, Rust, C++, C, C#
- PHP, Ruby, Swift, Kotlin, Scala
- HTML, CSS, SCSS, JSON, YAML, TOML
- Markdown, Shell, Dockerfile, SQL
- And more...

## Security

- No code execution from scanned repositories
- Path traversal protection on all file operations
- Repository size and clone time limits
- Automatic cleanup of temporary directories
- CORS restricted to configured frontend origin

## Development

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

### Linting

```bash
# Backend
cd backend && pip install ruff && ruff check .

# Frontend
cd frontend && npm run lint
```

## Building for Production

### Backend

```bash
cd backend
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm run build
# Output in dist/
```

## License

MIT License - feel free to use for learning and projects.

## Acknowledgments

- Built as a college mini-project
- Inspired by GitHub Copilot, Sourcegraph, and other code intelligence tools
- Uses Prism.js for syntax highlighting
- Uses Lucide React for icons