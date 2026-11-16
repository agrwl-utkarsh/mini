from __future__ import annotations

import json
import urllib.error
import urllib.request

from app.config import settings

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent?key={key}"
)


def generate(prompt: str) -> str | None:
    if not settings.gemini_enabled:
        return None

    url = GEMINI_URL.format(
        model=settings.gemini_model,
        key=settings.gemini_api_key.strip(),
    )
    payload = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024},
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return None

    try:
        text = body["candidates"][0]["content"]["parts"][0]["text"]
        return str(text).strip() or None
    except (KeyError, IndexError, TypeError):
        return None


def explain_with_gemini(path: str, language: str | None, source: str) -> str | None:
    prompt = (
        "You are helping a student understand a GitHub repository. "
        "Explain what this file does in 2-4 short paragraphs. "
        "List important imports, classes, and functions when they exist. "
        "Do not invent files that are not shown. Do not provide exploit instructions.\n\n"
        f"Path: {path}\nLanguage: {language or 'unknown'}\n\nSource:\n{source[:12000]}"
    )
    return generate(prompt)


def answer_with_gemini(question: str, snippets: list[dict[str, str]]) -> str | None:
    context = "\n\n".join(
        f"FILE: {item['path']}\n{item['content'][:3500]}" for item in snippets
    )
    prompt = (
        "Answer the student's question about this repository using only the source excerpts. "
        "Cite file paths in the answer. If the excerpts are not enough, say so.\n\n"
        f"Question: {question}\n\nExcerpts:\n{context or '(none)'}"
    )
    return generate(prompt)
