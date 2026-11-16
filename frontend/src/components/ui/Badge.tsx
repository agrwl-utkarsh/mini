import React from 'react';
import { classNames, getLanguageColor } from '../../utils/formatters';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'language';
  size?: 'sm' | 'md';
  dot?: boolean;
  language?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', dot = false, language, className, style, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-slate-800 text-slate-300 border border-slate-700',
      success: 'bg-green-500/20 text-green-400 border border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
      info: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
      language: 'bg-slate-800 text-slate-200 border border-slate-700',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-sm gap-1.5',
    };

    const dotColor = language ? getLanguageColor(language) : variant === 'success' ? '#22c55e' : variant === 'warning' ? '#eab308' : variant === 'danger' ? '#ef4444' : variant === 'info' ? '#0ea5e9' : '#64748b';

    return (
      <span
        ref={ref}
        className={classNames(
          'inline-flex items-center font-medium rounded-full border',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        style={{ ...style, ...(variant === 'language' && { backgroundColor: `${dotColor}20`, borderColor: `${dotColor}40`, color: dotColor }) }}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';