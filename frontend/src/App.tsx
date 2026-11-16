import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './components/landing/LandingPage';
import { FileExplorer } from './components/explorer/FileExplorer';
import { FileTabs } from './components/viewer/FileTabs';
import { CodeViewer } from './components/viewer/CodeViewer';
import { FileExplainer } from './components/explainer/FileExplainer';
import { ChatPanel } from './components/assistant/ChatPanel';
import { Dashboard } from './components/dashboard/Dashboard';
import { api } from './services/api';
import type { FileTab, FileContentResponse } from './types';

function App() {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [maximizedTab, setMaximizedTab] = useState<string | null>(null);
  const [rightPanelContent, setRightPanelContent] = useState<'explainer' | 'assistant' | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const openRightPanel = useCallback((content: 'explainer' | 'assistant') => {
    setRightPanelContent(content);
    setRightPanelOpen(true);
  }, []);

  const closeRightPanel = useCallback(() => {
    setRightPanelOpen(false);
    setRightPanelContent(null);
  }, []);

  const handleFileSelect = useCallback(async (path: string) => {
    // Check if already open
    const existingTab = tabs.find((t) => t.path === path);
    if (existingTab) {
      setActiveTab(path);
      openRightPanel('explainer');
      return;
    }

    // Load file content
    const repoId = getRepoIdFromUrl();
    if (!repoId) return;

    try {
      const response: FileContentResponse = await api.getFileContent(repoId, path);
      const newTab: FileTab = {
        path,
        name: path.split('/').pop() || path,
        language: response.language,
        content: response.content,
        isBinary: response.is_binary,
        size: response.size,
        lines: response.lines,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(path);
      openRightPanel('explainer');
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  }, [tabs, openRightPanel]);

  const handleTabClose = useCallback((path: string) => {
    setTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTab === path) {
      const remaining = tabs.filter((t) => t.path !== path);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  }, [tabs, activeTab]);

  const handleTabChange = useCallback((path: string) => {
    setActiveTab(path);
    openRightPanel('explainer');
  }, [openRightPanel]);

  const handleMaximize = useCallback((path: string) => {
    setMaximizedTab(path);
  }, []);

  const handleMinimize = useCallback(() => {
    setMaximizedTab(null);
  }, []);

  const getRepoIdFromUrl = () => {
    const match = window.location.pathname.match(/\/repo\/([^/]+)/);
    return match ? match[1] : null;
  };

  const repoId = getRepoIdFromUrl();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/repo/:repoId" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route
          path="explorer"
          element={
            <FileExplorer
              onFileSelect={handleFileSelect}
            />
          }
        />
        <Route
          path="viewer"
          element={
            <>
              <FileTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onTabClose={handleTabClose}
                onMaximize={handleMaximize}
              />
              {activeTab && (
                <CodeViewer
                  tab={tabs.find((t) => t.path === activeTab) || null}
                  maximized={maximizedTab === activeTab}
                  onMaximize={handleMaximize}
                  onMinimize={handleMinimize}
                  onClose={() => handleTabClose(activeTab!)}
                />
              )}
            </>
          }
        />
        <Route
          path="explainer"
          element={
            <FileExplainer
              filePath={activeTab || undefined}
            />
          }
        />
        <Route
          path="assistant"
          element={
            <ChatPanel repoId={repoId} />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;