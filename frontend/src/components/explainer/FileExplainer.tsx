import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, Brain, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { api } from '../../services/api';
import type { FileExplainResponse, CodeSymbol } from '../../types';

interface FileExplainerProps {
  filePath?: string;
}

export const FileExplainer: React.FC<FileExplainerProps> = ({ filePath }) => {
  const { repoId } = useParams<{ repoId: string }>();
  const [explanation, setExplanation] = useState<FileExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadExplanation = useCallback(async () => {
    if (!repoId || !filePath) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.explainFile(repoId, filePath);
      setExplanation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get explanation');
    } finally {
      setLoading(false);
    }
  }, [repoId, filePath]);

  useEffect(() => {
    if (!repoId || !filePath) {
      setExplanation(null);
      return;
    }
    loadExplanation();
  }, [repoId, filePath, loadExplanation]);

  if (!filePath) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a file to see explanation</p>
          <p className="text-sm mt-1">Click on a file in the explorer</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-400">Analyzing file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-100 mb-2">Failed to explain</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button onClick={loadExplanation} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No explanation available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">AI Explanation</h3>
            <p className="text-xs text-slate-500">Powered by Gemini 1.5 Flash</p>
          </div>
        </div>
        {explanation.fallback_used && (
          <Badge variant="warning" size="sm" dot>
            <Zap className="w-3 h-3 mr-1" /> Fallback Mode
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Explanation */}
        <Card variant="outlined" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
              {explanation.explanation}
            </div>
          </CardContent>
        </Card>

        {/* Symbols */}
        {(explanation.functions.length > 0 || explanation.classes.length > 0) && (
          <Card variant="outlined" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Code Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {explanation.classes.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded bg-purple-500" />
                    Classes ({explanation.classes.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {explanation.classes.map((cls) => (
                      <Badge key={cls} variant="language" size="sm" language="TypeScript" className="bg-purple-500/20 border-purple-500/30 text-purple-400">
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {explanation.functions.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded bg-emerald-500" />
                    Functions ({explanation.functions.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {explanation.functions.slice(0, 20).map((fn) => (
                      <Badge key={fn} variant="language" size="sm" language="TypeScript" className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400">
                        {fn}()
                      </Badge>
                    ))}
                    {explanation.functions.length > 20 && (
                      <Badge variant="default" size="sm">+{explanation.functions.length - 20} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Imports */}
        {explanation.imports.length > 0 && (
          <Card variant="outlined" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Imports ({explanation.imports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {explanation.imports.slice(0, 30).map((imp) => (
                  <Badge key={imp} variant="default" size="sm" className="font-mono text-xs">
                    {imp}
                  </Badge>
                ))}
                {explanation.imports.length > 30 && (
                  <Badge variant="default" size="sm">+{explanation.imports.length - 30} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Symbols from parser */}
        {explanation.symbols.length > 0 && (
          <Card variant="outlined" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                Detailed Symbols
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {explanation.symbols.map((symbol) => (
                  <SymbolRow key={`${symbol.type}-${symbol.name}-${symbol.line_start}`} symbol={symbol} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const SymbolRow: React.FC<{ symbol: CodeSymbol }> = ({ symbol }) => {
  const typeColors = {
    function: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    class: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    import: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
  };

  const typeIcons = {
    function: 'ƒ',
    class: 'C',
    import: 'I',
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: typeColors[symbol.type].split(' ')[0].replace('bg-', ''), borderColor: typeColors[symbol.type].split(' ')[1].replace('border-', ''), color: typeColors[symbol.type].split(' ')[2].replace('text-', '') }}>
        {typeIcons[symbol.type]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-slate-200">{symbol.name}</span>
          {symbol.signature && (
            <span className="text-xs text-slate-500 font-mono truncate">{symbol.signature}</span>
          )}
        </div>
        {symbol.docstring && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{symbol.docstring}</p>
        )}
      </div>
      <span className="text-xs text-slate-500 font-mono whitespace-nowrap">L{symbol.line_start}-{symbol.line_end}</span>
    </div>
  );
};