import { clsx } from "@/lib/clsx";

export interface LoadingProps {
  className?: string;
  variant?: "spinner" | "skeleton" | "dots";
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function Loading({ className, variant = "spinner", size = "md", text }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (variant === "skeleton") {
    return (
      <div className={clsx("loading-skeleton", className)} aria-hidden="true" />
    );
  }

  if (variant === "dots") {
    return (
      <div className={clsx("flex items-center gap-1", className)} role="status" aria-label="Loading">
        <span className={clsx("animate-bounce", sizeClasses[size])}>●</span>
        <span className={clsx("animate-bounce", sizeClasses[size])} style={{ animationDelay: "0.1s" }}>●</span>
        <span className={clsx("animate-bounce", sizeClasses[size])} style={{ animationDelay: "0.2s" }}>●</span>
        {text && <span className={clsx("ml-2", textSizeClasses[size])}>{text}</span>}
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center justify-center gap-2", className)} role="status" aria-label="Loading">
      <svg
        className={clsx("animate-spin text-primary-600", sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {text && <span className={clsx(textSizeClasses[size], "text-secondary-600")}>{text}</span>}
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("loading-skeleton", className)} {...props} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("space-y-2", className)} {...props} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={clsx("loading-skeleton h-4", i === lines - 1 && "w-3/4")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("card p-6 space-y-4", className)} {...props} aria-hidden="true">
      <div className="flex items-center gap-4">
        <div className="loading-skeleton h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="loading-skeleton h-4 w-1/4" />
          <div className="loading-skeleton h-3 w-1/3" />
        </div>
      </div>
      <div className="loading-skeleton h-4 w-full" />
      <div className="loading-skeleton h-4 w-2/3" />
      <div className="loading-skeleton h-4 w-1/2" />
    </div>
  );
}