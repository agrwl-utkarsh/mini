import os
from pathlib import Path
from typing import Optional


def validate_path(base_path: Path, requested_path: str) -> Optional[Path]:
    """
    Validate that a requested path is within the base directory.
    Returns resolved path if valid, None otherwise.
    """
    try:
        # Resolve base path
        base = base_path.resolve()

        # Join and resolve requested path
        requested = (base / requested_path).resolve()

        # Check if requested path is within base
        if not str(requested).startswith(str(base)):
            return None

        # Check if path exists
        if not requested.exists():
            return None

        return requested
    except Exception:
        return None


def sanitize_path(path: str) -> str:
    """Sanitize path to prevent directory traversal."""
    # Remove any path traversal attempts
    path = path.replace("..", "").replace("//", "/")
    # Remove leading slashes
    path = path.lstrip("/")
    return path


def is_safe_filename(filename: str) -> bool:
    """Check if filename is safe (no path traversal, no special chars)."""
    if not filename or filename != os.path.basename(filename):
        return False
    if ".." in filename or "/" in filename or "\\" in filename:
        return False
    # Allow alphanumeric, dots, dashes, underscores
    import re
    return bool(re.match(r'^[\w\-.]+$', filename))