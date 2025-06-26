
"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/dashboard/Header';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Using a single wrapper for the background makes it cleaner
  return (
    <div className="relative min-h-screen bg-background">
      {/* Background Image Layer */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Image 
          src="/auth-background.png" 
          alt="Abstract background of letters" 
          layout="fill" 
          objectFit="cover"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {loading || !user ? (
          <>
            {/* Skeleton Header */}
            <header className="bg-card/80 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <Skeleton className="h-8 w-32 bg-primary/20" />
                <Skeleton className="h-10 w-10 rounded-full bg-primary/20" />
              </div>
            </header>
            {/* Skeleton Main */}
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
              <div className="space-y-4">
                <Skeleton className="h-32 w-full bg-primary/20" />
                <Skeleton className="h-64 w-full bg-primary/20" />
              </div>
            </main>
            {/* Skeleton Footer */}
            <footer className="py-4 text-center text-sm text-muted-foreground border-t bg-card/80 backdrop-blur-sm">
                <Skeleton className="h-4 w-48 mx-auto bg-primary/20" />
            </footer>
          </>
        ) : (
          <>
            {/* Actual Header */}
            <Header />
            {/* Actual Main Content */}
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
            </main>
            {/* Actual Footer */}
            <footer className="py-4 text-center text-sm text-muted-foreground border-t bg-card/80 backdrop-blur-sm">
                © {new Date().getFullYear()} WordLune. All rights reserved.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
