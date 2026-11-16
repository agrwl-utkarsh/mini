from __future__ import annotations

import re
from pathlib import Path

from app.config import settings
from app.security import safe_join
from app.services.scanner import IGNORED_DIRS, is_probably_text

TOKEN_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]{2,}")


def tokenize(text: str) -> set[str]:
    return {t.lower() for t in TOKEN_RE.findall(text or "")}


def retrieve_snippets(root: Path, question: str, limit: int = 5) -> list[dict[str, str]]:
    query_tokens = tokenize(question)
    if not query_tokens:
        return []

    scored: list[tuple[int, str, str]] = []
    files_read = 0

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if files_read >= 400:
            break
        try:
            if path.stat().st_size > settings.max_file_bytes:
                continue
        except OSError:
            continue
        if not is_probably_text(path):
            continue

        rel = str(path.relative_to(root)).replace("\\", "/")
        try:
            safe_join(root, rel)
            text = path.read_text(encoding="utf-8", errors="ignore")
        except (OSError, ValueError, PermissionError):
            continue

        files_read += 1
        name_tokens = tokenize(rel.replace("/", " ").replace(".", " "))
        content_tokens = tokenize(text[:8000])
        score = 4 * len(query_tokens & name_tokens) + len(query_tokens & content_tokens)
        if score <= 0:
            continue
        scored.append((score, rel, text[:4000]))

    scored.sort(key=lambda item: item[0], reverse=True)
    results = []
    for score, rel, content in scored[:limit]:
        results.append(
            {
                "path": rel,
                "content": content,
                "reason": f"Keyword overlap score {score}",
            }
        )
    return results
