from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from app.config import settings
from app.security import parse_github_url


class CloneError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


def clone_repository(url: str, dest: Path) -> tuple[str, str, str]:
    owner, repo, clone_url = parse_github_url(url)
    dest.parent.mkdir(parents=True, exist_ok=True)

    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", "--single-branch", clone_url, str(dest)],
            capture_output=True,
            text=True,
            timeout=settings.clone_timeout,
            check=False,
        )
    except FileNotFoundError as exc:
        raise CloneError(
            "Git is not installed or not available on PATH.", status_code=500
        ) from exc
    except subprocess.TimeoutExpired as exc:
        shutil.rmtree(dest, ignore_errors=True)
        raise CloneError(
            "Cloning timed out. Try a smaller repository.", status_code=408
        ) from exc

    if result.returncode != 0:
        shutil.rmtree(dest, ignore_errors=True)
        stderr = (result.stderr or result.stdout or "").strip()
        lowered = stderr.lower()
        if "not found" in lowered or "repository not found" in lowered:
            raise CloneError(
                "Repository not found. Confirm the URL is a public GitHub repo.",
                status_code=404,
            )
        if "could not resolve" in lowered or "unable to access" in lowered:
            raise CloneError(
                "Could not reach GitHub. Check the URL and your network connection.",
                status_code=400,
            )
        raise CloneError(
            "Failed to clone the repository. It may be private or invalid.",
            status_code=400,
        )

    return owner, repo, f"https://github.com/{owner}/{repo}"
