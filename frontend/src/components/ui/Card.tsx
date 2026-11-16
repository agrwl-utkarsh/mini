import React from 'react';
import { classNames } from '../../utils/formatters';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'md', hover = false, className, style, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-slate-900/50 border border-slate-800',
      elevated: 'bg-slate-900/50 border border-slate-800 shadow-xl shadow-black/30',
      outlined: 'bg-transparent border border-slate-700',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hover
      ? 'transition-all duration-300 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10'
      : '';

    return (
      <div
        ref={ref}
        className={classNames(
          'rounded-xl',
          variantStyles[variant],
          paddingStyles[padding],
          hoverStyles,
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={classNames('mb-4', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, ...props }, ref) => (
    <h3 ref={ref} className={classNames('text-lg font-semibold text-slate-100', className)} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className, ...props }, ref) => (
    <p ref={ref} className={classNames('text-sm text-slate-400 mt-1', className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={classNames('', className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={classNames('mt-4 pt-4 border-t border-slate-800 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';