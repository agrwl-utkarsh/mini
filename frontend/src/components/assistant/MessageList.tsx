import React, { useRef, useEffect } from 'react';
import { classNames } from '../../utils/formatters';
import type { ChatMessage } from '../../types';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  onCopyCode?: (code: string) => void;
}

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

interface MessageBubbleProps {
  message: ChatMessage;
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

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((message, index) => (
        <MessageBubble
          key={`${message.role}-${index}`}
          message={message}
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

      <div ref={messagesEndRef} />
    </div>
  );
};
