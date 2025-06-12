"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  if (loading || (!loading && ((user && typeof window !== 'undefined' && window.location.pathname !== '/dashboard') || (!user && typeof window !== 'undefined' && window.location.pathname !== '/login')))) {
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
