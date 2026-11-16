import React, { useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import type { FileTab } from '../../types';

interface FileTabsProps {
  tabs: FileTab[];
  activeTab: string | null;
  onTabChange: (path: string) => void;
  onTabClose: (path: string) => void;
}

const MAX_VISIBLE_TABS = 8;

export const FileTabs: React.FC<FileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
}) => {
  const [scrollOffset] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollLeft = useCallback(() => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }, []);

  const handleTabClick = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTabChange(path);
  };

  const handleCloseClick = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTabClose(path);
  };

  if (tabs.length === 0) {
    return (
      <div className="h-10 bg-slate-900/50 border-b border-slate-800 flex items-center justify-center">
        <span className="text-slate-500 text-sm">No files open</span>
      </div>
    );
  }

  const visibleTabs = tabs.slice(scrollOffset, scrollOffset + MAX_VISIBLE_TABS);
  const showLeftArrow = scrollOffset > 0;
  const showRightArrow = scrollOffset + MAX_VISIBLE_TABS < tabs.length;

  return (
    <div className="h-10 bg-slate-900/50 border-b border-slate-800 flex items-center">
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="p-1.5 text-slate-500 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div ref={tabsRef} className="flex-1 overflow-hidden flex items-stretch min-w-0" role="tablist">
        {visibleTabs.map((tab) => (
          <button
            key={tab.path}
            role="tab"
            aria-selected={activeTab === tab.path}
            onClick={(e) => handleTabClick(tab.path, e)}
            className={classNames(
              'flex items-center gap-2 px-3 py-1.5 h-full border-r border-slate-800',
              'transition-colors whitespace-nowrap min-w-[150px] max-w-[250px]',
              activeTab === tab.path
                ? 'bg-sky-500/10 text-sky-300 border-b-2 border-sky-500'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            )}
          >
            <Badge variant="language" size="sm" language={tab.language} className="flex-shrink-0">
              {tab.language}
            </Badge>
            <span className="truncate flex-1 text-sm font-mono">{tab.name}</span>
            <button
              onClick={(e) => handleCloseClick(tab.path, e)}
              className="p-0.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
              aria-label={`Close ${tab.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>

      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="p-1.5 text-slate-500 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {tabs.length > MAX_VISIBLE_TABS && (
        <button className="p-1.5 text-slate-500 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-1" aria-label="More tabs">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

import { useRef } from 'react';