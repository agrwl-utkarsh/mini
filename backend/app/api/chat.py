import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.services.git_service import GitService
from app.services.assistant import ask_question
from app.services.scanner import RepoScanner
from app.models.chat import AskRequest, AskResponse
from app.models.repo import TreeNode, RepoStatus

router = APIRouter(prefix="/repos", tags=["chat"])

git_service = GitService()

# Cache for repo trees (in production, use proper caching)
_repo_tree_cache: dict = {}


def get_repo_tree(repo_id: str) -> list[TreeNode]:
    """Get cached repo tree or scan if not cached."""
    if repo_id in _repo_tree_cache:
        return _repo_tree_cache[repo_id]

    repo_path = git_service.get_repo_path(repo_id)
    if not repo_path.exists():
        return []

    scanner = RepoScanner(repo_path)
    tree, _ = scanner.scan()
    _repo_tree_cache[repo_id] = tree
    return tree


@router.post("/{repo_id}/ask", response_model=AskResponse)
async def ask_question_endpoint(repo_id: str, request: AskRequest):
    """Ask a question about the repository."""
    try:
        repo_uuid = uuid.UUID(repo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repo ID format")

    # Validate repo exists
    repo_path = git_service.get_repo_path(repo_id)
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository not found")

    # Get repo tree
    tree = get_repo_tree(repo_id)
    if not tree:
        raise HTTPException(status_code=400, detail="Repository not analyzed yet")

    # Ask question
    answer, references, fallback_used = ask_question(
        repo_path, request.question, request.history, tree
    )

    return AskResponse(
        repo_id=repo_uuid,
        answer=answer,
        references=references,
        fallback_used=fallback_used
    )