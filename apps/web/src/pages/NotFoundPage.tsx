import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { Home, Search, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 text-secondary-300">
          <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-secondary-900 mb-2">404</h1>
        <p className="text-xl text-secondary-600 mb-8">Page not found</p>
        <p className="text-secondary-500 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button size="lg">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link to="/events">
            <Button size="lg" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}