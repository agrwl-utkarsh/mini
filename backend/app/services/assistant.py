import os
from pathlib import Path
from typing import List, Optional, Dict, Any
import re

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    import tiktoken
    _tiktoken_encoding = tiktoken.get_encoding("cl100k_base")
except Exception:
    _tiktoken_encoding = None

from app.config import settings
from app.services.scanner import RepoScanner
from app.services.analyzer import analyze_code
from app.models.chat import ChatMessage, FileReference
from app.models.repo import TreeNode


class RepoAssistant:
    def __init__(self):
        self.model = None
        self.encoding = _tiktoken_encoding
        self._init_gemini()

    def _init_gemini(self):
        """Initialize Gemini if API key is available."""
        if settings.GEMINI_API_KEY and genai is not None:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                print(f"Failed to initialize Gemini for assistant: {e}")
                self.model = None

    def _count_tokens(self, text: str) -> int:
        if self.encoding:
            return len(self.encoding.encode(text))
        return len(text) // 4

    def _truncate_content(self, content: str, max_tokens: int) -> str:
        if self.encoding:
            tokens = self.encoding.encode(content)
            if len(tokens) <= max_tokens:
                return content
            return self.encoding.decode(tokens[:max_tokens])
        max_chars = max_tokens * 4
        return content[:max_chars] if len(content) > max_chars else content

    def _find_relevant_files(self, repo_path: Path, question: str, tree: List[TreeNode], max_files: int = 5) -> List[tuple[str, str, str]]:
        """Find files relevant to the question using keyword matching."""
        question_lower = question.lower()
        question_words = set(re.findall(r'\w+', question_lower))

        # Score files based on relevance
        scored_files = []

        def walk_tree(nodes: List[TreeNode], prefix: str = ""):
            for node in nodes:
                full_path = os.path.join(prefix, node.name) if prefix else node.name
                if node.type == "file" and not node.is_binary:
                    # Score based on filename and path matching
                    score = 0
                    path_lower = full_path.lower()
                    name_lower = node.name.lower()

                    # Direct name matches
                    for word in question_words:
                        if word in name_lower:
                            score += 3
                        if word in path_lower:
                            score += 1

                    # Language-specific boosts
                    if node.language:
                        lang_keywords = {
                            'python': ['python', 'py', 'script', 'backend', 'api', 'server'],
                            'javascript': ['js', 'javascript', 'frontend', 'react', 'node'],
                            'typescript': ['ts', 'typescript', 'frontend', 'react'],
                            'java': ['java', 'spring', 'backend'],
                            'go': ['go', 'golang', 'backend', 'service'],
                            'rust': ['rust', 'cargo', 'backend'],
                        }
                        if node.language.lower() in lang_keywords:
                            for kw in lang_keywords[node.language.lower()]:
                                if kw in question_lower:
                                    score += 2

                    if score > 0:
                        scored_files.append((score, full_path, node.language or ""))

                elif node.type == "dir" and node.children:
                    walk_tree(node.children, full_path)

        walk_tree(tree)

        # Sort by score and return top files
        scored_files.sort(key=lambda x: x[0], reverse=True)
        return scored_files[:max_files]

    def _get_file_content(self, repo_path: Path, file_path: str, max_tokens: int = 2000) -> Optional[str]:
        """Get file content, truncated if necessary."""
        full_path = repo_path / file_path
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            return self._truncate_content(content, max_tokens)
        except Exception:
            return None

    def _build_fallback_answer(self, question: str, relevant_files: List[tuple]) -> tuple[str, List[FileReference], bool]:
        """Generate a basic answer without AI."""
        if not relevant_files:
            return (
                "I couldn't find any relevant files for your question. "
                "Try asking about specific files, functions, or components in the repository.",
                [],
                True
            )

        answer_parts = [
            f"Based on the repository structure, here are files that might be relevant to: **{question}**\n"
        ]

        references = []
        for score, file_path, language in relevant_files:
            answer_parts.append(f"- **{file_path}** ({language}) - relevance score: {score}")
            references.append(FileReference(
                path=file_path,
                relevance=f"Keyword match score: {score}"
            ))

        answer_parts.append(
            "\n---\n"
            "*Note: AI assistant is not configured. This is a basic keyword-based search. "
            "Add a GEMINI_API_KEY to enable intelligent code understanding.*"
        )

        return "\n".join(answer_parts), references, True

    def ask(self, repo_path: Path, question: str, history: List[ChatMessage], tree: List[TreeNode]) -> tuple[str, List[FileReference], bool]:
        """
        Answer a question about the repository.
        Returns (answer, references, fallback_used).
        """
        # Find relevant files
        relevant_files = self._find_relevant_files(repo_path, question, tree)

        if not relevant_files:
            return (
                "I couldn't find any files relevant to your question. "
                "Could you try rephrasing or asking about a specific file or component?",
                [],
                True
            )

        # Get file contents
        file_contents = []
        references = []
        for score, file_path, language in relevant_files:
            content = self._get_file_content(repo_path, file_path)
            if content:
                file_contents.append(f"=== {file_path} ({language}) ===\n{content}")
                references.append(FileReference(
                    path=file_path,
                    relevance=f"Keyword match score: {score}"
                ))

        if not file_contents:
            return self._build_fallback_answer(question, relevant_files)

        # Try AI answer
        if self.model:
            try:
                answer = self._ask_with_ai(question, history, file_contents)
                return answer, references, False
            except Exception as e:
                print(f"AI assistant failed, using fallback: {e}")

        # Fallback
        return self._build_fallback_answer(question, relevant_files)

    def _ask_with_ai(self, question: str, history: List[ChatMessage], file_contents: List[str]) -> str:
        """Generate answer using Gemini with context."""
        # Build context from files
        context = "\n\n".join(file_contents)
        context = self._truncate_content(context, 10000)

        # Build conversation history
        history_str = ""
        for msg in history[-6:]:  # Last 6 messages
            role = "User" if msg.role == "user" else "Assistant"
            history_str += f"{role}: {msg.content}\n"

        prompt = f"""You are a senior software engineer helping a developer understand a codebase.

Repository Context:
{context}

Conversation History:
{history_str}

Current Question: {question}

Instructions:
- Answer based ONLY on the provided repository context
- Reference specific files, functions, and lines when possible
- If the context doesn't contain enough information, say so
- Be concise but thorough
- Include file references in your answer (e.g., "In `src/auth.py`...")

Answer:"""

        response = self.model.generate_content(prompt)
        return response.text.strip()


# Global assistant instance
assistant = RepoAssistant()


def ask_question(repo_path: Path, question: str, history: List[ChatMessage], tree: List[TreeNode]) -> tuple[str, List[FileReference], bool]:
    """Convenience function to ask a question."""
    return assistant.ask(repo_path, question, history, tree)