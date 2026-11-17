# Vercel Deployment Guide for RepoSense

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Project                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐         ┌─────────────────┐            │
│  │   Frontend      │ ◄──────►│    Backend      │            │
│  │   (Vite/React)  │  Proxy  │   (FastAPI)     │            │
│  │                 │  /api/*     │  External     │            │
│  │  Public: /*     │         │  (Render)       │            │
│  └─────────────────┘         └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Current Setup (Hybrid - Recommended)

- **Frontend**: Deployed on Vercel (static + edge)
- **Backend**: Deployed on Render/Fly.io/Railway (long-running FastAPI server)
- **Communication**: Vercel rewrites proxy `/api/*` to external backend

This approach works because the RepoSense backend requires:
- Long-running processes (git clone takes 30-60s)
- Persistent local storage for cloned repositories
- In-memory state management for analysis jobs
- Background tasks with polling

## Quick Deploy

### 1. Deploy Backend to Render

In Render dashboard:
- **Root**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `FRONTEND_URL=https://your-app.vercel.app`
  - `GEMINI_API_KEY=your_key_here` (optional)
  - `REPO_BASE_PATH=/tmp/reposense`
  - `MAX_REPO_SIZE_MB=500`
  - `CLONE_TIMEOUT_SECONDS=60`

### 2. Deploy Frontend to Vercel

In Vercel dashboard:
- **Root**: `frontend`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1`

### 3. Vercel Rewrites (Already Configured)

The `vercel.json` is already configured to proxy API requests:

```json
{
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "https://your-backend.onrender.com/api/v1/$1"
    },
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend.onrender.com/api/$1"
    },
    {
      "source": "/health",
      "destination": "https://your-backend.onrender.com/health"
    },
    {
      "source": "/docs",
      "destination": "https://your-backend.onrender.com/docs"
    },
    {
      "source": "/openapi.json",
      "destination": "https://your-backend.onrender.com/openapi.json"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Local Development

### Using Root Package.json (Recommended)

```bash
# Install root dependencies
npm install

# Start both frontend and backend
npm run dev

# Or individually:
npm run dev:web     # Frontend only (Vite on :5173)
npm run dev:api     # Backend only (FastAPI on :8000)
```

### Using Vercel CLI (Optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel config
vercel dev

# Frontend: http://localhost:3000
# API proxied to backend
```

## Files Configuration

| File | Purpose |
|------|---------|
| `vercel.json` | Rewrites config for API proxy to external backend |
| `frontend/.env.example` | Frontend environment variables |
| `backend/.env.example` | Backend environment variables |
| `package.json` | Root workspace with dev scripts |

## Why Not Full Vercel?

The current backend architecture is designed for long-running servers. Moving to serverless requires significant re-architecture:

| Challenge | Current Implementation | Vercel Limitation |
|-----------|----------------------|-------------------|
| **Git Clone** | `git clone` to disk (30-60s) | 10s/60s timeout, 512MB /tmp |
| **Background Tasks** | `BackgroundTasks` + in-memory dicts | No persistent state between invocations |
| **File Storage** | Local `/tmp/reposense/` | Ephemeral, cleared per invocation |
| **State Management** | Global `repo_status`, `repo_trees` dicts | Lost on every request |
| **Long Polling** | Client polls `/status` every 2s | Each poll = new function invocation |

**To run fully on Vercel**, you would need:
1. Replace in-memory dicts with **Upstash Redis** / **Vercel KV**
2. Use **Vercel Queue** / **Upstash QStash** for background jobs
3. Store cloned repos in **S3/R2** or use **GitHub API** directly
4. Add cleanup cron for expired repos

## Recommendation

**Start with Hybrid** (current setup). The backend works well on Render/Fly.io/Railway with minimal cost. Only migrate to full Vercel if you need serverless scaling.