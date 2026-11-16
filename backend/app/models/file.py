from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class CodeSymbol(BaseModel):
    name: str
    type: str  # "function", "class", "import"
    line_start: int
    line_end: int
    signature: Optional[str] = None
    docstring: Optional[str] = None


class FileContentResponse(BaseModel):
    repo_id: UUID
    path: str
    content: str
    language: str
    size: int
    lines: int
    is_binary: bool


class FileExplainRequest(BaseModel):
    path: str


class FileExplainResponse(BaseModel):
    repo_id: UUID
    path: str
    explanation: str
    symbols: List[CodeSymbol]
    imports: List[str]
    functions: List[str]
    classes: List[str]
    fallback_used: bool = False