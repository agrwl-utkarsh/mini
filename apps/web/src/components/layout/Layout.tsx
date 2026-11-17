import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar, SidebarTrigger } from "./Sidebar";
import { TopNav } from "./TopNav";

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopNav />
      <main className="lg:pl-64">
        <div className="container-app py-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}