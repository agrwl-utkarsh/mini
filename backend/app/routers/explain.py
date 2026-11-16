from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.routers.repos import repo_file, _session_or_404
from app.services.fallback import explain_file_heuristic, extract_symbols
from app.services.gemini import explain_with_gemini

router = APIRouter(prefix="/api/repos", tags=["explain"])


class ExplainRequest(BaseModel):
    path: str = Field(..., min_length=1)


@router.post("/{repo_id}/explain")
def explain_file(repo_id: str, payload: ExplainRequest) -> dict:
    _session_or_404(repo_id)
    file_data = repo_file(repo_id, payload.path)
    source = file_data["content"]
    language = file_data.get("language")
    symbols = extract_symbols(source)

    ai_mode = "fallback"
    explanation = None
    if settings.gemini_enabled:
        explanation = explain_with_gemini(payload.path, language, source)
        if explanation:
            ai_mode = "gemini"

    if not explanation:
        explanation = explain_file_heuristic(payload.path, language, source)
        ai_mode = "fallback"

    return {
        "path": payload.path,
        "language": language,
        "explanation": explanation,
        "symbols": symbols,
        "ai_mode": ai_mode,
        "fallback_label": "Basic analysis — Gemini not configured"
        if ai_mode == "fallback"
        else None,
    }
