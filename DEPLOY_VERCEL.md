# Vercel Multi-Service Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Project                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐         ┌─────────────────┐            │
│  │   Frontend      │ ◄──────►│    Backend      │            │
│  │   (Vite/React)  │  Bind   │   (FastAPI)     │            │
│  │                 │  BACKEND_URL   FRONTEND_URL │            │
│  │  Public: /*     │         │  Public: /api/* │            │
│  └─────────────────┘         └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Service Configuration

| Service | Root | Framework | Public Path |
|---------|------|-----------|-------------|
| `frontend` | `frontend/` | `vite` | `/*` (catch-all) |
| `backend` | `backend/` | `fastapi` | `/api/*`, `/health`, `/docs` |

## Bindings (Internal Communication)

| From | To | Binding Name | Injected Env Var |
|------|-----|--------------|------------------|
| `frontend` | `backend` | `BACKEND_URL` | `BACKEND_URL` |
| `backend` | `frontend` | `FRONTEND_URL` | `FRONTEND_URL` |

- Bindings are **internal only** - services communicate via private Vercel network
- `BACKEND_URL` = `https://<project>.vercel.app/backend` (internal)
- `FRONTEND_URL` = `https://<project>.vercel.app/frontend` (internal)
- **Do not set these manually** - Vercel injects them at runtime

## Current Code Compatibility

### ✅ Already Compatible
- **Backend CORS**: Reads `FRONTEND_URL` from env (injected by binding)
- **Frontend API client**: Updated to use `BACKEND_URL` binding when available
- **Environment examples**: Documented for both local and Vercel

### ❌ NOT Compatible (Requires Major Changes)

| Issue | Current Implementation | Vercel Limitation |
|-------|----------------------|-------------------|
| **Git Clone** | `git clone` to disk (30-60s) | 10s/60s timeout, 512MB /tmp |
| **Background Tasks** | `BackgroundTasks` + in-memory dicts | No persistent state between invocations |
| **File Storage** | Local `/tmp/reposense/` | Ephemeral, cleared per invocation |
| **State Management** | Global `repo_status`, `repo_trees` dicts | Lost on every request |
| **Long Polling** | Client polls `/status` every 2s | Each poll = new function invocation |

## Required Changes for Full Vercel Support

### Option 1: Externalize State (Recommended)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────►│  Vercel     │────►│  External   │
│  (React)    │     │  Functions  │     │  Services   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                    ┌──────┴──────┐     ┌──────┴──────┐
                    ▼             ▼     ▼             ▼
              ┌─────────┐  ┌─────────┐ ┌─────────┐ ┌─────────┐
              │ Upstash │  │  Redis  │ │   S3    │ │ GitHub  │
              │  Queue  │  │ (state) │ │ (files) │ │  API    │
              └─────────┘  └─────────┘ └─────────┘ └─────────┘
```

**Changes needed:**
1. Replace in-memory dicts with **Upstash Redis** or **Vercel KV**
2. Use **Vercel Queue** / **Upstash QStash** for background jobs
3. Store cloned repos in **S3/R2** or use **GitHub API** directly
4. Add `/api/v1/cleanup` cron for expired repos

### Option 2: GitHub API Only (No Cloning)
- Use GitHub REST/GraphQL API to fetch file contents
- No local disk needed
- Rate limited (5000 req/hr authenticated)

### Option 3: Hybrid (Recommended for MVP)
- **Frontend on Vercel** (static + edge)
- **Backend on Render/Fly.io/Railway** (long-running)
- Use `vercel.json` rewrites to proxy `/api/*` to external backend

## Quick Deploy (Hybrid Approach)

### 1. Deploy Backend to Render
```bash
# In Render dashboard:
# Root: backend
# Build: pip install -r requirements.txt
# Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT
# Env: FRONTEND_URL=https://your-app.vercel.app
```

### 2. Deploy Frontend to Vercel
```bash
# In Vercel dashboard:
# Root: frontend
# Framework: Vite
# Env: VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

### 3. Update vercel.json for Proxy (if keeping single domain)
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend.onrender.com/api/$1"
    }
  ]
}
```

## Local Development with `vercel dev`

```bash
# Install Vercel CLI
npm i -g vercel

# Run both services locally
vercel dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:3000/backend (internal)
```

## Files Created/Modified

| File | Purpose |
|------|---------|
| `vercel.json` | Multi-service config with bindings & rewrites |
| `backend/api/index.py` | Vercel entrypoint (documents limitations) |
| `frontend/src/services/api.ts` | Uses `BACKEND_URL` binding |
| `frontend/.env.example` | Documents binding variable |
| `backend/.env.example` | Documents binding variable |

## Next Steps (Choose One)

1. **Hybrid (Recommended)**: Keep backend on Render, frontend on Vercel
2. **Full Vercel**: Implement external state (Redis + Queue + S3)
3. **GitHub API Only**: Rewrite backend to use GitHub API exclusively

**Recommendation**: Start with **Hybrid**. The current backend architecture is designed for long-running servers. Moving to serverless requires significant re-architecture.