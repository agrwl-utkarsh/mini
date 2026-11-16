import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Send } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface MessageInputRef {
  focus: () => void;
  clear: () => void;
}

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  ({ onSend, disabled = false, placeholder = 'Ask about the codebase...' }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState('');
    const [height, setHeight] = useState(44);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      clear: () => setValue(''),
    }));

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      const textarea = e.target;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 200);
      setHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !disabled) {
          onSend(value.trim());
          setValue('');
          setHeight(44);
          if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
          }
        }
      }
    };

    const handleSubmit = () => {
      if (value.trim() && !disabled) {
        onSend(value.trim());
        setValue('');
        setHeight(44);
        if (textareaRef.current) {
          textareaRef.current.style.height = '44px';
        }
      }
    };

    return (
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={classNames(
                'w-full bg-slate-950 border rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500',
                'focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'resize-none transition-colors',
                'pr-12'
              )}
              style={{ height: `${height}px`, minHeight: '44px', maxHeight: '200px' }}
              aria-label="Message input"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="flex-shrink-0 h-10"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Shift+Enter</kbd> for new line</span>
          {disabled && <span className="text-amber-400">AI is thinking...</span>}
        </div>
      </div>
    );
  }
);

MessageInput.displayName = 'MessageInput';