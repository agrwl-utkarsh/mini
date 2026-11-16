from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.config import settings
from app.routers.repos import _session_or_404
from app.services.fallback import answer_question_heuristic
from app.services.gemini import answer_with_gemini
from app.services.retrieval import retrieve_snippets

router = APIRouter(prefix="/api/repos", tags=["ask"])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)


@router.post("/{repo_id}/ask")
def ask_repo(repo_id: str, payload: AskRequest) -> dict:
    session = _session_or_404(repo_id)
    snippets = retrieve_snippets(session.clone_path, payload.question)
    references = [{"path": item["path"], "reason": item["reason"]} for item in snippets]

    ai_mode = "fallback"
    answer = None
    if settings.gemini_enabled:
        answer = answer_with_gemini(payload.question, snippets)
        if answer:
            ai_mode = "gemini"

    if not answer:
        answer = answer_question_heuristic(payload.question, snippets)
        ai_mode = "fallback"

    return {
        "answer": answer,
        "references": references,
        "ai_mode": ai_mode,
        "fallback_label": "Basic analysis — Gemini not configured"
        if ai_mode == "fallback"
        else None,
    }
