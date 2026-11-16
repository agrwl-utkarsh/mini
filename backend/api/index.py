"""
Vercel Serverless Function Entry Point for FastAPI.

This file is used by Vercel's Python runtime to serve the FastAPI app.
Each request creates a new invocation - no persistent state between requests.

IMPORTANT: The current RepoSense backend architecture is NOT compatible with
Vercel Functions due to:
- Long-running git clone/scan operations (30-60s) exceeding 10s/60s timeout
- In-memory state (repo_status, repo_trees, repo_summaries) lost between invocations
- Disk-based cloning to /tmp with 512MB limit

To make this work on Vercel, you would need to:
1. Use external storage (Redis, PostgreSQL, S3) for repo state
2. Offload git clone/scan to a background worker (e.g., Vercel Queue, Upstash QStash)
3. Use GitHub API instead of git clone for file access
4. Implement polling via client-side with serverless status checks

For now, this entrypoint exists for Vercel deployment structure.
The backend should run on a long-running platform (Render, Fly.io, Railway).
"""

from app.main import app

# Vercel expects the app to be exported as `app` or `handler`
# For FastAPI, the app instance is used directly
# No additional wrapper needed for modern Vercel Python runtime