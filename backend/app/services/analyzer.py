import ast
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from app.models.file import CodeSymbol


@dataclass
class ParsedCode:
    imports: List[str]
    functions: List[CodeSymbol]
    classes: List[CodeSymbol]


class CodeAnalyzer:
    """Analyze source code to extract symbols (functions, classes, imports)."""

    def __init__(self):
        self.parsers = {
            '.py': self._parse_python,
            '.js': self._parse_javascript,
            '.jsx': self._parse_javascript,
            '.ts': self._parse_typescript,
            '.tsx': self._parse_typescript,
            '.java': self._parse_java,
            '.go': self._parse_go,
            '.rs': self._parse_rust,
            '.cpp': self._parse_cpp,
            '.c': self._parse_cpp,
            '.h': self._parse_cpp,
            '.hpp': self._parse_cpp,
            '.cs': self._parse_csharp,
            '.php': self._parse_php,
            '.rb': self._parse_ruby,
            '.swift': self._parse_swift,
            '.kt': self._parse_kotlin,
        }

    def analyze(self, file_path: Path, content: str, language: str) -> ParsedCode:
        """Analyze code and extract symbols."""
        suffix = file_path.suffix.lower()
        parser = self.parsers.get(suffix)
        if parser:
            return parser(content)
        return ParsedCode(imports=[], functions=[], classes=[])

    # --- Python ---
    def _parse_python(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ""
                    for alias in node.names:
                        imports.append(f"{module}.{alias.name}" if module else alias.name)
                elif isinstance(node, ast.FunctionDef):
                    functions.append(CodeSymbol(
                        name=node.name,
                        type="function",
                        line_start=node.lineno,
                        line_end=node.end_lineno or node.lineno,
                        signature=self._get_python_signature(node),
                        docstring=ast.get_docstring(node)
                    ))
                elif isinstance(node, ast.AsyncFunctionDef):
                    functions.append(CodeSymbol(
                        name=node.name,
                        type="function",
                        line_start=node.lineno,
                        line_end=node.end_lineno or node.lineno,
                        signature=f"async {self._get_python_signature(node)}",
                        docstring=ast.get_docstring(node)
                    ))
                elif isinstance(node, ast.ClassDef):
                    classes.append(CodeSymbol(
                        name=node.name,
                        type="class",
                        line_start=node.lineno,
                        line_end=node.end_lineno or node.lineno,
                        signature=f"class {node.name}",
                        docstring=ast.get_docstring(node)
                    ))
        except SyntaxError:
            pass  # Fall back to regex

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    def _get_python_signature(self, node: ast.FunctionDef) -> str:
        args = []
        for arg in node.args.args:
            arg_str = arg.arg
            if arg.annotation:
                arg_str += f": {ast.unparse(arg.annotation)}"
            args.append(arg_str)
        if node.args.vararg:
            args.append(f"*{node.args.vararg.arg}")
        if node.args.kwarg:
            args.append(f"**{node.args.kwarg.arg}")
        return f"def {node.name}({', '.join(args)})"

    # --- JavaScript / TypeScript ---
    def _parse_javascript(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        # Imports
        import_patterns = [
            r'import\s+(?:\{[^}]*\}|\w+)\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'import\s+[\'"]([^\'"]+)[\'"]',
            r'require\([\'"]([^\'"]+)[\'"]\)',
        ]
        for pattern in import_patterns:
            for match in re.finditer(pattern, content):
                imports.append(match.group(1))

        # Functions
        func_patterns = [
            r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)',
            r'(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>',
            r'(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(([^)]*)\)',
        ]
        for pattern in func_patterns:
            for match in re.finditer(pattern, content):
                line_num = content[:match.start()].count('\n') + 1
                functions.append(CodeSymbol(
                    name=match.group(1),
                    type="function",
                    line_start=line_num,
                    line_end=line_num,
                    signature=f"function {match.group(1)}({match.group(2)})"
                ))

        # Classes
        class_pattern = r'(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?'
        for match in re.finditer(class_pattern, content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"class {match.group(1)}"
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    def _parse_typescript(self, content: str) -> ParsedCode:
        # TypeScript uses same patterns as JS mostly
        return self._parse_javascript(content)

    # --- Java ---
    def _parse_java(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        # Imports
        for match in re.finditer(r'import\s+([\w.]+);', content):
            imports.append(match.group(1))

        # Classes
        for match in re.finditer(r'(?:public|private|protected)?\s*(?:abstract|final)?\s*class\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"class {match.group(1)}"
            ))

        # Methods
        for match in re.finditer(r'(?:public|private|protected)?\s*(?:static)?\s*(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*(?:throws\s+\w+\s*)?\{', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=match.group(0).strip().rstrip('{').strip()
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    # --- Go ---
    def _parse_go(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []  # Go has structs, not classes

        # Imports
        import_block = re.search(r'import\s*\(([^)]+)\)', content, re.DOTALL)
        if import_block:
            for line in import_block.group(1).split('\n'):
                line = line.strip().strip('"')
                if line:
                    imports.append(line)
        else:
            for match in re.finditer(r'import\s+"([^"]+)"', content):
                imports.append(match.group(1))

        # Functions
        for match in re.finditer(r'func\s+(?:\(\w+\s+\w+\)\s+)?(\w+)\s*\([^)]*\)', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=f"func {match.group(1)}"
            ))

        # Structs (like classes)
        for match in re.finditer(r'type\s+(\w+)\s+struct\s*\{', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"type {match.group(1)} struct"
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    # --- Rust ---
    def _parse_rust(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        # Imports
        for match in re.finditer(r'use\s+([\w:{\s,*}]+);', content):
            imports.append(match.group(1).strip())

        # Functions
        for match in re.finditer(r'(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*\([^)]*\)', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=f"fn {match.group(1)}"
            ))

        # Structs/Enums
        for match in re.finditer(r'(?:pub\s+)?(?:struct|enum)\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"{match.group(0).split()[0]} {match.group(1)}"
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    # --- C/C++ ---
    def _parse_cpp(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        # Includes
        for match in re.finditer(r'#include\s+[<"]([^>"]+)[>"]', content):
            imports.append(match.group(1))

        # Classes/Structs
        for match in re.finditer(r'(?:class|struct)\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"{match.group(0).strip()} {match.group(1)}"
            ))

        # Functions (simplified)
        for match in re.finditer(r'(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*(?:const)?\s*\{', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=match.group(0).strip().rstrip('{').strip()
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    # --- C# ---
    def _parse_csharp(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        for match in re.finditer(r'using\s+([\w.]+);', content):
            imports.append(match.group(1))

        for match in re.finditer(r'(?:public|private|protected|internal)?\s*(?:abstract|sealed|static)?\s*class\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"class {match.group(1)}"
            ))

        for match in re.finditer(r'(?:public|private|protected|internal)?\s*(?:static|async|virtual|override)?\s*(?:\w+\s+)+(\w+)\s*\([^)]*\)', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=match.group(0).strip()
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    # --- PHP ---
    def _parse_php(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        for match in re.finditer(r'(?:require|include|require_once|include_once)\s*\(?\s*[\'"]([^\'"]+)[\'"]', content):
            imports.append(match.group(1))

        for match in re.finditer(r'(?:abstract\s+)?class\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"class {match.group(1)}"
            ))

        for match in re.finditer(r'function\s+(\w+)\s*\([^)]*\)', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=f"function {match.group(1)}"
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    # --- Ruby ---
    def _parse_ruby(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        for match in re.finditer(r'require\s+[\'"]([^\'"]+)[\'"]', content):
            imports.append(match.group(1))

        for match in re.finditer(r'class\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"class {match.group(1)}"
            ))

        for match in re.finditer(r'def\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=f"def {match.group(1)}"
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    # --- Swift ---
    def _parse_swift(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        for match in re.finditer(r'import\s+(\w+)', content):
            imports.append(match.group(1))

        for match in re.finditer(r'(?:class|struct|protocol)\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"{match.group(0).split()[0]} {match.group(1)}"
            ))

        for match in re.finditer(r'func\s+(\w+)\s*\([^)]*\)', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=f"func {match.group(1)}"
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)

    # --- Kotlin ---
    def _parse_kotlin(self, content: str) -> ParsedCode:
        imports = []
        functions = []
        classes = []

        for match in re.finditer(r'import\s+([\w.]+)', content):
            imports.append(match.group(1))

        for match in re.finditer(r'(?:class|interface|data class|object)\s+(\w+)', content):
            line_num = content[:match.start()].count('\n') + 1
            classes.append(CodeSymbol(
                name=match.group(1),
                type="class",
                line_start=line_num,
                line_end=line_num,
                signature=f"{match.group(0).split()[0]} {match.group(1)}"
            ))

        for match in re.finditer(r'fun\s+(\w+)\s*\([^)]*\)', content):
            line_num = content[:match.start()].count('\n') + 1
            functions.append(CodeSymbol(
                name=match.group(1),
                type="function",
                line_start=line_num,
                line_end=line_num,
                signature=f"fun {match.group(1)}"
            ))

        return ParsedCode(imports=imports, functions=functions, classes=classes)


# Global analyzer instance
analyzer = CodeAnalyzer()


def analyze_code(file_path: Path, content: str, language: str) -> ParsedCode:
    """Convenience function to analyze code."""
    return analyzer.analyze(file_path, content, language)