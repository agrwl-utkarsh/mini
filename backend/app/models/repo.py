from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from enum import Enum
from uuid import UUID, uuid4
from datetime import datetime


class RepoStatus(str, Enum):
    PENDING = "pending"
    CLONING = "cloning"
    SCANNING = "scanning"
    READY = "ready"
    ERROR = "error"


class LanguageStats(BaseModel):
    language: str
    files: int
    lines: int
    percentage: float


class FrameworkInfo(BaseModel):
    name: str
    config_files: List[str]
    confidence: float


class RepoSummary(BaseModel):
    total_files: int
    total_dirs: int
    total_lines: int
    total_size_bytes: int
    languages: List[LanguageStats]
    frameworks: List[FrameworkInfo]
    config_files: List[str]


class RepoAnalyzeRequest(BaseModel):
    url: HttpUrl


class RepoAnalyzeResponse(BaseModel):
    repo_id: UUID
    status: RepoStatus
    message: str


class RepoStatusResponse(BaseModel):
    repo_id: UUID
    status: RepoStatus
    summary: Optional[RepoSummary] = None
    error: Optional[str] = None
    progress: Optional[str] = None


class TreeNode(BaseModel):
    name: str
    type: str  # "file" or "dir"
    path: str
    size: Optional[int] = None
    language: Optional[str] = None
    children: Optional[List["TreeNode"]] = None
    is_binary: bool = False


TreeNode.model_rebuild()


class RepoTreeResponse(BaseModel):
    repo_id: UUID
    tree: List[TreeNode]