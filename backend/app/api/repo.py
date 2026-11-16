import uuid
import threading
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.git_service import GitService
from app.services.scanner import scan_repository
from app.models.repo import (
    RepoAnalyzeRequest, RepoAnalyzeResponse, RepoStatusResponse,
    RepoSummary, RepoStatus, RepoTreeResponse, TreeNode
)

router = APIRouter(prefix="/repos", tags=["repositories"])

# In-memory storage for repo status (use Redis/DB in production)
repo_status: dict = {}
repo_trees: dict = {}
repo_summaries: dict = {}

git_service = GitService()


def analyze_repo_background(repo_id: str, url: str):
    """Background task to clone and analyze repository."""
    repo_path = git_service.get_repo_path(repo_id)

    try:
        # Update status: cloning
        repo_status[repo_id] = {
            "status": RepoStatus.CLONING,
            "progress": "Cloning repository..."
        }

        # Clone
        success, error = git_service.clone_repository(repo_id, url)
        if not success:
            repo_status[repo_id] = {
                "status": RepoStatus.ERROR,
                "error": error
            }
            return

        # Check size
        size_mb = git_service.get_repo_size(repo_id) / (1024 * 1024)
        if size_mb > settings.MAX_REPO_SIZE_MB:
            git_service.cleanup_repo(repo_id)
            repo_status[repo_id] = {
                "status": RepoStatus.ERROR,
                "error": f"Repository too large ({size_mb:.1f}MB > {settings.MAX_REPO_SIZE_MB}MB limit)"
            }
            return

        # Update status: scanning
        repo_status[repo_id] = {
            "status": RepoStatus.SCANNING,
            "progress": "Scanning repository structure..."
        }

        # Scan
        def progress_cb(stage: str, msg: str):
            repo_status[repo_id] = {
                "status": RepoStatus.SCANNING,
                "progress": msg
            }

        tree, summary = scan_repository(repo_path, progress_cb)

        # Store results
        repo_trees[repo_id] = tree
        repo_summaries[repo_id] = summary

        # Update status: ready
        repo_status[repo_id] = {
            "status": RepoStatus.READY,
            "summary": summary,
            "progress": "Analysis complete"
        }

    except Exception as e:
        repo_status[repo_id] = {
            "status": RepoStatus.ERROR,
            "error": f"Analysis failed: {str(e)}"
        }
        # Cleanup on error
        git_service.cleanup_repo(repo_id)


@router.post("/analyze", response_model=RepoAnalyzeResponse)
async def analyze_repository(request: RepoAnalyzeRequest, background_tasks: BackgroundTasks):
    """Start analyzing a GitHub repository."""
    url = str(request.url)

    # Validate URL
    valid, error = git_service.validate_github_url(url)
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    # Generate repo ID
    repo_id = str(uuid.uuid4())

    # Initialize status
    repo_status[repo_id] = {
        "status": RepoStatus.PENDING,
        "progress": "Starting analysis..."
    }

    # Start background analysis
    background_tasks.add_task(analyze_repo_background, repo_id, url)

    return RepoAnalyzeResponse(
        repo_id=uuid.UUID(repo_id),
        status=RepoStatus.PENDING,
        message="Repository analysis started. Poll /status endpoint for updates."
    )


@router.get("/{repo_id}/status", response_model=RepoStatusResponse)
async def get_repo_status(repo_id: str):
    """Get repository analysis status."""
    try:
        repo_uuid = uuid.UUID(repo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repo ID format")

    if repo_id not in repo_status:
        raise HTTPException(status_code=404, detail="Repository not found")

    status_data = repo_status[repo_id]
    return RepoStatusResponse(
        repo_id=repo_uuid,
        **status_data
    )


@router.get("/{repo_id}/tree", response_model=RepoTreeResponse)
async def get_repo_tree(repo_id: str):
    """Get repository file tree."""
    try:
        repo_uuid = uuid.UUID(repo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repo ID format")

    if repo_id not in repo_trees:
        raise HTTPException(status_code=404, detail="Repository tree not found. Analysis may not be complete.")

    return RepoTreeResponse(
        repo_id=repo_uuid,
        tree=repo_trees[repo_id]
    )


@router.delete("/{repo_id}")
async def delete_repository(repo_id: str):
    """Clean up repository data."""
    try:
        repo_uuid = uuid.UUID(repo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repo ID format")

    # Clean up local files
    git_service.cleanup_repo(repo_id)

    # Clean up memory
    repo_status.pop(repo_id, None)
    repo_trees.pop(repo_id, None)
    repo_summaries.pop(repo_id, None)

    return {"message": "Repository cleaned up successfully"}