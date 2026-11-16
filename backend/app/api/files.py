import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse

from app.config import settings
from app.services.git_service import GitService
from app.services.explainer import explain_file
from app.utils.security import validate_path
from app.models.file import (
    FileContentResponse, FileExplainRequest, FileExplainResponse
)
from app.models.repo import RepoStatus

router = APIRouter(prefix="/repos", tags=["files"])

git_service = GitService()


@router.get("/{repo_id}/files/{file_path:path}", response_model=FileContentResponse)
async def get_file_content(repo_id: str, file_path: str):
    """Get file content from repository."""
    try:
        repo_uuid = uuid.UUID(repo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repo ID format")

    # Validate repo exists
    repo_path = git_service.get_repo_path(repo_id)
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository not found")

    # Validate and resolve file path
    full_path = validate_path(repo_path, file_path)
    if not full_path:
        raise HTTPException(status_code=404, detail="File not found")

    if not full_path.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")

    # Check file size
    size = full_path.stat().st_size
    if size > 10 * 1024 * 1024:  # 10MB limit for viewing
        raise HTTPException(status_code=413, detail="File too large to display")

    # Read file
    try:
        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    # Detect language
    from app.services.scanner import EXTENSION_MAP
    suffix = full_path.suffix.lower()
    language = EXTENSION_MAP.get(suffix, "Text")
    if full_path.name.lower() in EXTENSION_MAP:
        language = EXTENSION_MAP[full_path.name.lower()]

    lines = content.count('\n') + 1 if content else 0
    is_binary = '\x00' in content

    return FileContentResponse(
        repo_id=repo_uuid,
        path=file_path,
        content=content,
        language=language,
        size=size,
        lines=lines,
        is_binary=is_binary
    )


@router.post("/{repo_id}/explain", response_model=FileExplainResponse)
async def explain_file_endpoint(repo_id: str, request: FileExplainRequest):
    """Explain a file's purpose and structure."""
    try:
        repo_uuid = uuid.UUID(repo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repo ID format")

    # Validate repo exists
    repo_path = git_service.get_repo_path(repo_id)
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository not found")

    # Validate file path
    full_path = validate_path(repo_path, request.path)
    if not full_path or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    # Read file content
    try:
        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    # Detect language
    from app.services.scanner import EXTENSION_MAP
    suffix = full_path.suffix.lower()
    language = EXTENSION_MAP.get(suffix, "Text")
    if full_path.name.lower() in EXTENSION_MAP:
        language = EXTENSION_MAP[full_path.name.lower()]

    # Get explanation
    explanation, symbols, imports, functions, classes, fallback_used = explain_file(
        repo_path, request.path, content, language
    )

    return FileExplainResponse(
        repo_id=repo_uuid,
        path=request.path,
        explanation=explanation,
        symbols=symbols,
        imports=imports,
        functions=functions,
        classes=classes,
        fallback_used=fallback_used
    )