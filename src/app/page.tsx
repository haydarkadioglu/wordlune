
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LandingPage from '@/components/landing/LandingPage';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect ensures that if the user lands on the homepage
    // while already logged in, they aren't unnecessarily redirected.
    // Redirection from login/register pages is handled in the AuthProvider.
  }, [user, loading, router]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4 animate-pulse">
          <span className="text-4xl font-bold text-primary-foreground">W</span>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <LandingPage />;
}
