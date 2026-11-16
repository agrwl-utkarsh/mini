from __future__ import annotations

import re
from pathlib import Path

IMPORT_PATTERNS = [
    re.compile(r"^\s*(?:import|from)\s+([\w.]+)", re.M),
    re.compile(r"^\s*(?:const|let|var)\s+\w+\s*=\s*require\(['\"]([^'\"]+)['\"]\)", re.M),
    re.compile(r"^\s*import\s+(?:.+?\s+from\s+)?['\"]([^'\"]+)['\"]", re.M),
    re.compile(r"^\s*using\s+([\w.]+);", re.M),
]

CLASS_RE = re.compile(r"^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)", re.M)
FUNC_RE = re.compile(
    r"^\s*(?:export\s+)?(?:async\s+)?(?:def|function|fun|fn)\s+(\w+)",
    re.M,
)
ARROW_RE = re.compile(
    r"^\s*(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(",
    re.M,
)


def extract_symbols(source: str) -> dict[str, list[str]]:
    imports: list[str] = []
    for pattern in IMPORT_PATTERNS:
        imports.extend(pattern.findall(source))
    classes = CLASS_RE.findall(source)
    functions = FUNC_RE.findall(source) + ARROW_RE.findall(source)

    def unique(items: list[str]) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for item in items:
            if item not in seen:
                seen.add(item)
                out.append(item)
        return out[:40]

    return {
        "imports": unique(imports),
        "classes": unique(classes),
        "functions": unique(functions),
    }


def explain_file_heuristic(path: str, language: str | None, source: str) -> str:
    name = Path(path).name
    symbols = extract_symbols(source)
    lines = source.splitlines()
    parts = [
        f'"{name}" looks like a {language or "source"} file with {len(lines)} lines.',
    ]
    if symbols["imports"]:
        shown = ", ".join(symbols["imports"][:8])
        parts.append(f"It imports: {shown}.")
    if symbols["classes"]:
        parts.append("Classes: " + ", ".join(symbols["classes"][:8]) + ".")
    if symbols["functions"]:
        parts.append("Functions: " + ", ".join(symbols["functions"][:12]) + ".")
    if not symbols["imports"] and not symbols["classes"] and not symbols["functions"]:
        if name.lower() in {"readme.md", "readme"}:
            parts.append("This is a README. It usually describes the project purpose and how to run it.")
        elif name.endswith((".json", ".yml", ".yaml", ".toml", ".ini")):
            parts.append("This is configuration data rather than application logic.")
        else:
            parts.append("No obvious classes or functions were detected with basic pattern matching.")
    parts.append(
        "This is a labelled basic analysis because no Gemini API key is configured."
    )
    return " ".join(parts)


def answer_question_heuristic(
    question: str,
    snippets: list[dict[str, str]],
) -> str:
    if not snippets:
        return (
            "Basic analysis could not find matching source files for that question. "
            "Try asking about a filename, language, or a function you see in the explorer. "
            "(Gemini is not configured.)"
        )

    lines = [
        "Basic analysis (Gemini not configured). Here are the most relevant files:",
    ]
    for item in snippets:
        lines.append(f"- {item['path']}: matched terms in this file.")
        preview = " ".join(item["content"].split())[:220]
        if preview:
            lines.append(f"  Excerpt: {preview}")
    lines.append(f"Question received: {question.strip()}")
    return "\n".join(lines)
