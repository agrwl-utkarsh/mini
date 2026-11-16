import React, { useRef, useEffect } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import type { ChatMessage, FileReference } from '../../types';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  onCopyCode: (code: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  onCopyCode,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const formatMessage = (content: string) => {
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => (
        `<pre class="language-${lang || 'plaintext'}"><code>${escapeHtml(code.trim())}</code></pre>`
      ))
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  };

  const renderContent = (content: string) => {
    const parts = content.split(/```(\w+)?\n([\s\S]*?)```/);
    return (
      <div className="prose prose-invert max-w-none text-slate-300">
        {parts.map((part, i) => {
          if (i % 3 === 0) {
            return <div key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br>') }} />;
          } else if (i % 3 === 1) {
            return null;
          } else {
            const lang = parts[i - 1] || 'plaintext';
            return (
              <CodeBlock
                key={i}
                code={part}
                language={lang}
                onCopy={onCopyCode}
              />
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={messagesEndRef}>
      {messages.map((message, index) => (
        <MessageBubble
          key={`${message.role}-${index}`}
          message={message}
          index={index}
          onCopyCode={onCopyCode}
        />
      ))}

      {loading && (
        <div className="flex items-start gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sky-400 text-sm">AI</span>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-800 rounded w-1/2" />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <div className="flex gap-3">
      <div
        className={classNames(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium',
          message.role === 'user'
            ? 'bg-sky-500 text-white'
            : 'bg-slate-800 text-sky-400 border border-slate-700'
        )}
      >
        {message.role === 'user' ? 'You' : 'AI'}
      </div>
      <div
        className={classNames(
          'max-w-[85%] rounded-2xl px-4 py-3',
          message.role === 'user'
            ? 'bg-sky-500/15 border border-sky-500/20 text-slate-100 rounded-br-none'
            : 'bg-slate-900/50 border border-slate-800 text-slate-300 rounded-bl-none'
        )}
      >
        <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
      </div>
    </div>
  );
};

const formatMessage = (content: string) => {
  return content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => (
      `<pre class="language-${lang || 'plaintext'}"><code>${escapeHtml(code.trim())}</code></pre>`
    ))
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
};

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
};

interface CodeBlockProps {
  code: string;
  language: string;
  onCopy: (code: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, onCopy }) => {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="relative my-3 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-xs text-slate-500 font-mono">{language}</span>
        <button
          onClick={() => {
            onCopy(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="p-1 text-slate-500 hover:text-slate-100 transition-colors"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <CheckCheck className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto"><code className="text-sm font-mono text-slate-300">{code}</code></pre>
    </div>
  );
};