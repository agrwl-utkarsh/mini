import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, RefreshCw } from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { FileNode } from './FileNode';
import type { TreeNode } from '../../types';

interface FileTreeProps {
  tree: TreeNode[];
  selectedPath?: string;
  onSelect: (path: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  tree,
  selectedPath,
  onSelect,
  loading = false,
  onRefresh,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');

  // Auto-expand first level directories
  useEffect(() => {
    if (tree.length > 0 && expandedPaths.size === 0) {
      const firstLevelDirs = tree
        .filter((n) => n.type === 'dir' && n.children && n.children.length > 0)
        .slice(0, 3)
        .map((n) => n.path);
      setExpandedPaths(new Set(firstLevelDirs));
    }
  }, [tree, expandedPaths.size]);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const filterNode = (node: TreeNode, filterLower: string): boolean => {
    if (node.name.toLowerCase().includes(filterLower)) return true;
    if (node.type === 'dir' && node.children) {
      return node.children.some((child) => filterNode(child, filterLower));
    }
    return false;
  };

  const filteredTree = filter
    ? tree.filter((node) => filterNode(node, filter.toLowerCase()))
    : tree;

  const clearFilter = () => setFilter('');

  return (
    <div className="flex flex-col h-full bg-slate-950/50">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-800">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Filter files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={filter ? <X className="w-4 h-4 cursor-pointer" onClick={clearFilter} /> : undefined}
            className="text-xs"
          />
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading} aria-label="Refresh tree">
            <RefreshCw className={classNames('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            {filter ? (
              <>
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p>No files match "{filter}"</p>
              </>
            ) : (
              <>
                <FileCode className="w-8 h-8 mb-2 opacity-50" />
                <p>No files found</p>
              </>
            )}
          </div>
        ) : (
          filteredTree.map((node) => (
            <FileNode
              key={node.path}
              node={node}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onToggle={togglePath}
              expandedPaths={expandedPaths}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Need to import FileCode for empty state
import { FileCode } from 'lucide-react';