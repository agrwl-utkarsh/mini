import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { Zap, Brain, Info, AlertTriangle, FileText } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { api } from '../../services/api';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { ChatMessage, FileReference, AskResponse } from '../../types';

interface ChatPanelProps {
  repoId?: string;
  tree?: any[];
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ repoId, tree = [] }) => {
  const { repoId: urlRepoId } = useParams<{ repoId: string }>();
  const effectiveRepoId = repoId || urlRepoId;
  const context = useOutletContext<{ closeRightPanel: () => void }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [references, setReferences] = useState<FileReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fallbackMode, setFallbackMode] = useState(false);

  const handleSend = useCallback(async (question: string) => {
    if (!effectiveRepoId) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError('');

    try {
      const response: AskResponse = await api.askQuestion(
        effectiveRepoId,
        question,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setReferences(response.references);
      setFallbackMode(response.fallback_used);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [effectiveRepoId, messages]);

  const handleReferenceClick = (path: string) => {
    context?.closeRightPanel();
    // Navigate to file - this would need router navigation
    window.dispatchEvent(new CustomEvent('open-file', { detail: { path } }));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (!effectiveRepoId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a repository to chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">AI Assistant</h3>
            <p className="text-xs text-slate-500">Ask questions about the codebase</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fallbackMode && (
            <Badge variant="warning" size="sm" dot leftIcon={<Zap className="w-3 h-3" />}>
              Fallback Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Fallback Notice */}
      {fallbackMode && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-300">
              <p className="font-medium">Running in fallback mode</p>
              <p>Gemini API key not configured. Answers are based on keyword matching only. Add <code className="bg-slate-800 px-1 rounded">GEMINI_API_KEY</code> to enable AI-powered assistance.</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        references={references}
        loading={loading}
        onCopyCode={handleCopyCode}
        onReferenceClick={handleReferenceClick}
      />

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={loading} />

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError('')} className="ml-2 text-white/70 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};