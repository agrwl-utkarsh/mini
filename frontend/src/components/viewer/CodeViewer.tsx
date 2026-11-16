import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import { Copy, Download, Maximize2, Minimize2, ChevronLeft } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatBytes, getLanguageColor } from '../../utils/formatters';
import type { FileTab } from '../../types';

// Import Prism languages
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-html';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-sql';

// Import theme
import 'prismjs/themes/prism-tomorrow.css';

interface CodeViewerProps {
  tab: FileTab | null;
  onClose?: () => void;
  maximized?: boolean;
  onMaximize?: () => void;
  onMinimize?: () => void;
}

const languageMap: Record<string, string> = {
  Python: 'python',
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  React: 'jsx',
  Java: 'java',
  Go: 'go',
  Rust: 'rust',
  'C++': 'cpp',
  C: 'c',
  'C#': 'csharp',
  PHP: 'php',
  Ruby: 'ruby',
  Swift: 'swift',
  Kotlin: 'kotlin',
  HTML: 'html',
  CSS: 'css',
  SCSS: 'scss',
  JSON: 'json',
  YAML: 'yaml',
  TOML: 'toml',
  Markdown: 'markdown',
  Shell: 'bash',
  Dockerfile: 'docker',
  SQL: 'sql',
};

export const CodeViewer: React.FC<CodeViewerProps> = ({
  tab,
  onClose,
  maximized = false,
  onMaximize,
  onMinimize,
}) => {
  const [copied, setCopied] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (tab?.content) {
      const contentLines = tab.content.split('\n');
      setLines(contentLines);
      // Highlight after render
      setTimeout(() => {
        if (preRef.current) {
          Prism.highlightAllUnder(preRef.current);
        }
      }, 0);
    } else {
      setLines([]);
    }
  }, [tab?.content]);

  const handleCopy = async () => {
    if (!tab?.content) return;
    await navigator.clipboard.writeText(tab.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!tab?.content) return;
    const blob = new Blob([tab.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tab.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!tab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950/50">
        <div className="text-center text-slate-500">
          <ChevronLeft className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a file to view</p>
          <p className="text-sm mt-1">Click on a file in the explorer</p>
        </div>
      </div>
    );
  }

  const prismLang = languageMap[tab.language] || 'plaintext';
  const langColor = getLanguageColor(tab.language);

  return (
    <div className={classNames('flex flex-col h-full bg-slate-950/50', maximized && 'fixed inset-4 z-50 rounded-xl shadow-2xl')}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0" aria-label="Close tab">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />
            <span className="font-mono text-sm text-slate-200 truncate">{tab.name}</span>
            <Badge variant="language" size="sm" language={tab.language} className="flex-shrink-0">
              {tab.language}
            </Badge>
            <Badge variant="default" size="sm" className="flex-shrink-0">
              {tab.lines} lines · {formatBytes(tab.size)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={copied ? 'Copied!' : 'Copy code'}>
            {copied ? (
              <span className="text-xs text-green-400">Copied!</span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} aria-label="Download file">
            <Download className="w-4 h-4" />
          </Button>
          {maximized ? (
            <Button variant="ghost" size="sm" onClick={onMinimize} aria-label="Minimize">
              <Minimize2 className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onMaximize} aria-label="Maximize">
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto p-4" style={{ fontFamily: 'inherit' }}>
        <pre
          ref={preRef}
          className={`language-${prismLang} text-sm leading-relaxed`}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            overflow: 'visible',
            fontFamily: '"JetBrains Mono", "Fira Code", Monaco, Consolas, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            tabSize: 2,
          }}
        >
          <code className={`language-${prismLang}`}>
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span
                  className="text-slate-500 w-8 text-right pr-4 select-none user-select-none"
                  style={{ userSelect: 'none' }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};