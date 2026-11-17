import React from 'react';
import { Github, ExternalLink, RefreshCw, Trash2, Sparkles, Menu } from 'lucide-react';
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
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  repoName,
  repoUrl,
  status = 'ready',
  onRefresh,
  onDelete,
  onNewAnalysis,
  rightPanelOpen = false,
  onToggleRightPanel,
  onToggleSidebar,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'info' as const, icon: '⏳' };
      case 'cloning':
        return { label: 'Cloning...', color: 'info' as const, icon: '⬇️' };
      case 'scanning':
        return { label: 'Scanning...', color: 'warning' as const, icon: '🔍' };
      case 'ready':
        return { label: 'Ready', color: 'success' as const, icon: '✓' };
      case 'error':
        return { label: 'Error', color: 'danger' as const, icon: '✗' };
      default:
        return { label: 'Unknown', color: 'default' as const, icon: '?' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <header className="sticky top-0 z-20 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 flex items-center px-4 md:px-6">
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="mr-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 flex items-center gap-3 md:gap-4 min-w-0">
        {repoName && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-slate-100 text-sm md:text-base truncate">{repoName}</h1>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-400 transition-colors truncate"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{repoUrl.replace(/^https?:\/\//, '').replace(/\.git$/, '')}</span>
                </a>
              )}
            </div>
          </div>
        )}

        <Badge variant={statusConfig.color} dot size="sm" className="hidden sm:inline-flex flex-shrink-0">
          {statusConfig.icon} {statusConfig.label}
        </Badge>
      </div>

      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {onToggleRightPanel && (
          <Button
            variant={rightPanelOpen ? 'primary' : 'secondary'}
            size="sm"
            onClick={onToggleRightPanel}
            aria-label="Toggle AI panel"
            leftIcon={<Sparkles className="w-4 h-4 text-sky-400" />}
          >
            <span className="hidden sm:inline">AI Panel</span>
          </Button>
        )}

        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={status === 'cloning' || status === 'scanning'}
            aria-label="Refresh analysis"
          >
            <RefreshCw className={classNames('w-4 h-4', (status === 'cloning' || status === 'scanning') && 'animate-spin')} />
          </Button>
        )}

        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete repository">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {onNewAnalysis && (
          <Button variant="primary" size="sm" onClick={onNewAnalysis} leftIcon={<Github className="w-4 h-4" />}>
            <span className="hidden sm:inline">New Analysis</span>
          </Button>
        )}
      </div>
    </header>
  );
};
