from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: Optional[str] = None


class FileReference(BaseModel):
    path: str
    lines: Optional[str] = None  # e.g., "10-25"
    relevance: Optional[str] = None


class AskRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []


class AskResponse(BaseModel):
    repo_id: UUID
    answer: str
    references: List[FileReference] = []
    fallback_used: bool = False