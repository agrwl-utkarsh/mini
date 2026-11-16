import React from 'react';
import { Github, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  repoName?: string;
  repoUrl?: string;
  status?: 'pending' | 'cloning' | 'scanning' | 'ready' | 'error';
  onRefresh?: () => void;
  onDelete?: () => void;
  onNewAnalysis?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  repoName,
  repoUrl,
  status = 'ready',
  onRefresh,
  onDelete,
  onNewAnalysis,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'info', icon: '⏳' };
      case 'cloning':
        return { label: 'Cloning...', color: 'info', icon: '⬇️' };
      case 'scanning':
        return { label: 'Scanning...', color: 'warning', icon: '🔍' };
      case 'ready':
        return { label: 'Ready', color: 'success', icon: '✓' };
      case 'error':
        return { label: 'Error', color: 'danger', icon: '✗' };
      default:
        return { label: 'Unknown', color: 'default', icon: '?' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <header className="sticky top-0 z-20 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 flex items-center px-6">
      <div className="flex-1 flex items-center gap-4 min-w-0">
        {repoName && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-slate-100 truncate">{repoName}</h1>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-400 transition-colors truncate block"
                >
                  <ExternalLink className="w-3 h-3" />
                  {repoUrl.replace(/^https?:\/\//, '').replace(/\.git$/, '')}
                </a>
              )}
            </div>
          </div>
        )}

        <Badge variant={statusConfig.color as any} dot size="sm">
          {statusConfig.icon} {statusConfig.label}
        </Badge>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={status === 'cloning' || status === 'scanning'}
            aria-label="Refresh analysis"
          >
            <RefreshCw className={classNames('w-4 h-4', status === 'cloning' || status === 'scanning' && 'animate-spin')} />
          </Button>
        )}

        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete repository">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {onNewAnalysis && (
          <Button variant="primary" size="sm" onClick={onNewAnalysis} leftIcon={<Github className="w-4 h-4" />}>
            New Analysis
          </Button>
        )}
      </div>
    </header>
  );
};