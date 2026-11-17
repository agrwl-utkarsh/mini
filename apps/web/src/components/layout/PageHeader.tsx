import { ReactNode, Fragment } from "react";
import { clsx } from "@/lib/clsx";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({ title, description, action, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={clsx("page-header", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-secondary-500 mb-4" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={index}>
              {index > 0 && (
                <span className="mx-1" aria-hidden="true">/</span>
              )}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-secondary-700 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-secondary-900 font-medium" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}