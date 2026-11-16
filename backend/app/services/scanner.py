import os
from pathlib import Path
from typing import List, Dict, Set, Optional, Tuple
from collections import Counter
import pathspec
from git import Repo

from app.models.repo import TreeNode, LanguageStats, FrameworkInfo, RepoSummary
from app.config import settings

# Language detection by extension
EXTENSION_MAP = {
    '.py': 'Python', '.pyw': 'Python', '.pyi': 'Python',
    '.js': 'JavaScript', '.jsx': 'React', '.mjs': 'JavaScript',
    '.ts': 'TypeScript', '.tsx': 'React', '.mts': 'TypeScript',
    '.java': 'Java', '.kt': 'Kotlin', '.scala': 'Scala', '.groovy': 'Groovy',
    '.go': 'Go', '.rs': 'Rust', '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++',
    '.c': 'C', '.h': 'C', '.hpp': 'C++',
    '.cs': 'C#', '.vb': 'Visual Basic',
    '.php': 'PHP', '.php3': 'PHP', '.php4': 'PHP', '.php5': 'PHP', '.phtml': 'PHP',
    '.rb': 'Ruby', '.erb': 'Ruby',
    '.swift': 'Swift', '.m': 'Objective-C', '.mm': 'Objective-C++',
    '.html': 'HTML', '.htm': 'HTML', '.xhtml': 'HTML',
    '.css': 'CSS', '.scss': 'SCSS', '.sass': 'SCSS', '.less': 'Less',
    '.json': 'JSON', '.jsonc': 'JSON',
    '.yaml': 'YAML', '.yml': 'YAML',
    '.toml': 'TOML', '.ini': 'INI', '.cfg': 'INI', '.conf': 'INI',
    '.md': 'Markdown', '.markdown': 'Markdown', '.rst': 'reStructuredText',
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell', '.fish': 'Shell',
    '.ps1': 'PowerShell', '.psm1': 'PowerShell',
    '.dockerfile': 'Dockerfile', 'dockerfile': 'Dockerfile',
    '.sql': 'SQL', '.graphql': 'GraphQL', '.gql': 'GraphQL',
    '.xml': 'XML', '.svg': 'SVG',
    '.r': 'R', '.R': 'R',
    '.lua': 'Lua', '.pl': 'Perl', '.pm': 'Perl',
    '.dart': 'Dart', '.ex': 'Elixir', '.exs': 'Elixir',
    '.clj': 'Clojure', '.cljs': 'ClojureScript',
    '.hs': 'Haskell', '.ml': 'OCaml', '.fs': 'F#',
    '.vim': 'VimL', '.tex': 'LaTeX',
}

# Framework detection patterns
FRAMEWORK_PATTERNS = {
    "React": {
        "files": ["package.json"],
        "patterns": ["react", "react-dom", "next", "gatsby", "vite"],
        "config": ["vite.config.ts", "next.config.js", "gatsby-config.js"]
    },
    "Vue": {
        "files": ["package.json"],
        "patterns": ["vue", "@vue", "nuxt", "vitepress"],
        "config": ["vue.config.js", "nuxt.config.js"]
    },
    "Angular": {
        "files": ["package.json", "angular.json"],
        "patterns": ["@angular/core", "@angular/cli"],
        "config": ["angular.json"]
    },
    "Svelte": {
        "files": ["package.json"],
        "patterns": ["svelte", "@sveltejs"],
        "config": ["svelte.config.js"]
    },
    "Next.js": {
        "files": ["package.json"],
        "patterns": ["next"],
        "config": ["next.config.js", "next.config.ts"]
    },
    "Express": {
        "files": ["package.json"],
        "patterns": ["express"],
        "config": []
    },
    "FastAPI": {
        "files": ["requirements.txt", "pyproject.toml", "setup.py"],
        "patterns": ["fastapi"],
        "config": []
    },
    "Django": {
        "files": ["requirements.txt", "pyproject.toml", "setup.py", "manage.py"],
        "patterns": ["django"],
        "config": ["settings.py", "urls.py", "wsgi.py", "asgi.py"]
    },
    "Flask": {
        "files": ["requirements.txt", "pyproject.toml", "setup.py"],
        "patterns": ["flask"],
        "config": []
    },
    "Spring Boot": {
        "files": ["pom.xml", "build.gradle", "build.gradle.kts"],
        "patterns": ["spring-boot-starter"],
        "config": ["application.yml", "application.properties"]
    },
    "ASP.NET Core": {
        "files": ["*.csproj", "*.sln"],
        "patterns": ["Microsoft.AspNetCore"],
        "config": ["appsettings.json", "Program.cs", "Startup.cs"]
    },
    "Rails": {
        "files": ["Gemfile", "config/application.rb"],
        "patterns": ["rails"],
        "config": ["config/routes.rb", "config/database.yml"]
    },
    "Laravel": {
        "files": ["composer.json", "artisan"],
        "patterns": ["laravel/framework"],
        "config": [".env", "config/app.php"]
    },
    "Go Modules": {
        "files": ["go.mod", "go.sum"],
        "patterns": [],
        "config": ["go.mod"]
    },
    "Cargo (Rust)": {
        "files": ["Cargo.toml", "Cargo.lock"],
        "patterns": [],
        "config": ["Cargo.toml"]
    },
    "Maven": {
        "files": ["pom.xml"],
        "patterns": [],
        "config": ["pom.xml"]
    },
    "Gradle": {
        "files": ["build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"],
        "patterns": [],
        "config": ["build.gradle", "build.gradle.kts"]
    },
}

# Ignore patterns for scanning
IGNORE_PATTERNS = [
    ".git/",
    "node_modules/",
    "venv/",
    ".venv/",
    "env/",
    "__pycache__/",
    "*.pyc",
    ".pytest_cache/",
    ".coverage",
    "htmlcov/",
    "dist/",
    "build/",
    "target/",
    ".next/",
    ".vercel/",
    ".turbo/",
    "coverage/",
    ".nyc_output/",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    "*.swp",
    "*.swo",
    ".idea/",
    ".vscode/",
    "*.egg-info/",
    ".tox/",
    ".mypy_cache/",
    ".ruff_cache/",
    "*.min.js",
    "*.min.css",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lockb",
    "Cargo.lock",
    "go.sum",
    "composer.lock",
    "Gemfile.lock",
    "poetry.lock",
    "uv.lock",
]


class RepoScanner:
    def __init__(self, repo_path: Path):
        self.repo_path = Path(repo_path)
        self.ignore_spec = self._build_ignore_spec()

    def _build_ignore_spec(self) -> pathspec.PathSpec:
        """Build pathspec from ignore patterns + .gitignore."""
        patterns = IGNORE_PATTERNS.copy()

        # Add .gitignore patterns if exists
        gitignore_path = self.repo_path / ".gitignore"
        if gitignore_path.exists():
            try:
                with open(gitignore_path, 'r', encoding='utf-8', errors='ignore') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            patterns.append(line)
            except Exception:
                pass

        return pathspec.PathSpec.from_lines('gitwildmatch', patterns)

    def _should_ignore(self, rel_path: str) -> bool:
        """Check if path should be ignored."""
        return self.ignore_spec.match_file(rel_path)

    def _detect_language(self, file_path: Path) -> Optional[str]:
        """Detect programming language from file extension or shebang."""
        # Check extension first
        suffix = file_path.suffix.lower()
        if suffix in EXTENSION_MAP:
            return EXTENSION_MAP[suffix]

        # Check full filename (for Dockerfile, Makefile, etc.)
        name_lower = file_path.name.lower()
        if name_lower in EXTENSION_MAP:
            return EXTENSION_MAP[name_lower]

        # Check shebang for scripts without extension
        if not suffix and file_path.is_file():
            try:
                with open(file_path, 'rb') as f:
                    first_line = f.readline().decode('utf-8', errors='ignore').strip()
                    if first_line.startswith('#!'):
                        if 'python' in first_line:
                            return 'Python'
                        elif 'node' in first_line:
                            return 'JavaScript'
                        elif 'bash' in first_line or 'sh' in first_line:
                            return 'Shell'
                        elif 'perl' in first_line:
                            return 'Perl'
                        elif 'ruby' in first_line:
                            return 'Ruby'
                        elif 'python3' in first_line:
                            return 'Python'
            except Exception:
                pass

        return None

    def _is_binary(self, file_path: Path) -> bool:
        """Check if file is binary."""
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(8192)
                if b'\x00' in chunk:
                    return True
                # Check for high ratio of non-text bytes
                text_chars = bytearray({7,8,9,10,12,13,27} | set(range(0x20, 0x7f)))
                non_text = sum(1 for b in chunk if b not in text_chars)
                return non_text / len(chunk) > 0.3 if chunk else False
        except Exception:
            return True

    def _count_lines(self, file_path: Path) -> int:
        """Count lines in a text file."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return sum(1 for _ in f)
        except Exception:
            return 0

    def scan(self, progress_callback=None) -> Tuple[List[TreeNode], RepoSummary]:
        """Scan repository and return tree structure and summary."""
        if progress_callback:
            progress_callback("scanning", "Scanning repository structure...")

        tree = self._build_tree(self.repo_path, "")
        summary = self._generate_summary()

        if progress_callback:
            progress_callback("scanning", "Scan complete")

        return tree, summary

    def _build_tree(self, dir_path: Path, rel_prefix: str) -> List[TreeNode]:
        """Recursively build file tree."""
        nodes = []

        try:
            entries = sorted(dir_path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
        except PermissionError:
            return nodes

        for entry in entries:
            rel_path = os.path.join(rel_prefix, entry.name) if rel_prefix else entry.name

            if self._should_ignore(rel_path):
                continue

            if entry.is_dir():
                children = self._build_tree(entry, rel_path)
                nodes.append(TreeNode(
                    name=entry.name,
                    type="dir",
                    path=rel_path,
                    children=children if children else None
                ))
            else:
                language = self._detect_language(entry)
                is_binary = self._is_binary(entry)
                size = entry.stat().st_size if not is_binary else None
                lines = self._count_lines(entry) if not is_binary and language else None

                nodes.append(TreeNode(
                    name=entry.name,
                    type="file",
                    path=rel_path,
                    size=size,
                    language=language,
                    is_binary=is_binary
                ))

        return nodes

    def _generate_summary(self) -> RepoSummary:
        """Generate repository summary statistics."""
        total_files = 0
        total_dirs = 0
        total_lines = 0
        total_size = 0
        lang_counter = Counter()
        lang_lines = Counter()
        lang_sizes = Counter()
        config_files = []
        framework_matches = {}

        for root, dirs, files in os.walk(self.repo_path):
            # Skip ignored directories
            rel_root = os.path.relpath(root, self.repo_path)
            if rel_root == ".":
                rel_root = ""

            # Filter dirs in-place to avoid walking ignored
            dirs[:] = [d for d in dirs if not self._should_ignore(os.path.join(rel_root, d))]

            total_dirs += len(dirs)

            for file in files:
                rel_file = os.path.join(rel_root, file) if rel_root else file
                if self._should_ignore(rel_file):
                    continue

                file_path = Path(root) / file
                total_files += 1

                try:
                    size = file_path.stat().st_size
                    total_size += size
                except Exception:
                    size = 0

                language = self._detect_language(file_path)
                is_binary = self._is_binary(file_path)

                if language and not is_binary:
                    lang_counter[language] += 1
                    lang_sizes[language] += size
                    lines = self._count_lines(file_path)
                    total_lines += lines
                    lang_lines[language] += lines

                # Track config files
                if file.lower() in [
                    'package.json', 'tsconfig.json', 'jsconfig.json',
                    'requirements.txt', 'pyproject.toml', 'setup.py', 'setup.cfg',
                    'cargo.toml', 'go.mod', 'pom.xml', 'build.gradle', 'build.gradle.kts',
                    'composer.json', 'gemfile', 'makefile', 'cmakelists.txt',
                    'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
                    '.github/workflows', '.gitlab-ci.yml', 'jenkinsfile',
                    'README.md', 'README.rst', 'README.txt', 'CHANGELOG.md',
                    'LICENSE', 'LICENSE.txt', 'LICENSE.md',
                    '.env', '.env.example', '.env.local',
                ]:
                    config_files.append(rel_file)

        # Calculate language percentages
        total_lang_files = sum(lang_counter.values())
        languages = []
        for lang, count in lang_counter.most_common():
            percentage = (count / total_lang_files * 100) if total_lang_files > 0 else 0
            languages.append(LanguageStats(
                language=lang,
                files=count,
                lines=lang_lines.get(lang, 0),
                percentage=round(percentage, 1)
            ))

        # Detect frameworks
        frameworks = self._detect_frameworks(config_files, framework_matches)

        return RepoSummary(
            total_files=total_files,
            total_dirs=total_dirs,
            total_lines=total_lines,
            total_size_bytes=total_size,
            languages=languages,
            frameworks=frameworks,
            config_files=config_files
        )

    def _detect_frameworks(self, config_files: List[str], framework_matches: Dict) -> List[FrameworkInfo]:
        """Detect frameworks based on config files and dependencies."""
        frameworks = []
        repo_files = set(config_files)

        # Read package.json for JS frameworks
        package_json_path = self.repo_path / "package.json"
        package_deps = {}
        if package_json_path.exists():
            try:
                import json
                with open(package_json_path, 'r') as f:
                    pkg = json.load(f)
                    package_deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
            except Exception:
                pass

        # Read Python requirements
        python_deps = set()
        for req_file in ['requirements.txt', 'pyproject.toml', 'setup.py']:
            req_path = self.repo_path / req_file
            if req_path.exists():
                try:
                    with open(req_path, 'r') as f:
                        content = f.read().lower()
                        # Simple extraction
                        import re
                        deps = re.findall(r'^([a-zA-Z0-9_-]+)', content, re.MULTILINE)
                        python_deps.update(deps)
                except Exception:
                    pass

        for fw_name, fw_info in FRAMEWORK_PATTERNS.items():
            confidence = 0.0
            matched_configs = []

            # Check config files
            for config in fw_info.get("config", []):
                if any(config in f for f in repo_files):
                    confidence += 0.4
                    matched_configs.append(config)

            # Check patterns in package.json
            for pattern in fw_info.get("patterns", []):
                if any(pattern in dep for dep in package_deps):
                    confidence += 0.5
                    matched_configs.append(f"package.json:{pattern}")
                if pattern in python_deps:
                    confidence += 0.5
                    matched_configs.append(f"requirements:{pattern}")

            # Check required files
            for req_file in fw_info.get("files", []):
                if any(req_file in f for f in repo_files):
                    confidence += 0.3
                    matched_configs.append(req_file)

            if confidence > 0.3:
                frameworks.append(FrameworkInfo(
                    name=fw_name,
                    config_files=list(set(matched_configs)),
                    confidence=min(round(confidence, 2), 1.0)
                ))

        # Sort by confidence
        frameworks.sort(key=lambda x: x.confidence, reverse=True)
        return frameworks


def scan_repository(repo_path: Path, progress_callback=None) -> Tuple[List[TreeNode], RepoSummary]:
    """Convenience function to scan a repository."""
    scanner = RepoScanner(repo_path)
    return scanner.scan(progress_callback)