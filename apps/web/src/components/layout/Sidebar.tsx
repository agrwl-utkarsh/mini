import { NavLink, useLocation } from "react-router-dom";
import { clsx } from "@/lib/clsx";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Ticket,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/dashboard/events", icon: Calendar },
  { label: "Registrations", href: "/dashboard/registrations", icon: Ticket },
  { label: "Tasks", href: "/dashboard/tasks", icon: ClipboardList },
  { label: "Finance", href: "/dashboard/finance", icon: FileText },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 btn-secondary"
        onClick={onClose}
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-secondary-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 px-6 border-b border-secondary-200">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-secondary-900">FESTORA</span>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive: active }) =>
                    clsx(
                      "sidebar-link",
                      active && "sidebar-link-active"
                    )
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-secondary-200">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">User Name</p>
                <p className="text-xs text-secondary-500 truncate">ORGANIZER</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden btn-ghost p-2"
      aria-label="Open sidebar"
      aria-expanded="false"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}