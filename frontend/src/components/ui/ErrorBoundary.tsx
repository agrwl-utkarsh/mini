import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <Card variant="elevated" padding="lg" className="max-w-md w-full text-center border-red-500/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="primary" onClick={this.resetError} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/'} leftIcon={<Home className="w-4 h-4" />}>
                Go Home
              </Button>
            </div>
            <details className="mt-6 text-left">
              <summary className="text-xs text-slate-500 cursor-pointer">Error Details</summary>
              <pre className="mt-2 p-3 text-[10px] text-slate-400 bg-slate-900 rounded overflow-x-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            </details>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;