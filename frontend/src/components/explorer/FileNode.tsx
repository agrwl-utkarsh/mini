import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, FileCode, Image } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { getLanguageIcon, isImageFile } from '../../utils/formatters';
import type { TreeNode } from '../../types';

interface FileNodeProps {
  node: TreeNode;
  selectedPath?: string;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  expandedPaths: Set<string>;
  depth?: number;
}

export const FileNode: React.FC<FileNodeProps> = ({
  node,
  selectedPath,
  onSelect,
  onToggle,
  expandedPaths,
  depth = 0,
}) => {
  const [expanded, setExpanded] = useState(expandedPaths.has(node.path));
  const isDirectory = node.type === 'dir';
  const isSelected = selectedPath === node.path;
  const hasChildren = isDirectory && node.children && node.children.length > 0;

  useEffect(() => {
    setExpanded(expandedPaths.has(node.path));
  }, [expandedPaths, node.path]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      onToggle(node.path);
    } else {
      onSelect(node.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    } else if (e.key === 'ArrowRight' && isDirectory && !expanded) {
      onToggle(node.path);
    } else if (e.key === 'ArrowLeft' && isDirectory && expanded) {
      onToggle(node.path);
    }
  };

  const getIcon = () => {
    if (isDirectory) {
      return expanded ? <Folder className="w-4 h-4 text-amber-400" /> : <Folder className="w-4 h-4 text-slate-500" />;
    }
    if (node.is_binary || isImageFile(node.name)) {
      return <Image className="w-4 h-4 text-slate-500" />;
    }
    return <FileCode className="w-4 h-4 text-slate-500" />;
  };

  const getLanguageBadge = () => {
    if (!node.language || isDirectory) return null;
    return (
      <Badge variant="language" size="sm" language={node.language} className="ml-auto flex-shrink-0">
        {getLanguageIcon(node.language)} {node.language}
      </Badge>
    );
  };

  const getSizeBadge = () => {
    if (node.size === undefined || isDirectory) return null;
    const kb = node.size / 1024;
    const sizeStr = kb < 1 ? `${node.size}B` : kb < 1024 ? `${kb.toFixed(1)}KB` : `${(kb / 1024).toFixed(1)}MB`;
    return (
      <Badge variant="default" size="sm" className="ml-2 flex-shrink-0">
        {sizeStr}
      </Badge>
    );
  };

  return (
    <div>
      <div
        role={isDirectory ? 'treeitem' : 'button'}
        aria-expanded={isDirectory ? expanded : undefined}
        aria-selected={isSelected}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={classNames(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
          'cursor-pointer select-none',
          isSelected
            ? 'bg-sky-500/15 text-sky-300'
            : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100',
          depth > 0 && 'pl-6'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {isDirectory && hasChildren && (
          <ChevronRight
            className={classNames('w-4 h-4 flex-shrink-0 text-slate-500 transition-transform', expanded && 'rotate-90')}
          />
        )}
        {isDirectory && !hasChildren && <span className="w-4 h-4 flex-shrink-0" />}
        {!isDirectory && <span className="w-4 h-4 flex-shrink-0" />}
        {getIcon()}
        <span className="truncate flex-1 min-w-0 text-sm font-mono">{node.name}</span>
        {getLanguageBadge()}
        {getSizeBadge()}
      </div>

      {isDirectory && expanded && hasChildren && (
        <div role="group" aria-label={`${node.name} contents`}>
          {node.children!.map((child) => (
            <FileNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onToggle={onToggle}
              expandedPaths={expandedPaths}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};