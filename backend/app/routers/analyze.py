from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.security import parse_github_url
from app.services.git_clone import CloneError, clone_repository
from app.services.scanner import RepoTooLargeError, scan_repository
from app.services.store import RepoSession, save

router = APIRouter(prefix="/api", tags=["analyze"])


class AnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=8, max_length=400)


class AnalyzeResponse(BaseModel):
    repo_id: str
    name: str
    owner: str
    url: str
    stats: dict
    languages: dict[str, int]
    frameworks: list[str]
    ai_mode: str


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "ai_mode": "gemini" if settings.gemini_enabled else "fallback",
    }


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        parse_github_url(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    repo_id = str(uuid.uuid4())
    dest: Path = settings.clones_dir / repo_id

    try:
        owner, repo, canonical_url = clone_repository(payload.url, dest)
        scan = scan_repository(dest)
    except CloneError as exc:
        shutil.rmtree(dest, ignore_errors=True)
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except RepoTooLargeError as exc:
        shutil.rmtree(dest, ignore_errors=True)
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except Exception as exc:
        shutil.rmtree(dest, ignore_errors=True)
        raise HTTPException(
            status_code=500,
            detail="Unexpected error while analysing the repository.",
        ) from exc

    session = RepoSession(
        repo_id=repo_id,
        name=repo,
        owner=owner,
        url=canonical_url,
        clone_path=dest,
        stats=scan["stats"],
        languages=scan["languages"],
        frameworks=scan["frameworks"],
        tree=scan["tree"],
    )
    save(session)

    return AnalyzeResponse(
        repo_id=repo_id,
        name=repo,
        owner=owner,
        url=canonical_url,
        stats=scan["stats"],
        languages=scan["languages"],
        frameworks=scan["frameworks"],
        ai_mode="gemini" if settings.gemini_enabled else "fallback",
    )
