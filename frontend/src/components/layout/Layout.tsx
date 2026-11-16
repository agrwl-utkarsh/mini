import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Button } from '../ui/Button';
import { classNames } from '../../utils/formatters';

interface LayoutProps {
  repoName?: string;
  repoUrl?: string;
  status?: 'pending' | 'cloning' | 'scanning' | 'ready' | 'error';
  fileCount?: number;
  onRefresh?: () => void;
  onDelete?: () => void;
  onNewAnalysis?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  repoName,
  repoUrl,
  status = 'ready',
  fileCount,
  onRefresh,
  onDelete,
  onNewAnalysis,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'explorer' | 'assistant' | 'settings'>('explorer');
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState<'explainer' | 'assistant' | null>('explainer');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const openRightPanel = (content: 'explainer' | 'assistant') => {
    setRightPanelContent(content);
    setRightPanelOpen(true);
  };

  const closeRightPanel = () => setRightPanelOpen(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        repoName={repoName}
        fileCount={fileCount}
        showRepoInfo={!!repoName}
      />

      {/* Main Content */}
      <main
        className={classNames(
          'flex-1 flex flex-col overflow-hidden transition-all duration-300',
          sidebarOpen ? 'lg:ml-70' : 'lg:ml-15'
        )}
      >
        {/* Header */}
        <Header
          repoName={repoName}
          repoUrl={repoUrl}
          status={status}
          onRefresh={onRefresh}
          onDelete={onDelete}
          onNewAnalysis={onNewAnalysis}
        />

        {/* Body */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Panel - File Explorer */}
          <aside
            className={classNames(
              'bg-slate-950/50 border-r border-slate-800 flex flex-col transition-all duration-300',
              activeSection === 'explorer' ? 'w-80' : 'w-0 overflow-hidden'
            )}
            style={{ minWidth: activeSection === 'explorer' ? '320px' : '0' }}
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <Outlet context={{ openRightPanel, closeRightPanel }} />
            </div>
          </aside>

          {/* Center Panel - Code Viewer + Explainer */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            <Outlet />
          </div>

          {/* Right Panel - Explainer / Assistant */}
          <aside
            className={classNames(
              'fixed right-0 top-16 h-[calc(100vh-4rem)] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 z-20 transition-all duration-300 flex flex-col overflow-hidden',
              rightPanelOpen ? 'w-96' : 'w-0 overflow-hidden'
            )}
            style={{ minWidth: rightPanelOpen ? '384px' : '0' }}
          >
            {rightPanelOpen && (
              <>
                <div className="flex items-center justify-between p-3 border-b border-slate-800">
                  <h3 className="font-medium text-slate-100">
                    {rightPanelContent === 'explainer' ? 'Explanation' : 'Assistant'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={closeRightPanel} aria-label="Close panel">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {rightPanelContent === 'explainer' && (
                    <Outlet context={{ panelType: 'explainer' }} />
                  )}
                  {rightPanelContent === 'assistant' && (
                    <Outlet context={{ panelType: 'assistant' }} />
                  )}
                </div>
              </>
            )}
          </aside>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={toggleSidebar}
              aria-hidden="true"
            />
          )}
        </div>
      </main>
    </div>
  );
};