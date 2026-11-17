import { NavLink, useLocation } from "react-router-dom";
import { clsx } from "@/lib/clsx";
import { Bell, Search, User, LogOut, ChevronDown } from "lucide-react";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui";

export function TopNav() {
  const location = useLocation();

  const publicNavItems = [
    { label: "Events", href: "/events" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-secondary-200">
      <div className="container-app h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Public navigation">
            {publicNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    "topnav-link",
                    isActive && "bg-primary-50 text-primary-700"
                  )
                }
                aria-current={location.pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:block flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search events..."
                className="input pl-10 w-full"
                aria-label="Search events"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-ghost p-2 relative" aria-label="Notifications">
            <Bell className="h-5 w-5 text-secondary-600" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          </button>

          <Dropdown
            trigger={
              <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary-100 transition-colors" aria-label="User menu">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-700" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-secondary-700">User Name</span>
                <ChevronDown className="h-4 w-4 text-secondary-500" />
              </button>
            }
            align="right"
          >
            <DropdownItem icon={<User className="h-4 w-4" />} onClick={() => {}}>
              Profile
            </DropdownItem>
            <DropdownItem onClick={() => {}}>
              Settings
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem icon={<LogOut className="h-4 w-4" />} variant="destructive" onClick={() => {}}>
              Sign out
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}