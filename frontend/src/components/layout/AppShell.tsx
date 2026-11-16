import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export type WorkspaceSection = "overview" | "explorer" | "explainer" | "assistant";

export function AppShell({
  repoName,
  section,
  onSectionChange,
  children,
}: {
  repoName: string;
  section: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
  children: ReactNode;
}) {
  return (
    <div className="grid-glow flex min-h-screen">
      <Sidebar section={section} onChange={onSectionChange} repoName={repoName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className="text-sm text-slate-400">Codebase understanding workspace</p>
          <Link to="/" className="text-sm text-cyan-300 hover:text-cyan-200">
            Analyse another repo
          </Link>
        </header>
        <main className="min-w-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
