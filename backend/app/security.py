from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlparse

GITHUB_URL_RE = re.compile(
    r"^https://github\.com/(?P<owner>[A-Za-z0-9_.-]+)/(?P<repo>[A-Za-z0-9_.-]+?)(?:\.git)?/?$"
)


def parse_github_url(url: str) -> tuple[str, str, str]:
    raw = (url or "").strip()
    if not raw:
        raise ValueError("Repository URL is required.")

    parsed = urlparse(raw)
    if parsed.scheme != "https" or parsed.netloc.lower() != "github.com":
        raise ValueError("Only public HTTPS GitHub URLs are supported.")

    match = GITHUB_URL_RE.match(raw.rstrip("/"))
    if not match:
        raise ValueError("URL must look like https://github.com/owner/repo")

    owner = match.group("owner")
    repo = match.group("repo")
    if owner.lower() in {".", ".."} or repo.lower() in {".", ".."}:
        raise ValueError("Invalid GitHub repository URL.")

    clone_url = f"https://github.com/{owner}/{repo}.git"
    return owner, repo, clone_url


def safe_join(root: Path, relative: str) -> Path:
    if not relative or relative.strip() in {".", "./"}:
        raise ValueError("A file path is required.")

    candidate = (root / relative).resolve()
    root_resolved = root.resolve()
    try:
        candidate.relative_to(root_resolved)
    except ValueError as exc:
        raise PermissionError("File path is outside the cloned repository.") from exc
    return candidate
