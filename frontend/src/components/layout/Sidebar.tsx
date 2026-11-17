import React from 'react';
import { FolderGit2, FileText, MessageSquare, Settings, X } from 'lucide-react';
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
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={classNames(
          'fixed left-0 top-0 h-full bg-slate-950/95 backdrop-blur-xl border-r border-slate-800 z-40 transition-transform duration-300 flex flex-col w-[260px]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <FolderGit2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-100 text-lg">RepoSense</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Close sidebar" className="lg:hidden">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Repo Info */}
        {showRepoInfo && repoName && (
          <div className="p-4 border-b border-slate-800 bg-slate-900/30">
            <div className="flex items-center gap-2 mb-1.5">
              <FolderGit2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span className="font-medium text-slate-200 text-xs font-mono truncate">{repoName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileText className="w-3.5 h-3.5" />
              <span>{fileCount || 0} files</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                onSectionChange(section.id as 'explorer' | 'assistant' | 'settings');
              }}
              className={classNames(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                activeSection === section.id
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent'
              )}
              aria-current={activeSection === section.id ? 'page' : undefined}
            >
              <section.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate flex-1">{section.label}</span>
              {section.badge > 0 && (
                <Badge variant="info" size="sm" dot>{section.badge}</Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/20">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>RepoSense v0.1</span>
          </div>
        </div>
      </aside>
    </>
  );
};
