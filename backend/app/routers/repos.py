from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.security import safe_join
from app.services.scanner import LANGUAGE_BY_EXT, is_probably_text
from app.services.store import get

router = APIRouter(prefix="/api/repos", tags=["repos"])


def _session_or_404(repo_id: str):
    session = get(repo_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Repository session not found. Analyse it again.")
    return session


@router.get("/{repo_id}")
def repo_summary(repo_id: str) -> dict:
    session = _session_or_404(repo_id)
    return {
        "repo_id": session.repo_id,
        "name": session.name,
        "owner": session.owner,
        "url": session.url,
        "stats": session.stats,
        "languages": session.languages,
        "frameworks": session.frameworks,
        "ai_mode": "gemini" if settings.gemini_enabled else "fallback",
    }


@router.get("/{repo_id}/tree")
def repo_tree(repo_id: str) -> dict:
    session = _session_or_404(repo_id)
    return {"tree": session.tree}


@router.get("/{repo_id}/file")
def repo_file(repo_id: str, path: str = Query(..., min_length=1)) -> dict:
    session = _session_or_404(repo_id)
    try:
        file_path = safe_join(session.clone_path, path)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found in the cloned repository.")

    try:
        size = file_path.stat().st_size
    except OSError as exc:
        raise HTTPException(status_code=400, detail="Could not read the file.") from exc

    if size > settings.max_file_bytes:
        raise HTTPException(
            status_code=413,
            detail="File is too large to display in the prototype viewer.",
        )
    if not is_probably_text(file_path):
        raise HTTPException(status_code=415, detail="Binary files cannot be displayed.")

    try:
        content = file_path.read_text(encoding="utf-8", errors="replace")
    except OSError as ext:
        raise HTTPException(status_code=400, detail="Could not read the file.") from ext

    language = LANGUAGE_BY_EXT.get(file_path.suffix.lower())
    return {"path": path.replace("\\", "/"), "content": content, "language": language}
