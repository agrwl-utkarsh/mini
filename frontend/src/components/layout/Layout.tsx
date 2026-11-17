import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FileExplorer } from '../explorer/FileExplorer';
import { FileTabs } from '../viewer/FileTabs';
import { CodeViewer } from '../viewer/CodeViewer';
import { FileExplainer } from '../explainer/FileExplainer';
import { ChatPanel } from '../assistant/ChatPanel';
import { RepoSummary } from '../dashboard/RepoSummary';
import { LoadingState } from '../dashboard/LoadingState';
import { Button } from '../ui/Button';
import { classNames } from '../../utils/formatters';
import { api } from '../../services/api';
import type { FileTab, RepoStatusResponse, RepoStatus, FileContentResponse } from '../../types';
import { Brain, FileText, Sparkles, X, ChevronRight } from 'lucide-react';

export const Layout: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();

  // Status & Analysis State
  const [status, setStatus] = useState<RepoStatusResponse | null>(null);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState('');

  // UI Panels State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'explorer' | 'assistant' | 'settings'>('explorer');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelContent, setRightPanelContent] = useState<'explainer' | 'assistant'>('explainer');

  // File Tabs & Code Viewer State
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [maximizedTab, setMaximizedTab] = useState<string | null>(null);

  // Poll repository status
  useEffect(() => {
    if (!repoId) return;

    let isMounted = true;
    const pollStatus = async () => {
      try {
        const data = await api.getRepoStatus(repoId);
        if (!isMounted) return;
        setStatus(data);

        if (data.status === 'ready' || data.status === 'error') {
          setPolling(false);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        setPolling(false);
      }
    };

    pollStatus();

    const interval = setInterval(() => {
      if (polling) {
        pollStatus();
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [repoId, polling]);

  // Open a file
  const handleFileSelect = useCallback(async (path: string) => {
    if (!repoId) return;

    const existingTab = tabs.find((t) => t.path === path);
    if (existingTab) {
      setActiveTab(path);
      setRightPanelContent('explainer');
      setRightPanelOpen(true);
      return;
    }

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
      setRightPanelContent('explainer');
      setRightPanelOpen(true);
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  }, [repoId, tabs]);

  const handleTabClose = useCallback((path: string) => {
    setTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTab === path) {
      const remaining = tabs.filter((t) => t.path !== path);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
    if (maximizedTab === path) {
      setMaximizedTab(null);
    }
  }, [tabs, activeTab, maximizedTab]);

  const handleTabChange = useCallback((path: string) => {
    setActiveTab(path);
  }, []);

  const handleMaximize = useCallback((path: string) => {
    setMaximizedTab(path);
  }, []);

  const handleMinimize = useCallback(() => {
    setMaximizedTab(null);
  }, []);

  const handleRefresh = async () => {
    if (!repoId) return;
    setPolling(true);
    setError('');
    try {
      await api.deleteRepository(repoId);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
      setPolling(false);
    }
  };

  const handleDelete = async () => {
    if (!repoId) return;
    try {
      await api.deleteRepository(repoId);
    } catch {
      // Ignore cleanup error on delete
    }
    navigate('/');
  };

  const handleNewAnalysis = () => navigate('/');

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleRightPanel = () => setRightPanelOpen((prev) => !prev);

  const activeTabItem = tabs.find((t) => t.path === activeTab) || null;
  const repoName = repoId ? `Repository (${repoId.slice(0, 8)})` : undefined;
  const fileCount = status?.summary?.total_files;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-mono text-slate-100">
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          if (section === 'assistant') {
            setRightPanelContent('assistant');
            setRightPanelOpen(true);
          } else if (section === 'explorer') {
            setActiveTab(null);
          }
          setSidebarOpen(false);
        }}
        repoName={repoName}
        fileCount={fileCount}
        showRepoInfo={!!repoName}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-[260px] min-w-0 transition-all duration-300">
        {/* Header */}
        <Header
          repoName={repoName}
          status={status?.status || 'pending'}
          onRefresh={handleRefresh}
          onDelete={handleDelete}
          onNewAnalysis={handleNewAnalysis}
          rightPanelOpen={rightPanelOpen}
          onToggleRightPanel={toggleRightPanel}
          onToggleSidebar={toggleSidebar}
        />

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Loading or Error States */}
          {(!status || status.status === 'pending' || status.status === 'cloning' || status.status === 'scanning') && (
            <div className="flex-1 flex items-center justify-center p-6">
              {(() => {
                const stageMap: Record<RepoStatus, 'cloning' | 'scanning' | 'analyzing'> = {
                  pending: 'cloning',
                  cloning: 'cloning',
                  scanning: 'scanning',
                  ready: 'analyzing',
                  error: 'analyzing',
                };
                return (
                  <LoadingState
                    stage={stageMap[status?.status || 'pending']}
                    message={status?.progress || 'Analyzing repository...'}
                    progress={status?.status === 'scanning' ? 65 : status?.status === 'cloning' ? 30 : 10}
                  />
                );
              })()}
            </div>
          )}

          {status?.status === 'error' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md bg-slate-900/60 p-8 rounded-2xl border border-red-500/20 shadow-2xl">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-slate-100 mb-2">Analysis Failed</h2>
                <p className="text-slate-400 text-sm mb-6">{status.error || error || 'An error occurred during analysis.'}</p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="primary" onClick={handleRefresh}>
                    Retry Analysis
                  </Button>
                  <Button variant="secondary" onClick={handleNewAnalysis}>
                    Try Another Repo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Ready State: IDE Workspace */}
          {status?.status === 'ready' && (
            <>
              {/* Left Column: File Explorer */}
              <aside className="w-64 md:w-72 bg-slate-950/70 border-r border-slate-800 flex flex-col flex-shrink-0 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    Explorer
                  </span>
                  {fileCount !== undefined && (
                    <span className="text-[11px] text-slate-500">{fileCount} files</span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <FileExplorer
                    onFileSelect={handleFileSelect}
                    selectedPath={activeTab || undefined}
                  />
                </div>
              </aside>

              {/* Center Column: Dashboard Summary or Code Viewer */}
              <main className="flex-1 flex flex-col min-w-0 bg-slate-950/40 overflow-hidden relative">
                {activeTabItem ? (
                  <>
                    <FileTabs
                      tabs={tabs}
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                      onTabClose={handleTabClose}
                      onMaximize={handleMaximize}
                    />
                    <div className="flex-1 overflow-hidden relative">
                      <CodeViewer
                        tab={activeTabItem}
                        maximized={maximizedTab === activeTab}
                        onMaximize={() => handleMaximize(activeTab!)}
                        onMinimize={handleMinimize}
                        onClose={() => handleTabClose(activeTab!)}
                      />
                    </div>
                  </>
                ) : (
                  /* Repository Summary Overview */
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-sky-400" />
                          Codebase Overview
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                          Select any file in the Explorer on the left to inspect its code and AI explanation.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRightPanelContent('assistant');
                          setRightPanelOpen(true);
                        }}
                        leftIcon={<Brain className="w-4 h-4 text-indigo-400" />}
                      >
                        Ask AI Assistant
                      </Button>
                    </div>

                    {status.summary && (
                      <RepoSummary summary={status.summary} />
                    )}
                  </div>
                )}
              </main>

              {/* Right Column: AI Explainer / Assistant */}
              <aside
                className={classNames(
                  'border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl flex flex-col transition-all duration-300 z-10 flex-shrink-0',
                  rightPanelOpen ? 'w-80 md:w-96' : 'w-0 overflow-hidden border-l-0'
                )}
              >
                {rightPanelOpen && (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Right Panel Header with Tabs */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/60">
                      <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                        <button
                          onClick={() => setRightPanelContent('explainer')}
                          className={classNames(
                            'px-2.5 py-1 text-xs rounded-md transition font-medium flex items-center gap-1.5',
                            rightPanelContent === 'explainer'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          )}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Explanation
                        </button>
                        <button
                          onClick={() => setRightPanelContent('assistant')}
                          className={classNames(
                            'px-2.5 py-1 text-xs rounded-md transition font-medium flex items-center gap-1.5',
                            rightPanelContent === 'assistant'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          )}
                        >
                          <Brain className="w-3.5 h-3.5" />
                          Assistant
                        </button>
                      </div>

                      <button
                        onClick={toggleRightPanel}
                        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                        aria-label="Close right panel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right Panel Body */}
                    <div className="flex-1 overflow-y-auto">
                      {rightPanelContent === 'explainer' ? (
                        <FileExplainer filePath={activeTab || undefined} />
                      ) : (
                        <ChatPanel repoId={repoId} />
                      )}
                    </div>
                  </div>
                )}
              </aside>

              {/* Collapsed Right Panel Reopen Button */}
              {!rightPanelOpen && (
                <button
                  onClick={toggleRightPanel}
                  className="fixed right-0 top-1/2 -translate-y-1/2 bg-slate-900/90 hover:bg-slate-800 text-sky-400 p-2 rounded-l-lg border-l border-y border-slate-700 shadow-xl transition z-20 flex items-center"
                  aria-label="Open AI Panel"
                  title="Open AI Panel"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
