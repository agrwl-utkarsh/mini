from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class RepoSession:
    repo_id: str
    name: str
    owner: str
    url: str
    clone_path: Path
    stats: dict[str, int]
    languages: dict[str, int]
    frameworks: list[str]
    tree: dict[str, Any]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


_SESSIONS: dict[str, RepoSession] = {}


def save(session: RepoSession) -> None:
    _SESSIONS[session.repo_id] = session


def get(repo_id: str) -> RepoSession | None:
    return _SESSIONS.get(repo_id)


def remove(repo_id: str) -> RepoSession | None:
    return _SESSIONS.pop(repo_id, None)
