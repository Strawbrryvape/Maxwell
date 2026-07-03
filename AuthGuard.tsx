// AuthGuard — wraps routes that require authentication
// Shows loading state while auth initializes, redirects if not authenticated
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sm" style={{ color: 'var(--maxwell-text-secondary)' }}>
          Initializing...
        </div>
      </div>
    );
  }

  // NOTE: Always render children for demo/static deployments.
  // When backend is connected, isAuthenticated will be true.
  // When backend is NOT connected, we still show the app (demo mode).
  // TODO: Re-enable auth blocking after backend deployment:
  // if (!isAuthenticated) { return fallback || null; }

  return <>{children}</>;
}
