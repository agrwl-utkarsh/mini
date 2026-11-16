import React from 'react';
import { ChevronRight, FolderGit2, FileText, MessageSquare, Settings, X } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: 'explorer' | 'assistant' | 'settings';
  onSectionChange: (section: 'explorer' | 'assistant' | 'settings') => void;
  repoName?: string;
  fileCount?: number;
  showRepoInfo?: boolean;
}

const sections = [
  { id: 'explorer', label: 'Explorer', icon: FolderGit2, badge: 0 },
  { id: 'assistant', label: 'Assistant', icon: MessageSquare, badge: 0 },
  { id: 'settings', label: 'Settings', icon: Settings, badge: 0 },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeSection,
  onSectionChange,
  repoName,
  fileCount,
  showRepoInfo = false,
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-4 z-40 p-2 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
        aria-label="Open sidebar"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-slate-950/95 backdrop-blur-xl border-r border-slate-800 z-30 transition-all duration-300 flex flex-col"
      style={{ width: '280px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <FolderGit2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-100 text-lg">RepoSense</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Close sidebar">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Repo Info */}
      {showRepoInfo && repoName && (
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <FolderGit2 className="w-4 h-4 text-sky-400" />
            <span className="font-medium text-slate-200 truncate">{repoName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-3 h-3" />
            <span>{fileCount || 0} files</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id as 'explorer' | 'assistant' | 'settings')}
            className={classNames(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeSection === section.id
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            )}
            aria-current={activeSection === section.id ? 'page' : undefined}
          >
            <section.icon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{section.label}</span>
            {section.badge > 0 && (
              <Badge variant="info" size="sm" dot>{section.badge}</Badge>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>API Connected</span>
        </div>
      </div>
    </aside>
  );
};