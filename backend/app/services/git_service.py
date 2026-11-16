import os
import shutil
import tempfile
import subprocess
from pathlib import Path
from typing import Optional, Tuple
from git import Repo, GitCommandError
from urllib.parse import urlparse
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class GitService:
    def __init__(self):
        self.base_path = Path(settings.REPO_BASE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def validate_github_url(self, url: str) -> Tuple[bool, str]:
        """Validate if URL is a valid public GitHub repository URL."""
        try:
            parsed = urlparse(url)
            if parsed.netloc not in ("github.com", "www.github.com"):
                return False, "Only GitHub URLs are supported"

            path_parts = parsed.path.strip("/").split("/")
            if len(path_parts) < 2:
                return False, "Invalid GitHub repository URL format"

            owner, repo = path_parts[0], path_parts[1].replace(".git", "")
            if not owner or not repo:
                return False, "Invalid repository owner or name"

            return True, ""
        except Exception as e:
            return False, f"Invalid URL: {str(e)}"

    def get_repo_path(self, repo_id: str) -> Path:
        """Get the local path for a repository."""
        return self.base_path / repo_id

    def clone_repository(self, repo_id: str, url: str, progress_callback=None) -> Tuple[bool, str]:
        """Clone a GitHub repository to local storage."""
        repo_path = self.get_repo_path(repo_id)

        # Clean up any existing directory
        if repo_path.exists():
            shutil.rmtree(repo_path, ignore_errors=True)

        try:
            if progress_callback:
                progress_callback("cloning", "Cloning repository...")

            # Shallow clone for speed
            Repo.clone_from(
                url,
                repo_path,
                depth=1,
                single_branch=True,
                timeout=settings.CLONE_TIMEOUT_SECONDS
            )

            if progress_callback:
                progress_callback("cloning", "Repository cloned successfully")

            return True, ""
        except GitCommandError as e:
            error_msg = str(e)
            if "Repository not found" in error_msg or "could not read from remote repository" in error_msg:
                return False, "Repository not found or is private"
            elif "timeout" in error_msg.lower():
                return False, f"Clone timed out after {settings.CLONE_TIMEOUT_SECONDS}s"
            else:
                return False, f"Git error: {error_msg}"
        except Exception as e:
            return False, f"Clone failed: {str(e)}"

    def get_repo_size(self, repo_id: str) -> int:
        """Get repository size in bytes."""
        repo_path = self.get_repo_path(repo_id)
        if not repo_path.exists():
            return 0

        total_size = 0
        for dirpath, dirnames, filenames in os.walk(repo_path):
            # Skip .git directory for size calculation
            if ".git" in dirpath.split(os.sep):
                continue
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    total_size += os.path.getsize(fp)
                except OSError:
                    pass
        return total_size

    def cleanup_repo(self, repo_id: str) -> bool:
        """Remove cloned repository."""
        repo_path = self.get_repo_path(repo_id)
        try:
            if repo_path.exists():
                shutil.rmtree(repo_path, ignore_errors=True)
            return True
        except Exception as e:
            logger.error(f"Failed to cleanup repo {repo_id}: {e}")
            return False

    def repo_exists(self, repo_id: str) -> bool:
        """Check if repository exists locally."""
        return self.get_repo_path(repo_id).exists()

    def get_default_branch(self, repo_id: str) -> Optional[str]:
        """Get the default branch name."""
        repo_path = self.get_repo_path(repo_id)
        try:
            repo = Repo(repo_path)
            return repo.active_branch.name
        except Exception:
            return None