
"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/dashboard/Header';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-card shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Skeleton className="h-8 w-32 bg-primary/20" />
            <Skeleton className="h-10 w-10 rounded-full bg-primary/20" />
          </div>
        </header>
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full bg-primary/20" />
            <Skeleton className="h-64 w-full bg-primary/20" />
          </div>
        </main>
         <footer className="py-4 text-center text-sm text-muted-foreground border-t">
            <Skeleton className="h-4 w-48 mx-auto bg-primary/20" />
        </footer>
      </div>
    );
  }

  return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
        </main>
        <footer className="py-4 text-center text-sm text-muted-foreground border-t">
            © {new Date().getFullYear()} WordLune. All rights reserved.
        </footer>
      </div>
  );
}
