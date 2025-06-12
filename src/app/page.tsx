
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { loading } = useAuth(); // loading is consistently false due to mock setup
  const router = useRouter();
  const [shouldRenderSkeleton, setShouldRenderSkeleton] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after initial hydration.
    if (!loading) { // This is always true with mock auth
      // Set state to render skeleton right before redirecting.
      // This ensures server and initial client render are null.
      setShouldRenderSkeleton(true);
      router.replace('/dashboard');
    }
  }, [loading, router]); // loading is stable (false), router is stable.

  // On the server, shouldRenderSkeleton is false -> returns null.
  // On the client, initial render, shouldRenderSkeleton is false -> returns null. (MATCHES SERVER)
  // After useEffect runs on client:
  // 1. setShouldRenderSkeleton(true) is called.
  // 2. router.replace('/dashboard') is called.
  // 3. Component re-renders, shouldRenderSkeleton is true, so skeleton is shown.
  // 4. Redirect completes, HomePage component unmounts.
  if (shouldRenderSkeleton) {
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
