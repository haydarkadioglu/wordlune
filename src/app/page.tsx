
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user, loading } = useAuth(); // user will be mockUser, loading will be false
  const router = useRouter();

  useEffect(() => {
    // With mock user, loading is false and user is (almost) always present.
    // This will always try to redirect to /dashboard.
    if (!loading) { // loading is always false from our modified AuthProvider
      // Always redirect to dashboard, as login is bypassed
      router.replace('/dashboard');
    }
  }, [loading, router]); // user dependency removed as redirect is unconditional on loading state

  // Show a skeleton or loading indicator while the redirect is in progress.
  // The condition `window.location.pathname !== '/dashboard'` ensures skeleton shows only on '/'
  // and not briefly on '/dashboard' if there's any flicker.
  if (loading || (typeof window !== 'undefined' && window.location.pathname !== '/dashboard')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Skeleton className="h-12 w-12 rounded-full bg-primary/20 mb-4" />
        <Skeleton className="h-8 w-48 bg-primary/20 mb-2" />
        <Skeleton className="h-6 w-32 bg-primary/20" />
      </div>
    );
  }

  return null; 
}
