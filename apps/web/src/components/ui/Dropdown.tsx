import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";
import { ChevronDown, X } from "lucide-react";

export interface DropdownProps {
  children: ReactNode;
  trigger: ReactNode;
  align?: "left" | "right";
}

export function Dropdown({ children, trigger, align = "right" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        <ChevronDown className={clsx("h-4 w-4 text-secondary-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <Fragment>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsOpen(false)} />
          <div
            className={clsx(
              "dropdown",
              align === "right" ? "right-0" : "left-0"
            )}
            role="menu"
          >
            {children}
          </div>
        </Fragment>
      )}
    </div>
  );
}

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: "default" | "destructive";
}

export function DropdownItem({ children, icon, variant = "default", className, ...props }: DropdownItemProps) {
  const variantClasses = {
    default: "text-secondary-700 hover:bg-secondary-50",
    destructive: "text-red-600 hover:bg-red-50",
  };

  return (
    <button
      role="menuitem"
      tabIndex={-1}
      className={clsx(
        "dropdown-item w-full flex items-center gap-2",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="h-4 w-4 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <hr className="my-1 border-secondary-200" role="separator" />;
}

export function DropdownLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("px-4 py-2 text-xs font-medium text-secondary-500 uppercase", className)}>{children}</p>;
}