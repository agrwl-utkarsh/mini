import React from 'react';
import { classNames } from '../../utils/formatters';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      select-none
    `;

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-sky-500 to-indigo-600
        text-white
        hover:from-sky-400 hover:to-indigo-500
        focus-visible:ring-sky-500
        shadow-lg shadow-sky-500/25
        active:scale-[0.98]
      `,
      secondary: `
        bg-slate-800 border border-slate-700
        text-slate-100
        hover:bg-slate-700 hover:border-slate-600
        focus-visible:ring-slate-500
        active:scale-[0.98]
      `,
      ghost: `
        bg-transparent
        text-slate-300
        hover:bg-slate-800 hover:text-white
        focus-visible:ring-slate-500
        active:scale-[0.98]
      `,
      danger: `
        bg-gradient-to-r from-red-500 to-red-600
        text-white
        hover:from-red-400 hover:to-red-500
        focus-visible:ring-red-500
        shadow-lg shadow-red-500/25
        active:scale-[0.98]
      `,
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={classNames(baseStyles, variantStyles[variant], sizeStyles[size], widthStyle, className)}
        style={style}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';