import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { classNames } from '../../utils/formatters';
import { FileTree } from './FileTree';
import { api } from '../../services/api';
import type { TreeNode, RepoTreeResponse } from '../../types';

interface ExplorerContext {
  openRightPanel: (content: 'explainer' | 'assistant') => void;
  closeRightPanel: () => void;
}

export const FileExplorer: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const context = useOutletContext<ExplorerContext>();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load tree on mount
  useEffect(() => {
    if (!repoId) return;
    loadTree();
  }, [repoId]);

  const loadTree = async () => {
    if (!repoId) return;
    setLoading(true);
    setError('');
    try {
      const response: RepoTreeResponse = await api.getRepoTree(repoId);
      setTree(response.tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file tree');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback((path: string) => {
    setSelectedPath(path);
    context?.openRightPanel('explainer');
  }, [context]);

  const handleRefresh = useCallback(() => {
    loadTree();
  }, [repoId]);

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

// Need to import useParams
import { useParams } from 'react-router-dom';