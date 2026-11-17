import os
from pathlib import Path
from typing import Optional, List

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
from app.services.analyzer import analyze_code, ParsedCode
from app.models.file import CodeSymbol


class FileExplainer:
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
                print(f"Failed to initialize Gemini: {e}")
                self.model = None

    def _count_tokens(self, text: str) -> int:
        if self.encoding:
            return len(self.encoding.encode(text))
        return len(text) // 4

    def _truncate_content(self, content: str, max_tokens: int = 8000) -> str:
        """Truncate content to fit within token limit."""
        if self.encoding:
            tokens = self.encoding.encode(content)
            if len(tokens) <= max_tokens:
                return content
            return self.encoding.decode(tokens[:max_tokens])
        max_chars = max_tokens * 4
        return content[:max_chars] if len(content) > max_chars else content

    def _build_fallback_explanation(self, parsed: ParsedCode, file_path: str, language: str) -> str:
        """Generate a basic explanation without AI."""
        parts = []

        # File overview
        parts.append(f"## {os.path.basename(file_path)} ({language})")

        # Imports
        if parsed.imports:
            imports_str = ", ".join(parsed.imports[:20])
            if len(parsed.imports) > 20:
                imports_str += f" ... and {len(parsed.imports) - 20} more"
            parts.append(f"**Imports ({len(parsed.imports)})**: {imports_str}")

        # Classes
        if parsed.classes:
            parts.append(f"**Classes ({len(parsed.classes)})**:")
            for cls in parsed.classes[:10]:
                sig = cls.signature or f"class {cls.name}"
                doc = f" - {cls.docstring[:100]}" if cls.docstring else ""
                parts.append(f"  - `{sig}`{doc}")
            if len(parsed.classes) > 10:
                parts.append(f"  ... and {len(parsed.classes) - 10} more classes")

        # Functions
        if parsed.functions:
            parts.append(f"**Functions ({len(parsed.functions)})**:")
            for fn in parsed.functions[:15]:
                sig = fn.signature or f"function {fn.name}"
                doc = f" - {fn.docstring[:100]}" if fn.docstring else ""
                parts.append(f"  - `{sig}`{doc}")
            if len(parsed.functions) > 15:
                parts.append(f"  ... and {len(parsed.functions) - 15} more functions")

        if not parsed.imports and not parsed.classes and not parsed.functions:
            parts.append("No significant code structures detected (may be config, data, or unsupported language).")

        return "\n".join(parts)

    def explain_file(self, repo_path: Path, file_path: str, content: str, language: str) -> tuple[str, List[CodeSymbol], List[str], List[str], List[str], bool]:
        """
        Explain a file. Returns (explanation, symbols, imports, functions, classes, fallback_used).
        """
        # Parse code first
        full_path = repo_path / file_path
        parsed = analyze_code(full_path, content, language)

        # Prepare symbols list
        all_symbols = parsed.functions + parsed.classes

        # Prepare lists for response
        imports_list = parsed.imports
        functions_list = [f.name for f in parsed.functions]
        classes_list = [c.name for c in parsed.classes]

        # Try AI explanation
        if self.model:
            try:
                explanation = self._explain_with_ai(file_path, content, language, parsed)
                return explanation, all_symbols, imports_list, functions_list, classes_list, False
            except Exception as e:
                print(f"AI explanation failed, using fallback: {e}")

        # Fallback
        explanation = self._build_fallback_explanation(parsed, file_path, language)
        return explanation, all_symbols, imports_list, functions_list, classes_list, True

    def _explain_with_ai(self, file_path: str, content: str, language: str, parsed: ParsedCode) -> str:
        """Generate explanation using Gemini."""
        # Truncate content if too long
        truncated_content = self._truncate_content(content, 6000)

        # Build context
        context = f"File: {file_path}\nLanguage: {language}\n\n"
        if parsed.imports:
            context += f"Imports: {', '.join(parsed.imports[:30])}\n"
        if parsed.classes:
            context += f"Classes: {', '.join([c.name for c in parsed.classes[:15]])}\n"
        if parsed.functions:
            context += f"Functions: {', '.join([f.name for f in parsed.functions[:20]])}\n"
        context += f"\nCode:\n```{language}\n{truncated_content}\n```"

        prompt = f"""You are a senior software engineer explaining code to a junior developer.

Analyze this {language} file and provide a clear, concise explanation covering:
1. **Purpose**: What does this file do?
2. **Key Components**: Main classes, functions, and their responsibilities
3. **Data Flow**: How data moves through the code
4. **Dependencies**: Important imports and external libraries used
5. **Notable Patterns**: Design patterns, architectural decisions, or interesting techniques

Be specific and reference actual code elements. Keep it under 300 words.

{context}"""

        response = self.model.generate_content(prompt)
        return response.text.strip()


# Global explainer instance
explainer = FileExplainer()


def explain_file(repo_path: Path, file_path: str, content: str, language: str) -> tuple[str, List[CodeSymbol], List[str], List[str], List[str], bool]:
    """Convenience function to explain a file."""
    return explainer.explain_file(repo_path, file_path, content, language)