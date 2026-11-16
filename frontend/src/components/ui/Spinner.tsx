import React from 'react';
import { classNames } from '../../utils/formatters';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'muted';
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', color = 'primary', className, ...props }, ref) => {
    const sizeStyles = {
      sm: 'w-4 h-4 border-2',
      md: 'w-6 h-6 border-2',
      lg: 'w-10 h-10 border-3',
    };

    const colorStyles = {
      primary: 'border-sky-500 border-t-transparent',
      white: 'border-white border-t-transparent',
      muted: 'border-slate-500 border-t-transparent',
    };

    return (
      <div
        ref={ref}
        className={classNames(
          'animate-spin rounded-full',
          sizeStyles[size],
          colorStyles[color],
          className
        )}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export const SpinnerOverlay = ({ message = 'Loading...', size = 'lg' }: { message?: string; size?: 'sm' | 'md' | 'lg' }) => (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4">
    <Spinner size={size} />
    <p className="text-slate-300 text-sm font-medium">{message}</p>
  </div>
);