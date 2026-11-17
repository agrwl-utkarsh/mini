import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { FileTree } from './FileTree';
import { api } from '../../services/api';
import type { TreeNode, RepoTreeResponse } from '../../types';

interface ExplorerContext {
  openRightPanel: (content: 'explainer' | 'assistant') => void;
  closeRightPanel: () => void;
}

interface FileExplorerProps {
  onFileSelect?: (path: string) => void;
  selectedPath?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, selectedPath: propSelectedPath }) => {
  const { repoId } = useParams<{ repoId: string }>();
  const context = useOutletContext<ExplorerContext | undefined>();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [localSelectedPath, setLocalSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const selectedPath = propSelectedPath !== undefined ? propSelectedPath : localSelectedPath;

  const loadTree = useCallback(async () => {
    if (!repoId) return;
    setLoading(true);
    try {
      const response: RepoTreeResponse = await api.getRepoTree(repoId);
      setTree(response.tree);
    } catch {
      // Error handled by FileTree component
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  // Load tree on mount
  useEffect(() => {
    if (!repoId) return;
    loadTree();
  }, [repoId, loadTree]);

  const handleSelect = useCallback((path: string) => {
    setLocalSelectedPath(path);
    if (onFileSelect) {
      onFileSelect(path);
    }
    context?.openRightPanel('explainer');
  }, [context, onFileSelect]);

  const handleRefresh = useCallback(() => {
    loadTree();
  }, [loadTree]);

  if (!repoId) return null;

  return (
    <FileTree
      tree={tree}
      selectedPath={selectedPath}
      onSelect={handleSelect}
      loading={loading}
      onRefresh={handleRefresh}
    />
  );
};
